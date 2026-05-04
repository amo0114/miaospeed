# MiaoSpeed 联调环境搭建指南

> 适用于 Windows 环境的前后端联调。
>
> 当前**推荐本地开发模式**：**Vite 代理 + 非 TLS + `/ws` 路径**。

---

## 1. 环境要求

### 必需软件

| 软件 | 版本 | 安装方式 |
|------|------|---------|
| **Go** | >= 1.21 | `winget install GoLang.Go` 或 [下载](https://go.dev/dl/) |
| **Node.js** | >= 18 | `winget install OpenJS.NodeJS.LTS` 或 [下载](https://nodejs.org/) |

### 当前默认联调模式说明

本仓库默认推荐的本地联调路径是：

1. 后端监听 `127.0.0.1:8765`
2. 后端 WebSocket 路径使用 `/ws`
3. 后端默认**不开启** `-mtls`
4. 前端浏览器连接到 `ws://localhost:5173/ws`
5. Vite 将 `/ws` 代理到后端 `ws://127.0.0.1:8765/ws`

这样做的目的是先把：

- WebSocket 连接
- 路径匹配
- 请求签名
- 结果回传

这几条基础链路跑通，再考虑 TLS 或直连模式。

---

## 2. 快速开始

### 方式一：批处理脚本（推荐）

```cmd
cd E:\workspacePulic\miaospeed
start-dev.bat
```

脚本会：

1. 检查并编译后端（如果缺失）
2. 检查并安装前端依赖（如果缺失）
3. 以**非 TLS**方式启动后端
4. 启动前端 Vite 开发服务器

### 方式二：PowerShell 脚本

```powershell
cd E:\workspacePulic\miaospeed

# 首次：编译后端 + 安装前端依赖
.\scripts\setup-dev.ps1 -BuildBackend

# 启动前后端
.\scripts\setup-dev.ps1 -StartAll
```

---

## 3. 手动搭建步骤

### 3.1 编译后端

```powershell
cd E:\workspacePulic\miaospeed

New-Item -ItemType Directory -Force -Path "utils\embeded"
New-Item -ItemType Directory -Force -Path "preconfigs\embeded\miaokoCA"

Set-Content -Path "utils\embeded\BUILDTOKEN.key" -Value "MIAOKO4|580JxAo049R|GEnERAl|1X571R930|T0kEN"

$certContent = @"
-----BEGIN CERTIFICATE-----
MIICpDCCAYwCCQDU+pQ4pHgB2jANBgkqhkiG9w0BAQsFADAUMRIwEAYDVQQDDAls
b2NhbGhvc3QwHhcNMjUwMTAxMDAwMDAwWhcNMzUwMTAxMDAwMDAwWjAUMRIwEAYD
VQQDDAlsb2NhbGhvc3QwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQC7
-----END CERTIFICATE-----
"@
Set-Content -Path "preconfigs\embeded\miaokoCA\miaoko.crt" -Value $certContent

$keyContent = @"
-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEAu6OC81fjA5R1zAh8mKdFRAyi+7yvhjwmUTEO1cXSdBzBzqAZ
-----END RSA PRIVATE KEY-----
"@
Set-Content -Path "preconfigs\embeded\miaokoCA\miaoko.key" -Value $keyContent

Set-Content -Path "preconfigs\embeded\ca-certificates.crt" -Value "-----BEGIN CERTIFICATE-----`nPlaceholder`n-----END CERTIFICATE-----"

$env:CGO_ENABLED = "0"
go build -o miaospeed.exe .
```

### 3.2 安装前端依赖

```powershell
cd E:\workspacePulic\miaospeed\web
npm install
```

### 3.3 启动后端（推荐本地模式）

```powershell
cd E:\workspacePulic\miaospeed
.\miaospeed.exe server -bind 127.0.0.1:8765 -path /ws -token dev-token-123
```

### 3.4 启动前端

```powershell
cd E:\workspacePulic\miaospeed\web
npm run dev
```

---

## 4. 联调配置

打开浏览器访问 `http://localhost:5173`，点击右上角齿轮图标，使用以下配置：

| 配置项 | 值 |
|--------|-----|
| **Server URL** | `ws://localhost:5173` |
| **WebSocket Path** | `/ws` |
| **Startup Token** | `dev-token-123` |
| **Build Token** | `MIAOKO4|580JxAo049R|GEnERAl|1X571R930|T0kEN` |

### 说明

- 浏览器不是直接连后端，而是先连 Vite 开发服务器
- `vite.config.ts` 会把 `/ws` 代理到后端
- 后端 `-path` 必须和前端 `WebSocket Path` 完全一致

---

## 5. 可选模式说明

### 5.1 直连后端模式

如果你不想经过 Vite 代理，可以手动改成：

- `Server URL = ws://127.0.0.1:8765`
- `WebSocket Path = /ws`

此时浏览器直接连接后端。

### 5.2 TLS 模式

如果后端开启 `-mtls`：

```powershell
.\miaospeed.exe server -bind 127.0.0.1:8765 -path /ws -token dev-token-123 -mtls
```

则前端不应继续使用默认的非 TLS 推荐模式。你需要同时处理：

- 使用 `wss://`
- 浏览器对自签证书或根证书的信任
- 代理层是否支持 TLS WebSocket 转发

因此，TLS 模式不作为当前默认本地联调方案。

---

## 6. 常见问题

### Q1: 前端无法连接后端

优先检查：

1. 后端是否启动在 `127.0.0.1:8765`
2. 后端是否使用了 `-path /ws`
3. 前端设置是否是：
   - `Server URL = ws://localhost:5173`
   - `WebSocket Path = /ws`
4. 浏览器里是否残留旧的 `localStorage` 配置

### Q2: 收到 `invalid websocket path`

说明前端 `WebSocket Path` 与后端 `-path` 不一致。

当前推荐模式下，应统一为：

- 前端：`/ws`
- 后端：`-path /ws`

### Q3: 收到 `cannot verify the request, please check your token`

可能原因：

1. Startup Token 不一致
2. Build Token 不一致
3. 前端签名算法与后端实现不一致

至少先确认：

- `VITE_BUILD_TOKEN`
- `utils/embeded/BUILDTOKEN.key`

内容完全一致。

### Q4: 改了配置却仍然连旧地址

原因通常是浏览器里保存了旧的 `miaospeed-config`。

解决：

- 打开设置重新保存
- 或清理浏览器 localStorage 后重新打开页面

### Q5: `start-dev.bat` / `setup-dev.ps1` 会不会复用旧产物？

会。

- `start-dev.bat` 只会在 `miaospeed.exe` 不存在时重新编译
- `setup-dev.ps1` 只会在 `node_modules` 不存在时重新安装依赖

如果你刚改过代码，建议手动重新构建或删除旧产物后再启动。

---

## 7. 快速参考

### 推荐本地联调启动命令

```powershell
# 后端
.\miaospeed.exe server -bind 127.0.0.1:8765 -path /ws -token dev-token-123

# 前端
cd web
npm run dev
```

### 推荐前端设置

| 配置项 | 值 |
|--------|-----|
| Server URL | `ws://localhost:5173` |
| WebSocket Path | `/ws` |
| Startup Token | `dev-token-123` |
| Build Token | `MIAOKO4|580JxAo049R|GEnERAl|1X571R930|T0kEN` |

---

> 文档版本：v1.1.0
> 
> 更新时间：2026-05-04
