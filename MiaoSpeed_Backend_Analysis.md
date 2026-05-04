# MiaoSpeed 深度分析报告

> **项目地址**: https://github.com/amo0114/miaospeed (Fork)
> **原仓库**: https://github.com/AirportR/miaospeed
> **版本**: v4.6.4 | **Go**: 1.25 | **Mihomo**: v1.19.20
> **协议**: AGPLv3 | **语言**: Go

---

## 目录

1. [项目结构](#1-项目结构)
2. [WebSocket 协议](#2-websocket-协议)
3. [核心结构体](#3-核心结构体)
4. [签名机制](#4-签名机制)
5. [支持的测试功能](#5-支持的测试功能)
6. [前端对接关键点](#6-前端对接关键点)
7. [与原 AirportR 仓库的差异](#7-与原-airportr-仓库的差异)
8. [前端开发路线图和技术栈推荐](#8-前端开发路线图和技术栈推荐)
9. [前端开发建议总结](#9-前端开发建议总结)

---

## 1. 项目结构

```
miaospeed/
├── main.go                    # 入口，设置编译常量，调用 CLI
├── cli.go                     # CLI 路由：server / script / misc 子命令
├── cli_server.go              # server 子命令：参数解析、启动配置
├── cli_script.go              # script 子命令：临时脚本测试
├── cli_misc.go                # misc 子命令：工具集
├── misc.go                    # 空文件占位
│
├── interfaces/                # 核心接口和类型定义
│   ├── api_request.go         # SlaveRequest / SlaveRequestV1/V2 结构体
│   ├── api_request_config.go  # SlaveRequestConfigsV1/V2/V3 配置
│   ├── api_response.go        # SlaveResponse / SlaveTask / SlaveProgress
│   ├── matrix.go              # Matrix 类型常量 + SlaveRequestMatrix 接口
│   ├── matrix_fields.go       # 各 Matrix 的数据结构 (DataStruct)
│   ├── macro.go               # Macro 类型常量 + SlaveRequestMacro 接口
│   ├── macro_fields.go        # Macro 字段类型常量
│   ├── vendor.go              # Vendor 接口 + VendorType 常量
│   ├── proxy.go               # ProxyType 枚举 + ProxyInfo 结构体
│   ├── scripts.go             # Script / ScriptResult 定义
│   ├── geoip.go               # GeoInfo / IPStacks / MultiStacks
│   ├── misc.go                # RequestOptionsNetwork / RequestOptions
│   └── utils.go               # cloneSlice 工具
│
├── service/                   # 核心服务层
│   ├── server.go              # WebSocket 服务器：升级、验证、分发
│   ├── service.go             # 空文件
│   ├── task.go                # SpeedTaskPoll / ConnTaskPoll 初始化
│   ├── runner.go              # ExtractMacrosFromMatrices
│   ├── testingpollitem.go     # TestingPollItem：单节点测试执行体
│   │
│   ├── taskpoll/              # 任务队列系统
│   │   ├── controller.go      # TPController：并发控制、任务调度
│   │   └── item.go            # TaskPollItem 接口
│   │
│   ├── matrices/              # Matrix 实现
│   │   ├── matrices.go        # 矩阵注册表 (registeredList)
│   │   ├── httpping/          # TEST_PING_CONN
│   │   ├── rttping/           # TEST_PING_RTT
│   │   ├── maxrttping/        # TEST_PING_MAX_RTT
│   │   ├── totalrttping/      # TEST_PING_TOTAL_RTT / TOTAL_CONN
│   │   ├── sdrtt/             # TEST_PING_SD_RTT (标准差)
│   │   ├── sdhttp/            # TEST_PING_SD_CONN
│   │   ├── averagespeed/      # SPEED_AVERAGE / USPEED_AVERAGE
│   │   ├── maxspeed/          # SPEED_MAX / USPEED_MAX
│   │   ├── persecondspeed/    # SPEED_PER_SECOND / USPEED_PER_SECOND
│   │   ├── packetloss/        # TEST_PING_PACKET_LOSS
│   │   ├── httpstatuscode/    # TEST_HTTP_CODE
│   │   ├── udptype/           # UDP_TYPE
│   │   ├── inboundgeoip/      # GEOIP_INBOUND
│   │   ├── outboundgeoip/     # GEOIP_OUTBOUND
│   │   ├── scripttest/        # TEST_SCRIPT
│   │   ├── hijack/            # TEST_HIJACK_DETECTION
│   │   ├── debug/             # DEBUG_SLEEP
│   │   ├── invalid/           # INVALID (占位)
│   │   └── engine.go          # 矩阵工具函数
│   │
│   └── macros/                # Macro 实现
│       ├── macros.go          # 宏注册表 (registeredList)
│       ├── ping/              # PING 宏：RTT/HTTP Ping/丢包率
│       ├── speed/             # SPEED / USPEED 宏：下载/上传测速
│       ├── udp/               # UDP 宏：NAT 类型检测
│       ├── geo/               # GEO 宏：GeoIP 查询
│       ├── script/            # SCRIPT 宏：JS 脚本执行
│       ├── hijack/            # HIJACK 宏：劫持检测
│       ├── sleep/             # SLEEP 宏：调试用
│       └── invalid/           # INVALID 宏占位
│
├── vendors/                   # 代理连接供应商
│   ├── vendors.go             # Vendor 注册表
│   ├── commons.go             # 通用请求工具
│   ├── clash/                 # Clash/Mihomo Vendor
│   │   ├── vendor.go          # DialTCP / DialUDP 实现
│   │   ├── metadata.go        # URL to Metadata 转换
│   │   └── profile.go         # YAML 代理解析
│   ├── local/                 # 本地 Vendor（直连）
│   └── invalid/               # 无效 Vendor 占位
│
├── engine/                    # JavaScript 脚本引擎
│   ├── engine.go              # goja VM 管理、超时控制
│   ├── embeded.go             # 嵌入文件声明
│   ├── embeded/               # 嵌入的脚本和证书
│   │   ├── predefined.js      # JS 预定义函数 (get/safeStringify/...)
│   │   ├── default_geoip.js   # 默认 GeoIP 脚本
│   │   └── default_ip.js      # 默认 IP 解析脚本
│   ├── factory/               # JS 工厂函数 (fetch/netcat/print)
│   └── helpers/               # VM 辅助函数
│
├── preconfigs/                # 预配置
│   ├── network.go             # 默认 STUN 服务器、测速 URL、超时参数
│   ├── certs.go               # TLS 证书加载
│   └── embeded.go             # 嵌入的 CA 证书
│
└── utils/                     # 工具层
    ├── config.go              # GlobalConfig 结构体
    ├── challenge.go           # 签名算法 (SHA512)
    ├── constants.go           # 版本号、LOGO、BUILDTOKEN
    ├── logger.go              # 日志系统
    ├── dns.go                 # DNS 解析
    ├── network.go             # 网络工具
    ├── dialer.go              # 自定义拨号器
    ├── maxmind.go             # MaxMind GeoIP DB
    ├── archive.go             # 归档工具
    ├── stats.go               # 统计工具
    ├── sys.go                 # 系统信号处理
    ├── utils.go               # 通用工具
    ├── ipfliter/              # IP 白名单/黑名单过滤
    └── structs/               # 数据结构工具
        ├── asyncarr.go        # 线程安全数组
        ├── asyncmap.go        # 线程安全 Map
        ├── set.go             # 集合
        ├── helper.go          # 集合/过滤/查找等工具函数
        ├── misc.go            # 数值范围限制等
        ├── ipfliter.go        # IP 过滤器接口
        └── memutils/          # 内存工具
```

### 1.1 核心抽象设计

| 抽象层 | 说明 | 位置 |
|--------|------|------|
| **Matrix** | 数据矩阵，用户想要获取的某个数据的最小颗粒度 | `interfaces/matrix.go` |
| **Macro** | 运行时宏任务，最小颗粒度的执行体 | `interfaces/macro.go` |
| **Vendor** | 服务提供商接口，为 miaospeed 提供代理连接能力 | `interfaces/vendor.go` |

---

## 2. WebSocket 协议

### 2.1 连接方式

| 特性 | 说明 |
|------|------|
| **协议** | WebSocket (RFC 6455) |
| **库** | `github.com/gorilla/websocket v1.5.3` |
| **默认端口** | 自定义 (`-bind 0.0.0.0:8080`) |
| **路径** | 默认 `/`，可通过 `-path` 自定义 |
| **TLS** | 可选，通过 `-mtls` 启用自签名 TLS |
| **Unix Socket** | 支持，路径以 `/` 开头时自动识别 |
| **IP 过滤** | `-allowip` 参数，默认允许所有 |
| **Buffer** | ReadBufferSize=1024, WriteBufferSize=1024 |

### 2.2 连接流程

```
客户端                              服务端
  |                                    |
  |---- HTTP Upgrade Request --------->|
  |<--- 101 Switching Protocols ------|
  |                                    |
  |     (WebSocket 连接建立)            |
  |                                    |
  |---- SlaveRequest (JSON) --------->|
  |                                    | 验证 Challenge (签名)
  |                                    | 验证 Invoker 白名单
  |                                    | 解析 Matrices
  |                                    | 选择 TaskPoll
  |                                    |
  |<--- SlaveResponse (Progress) -----|  (每个节点完成时)
  |<--- SlaveResponse (Progress) -----|
  |<--- SlaveResponse (Result) -------|  (全部完成)
  |                                    |
```

### 2.3 消息格式

#### 请求消息 (SlaveRequest)

```json
{
  "Basics": {
    "ID": "task-uuid",
    "Slave": "slave-id",
    "SlaveName": "slave-name",
    "Invoker": "bot-id",
    "Version": "1.0"
  },
  "Options": {
    "Filter": "filter-expression",
    "Matrices": [
      {"Type": "TEST_PING_RTT", "Params": ""},
      {"Type": "SPEED_AVERAGE", "Params": ""}
    ]
  },
  "Configs": {
    "ApiVersion": 3,
    "DownloadURL": "DYNAMIC:INTL",
    "DownloadDuration": 3,
    "DownloadThreading": 1,
    "UploadURL": "DYNAMIC:INTL",
    "UploadDuration": 3,
    "UploadThreading": 1,
    "PingAverageOver": 1,
    "PingAddress": "http://gstatic.com/generate_204",
    "TaskRetry": 3,
    "DNSServers": [],
    "TaskTimeout": 5000,
    "Scripts": []
  },
  "Vendor": "Clash",
  "Nodes": [
    {"Name": "node-name", "Payload": "yaml-proxy-config"}
  ],
  "RandomSequence": "random-uuid",
  "Challenge": "computed-signature-base64"
}
```

#### 响应消息 (SlaveResponse)

```json
{
  "ID": "task-uuid",
  "MiaoSpeedVersion": "4.6.X",
  "Error": "",
  "Result": {
    "Request": {},
    "Results": [
      {
        "Grouping": "",
        "ProxyInfo": {"Name": "node-1", "Address": "1.2.3.4:443", "Type": "Vmess"},
        "InvokeDuration": 1234,
        "Matrices": [
          {"Type": "TEST_PING_RTT", "Payload": "{\"Value\":120}"},
          {"Type": "SPEED_AVERAGE", "Payload": "{\"Value\":12345678}"}
        ]
      }
    ]
  },
  "Progress": null
}
```

### 2.4 认证流程

| 组件 | 说明 |
|------|------|
| **启动 TOKEN** | 启动时通过 `-token` 参数设置 |
| **编译 TOKEN** | 编译时嵌入的 `BUILDTOKEN.key` 文件，格式 `seg1|seg2|seg3` |
| **签名验证** | 客户端计算 `Challenge`，服务端验证一致性 |
| **Invoker 白名单** | 可选，通过 `-whitelist` 参数限制 |
| **IP 过滤** | 通过 `-allowip` 参数限制 |

### 2.5 服务端启动参数

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `-token` | 请求签名 Token | 必填 |
| `-bind` | 监听地址 | 必填 |
| `-path` | WebSocket 路径 | `/` |
| `-connthread` | 并行连接测试线程数 | 64 |
| `-tasklimit` | 任务队列上限 | 1000 |
| `-speedlimit` | 速度限制 (Bytes/s) | 0 |
| `-nospeed` | 禁用下载测速 | false |
| `-upload` | 启用上传测速 | false |
| `-ipv6` | 启用 IPv6 | false |
| `-allowip` | 允许的 IP 范围 | `0.0.0.0/0,::/0` |
| `-whitelist` | Bot ID 白名单 | 空 |
| `-demo` | Demo 模式 | false |

---

## 3. 核心结构体

### 3.1 SlaveRequest (API V3)

```go
type SlaveRequest struct {
    Basics  SlaveRequestBasics    // 基础信息
    Options SlaveRequestOptions   // 测试选项
    Configs SlaveRequestConfigsV3 // 测试配置
    Vendor  VendorType            // 代理供应商类型
    Nodes   []SlaveRequestNode    // 待测节点列表
    RandomSequence string         // 随机序列（防重放）
    Challenge      string         // 签名挑战值
}
```

### 3.2 SlaveRequestBasics

```go
type SlaveRequestBasics struct {
    ID        string  // 任务唯一标识
    Slave     string  // 从节点标识
    SlaveName string  // 从节点名称
    Invoker   string  // 调用者标识（用于白名单验证）
    Version   string  // 客户端版本
}
```

### 3.3 SlaveRequestOptions

```go
type SlaveRequestOptions struct {
    Filter   string                      // 节点过滤表达式
    Matrices []SlaveRequestMatrixEntry   // 要执行的测试矩阵列表
}

type SlaveRequestMatrixEntry struct {
    Type   SlaveRequestMatrixType  // 矩阵类型常量
    Params string                  // 矩阵参数
}
```

### 3.4 SlaveRequestConfigsV3

```go
type SlaveRequestConfigsV3 struct {
    *SlaveRequestConfigsV2
    UploadURL       string  // 上行测速文件 URL
    UploadDuration  int64   // 上行测速时长 (秒)
    UploadThreading uint    // 上行测速线程数
}

type SlaveRequestConfigsV2 struct {
    *SlaveRequestConfigsV1
    ApiVersion int  // API 版本 (0-3)
}

type SlaveRequestConfigsV1 struct {
    STUNURL           string   // STUN 服务器地址
    DownloadURL       string   // 下行测速文件 URL
    DownloadDuration  int64    // 下行测速时长 (秒) [1,30]
    DownloadThreading uint     // 下行测速线程数 [1,32]
    PingAverageOver   uint16   // Ping 求均值次数 [1,16]
    PingAddress       string   // Ping 目标地址
    TaskRetry         uint     // 测试重试次数 [1,10]
    DNSServers        []string // 自定义 DNS 服务器
    TaskTimeout       uint     // 任务超时 (ms) [10,10000]
    Scripts           []Script // JavaScript 脚本列表
}
```

### 3.5 SlaveRequestNode

```go
type SlaveRequestNode struct {
    Name    string  // 节点名称
    Payload string  // 代理配置 (YAML 格式)
}
```

### 3.6 SlaveResponse

```go
type SlaveResponse struct {
    ID               string         // 任务 ID
    MiaoSpeedVersion string         // 服务端版本号
    Error            string         // 错误信息
    Result           *SlaveTask     // 最终结果
    Progress         *SlaveProgress // 进度更新
}
```

### 3.7 SlaveTask 和 SlaveProgress

```go
type SlaveTask struct {
    Request SlaveRequest      // 原始请求
    Results []SlaveEntrySlot  // 所有节点结果
}

type SlaveProgress struct {
    Index   int            // 当前节点索引
    Record  SlaveEntrySlot // 节点结果
    Queuing int            // 队列剩余数
}
```

### 3.8 SlaveEntrySlot 和 MatrixResponse

```go
type SlaveEntrySlot struct {
    Grouping       string           // 分组标识
    ProxyInfo      ProxyInfo        // 代理信息
    InvokeDuration int64            // 执行耗时 (ms)
    Matrices       []MatrixResponse // 矩阵结果列表
}

type MatrixResponse struct {
    Type    SlaveRequestMatrixType // 矩阵类型
    Payload string                 // JSON 结果数据
}
```

### 3.9 VendorType 和 ProxyType

```go
type VendorType string
const (
    VendorLocal VendorType = "Local"    // 本地直连
    VendorClash VendorType = "Clash"    // Clash/Mihomo 代理
)

type ProxyType string
// 支持：Shadowsocks, Vmess, Trojan, Vless, Hysteria2,
// TUIC, Wireguard, SSH, AnyTLS, Masque 等
```

### 3.10 ProxyInfo

```go
type ProxyInfo struct {
    Name    string    // 节点名称
    Address string    // 节点地址
    Type    ProxyType // 代理类型
}
```

### 3.11 Script 和 ScriptResult

```go
type Script struct {
    ID            string     // 脚本 ID
    Type          ScriptType // 类型 (media/ip)
    Content       string     // JavaScript 内容
    TimeoutMillis uint64     // 超时 (ms)
}

type ScriptResult struct {
    Text        string // 显示文本
    Color       string // 文本颜色
    Background  string // 背景颜色
    TimeElapsed int64  // 执行耗时 (ms)
}
```

### 3.12 GeoInfo 和 MultiStacks

```go
type GeoInfo struct {
    Org           string  `json:"organization"`
    Lon           float32 `json:"longitude"`
    Lat           float32 `json:"latitude"`
    TimeZone      string  `json:"timezone"`
    ISP           string  `json:"isp"`
    ASN           int     `json:"asn"`
    ASNOrg        string  `json:"asn_organization"`
    Country       string  `json:"country"`
    IP            string  `json:"ip"`
    ContinentCode string  `json:"continent_code"`
    CountryCode   string  `json:"country_code"`
    StackType     string  `json:"stackType"`
}

type MultiStacks struct {
    Domain    string
    IPv4Stack []*GeoInfo
    IPv6Stack []*GeoInfo
}
```

---

## 4. 签名机制

### 4.1 算法流程

```
1. 克隆 SlaveRequest，清空 Challenge 字段
2. JSON 序列化，去除首尾空格
3. 构建 Token 链：[启动TOKEN, 编译TOKEN段1, 编译TOKEN段2, ...]
4. 累积 SHA512 哈希
5. Base64 URL 编码
```

### 4.2 核心代码

```go
func hashMiaoSpeed(token, request string) string {
    buildTokens := append([]string{token}, strings.Split(BUILDTOKEN, "|")...)
    hasher := sha512.New()
    hasher.Write([]byte(request))
    for _, t := range buildTokens {
        if t == "" { t = "SOME_TOKEN" }
        hasher.Write(hasher.Sum([]byte(t)))
    }
    return base64.URLEncoding.EncodeToString(hasher.Sum(nil))
}
```

### 4.3 编译 TOKEN 示例

```
MIAOKO4|580JxAo049R|GEnERAl|1X571R930|T0kEN
```

### 4.4 API 版本差异

| 版本 | 说明 |
|------|------|
| V0/V1 | 清空 Scripts 和 Nodes |
| V2 | 包含 ApiVersion 字段 |
| V3 | 包含上传测速字段（推荐） |

---

## 5. 支持的测试功能

### 5.1 Matrix 类型列表

| 类型常量 | 说明 | 数据结构 | Macro |
|----------|------|---------|-------|
| `SPEED_AVERAGE` | 平均下载速度 | `AverageSpeedDS` | SPEED |
| `SPEED_MAX` | 最大下载速度 | `MaxSpeedDS` | SPEED |
| `SPEED_PER_SECOND` | 逐秒下载速度 | `PerSecondSpeedDS` | SPEED |
| `USPEED_AVERAGE` | 平均上传速度 | `AverageSpeedDS` | USPEED |
| `USPEED_MAX` | 最大上传速度 | `MaxSpeedDS` | USPEED |
| `USPEED_PER_SECOND` | 逐秒上传速度 | `PerSecondSpeedDS` | USPEED |
| `UDP_TYPE` | NAT 类型 | `UDPTypeDS` | UDP |
| `GEOIP_INBOUND` | 入口 GeoIP | `InboundGeoIPDS` | GEO |
| `GEOIP_OUTBOUND` | 出口 GeoIP | `OutboundGeoIPDS` | GEO |
| `TEST_PING_CONN` | HTTP 延迟 | `HTTPPingDS` | PING |
| `TEST_PING_RTT` | RTT 延迟 | `RTTPingDS` | PING |
| `TEST_PING_MAX_RTT` | 最大 RTT | `MaxRTTDS` | PING |
| `TEST_PING_TOTAL_CONN` | 多次 HTTP 延迟 | `TotalHTTPDS` | PING |
| `TEST_PING_TOTAL_RTT` | 多次 RTT | `TotalRTTDS` | PING |
| `TEST_PING_SD_RTT` | RTT 标准差 | `SDRTTDS` | PING |
| `TEST_PING_SD_CONN` | HTTP 延迟标准差 | `SDHTTPDS` | PING |
| `TEST_PING_PACKET_LOSS` | 丢包率 | `PacketLossDS` | PING |
| `TEST_HTTP_CODE` | HTTP 状态码 | `HTTPStatusCodeDS` | PING |
| `TEST_SCRIPT` | 自定义脚本 | `ScriptTestDS` | SCRIPT |
| `TEST_HIJACK_DETECTION` | 劫持检测 | `HijackDS` | HIJACK |
| `DEBUG_SLEEP` | 调试休眠 | - | SLEEP |

### 5.2 测试参数范围

| 参数 | 范围 | 默认值 |
|------|------|--------|
| `DownloadDuration` | [1, 30] 秒 | 3 |
| `DownloadThreading` | [1, 32] | 1 |
| `UploadDuration` | [1, 30] 秒 | 3 |
| `UploadThreading` | [1, 32] | 1 |
| `PingAverageOver` | [1, 16] | 1 |
| `TaskRetry` | [1, 10] | 3 |
| `TaskTimeout` | [10, 10000] ms | 5000 |

---

## 6. 前端对接关键点

### 6.1 必须注意的事项

1. **签名必须正确** - JSON 序列化后 TrimSpace，Token 链顺序正确
2. **API 版本选择** - 推荐 V3（支持上传测速）
3. **WebSocket 路径** - 必须与服务端 `-path` 参数匹配
4. **响应区分** - Progress (Progress != null) vs Result (Result != null)
5. **节点 Payload** - 必须是合法的 Clash YAML 配置

### 6.2 潜在坑点

| 坑点 | 解决方案 |
|------|---------|
| 签名不匹配 | 确保 JSON 序列化顺序一致 |
| Challenge 未清空 | 克隆请求后再签名 |
| SpeedTaskPoll 排队 | 显示 Queuing 数 |
| 连接断开=任务中止 | 保持连接直到收到 Result |
| IPv6 默认禁用 | 服务端加 `-ipv6` |
| 上传测速限制 | 需 `-upload` 且 ApiVersion >= 3 |

---

## 7. 与原 AirportR 仓库的差异

Fork 代码与原仓库**完全一致**，最新提交 `7f9ca30`。

v4.6.4 更新：
- 新增 Masque 协议支持
- 新增网卡绑定 (`-interface/-i`)
- 新增安装脚本 `miaospeed.sh`
- 支持上传测速（需 `-upload` 启用）
- Mihomo 升级到 v1.19.20

---

## 8. 前端开发路线图和技术栈推荐

### 8.1 推荐技术栈

| 层级 | 推荐 | 理由 |
|------|------|------|
| 框架 | Next.js 14+ | React 生态成熟 |
| 语言 | TypeScript | 类型安全 |
| UI | shadcn/ui + Tailwind | 现代可定制 |
| 状态 | Zustand | 轻量简单 |
| WebSocket | 原生 + 封装 | 标准协议 |
| 图表 | Recharts | React 友好 |
| YAML | js-yaml | 成熟稳定 |
| 表格 | TanStack Table | 高度可定制 |

### 8.2 开发路线图

**Phase 1 (1-2 周)**: 基础框架 - WS 连接、签名、基础 UI
**Phase 2 (2-3 周)**: 核心功能 - 节点管理、测试配置、任务提交
**Phase 3 (2-3 周)**: 结果展示 - 进度、表格、图表、历史
**Phase 4 (2-3 周)**: 高级功能 - 多服务器、脚本编辑、主题

---

## 9. 前端开发建议总结

### 核心原则

1. **类型安全第一** - 所有通信结构体必须有 TS 类型定义
2. **签名一致性** - 算法必须与 Go 端完全一致
3. **错误处理完善** - 连接断开、签名错误、超时等场景
4. **渐进式开发** - 先实现基础连通性，再添加高级功能

### 开发优先级

| 优先级 | 功能 |
|--------|------|
| P0 | WebSocket 连接 + 签名 |
| P0 | 节点导入 + 基本测试 |
| P1 | 实时进度展示 |
| P1 | 结果表格 + 排序 |
| P2 | 速度/延迟图表 |
| P2 | GeoIP 地图 |
| P3 | 多服务器管理 |
| P3 | 脚本编辑器 |

### 注意事项清单

- [ ] 签名算法与 Go 端完全一致
- [ ] WebSocket 路径匹配服务端配置
- [ ] API 版本使用 V3
- [ ] 处理 Progress 和 Result 两种响应
- [ ] 节点 Payload 必须是合法 YAML
- [ ] 处理连接断开时的任务中止
- [ ] SpeedTaskPoll 并发=1，需处理排队
- [ ] 上传测速需要 `-upload` 且 ApiVersion >= 3
- [ ] IPv6 默认禁用，需服务端开启
- [ ] 错误响应的 `Error` 字段非空表示失败

---

> **文档版本**: v1.0
> **生成时间**: 2026-05-03
> **基于代码版本**: miaospeed v4.6.4 (commit 7f9ca30)
