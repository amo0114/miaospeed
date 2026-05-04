/**
 * YAML Parser for Clash/Mihomo proxy configurations
 * Extracts node names and payloads from YAML subscription
 */

import yaml from 'js-yaml'

export interface ParsedNode {
  name: string
  payload: string
  type: string
}

/**
 * Parse a Clash YAML configuration and extract proxy nodes
 */
export function parseClashYaml(yamlContent: string): ParsedNode[] {
  try {
    const config = yaml.load(yamlContent) as Record<string, unknown>

    if (!config || typeof config !== 'object') {
      return []
    }

    const proxies = config.proxies as Array<Record<string, unknown>> | undefined
    if (!Array.isArray(proxies)) {
      return []
    }

    return proxies
      .filter((p) => p && typeof p === 'object' && p.name && p.type)
      .map((proxy) => ({
        name: String(proxy.name),
        payload: yaml.dump(proxy).trim(),
        type: String(proxy.type),
      }))
  } catch (err) {
    console.error('Failed to parse Clash YAML:', err)
    return []
  }
}

/**
 * Parse a base64-encoded subscription (common format)
 * Each line is a base64-encoded proxy URI
 */
export function parseSubscription(content: string): ParsedNode[] {
  try {
    // Try to decode as base64
    const decoded = atob(content.trim())
    const lines = decoded.split('\n').filter(Boolean)

    return lines
      .map((line) => parseProxyUri(line.trim()))
      .filter((n): n is ParsedNode => n !== null)
  } catch {
    // Not base64, try as plain text
    const lines = content.split('\n').filter(Boolean)
    return lines
      .map((line) => parseProxyUri(line.trim()))
      .filter((n): n is ParsedNode => n !== null)
  }
}

/**
 * Parse a single proxy URI (vmess://, trojan://, ss://, etc.)
 */
function parseProxyUri(uri: string): ParsedNode | null {
  if (!uri) return null

  // If it looks like YAML, try to parse it
  if (uri.includes('type:') && uri.includes('server:')) {
    try {
      const proxy = yaml.load(uri) as Record<string, unknown>
      if (proxy && proxy.name && proxy.type) {
        return {
          name: String(proxy.name),
          payload: uri,
          type: String(proxy.type),
        }
      }
    } catch {
      // Not valid YAML
    }
  }

  // For URI formats, we need to convert to Clash YAML format
  // This is a simplified version - real implementation would need full URI parsing
  if (uri.startsWith('vmess://')) {
    return parseVmessUri(uri)
  }

  if (uri.startsWith('trojan://')) {
    return parseTrojanUri(uri)
  }

  if (uri.startsWith('ss://')) {
    return parseShadowsocksUri(uri)
  }

  return null
}

function parseVmessUri(uri: string): ParsedNode | null {
  try {
    const base64 = uri.replace('vmess://', '')
    const json = JSON.parse(atob(base64))

    const name = json.ps || json.add || 'Unknown'
    const payload = yaml.dump({
      name,
      type: 'vmess',
      server: json.add,
      port: parseInt(json.port) || 443,
      uuid: json.id,
      alterId: parseInt(json.aid) || 0,
      cipher: 'auto',
      tls: json.tls === 'tls',
      network: json.net || 'tcp',
      ...(json.net === 'ws' && {
        'ws-opts': {
          path: json.path || '/',
          headers: { Host: json.host || '' },
        },
      }),
    })

    return { name, payload, type: 'vmess' }
  } catch {
    return null
  }
}

function parseTrojanUri(uri: string): ParsedNode | null {
  try {
    const url = new URL(uri)
    const name = decodeURIComponent(url.hash.slice(1)) || url.hostname

    const payload = yaml.dump({
      name,
      type: 'trojan',
      server: url.hostname,
      port: parseInt(url.port) || 443,
      password: url.username,
      udp: true,
      sni: url.hostname,
    })

    return { name, payload, type: 'trojan' }
  } catch {
    return null
  }
}

function parseShadowsocksUri(uri: string): ParsedNode | null {
  try {
    const withoutProtocol = uri.replace('ss://', '')
    const [userInfo, serverInfo] = withoutProtocol.split('@')
    const [method, password] = atob(userInfo).split(':')
    const [server, portPart] = serverInfo.split(':')
    const [port, ...hashParts] = portPart.split('#')
    const name = hashParts.length > 0 ? decodeURIComponent(hashParts.join('#')) : server

    const payload = yaml.dump({
      name,
      type: 'ss',
      server,
      port: parseInt(port) || 443,
      cipher: method,
      password,
    })

    return { name, payload, type: 'ss' }
  } catch {
    return null
  }
}
