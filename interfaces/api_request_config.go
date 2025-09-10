package interfaces

import (
	"github.com/airportr/miaospeed/preconfigs"
	"github.com/airportr/miaospeed/utils/structs"
)

type SlaveRequestConfigsV1 struct {
	STUNURL           string `yaml:"stunURL,omitempty" cf:"name=🫙 STUN 地址"`
	DownloadURL       string `yaml:"downloadURL,omitempty" cf:"name=📃 下行测速文件"`
	DownloadDuration  int64  `yaml:"downloadDuration,omitempty" cf:"name=⏱️ 下行测速时长 (单位: 秒)"`
	DownloadThreading uint   `yaml:"downloadThreading,omitempty" cf:"name=🧶 下行测速线程数"`

	PingAverageOver uint16 `yaml:"pingAverageOver,omitempty" cf:"name=🧮 多次 Ping 求均值,value"`
	PingAddress     string `yaml:"pingAddress,omitempty" cf:"name=🏫 URL Ping 地址"`

	TaskRetry  uint     `yaml:"taskRetry,omitempty" cf:"name=🐛 测试重试次数"`
	DNSServers []string `yaml:"dnsServers,omitempty" cf:"name=💾 自定义DNS服务器,childvalue"`

	TaskTimeout uint     `yaml:"-" fw:"readonly"`
	Scripts     []Script `yaml:"-" fw:"readonly"`
}

const (
	ApiV0 = iota
	ApiV1 = iota
	ApiV2 = iota
)

type SlaveRequestConfigsV2 struct {
	*SlaveRequestConfigsV1
	ApiVersion      int    `yaml:"apiVersion,omitempty" cf:"name=🧬API版本，用于兼容Miaoko以及其他客户端"`
	UploadURL       string `yaml:"uploadURL,omitempty" cf:"name=📃 上行测速文件"`
	UploadDuration  int64  `yaml:"uploadDuration,omitempty" cf:"name=⏱️ 上行测速时长 (单位: 秒)"`
	UploadThreading uint   `yaml:"uploadThreading,omitempty" cf:"name=🧶 上行测速线程数"`
}

func (srcv2 *SlaveRequestConfigsV2) Clone() *SlaveRequestConfigsV2 {
	return &SlaveRequestConfigsV2{
		SlaveRequestConfigsV1: srcv2.SlaveRequestConfigsV1.Clone(),
		ApiVersion:            srcv2.ApiVersion,
		UploadURL:             srcv2.UploadURL,
		UploadDuration:        srcv2.UploadDuration,
		UploadThreading:       srcv2.UploadThreading,
	}
}

func (srcv2 *SlaveRequestConfigsV2) CloneToV1() *SlaveRequestConfigsV1 {
	return &SlaveRequestConfigsV1{
		STUNURL:           srcv2.STUNURL,
		DownloadURL:       srcv2.DownloadURL,
		DownloadDuration:  srcv2.DownloadDuration,
		DownloadThreading: srcv2.DownloadThreading,

		PingAverageOver: srcv2.PingAverageOver,
		PingAddress:     srcv2.PingAddress,

		TaskRetry:  srcv2.TaskRetry,
		DNSServers: cloneSlice(srcv2.DNSServers),

		TaskTimeout: srcv2.TaskTimeout,
		Scripts:     srcv2.Scripts,
	}
}

func (src *SlaveRequestConfigsV1) DescriptionText() string {
	hint := structs.X("案例:\ndownloadDuration: 取值范围 [1,30]\ndownloadThreading: 取值范围 [1,8]\ntaskThreading: 取值范围 [1,32]\ntaskRetry: 取值范围 [1,10]\n\n当前:\n")
	cont := "empty"
	if src != nil {
		cont = structs.X("downloadDuration: %d\ndownloadThreading: %d\ntaskRetry: %d\n", src.DownloadDuration, src.DownloadThreading, src.TaskRetry)
	}
	return hint + cont
}

func (src *SlaveRequestConfigsV1) Clone() *SlaveRequestConfigsV1 {
	return &SlaveRequestConfigsV1{
		STUNURL:           src.STUNURL,
		DownloadURL:       src.DownloadURL,
		DownloadDuration:  src.DownloadDuration,
		DownloadThreading: src.DownloadThreading,

		PingAverageOver: src.PingAverageOver,
		PingAddress:     src.PingAddress,

		TaskRetry:  src.TaskRetry,
		DNSServers: cloneSlice(src.DNSServers),

		TaskTimeout: src.TaskTimeout,
		Scripts:     src.Scripts,
	}
}

func (src *SlaveRequestConfigsV1) Merge(from *SlaveRequestConfigsV1) *SlaveRequestConfigsV1 {
	ret := src.Clone()
	if from.STUNURL != "" {
		ret.STUNURL = from.STUNURL
	}

	if from.DownloadURL != "" {
		ret.DownloadURL = from.DownloadURL
	}
	if from.DownloadDuration != 0 {
		ret.DownloadDuration = from.DownloadDuration
	}
	if from.DownloadThreading != 0 {
		ret.DownloadThreading = from.DownloadThreading
	}

	if from.PingAverageOver != 0 {
		ret.PingAverageOver = from.PingAverageOver
	}
	if from.PingAddress != "" {
		ret.PingAddress = from.PingAddress
	}

	if from.TaskRetry != 0 {
		ret.TaskRetry = from.TaskRetry
	}

	if from.DNSServers != nil {
		ret.DNSServers = from.DNSServers[:]
	}

	if from.TaskTimeout != 0 {
		ret.TaskTimeout = from.TaskTimeout
	}
	if from.Scripts != nil {
		ret.Scripts = from.Scripts
	}

	return ret
}

func (src *SlaveRequestConfigsV1) Check() *SlaveRequestConfigsV1 {
	if src == nil {
		src = &SlaveRequestConfigsV1{}
	}

	if src.STUNURL == "" {
		src.STUNURL = preconfigs.PROXY_DEFAULT_STUN_SERVER
	}
	if src.DownloadURL == "" {
		src.DownloadURL = preconfigs.SPEED_DEFAULT_LARGE_FILE_DEFAULT
	}
	if src.DownloadDuration < 1 || src.DownloadDuration > 30 {
		src.DownloadDuration = preconfigs.SPEED_DEFAULT_DURATION
	}
	if src.DownloadThreading < 1 || src.DownloadThreading > 32 {
		src.DownloadThreading = preconfigs.SPEED_DEFAULT_THREADING
	}

	if src.TaskRetry < 1 || src.TaskRetry > 10 {
		src.TaskRetry = preconfigs.SLAVE_DEFAULT_RETRY
	}

	if src.PingAddress == "" {
		src.PingAddress = preconfigs.SLAVE_DEFAULT_PING
	}
	if src.PingAverageOver == 0 || src.PingAverageOver > 16 {
		src.PingAverageOver = 1
	}

	if src.DNSServers == nil {
		src.DNSServers = make([]string, 0)
	}

	if src.TaskTimeout < 10 || src.TaskTimeout > 10000 {
		src.TaskTimeout = preconfigs.SLAVE_DEFAULT_TIMEOUT
	}
	if src.Scripts == nil {
		src.Scripts = make([]Script, 0)
	}

	return src
}
