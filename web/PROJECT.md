# MiaoSpeed WebUI 前端项目文档



> **版本**: v1.1.0

> **后端版本**: MiaoSpeed v4.6.4

> **技术栈**: Vite 8 + React 19 + TypeScript 6 + Tailwind CSS 4 + shadcn/ui 风格组件



---



## 目录



1. [项目概述](#1-项目概述)

2. [支持的代理协议](#2-支持的代理协议)

3. [技术栈](#3-技术栈)

4. [项目结构](#4-项目结构)

5. [核心模块说明](#5-核心模块说明)

6. [快速开始](#6-快速开始)

7. [配置说明](#7-配置说明)

8. [使用指南](#8-使用指南)

9. [开发指南](#9-开发指南)



---



## 1. 项目概述



MiaoSpeed WebUI 是 MiaoSpeed 代理测速后端的前端客户端，提供：



- **节点导入** - 支持 Clash YAML、订阅链接、代理 URI

- **一键测速** - Ping / Speed / Full 三种测试模式

- **实时进度** - WebSocket 实时显示测试进度

- **结果展示** - 表格展示，支持排序、筛选、导出 CSV

- **深色主题** - OLED 级深色设计，护眼专业



---



## 2. 支持的代理协议



MiaoSpeed 基于 [Mihomo](https://github.com/MetaCubeX/Mihomo) 内核，支持以下 **17 种**代理协议：



### 2.1 完整协议列表



| 协议 | 类型常量 | 说明 | 支持状态 |

|------|---------|------|---------|

| **Shadowsocks** | `Shadowsocks` | SS 经典协议 | ✅ 完整支持 |

| **ShadowsocksR** | `ShadowsocksR` | SSR 协议 | ✅ 完整支持 |

| **Vmess** | `Vmess` | VMess 协议 (VMess/VMessAEAD) | ✅ 完整支持 |

| **VLESS** | `Vless` | VLESS 协议 | ✅ 完整支持 |

| **Trojan** | `Trojan` | Trojan 协议 | ✅ 完整支持 |

| **Hysteria** | `Hysteria` | Hysteria v1 | ✅ 完整支持 |

| **Hysteria2** | `Hysteria2` | Hysteria v2 | ✅ 完整支持 |

| **TUIC** | `TUIC` | TUIC 协议 | ✅ 完整支持 |

| **WireGuard** | `Wireguard` | WireGuard VPN | ✅ 完整支持 |

| **Snell** | `Snell` | Snell 协议 | ✅ 完整支持 |

| **Socks5** | `Socks5` | SOCKS5 代理 | ✅ 完整支持 |

| **HTTP(S)** | `Http` | HTTP/HTTPS 代理 | ✅ 完整支持 |

| **SSH** | `SSH` | SSH 隧道 | ✅ 完整支持 |

| **Mieru** | `Mieru` | Mieru 协议 | ✅ 完整支持 |

| **AnyTLS** | `AnyTLS` | AnyTLS 协议 | ✅ 完整支持 |

| **Sudoku** | `Sudoku` | Sudoku 协议 | ✅ 完整支持 |

| **Masque** | `Masque` | MASQUE 协议 (v4.6.4 新增) | ✅ 完整支持 |



### 2.2 高级特性支持



| 特性 | 支持状态 | 说明 |

|------|---------|------|

| **VLESS + Reality** | ✅ 支持 | 通过 Mihomo 内核解析 |

| **VLESS + XTLS** | ✅ 支持 | XTLS-Vision 流控 |

| **VLESS + WebSocket** | ✅ 支持 | WS 传输层 |

| **VLESS + gRPC** | ✅ 支持 | gRPC 传输层 |

| **Vmess + AEAD** | ✅ 支持 | VMessAEAD 加密 |

| **Trojan + WebSocket** | ✅ 支持 | WS 传输层 |

| **Trojan + gRPC** | ✅ 支持 | gRPC 传输层 |

| **Hysteria2 + 混淆** | ✅ 支持 | 混淆密码 |

| **TUIC + UDP** | ✅ 支持 | UDP 优先 |

| **Shadowsocks + 插件** | ✅ 支持 | obfs/v2ray-plugin |

| **AnyTLS** | ✅ 支持 | v4.6.4 新增 |

| **Masque** | ✅ 支持 | v4.6.4 新增 |



### 2.3 协议配置示例



#### VLESS + Reality



```yaml

name: "VLESS-Reality"

type: vless

server: example.com

port: 443

uuid: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

network: tcp

tls: true

flow: xtls-rprx-vision

client-fingerprint: chrome

reality-opts:

  public-key: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

  short-id: xxxxxxxx

servername: www.google.com

```



#### AnyTLS



```yaml

name: "AnyTLS-Node"

type: anytls

server: example.com

port: 443

password: your-password

sni: example.com

client-fingerprint: chrome

```



#### Hysteria2



```yaml

name: "Hysteria2-Node"

type: hysteria2

server: example.com

port: 443

password: your-password

sni: example.com

up: 100 Mbps

down: 200 Mbps

```



#### Masque



```yaml

name: "Masque-Node"

type: masque

server: example.com

port: 443

uuid: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

password: your-password

```



---



## 3. 技术栈



| 类别 | 技术 | 版本 | 说明 |

|------|------|------|------|

| **构建工具** | Vite | 8.x | 快速开发服务器和构建 |

| **前端框架** | React | 19.x | 组件化 UI 开发 |

| **类型系统** | TypeScript | 6.x | 类型安全 |

| **CSS 框架** | Tailwind CSS | 4.x | 原子化 CSS |

| **UI 组件** | shadcn/ui 风格 | - | 可复用组件 |

| **图标库** | Lucide React | Latest | SVG 图标 |

| **YAML 解析** | js-yaml | Latest | Clash 配置解析 |

| **WebSocket** | 原生 API | - | 与后端通信 |

| **加密** | Web Crypto API | - | SHA-512 签名 |



### 3.1 设计系统



| 属性 | 值 | 说明 |

|------|-----|------|

| **主色调** | `#22C55E` | 绿色，表示成功/活跃 |

| **背景色** | `#020617` | 深黑，OLED 友好 |

| **卡片色** | `#0F172A` | 深蓝黑 |

| **边框色** | `#1E293B` | 暗灰 |

| **文本色** | `#F8FAFC` | 亮白 |

| **次要文本** | `#94A3B8` | 灰色 |

| **错误色** | `#EF4444` | 红色 |

| **警告色** | `#F59E0B` | 橙色 |

| **信息色** | `#3B82F6` | 蓝色 |

| **字体** | Plus Jakarta Sans | 现代无衬线 |



---



## 4. 项目结构



```

web/

├── public/

│   └── favicon.svg                 # 闪电图标 favicon

│

├── src/

│   ├── components/                 # React 组件

│   │   ├── ui/                     # shadcn/ui 基础组件

│   │   │   ├── badge.tsx           # 徽章组件

│   │   │   ├── button.tsx          # 按钮组件

│   │   │   ├── card.tsx            # 卡片组件

│   │   │   ├── input.tsx           # 输入框组件

│   │   │   └── textarea.tsx        # 文本域组件

│   │   │

│   │   ├── header.tsx              # 顶部导航栏

│   │   ├── node-importer.tsx       # 节点导入组件

│   │   ├── test-panel.tsx          # 测试配置面板

│   │   ├── results-table.tsx       # 结果展示表格

│   │   ├── progress-indicator.tsx  # 进度指示器

│   │   └── settings-dialog.tsx     # 设置对话框

│   │

│   ├── hooks/                      # React Hooks

│   │   └── use-miaospeed.ts        # WebSocket 核心 Hook

│   │

│   ├── lib/                        # 工具库

│   │   ├── crypto/

│   │   │   └── sign.ts             # SHA-512 签名算法

│   │   ├── yaml/

│   │   │   └── parser.ts           # YAML/URI 解析器

│   │   └── utils.ts                # 通用工具函数

│   │

│   ├── types/                      # TypeScript 类型

│   │   └── miaospeed.ts            # 与 Go 结构体对应的类型

│   │

│   ├── App.tsx                     # 主应用组件

│   ├── main.tsx                    # 应用入口

│   └── index.css                   # 全局样式 + 设计系统

│

├── index.html                      # HTML 入口

├── vite.config.ts                  # Vite 配置

├── tsconfig.json                   # TypeScript 配置

├── tsconfig.app.json               # 应用 TS 配置

├── tsconfig.node.json              # Node TS 配置

├── tailwind.config.js              # Tailwind 配置

├── postcss.config.js               # PostCSS 配置

└── package.json                    # 依赖管理

```



---



## 5. 核心模块说明



### 5.1 签名算法 (`lib/crypto/sign.ts`)



实现与 Go 后端兼容的请求签名流程，当前应以后端 `utils/challenge.go` 为唯一真值：



```

算法流程：

1. 克隆请求，清空 Challenge 字段

2. JSON 序列化并 TrimSpace

3. 构建 Token 链：[启动TOKEN, 编译TOKEN段1, 编译TOKEN段2, ...]

4. 累积 SHA-512：

   hash = SHA512(jsonString)

   hash = SHA512(hash + token[0])

   hash = SHA512(hash + token[1])

   ...

5. Base64 URL 编码

```



**核心函数**：

- `signRequest(token, request)` - 签名单个请求

- `buildRequest(token, nodes, matrices, configs)` - 构建完整请求

- `generateUUID()` - 生成 UUID v4



### 5.2 WebSocket Hook (`hooks/use-miaospeed.ts`)



管理与 MiaoSpeed 后端的 WebSocket 连接：



**状态管理**：

- `status` - 连接状态 (`disconnected` | `connecting` | `connected` | `error`)

- `progress` - 测试进度

- `results` - 测试结果

- `error` - 错误信息



**核心方法**：

- `connect()` - 建立连接

- `disconnect()` - 断开连接

- `submitTest(nodes, matrices, testType)` - 提交测试任务



**自动解析**：

- 从 `MatrixResponse` 提取 RTT、速度、丢包率、GeoIP 等

- 支持所有 21 种 Matrix 类型



### 5.3 YAML 解析器 (`lib/yaml/parser.ts`)



支持多种代理配置格式：



| 格式 | 示例 |

|------|------|

| **Clash YAML** | `proxies:\n  - name: xxx\n    type: vmess\n    ...` |

| **Vmess URI** | `vmess://base64json` |

| **Trojan URI** | `trojan://password@host:port#name` |

| **SS URI** | `ss://method:password@host:port#name` |

| **Base64 订阅** | `base64encoded(proxy1\nproxy2\n...)` |



### 5.4 类型定义 (`types/miaospeed.ts`)



与 Go 后端结构体一一对应的 TypeScript 类型：



| Go 结构体 | TypeScript 类型 |

|-----------|----------------|

| `SlaveRequest` | `SlaveRequest` |

| `SlaveResponse` | `SlaveResponse` |

| `SlaveEntrySlot` | `SlaveEntrySlot` |

| `MatrixResponse` | `MatrixResponse` |

| `ProxyInfo` | `ProxyInfo` |

| `SlaveRequestConfigsV3` | `SlaveRequestConfigs` |

| `GeoInfo` | `GeoInfo` |



---



## 6. 快速开始



### 6.1 前置条件



- Node.js >= 18

- npm >= 9

- MiaoSpeed 后端服务



### 6.2 安装



```bash

cd web

npm install

```



### 6.3 开发模式



```bash

npm run dev

```



访问 `http://localhost:5173`



### 6.4 生产构建



```bash

npm run build

```



输出到 `dist/` 目录



### 6.5 启动 MiaoSpeed 后端



```bash



# 推荐本地开发模式（Vite 代理 + 非 TLS）

./miaospeed server -bind 127.0.0.1:8765 -path /ws -token mySecretToken



# Demo 模式（自动生成配置）

./miaospeed server -bind 0.0.0.0:8765 -demo

```



---



## 7. 配置说明



### 7.1 前端配置



在应用内点击右上角齿轮图标打开设置：



| 配置项 | 说明 | 示例 |

|--------|------|------|

| **Server URL** | WebSocket 服务地址 | `ws://localhost:5173` |

| **WebSocket Path** | WS 路径（需与后端匹配） | `/ws` |

| **Startup Token** | 启动 Token（需与后端匹配） | `mySecretToken` |

| **Build Token** | 编译 Token | `MIAOKO4\|580JxAo049R\|...` |



配置自动保存到 `localStorage`。



### 7.2 后端配置参数



| 参数 | 说明 | 默认值 |

|------|------|--------|

| `-bind` | 监听地址 | 必填 |

| `-token` | 请求签名 Token | 必填 |

| `-path` | WebSocket 路径 | `/` |

| `-mtls` | 启用 TLS | false |

| `-nospeed` | 禁用测速 | false |

| `-upload` | 启用上传测速 | false |

| `-ipv6` | 启用 IPv6 | false |

| `-connthread` | 并行线程数 | 64 |

| `-tasklimit` | 任务队列上限 | 1000 |

| `-allowip` | 允许的 IP | `0.0.0.0/0,::/0` |

| `-whitelist` | Bot ID 白名单 | 空 |



### 7.3 环境变量



在 `web/` 目录创建 `.env` 文件：



```env

# 自定义 Build Token（可选）

VITE_BUILD_TOKEN=MIAOKO4|580JxAo049R|GEnERAl|1X571R930|T0kEN



# 默认服务器地址（推荐本地开发模式：Vite 代理）

VITE_DEFAULT_SERVER_URL=ws://localhost:5173



# 默认 WebSocket 路径

VITE_DEFAULT_WS_PATH=/ws

```



---



## 8. 使用指南



### 8.1 导入节点



支持以下方式导入节点：



1. **粘贴 Clash YAML**

   ```yaml

   proxies:

     - name: "HK-01"

       type: vmess

       server: hk.example.com

       port: 443

       uuid: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

       ...

   ```



2. **粘贴订阅内容**（Base64 编码）



3. **粘贴代理 URI**

   ```

   vmess://base64json

   trojan://password@host:port#name

   ss://method:password@host:port#name

   ```



4. **拖拽文件** - 支持 `.yaml`、`.yml`、`.txt`、`.conf`



### 8.2 选择测试类型



| 类型 | 包含测试 | 适用场景 |

|------|---------|---------|

| **Ping Only** | RTT、HTTP Ping、丢包率、GeoIP | 快速检测连通性 |

| **Speed Test** | 下载速度、RTT、GeoIP | 测速需求 |

| **Full Test** | 全部指标 | 完整评估 |



### 8.3 查看结果



结果表格包含：



| 列 | 说明 |

|----|------|

| **Node** | 节点名称和地址 |

| **Type** | 代理协议类型 |

| **RTT** | RTT 延迟（颜色编码） |

| **Download** | 下载速度（颜色编码） |

| **Upload** | 上传速度（颜色编码） |

| **Loss** | 丢包率（红色 = 有丢包） |

| **GeoIP** | 出口地理位置 |

| **Time** | 测试耗时 |



**操作**：

- 点击列标题排序

- 点击 "Copy" 复制到剪贴板

- 点击 "CSV" 导出为 CSV 文件



### 8.4 颜色编码



**延迟 (RTT)**：

- 🟢 绿色：<= 100ms（优秀）

- 🔵 蓝色：100-200ms（良好）

- 🟠 橙色：200-500ms（一般）

- 🔴 红色：> 500ms（较差）



**速度**：

- 🟢 绿色：>= 100 Mbps

- 🔵 蓝色：50-100 Mbps

- 🟠 橙色：10-50 Mbps

- 🔴 红色：< 10 Mbps



---



## 9. 开发指南



### 9.1 添加新的 Matrix 类型



1. 在 `types/miaospeed.ts` 添加类型常量

2. 在 `hooks/use-miaospeed.ts` 添加提取函数

3. 在 `components/results-table.tsx` 添加显示列



### 9.2 自定义主题



编辑 `src/index.css` 中的 `@theme` 部分：



```css

@theme {

  --color-primary: #22c55e;    /* 主色调 */

  --color-background: #020617; /* 背景色 */

  --color-card: #0f172a;       /* 卡片色 */

  /* ... */

}

```



### 9.3 添加新组件



使用 shadcn/ui 风格：



```tsx

import { cn } from '@/lib/utils'



interface MyComponentProps {

  className?: string

  // ...

}



export function MyComponent({ className, ...props }: MyComponentProps) {

  return (

    <div className={cn('base-styles', className)} {...props}>

      {/* ... */}

    </div>

  )

}

```



### 9.4 构建部署



```bash

# 构建

npm run build



# 预览构建结果

npm run preview



# 部署 dist/ 目录到任何静态服务器

```



**推荐部署方式**：

- Vercel

- Cloudflare Pages

- Nginx 反向代理

- 与 MiaoSpeed 同服务器



---



## 附录 A: 完整协议配置参考



### VLESS + Reality + XTLS-Vision



```yaml

name: "VLESS-Reality"

type: vless

server: example.com

port: 443

uuid: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

network: tcp

tls: true

udp: true

flow: xtls-rprx-vision

client-fingerprint: chrome

reality-opts:

  public-key: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

  short-id: xxxxxxxx

servername: www.google.com

```



### Vmess + WebSocket + TLS



```yaml

name: "Vmess-WS"

type: vmess

server: example.com

port: 443

uuid: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

alterId: 0

cipher: auto

tls: true

network: ws

ws-opts:

  path: /vmess

  headers:

    Host: example.com

```



### Trojan + gRPC + TLS



```yaml

name: "Trojan-gRPC"

type: trojan

server: example.com

port: 443

password: your-password

network: grpc

tls: true

sni: example.com

grpc-opts:

  grpc-service-name: trojan-grpc

```



### Hysteria2



```yaml

name: "Hysteria2"

type: hysteria2

server: example.com

port: 443

password: your-password

tls: true

sni: example.com

up: 100 Mbps

down: 200 Mbps

```



### AnyTLS



```yaml

name: "AnyTLS"

type: anytls

server: example.com

port: 443

password: your-password

tls: true

sni: example.com

client-fingerprint: chrome

```



### Masque



```yaml

name: "Masque"

type: masque

server: example.com

port: 443

uuid: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

password: your-password

tls: true

```



---



## 附录 B: API 版本说明



| 版本 | 特性 | 推荐度 |

|------|------|--------|

| V0/V1 | 基础功能 | ❌ 不推荐 |

| V2 | 包含 ApiVersion 字段 | ⚠️ 可用 |

| V3 | 支持上传测速 | ✅ **推荐** |



---



## 附录 C: 错误码说明



| 错误信息 | 原因 | 解决方案 |

|---------|------|---------|

| `cannot verify the request` | 签名不匹配 | 检查 Token 配置 |

| `invalid websocket path` | 路径不匹配 | 检查 `-path` 参数 |

| `the bot id is not in the whitelist` | ID 不在白名单 | 检查 `-whitelist` 参数 |

| `speedtest is disabled` | 测速被禁用 | 移除 `-nospeed` 参数 |

| `backend` | 上传测速未启用 | 添加 `-upload` 参数 |



---



> **文档版本**: v1.0.0

> **更新时间**: 2026-05-03

> **基于**: MiaoSpeed v4.6.4 + Mihomo v1.19.20
