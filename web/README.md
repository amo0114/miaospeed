# MiaoSpeed WebUI Frontend

这是 MiaoSpeed 的前端开发目录，不再是默认的 Vite 模板项目说明。

## 推荐本地开发模式

当前仓库推荐使用：

- **Vite 代理**
- **非 TLS**
- **后端路径 `/ws`**

对应关系：

- 浏览器连接：`ws://localhost:5173/ws`
- Vite 代理到：`ws://127.0.0.1:8765/ws`

## 快速开始

### 1. 安装依赖

```bash
cd web
npm install
```

### 2. 启动前端

```bash
npm run dev
```

默认访问地址：

- `http://localhost:5173`

### 3. 推荐后端启动命令

在项目根目录执行：

```bash
./miaospeed server -bind 127.0.0.1:8765 -path /ws -token dev-token-123
```

## 前端设置建议

打开页面右上角设置，使用：

- **Server URL**: `ws://localhost:5173`
- **WebSocket Path**: `/ws`
- **Startup Token**: `dev-token-123`
- **Build Token**: 与后端 `utils/embeded/BUILDTOKEN.key` 保持一致

## 常见问题

### 1. 改了默认值但页面还连旧地址

前端配置会保存到浏览器 `localStorage`。如果你之前存过旧配置，页面会优先读取旧值。

### 2. 收到 `invalid websocket path`

说明前端 `wsPath` 和后端 `-path` 不一致。

推荐本地模式必须统一为：

- 前端：`/ws`
- 后端：`-path /ws`

### 3. 收到 `cannot verify the request, please check your token`

优先检查：

- Startup Token 是否一致
- Build Token 是否一致
- 当前前端签名实现是否已与后端对齐

## 参考文档

更完整的项目说明请看：

- `../DEV_GUIDE.md`
- `./PROJECT.md`
- `../docs/frontend-backend-taskbook.md`
