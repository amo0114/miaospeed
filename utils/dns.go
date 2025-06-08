package utils

import (
	"context"
	"encoding/base64"
	"fmt"
	"github.com/miekg/dns"
	"io"
	"net"
	"net/http"
	urllib "net/url"
	"strings"
	"sync"
	"time"

	"github.com/airportr/miaospeed/interfaces"
	"github.com/airportr/miaospeed/utils/structs/memutils"
	"github.com/airportr/miaospeed/utils/structs/obliviousmap"
)

var DnsCache *obliviousmap.ObliviousMap[*interfaces.IPStacks]

func DNSLookuper(addr string, queryServers []string) []net.IP {
	if len(queryServers) == 0 {
		result, _ := net.LookupIP(addr)
		return result
	}

	ipSets := map[string]net.IP{}
	for _, server := range queryServers {
		// DoH query for HTTPS server
		if strings.HasPrefix(server, "https://") {
			//parsedServer, err := urllib.Parse(server)
			if parsedServer, err := urllib.Parse(server); err == nil {
				baseURL := fmt.Sprintf("%s://%s", parsedServer.Scheme, parsedServer.Host)
				if ips := DohLookup(addr, baseURL); ips != nil && len(ips) > 0 {
					for _, ip := range ips {
						ipSets[ip.String()] = ip
					}
				}
			}

		} else {
			// nomal DNS query
			r := &net.Resolver{
				PreferGo: true,
				Dial: func(ctx context.Context, network, address string) (net.Conn, error) {
					d := net.Dialer{
						Timeout: time.Millisecond * time.Duration(3000),
					}
					return d.DialContext(ctx, network, server)
				},
			}
			addrs, _ := r.LookupIPAddr(context.Background(), addr)
			for _, ia := range addrs {
				ipSets[ia.IP.String()] = ia.IP
			}
		}
	}

	ips := make([]net.IP, len(ipSets))
	j := 0
	for _, ia := range ipSets {
		ips[j] = ia
		j += 1
	}

	return ips
}

// DohLookup Use DNS over HTTPS to query A and AAAA records
func DohLookup(domain, dohBaseURL string) []net.IP {
	var wg sync.WaitGroup
	var ips []net.IP
	var mu sync.Mutex

	queryDNS := func(qtype uint16) {
		defer wg.Done()

		query := dns.Msg{}
		query.SetQuestion(dns.Fqdn(domain), qtype)
		msg, _ := query.Pack()
		b64 := base64.RawURLEncoding.EncodeToString(msg)
		dohURL := dohBaseURL + "/dns-query?dns=" + b64
		client := &http.Client{
			Timeout: time.Second * 5,
		}
		req, err := http.NewRequest("GET", dohURL, nil)
		if err != nil {
			DLogf("Create request error | type=%d | err=%v\n", qtype, err)
			return
		}
		req.Header.Set("Accept", "application/dns-message")
		resp, err := client.Do(req)
		if err != nil {
			DLogf("DNS over HTTPS query error | type=%d | err=%v\n", qtype, err)
		}
		defer func() { _ = resp.Body.Close() }()

		bodyBytes, err := io.ReadAll(resp.Body)
		if err != nil {
			DLogf("Read response body error | type=%d | err=%v\n", qtype, err)
			return
		}

		dnsResp := dns.Msg{}
		if err := dnsResp.Unpack(bodyBytes); err != nil {
			DLogf("DNS over HTTPS response unpack error | type=%d | err=%v\n", qtype, err)
			return
		}

		mu.Lock()
		defer mu.Unlock()
		for _, answer := range dnsResp.Answer {
			switch qtype {
			case dns.TypeA:
				if a, ok := answer.(*dns.A); ok {
					ips = append(ips, a.A)
				}
			case dns.TypeAAAA:
				if aaaa, ok := answer.(*dns.AAAA); ok {
					ips = append(ips, aaaa.AAAA)
				}
			}
		}
	}

	wg.Add(2)
	go queryDNS(dns.TypeA)    // A records
	go queryDNS(dns.TypeAAAA) // AAAA records

	wg.Wait()
	return ips
}

// queryServer = "8.8.8.8:53"
//func DNSLookuper(addr string, queryServers []string) []net.IP {
//	if len(queryServers) == 0 {
//		result, _ := net.LookupIP(addr)
//		return result
//	}
//
//	ipSets := map[string]net.IP{}
//	for _, server := range queryServers {
//		r := &net.Resolver{
//			PreferGo: true,
//			Dial: func(ctx context.Context, network, address string) (net.Conn, error) {
//				d := net.Dialer{
//					Timeout: time.Millisecond * time.Duration(3000),
//				}
//				return d.DialContext(ctx, network, server)
//			},
//		}
//		addrs, _ := r.LookupIPAddr(context.Background(), addr)
//		for _, ia := range addrs {
//			ipSets[ia.IP.String()] = ia.IP
//		}
//	}
//
//	ips := make([]net.IP, len(ipSets))
//	j := 0
//	for _, ia := range ipSets {
//		ips[j] = ia
//		j += 1
//	}
//
//	return ips
//}

func LookupIPv46(addr string, retry int, queryServers []string) *interfaces.IPStacks {
	token := fmt.Sprintf("%v|%v", addr, queryServers)
	if r, ok := DnsCache.Get(token); ok && r != nil {
		return r
	}

	var netips []net.IP
	for i := 0; i < retry && len(netips) == 0; i += 1 {
		netips = DNSLookuper(addr, queryServers)
	}
	DLogf("DNS Lookup | dns=%v result=%v", queryServers, netips)

	ipstacks := (&interfaces.IPStacks{}).Init()
	for _, ip := range netips {
		ipStr := ip.String()
		if !strings.Contains(ipStr, ":") {
			ipstacks.IPv4 = append(ipstacks.IPv4, ipStr)
		} else {
			ipstacks.IPv6 = append(ipstacks.IPv6, ipStr)
		}
	}

	if ipstacks.Count() > 0 {
		DnsCache.Set(token, ipstacks)
	} else {
		DWarnf("DNS Resolver | fail to resolve domain=%s", addr)
	}
	return ipstacks
}

func init() {
	memIPStacks := memutils.MemDriverMemory[*interfaces.IPStacks]{}
	memIPStacks.Init()
	DnsCache = obliviousmap.NewObliviousMap[*interfaces.IPStacks]("DnsCache/", time.Minute, true, &memIPStacks)
}
