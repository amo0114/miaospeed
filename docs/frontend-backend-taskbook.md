 # MiaoSpeed 前后端联调问题与修复任务书

 > 适用范围：当前仓库中的 Web 前端、Go 后端、联调脚本与开发文档。
 >
 > 目标：把“为什么前后端联不起来、哪些地方有漂移、应该先修什么”一次性讲清楚，并转成可执行的任务书。

 ---

 ## 1. 文档目的

 这份文档聚焦三件事：

 1. 说明当前项目的真实联调链路。
 2. 罗列前端、后端、脚本、文档中的关键问题。
 3. 把问题转成可执行的修复任务，并给出推荐联调顺序与验收标准。

 本文档不直接改代码，但它应该能作为后续修复工作的任务依据。

 ---

 ## 2. 当前联调链路

 ## 2.1 前端配置来源

 当前前端的连接配置分散在多个位置：

 - `web/src/types/miaospeed.ts`
   - 定义 `MiaoSpeedConfig`
   - 提供 `DEFAULT_CONFIG`
 - `web/src/App.tsx`
   - 启动时从 `localStorage` 读取 `miaospeed-config`
   - 保存设置时回写 `localStorage`
 - `web/src/components/settings-dialog.tsx`
   - 提供 Server URL / WebSocket Path / Startup Token / Build Token 的编辑界面
 - `web/.env`
   - 提供 `VITE_BUILD_TOKEN`、`VITE_DEFAULT_SERVER_URL`、`VITE_DEFAULT_WS_PATH`

 当前实际情况是：

 - 页面初次启动优先读取 `localStorage`
 - 如果没有本地保存配置，则回退到 `DEFAULT_CONFIG`
 - `.env` 中的默认地址和路径并没有成为当前配置初始化的明确单一来源

 这也是当前配置漂移的重要根因之一。

 ## 2.2 前端连接方式

 `web/src/hooks/use-miaospeed.ts` 里使用：

 - `serverUrl`
 - `wsPath`

 拼接得到最终 WebSocket 地址：

 - `serverUrl + wsPath`

 当前默认值来自 `web/src/types/miaospeed.ts`：

 - `serverUrl = ws://localhost:5173`
 - `wsPath = /ws`

 同时，`web/vite.config.ts` 中又把 `/ws` 代理到：

 - `ws://127.0.0.1:8765`

 这说明当前前端默认思路更偏向于：

 - 浏览器连 Vite 开发服务器
 - Vite 再转发到后端

 但这与文档和脚本中“前端直接连后端”的说明并不一致。

 ## 2.3 后端握手与验证流程

 当前 Go 后端的大致处理顺序如下：

 1. 接收 HTTP 请求
 2. 先升级为 WebSocket
 3. 升级后再校验路径
 4. 读取 JSON 请求体
 5. 校验 `Challenge`
 6. 校验 `Invoker` 是否在白名单内
 7. 进入任务队列
 8. 推送 `Progress`
 9. 推送最终 `Result`

 这意味着联调失败可能发生在两个层面：

 - WebSocket 升级前：如 IP 不在 allowlist 中，直接 HTTP 403
 - WebSocket 升级后：如路径错误、签名错误、白名单错误，返回 JSON 错误后关闭连接

 ## 2.4 请求签名链路

 当前签名链路涉及：

 - 前端：`web/src/lib/crypto/sign.ts`
 - 后端：`utils/challenge.go`
 - 编译期 Build Token：`utils/constants.go`

 正常情况下，请求签名需要同时依赖两类 Token：

 - Startup Token：后端运行时通过 `-token` 传入
 - Build Token：后端编译时嵌入 `utils/embeded/BUILDTOKEN.key`

 也就是说，仅仅填对 Startup Token 仍然不够，Build Token 不一致同样会导致验签失败。

 ## 2.5 当前测试结果展示链路

 当前前端存在两套结果状态：

 - `progress`：用于实时进度显示
 - `results`：用于最终结果表格

 `use-miaospeed.ts` 能解析实时 `Progress.Record`，但 `ResultsTable` 当前主要只消费最终 `results`，因此流式结果能力没有完全落到主表格体验上。

 ---

 ## 3. 当前问题总览

 | ID | 优先级 | 范围 | 问题摘要 |
 | --- | --- | --- | --- |
 | P0-01 | P0 | 前后端协议 | 前端签名算法与后端实现大概率不一致，导致请求会被拒绝 |
 | P0-02 | P0 | 前端配置 | Build Token 设置项暴露给用户，但运行时并未真正参与签名 |
 | P0-03 | P0 | 联调模式 | 当前仓库同时存在“Vite 代理模式”和“前端直连模式”，但没有统一口径 |
 | P0-04 | P0 | TLS/脚本 | `-mtls` 与 `ws://`/Vite 代理配置不一致，联调说明自相矛盾 |
 | P1-01 | P1 | 路径配置 | 前端默认 `/ws`，后端默认 `/`，路径不一致容易直接失败 |
 | P1-02 | P1 | 前端状态 | `localStorage` 优先级高于默认值与文档，容易造成“改了配置不生效”的错觉 |
 | P1-03 | P1 | 前端交互 | 节点清空时没有通知上层清空，可能导致旧节点残留 |
 | P1-04 | P1 | 前端一致性 | 测试预设在 `App.tsx` 与 `test-panel.tsx` 中重复定义，且已出现不一致 |
 | P1-05 | P1 | 结果展示 | 表格展示上传列，但默认预设并未请求上传指标 |
 | P1-06 | P1 | 文档/环境变量 | `.env`、默认值、文档中的变量命名与行为不一致 |
 | P1-07 | P1 | 文档漂移 | `web/PROJECT.md` 与真实依赖、文件结构、配置方式已明显漂移 |
 | P1-08 | P1 | 启动脚本 | `start-dev.bat`、`scripts/setup-dev.ps1` 会误导联调方式，并可能复用旧产物 |
 | P2-01 | P2 | 结果体验 | 实时进度没有真正进入主结果表格 |
 | P2-02 | P2 | 稳定性 | `localStorage` 解析缺少保护，脏数据可能影响启动 |
 | P2-03 | P2 | UX | 设置更新后没有明确的重连策略或提示 |
 | P2-04 | P2 | 配置模型 | `MiaoSpeedConfig` 中的 `path` 字段实际未参与连接逻辑 |
 | P2-05 | P2 | 调试能力 | 缺少“当前连接模式、目标 URL、签名来源、配置来源”的可视化诊断 |

 ---

 ## 4. 问题清单与解决方案

 ## 4.1 P0-01：前端签名算法与后端实现不一致

 **问题描述**

 前端 `web/src/lib/crypto/sign.ts` 明确在自行实现签名算法，但当前实现方式与后端 `utils/challenge.go` 的真实处理过程并不完全一致，尤其体现在：

 - 累积哈希处理方式
 - Base64 URL 编码是否保留 padding
 - Build Token 的来源与参与顺序

 **现象/风险**

 - WebSocket 可能成功建立
 - 但发送测试请求后，后端直接返回：`cannot verify the request, please check your token`
 - 用户误以为是 Token 填错，实际可能是算法根本不一致

 **根因**

 - 前端是“按理解复刻”后端签名逻辑，不是严格通过测试向量或共享实现来校验
 - 缺少一组可复用的前后端签名对照样例

 **解决方案**

 1. 以 `utils/challenge.go` 为唯一真值重写前端签名逻辑。
 2. 明确前端 Base64 URL 编码规则是否保留 `=` padding，并与后端完全一致。
 3. 增加一组固定请求样例，要求前端输出与后端输出完全一致。
 4. 在文档中明确：验签失败不仅可能是 Startup Token 错，也可能是 Build Token 或算法不一致。

 **涉及文件**

 - `web/src/lib/crypto/sign.ts`
 - `utils/challenge.go`
 - `utils/constants.go`

 **优先级**

 - P0，必须先修

 ## 4.2 P0-02：Build Token 设置项没有真正参与签名

 **问题描述**

 前端设置弹窗允许用户编辑 `buildToken`，类型定义中也保留了该字段，但当前签名逻辑读取的是环境变量或硬编码默认值，而不是当前配置里的 `buildToken`。

 **现象/风险**

 - 用户在 UI 里修改 Build Token 后，实际请求仍使用旧值
 - 用户会被“设置看起来可用，实际上不生效”误导

 **根因**

 - 配置模型、设置界面、签名实现三者没有打通

 **解决方案**

 二选一，必须明确：

 - 方案 A（推荐）：保留 Build Token 设置项，并让签名逻辑真正使用 `config.buildToken`
 - 方案 B：如果不希望用户在运行时调整 Build Token，则移除 UI 设置项，并在文档中明确 Build Token 仅来自编译环境

 当前仓库已有设置 UI，因此更推荐方案 A，并定义优先级：

 - `localStorage/UI 配置 > env > 内置默认值`

 **涉及文件**

 - `web/src/components/settings-dialog.tsx`
 - `web/src/types/miaospeed.ts`
 - `web/src/lib/crypto/sign.ts`
 - `web/src/hooks/use-miaospeed.ts`

 **优先级**

 - P0，必须先修

 ## 4.3 P0-03：联调模式没有统一口径

 **问题描述**

 当前仓库同时存在两种本地联调模式：

 1. Vite 代理模式
    - 前端连接 `ws://localhost:5173/ws`
    - Vite 把 `/ws` 转发给后端
 2. 前端直连后端模式
    - 文档和脚本指导用户把 Server URL 配置成 `ws://127.0.0.1:8765`
    - WebSocket Path 设为 `/`

 **现象/风险**

 - 默认值、Vite 配置、脚本、文档相互矛盾
 - 不同开发者按照不同说明操作，得到完全不同的连接结果

 **根因**

 - 仓库中同时保留了两套思路，但没有定义哪一种是“本地开发标准模式”

 **解决方案**

 明确分成两个官方模式，并以一个模式作为首选：

 - **推荐本地开发标准模式：Vite 代理模式，且先关闭 TLS**
   - 前端：`ws://localhost:5173` + `/ws`
   - 后端：`127.0.0.1:8765` + `-path /ws`
 - **部署/生产模式：前端直连或由反向代理统一转发**

 同时要求：

 - 默认值、脚本、文档必须与标准模式一致
 - 另一种模式作为“可选模式”单独说明

 **涉及文件**

 - `web/src/types/miaospeed.ts`
 - `web/vite.config.ts`
 - `DEV_GUIDE.md`
 - `web/PROJECT.md`
 - `start-dev.bat`
 - `scripts/setup-dev.ps1`

 **优先级**

 - P0，必须先修

 ## 4.4 P0-04：TLS 说明与脚本/代理配置冲突

 **问题描述**

 `start-dev.bat` 和 `scripts/setup-dev.ps1` 当前会以 `-mtls` 启动后端，但前端默认地址、代理目标和说明文本却仍在使用 `ws://`，而不是 `wss://`。

 **现象/风险**

 - 用户会按照脚本提示填 `ws://127.0.0.1:8765`
 - 但后端实际上是 TLS WebSocket
 - 即使协议层勉强打通，浏览器对自签名证书的信任问题也没有被解释清楚

 **根因**

 - 脚本追求“一键启动”，但没有同步设计浏览器与 Vite 代理的 TLS 策略

 **解决方案**

 建议分阶段处理：

 - 本地联调阶段默认关闭 `-mtls`
 - 先用纯 `ws://` 把路径、签名、请求结果链路跑通
 - 另写一节文档专门说明：如果开启 `-mtls`，则需要使用 `wss://`，并解决浏览器信任问题

 如果必须保留 TLS 本地启动脚本，则必须同步修正：

 - Vite 代理目标
 - 前端默认配置
 - 连接说明
 - 自签证书信任文档

 **涉及文件**

 - `start-dev.bat`
 - `scripts/setup-dev.ps1`
 - `web/vite.config.ts`
 - `DEV_GUIDE.md`
 - `preconfigs/certs.go`
 - `service/server.go`

 **优先级**

 - P0，必须先修

 ## 4.5 P1-01：`/ws` 与 `/` 的路径默认值不一致

 **问题描述**

 前端默认 `wsPath` 是 `/ws`，但后端 CLI 默认 `-path` 是 `/`。

 **现象/风险**

 - 路径稍有不一致，就会在升级成功后收到 `invalid websocket path`
 - 由于错误发生在 WebSocket 升级后，排查体验不直观

 **解决方案**

 - 统一当前标准模式下的路径
 - 明确：前端 `wsPath` 必须与后端 `-path` 完全一致
 - 在前端错误提示中把“路径错误”作为明确诊断项

 **涉及文件**

 - `web/src/types/miaospeed.ts`
 - `cli_server.go`
 - `service/server.go`
 - `DEV_GUIDE.md`

 ## 4.6 P1-02：`localStorage` 优先级过高且缺少提示

 **问题描述**

 `App.tsx` 会优先读取 `localStorage` 里的 `miaospeed-config`。这意味着只要浏览器里有旧配置，修改 `.env`、修改默认值或看文档都不一定立刻生效。

 **现象/风险**

 - 用户会觉得“我明明改了配置，为什么页面还是连旧地址”
 - 这会加大联调误判

 **解决方案**

 - 读取配置时增加异常保护
 - 在设置页或调试区域增加“当前配置来源”说明
 - 提供“重置为默认配置/清空本地配置”按钮

 **涉及文件**

 - `web/src/App.tsx`
 - `web/src/components/settings-dialog.tsx`

 ## 4.7 P1-03：节点清空后可能残留旧节点

 **问题描述**

 `web/src/components/node-importer.tsx` 的 `handleClear()` 只清空了组件内部状态，没有把空数组回传给父组件。

 **现象/风险**

 - UI 看起来已经清空
 - 但 `App.tsx` 中的 `nodes` 可能仍然保留旧值
 - 用户再次点击测试时，可能提交的是旧节点

 **解决方案**

 - `handleClear()` 必须调用 `onNodesImported([])`
 - 清空后同步重置节点数量与测试按钮状态

 **涉及文件**

 - `web/src/components/node-importer.tsx`
 - `web/src/App.tsx`

 ## 4.8 P1-04：测试预设重复定义且已不一致

 **问题描述**

 当前测试预设至少存在两处定义：

 - `web/src/App.tsx`
 - `web/src/components/test-panel.tsx`

 其中 “all/full test” 展示给用户的矩阵列表，已经与实际请求发送的矩阵列表不一致。

 **现象/风险**

 - 用户看到的“包含测试项”和后台真正执行的测试项不一致
 - 后续再扩展矩阵时会继续漂移

 **解决方案**

 - 把预设提取为单一配置源，例如 `web/src/lib/test-presets.ts`
 - `App.tsx` 与 `test-panel.tsx` 统一引用该配置源
 - 在文档中约定：新增矩阵时只能改一个地方

 **涉及文件**

 - `web/src/App.tsx`
 - `web/src/components/test-panel.tsx`
 - 新增建议文件：`web/src/lib/test-presets.ts`

 ## 4.9 P1-05：上传列展示与默认请求不一致

 **问题描述**

 `ResultsTable` 展示了 Upload 列，但默认预设并没有请求上传相关矩阵。

 **现象/风险**

 - 用户会以为“上传测速坏了”
 - 实际上只是请求里根本没有要该数据

 **解决方案**

 二选一：

 - 要么在 Speed/All 中增加上传测速矩阵和相关配置
 - 要么在当前阶段隐藏 Upload 列，并在文档中说明“暂未启用上传测速”

 **涉及文件**

 - `web/src/components/results-table.tsx`
 - `web/src/App.tsx`
 - `web/src/components/test-panel.tsx`

 ## 4.10 P1-06：环境变量、默认值、文档命名不一致

 **问题描述**

 当前存在如下漂移：

 - `.env` 中使用 `VITE_DEFAULT_SERVER_URL`、`VITE_DEFAULT_WS_PATH`
 - 文档中曾出现 `VITE_DEFAULT_SERVER`
 - 实际运行默认值又写在 `DEFAULT_CONFIG`

 **现象/风险**

 - 读文档的人和读代码的人会得到不同答案
 - `.env` 改了不一定对运行有影响

 **解决方案**

 - 统一变量命名
 - 明确哪一层是真正的默认来源
 - 如果 `.env` 不参与当前初始化逻辑，则不要在文档中把它写成主入口

 **涉及文件**

 - `web/.env`
 - `web/src/types/miaospeed.ts`
 - `web/PROJECT.md`
 - `DEV_GUIDE.md`

 ## 4.11 P1-07：前端项目文档明显陈旧

 **问题描述**

 `web/PROJECT.md` 中的依赖版本、文件结构、配置方式已经与当前实际前端不一致，例如：

 - React / Vite / TypeScript 版本漂移
 - 文档中列出的配置文件并不存在
 - 当前 Tailwind 已通过 Vite 插件接入

 **解决方案**

 - 对 `web/PROJECT.md` 做一次全面清理
 - 删除不存在的配置文件说明
 - 同步真实依赖版本与联调方式
 - 让 `web/README.md` 不再停留在 Vite 模板说明层面

 **涉及文件**

 - `web/PROJECT.md`
 - `web/README.md`
 - `web/package.json`
 - `web/vite.config.ts`

 ## 4.12 P1-08：启动脚本会误导联调，并可能复用旧产物

 **问题描述**

 当前脚本存在两个问题：

 1. 联调说明与实际启动参数不一致
 2. 仅在缺少 `miaospeed.exe` 或 `node_modules` 时才重新构建/安装，容易悄悄复用旧产物

 **解决方案**

 - 明确脚本用途：是“快速启动”，还是“构建 + 启动 + 校验”
 - 对二进制和依赖的复用加提示
 - 增加参数控制：是否强制重建、是否使用 TLS、是否使用代理模式

 **涉及文件**

 - `start-dev.bat`
 - `scripts/setup-dev.ps1`
 - `DEV_GUIDE.md`

 ## 4.13 P2 级问题

 这些问题不会立刻阻塞联调，但会明显影响体验和后续维护：

 - 实时结果没有进入主表格
 - `localStorage` JSON 解析缺少异常保护
 - 设置变更后没有自动重连或明确提示
 - 未使用的 `path` 字段会继续制造理解成本
 - 缺少“当前连接目标、配置来源、请求模式”的前端诊断面板

 ---

 ## 5. 修复任务书

 ## 5.1 P0 任务（必须先做）

 ### 任务 T0-1：确定唯一的本地开发标准模式

 **目标**

 把当前混乱的“直连模式/代理模式/TLS 模式”整理成明确口径。

 **推荐结论**

 - 本地联调标准模式：**Vite 代理 + 非 TLS**
 - 前端：`ws://localhost:5173` + `/ws`
 - 后端：`127.0.0.1:8765` + `-path /ws`

 **涉及文件**

 - `web/src/types/miaospeed.ts`
 - `web/vite.config.ts`
 - `start-dev.bat`
 - `scripts/setup-dev.ps1`
 - `DEV_GUIDE.md`
 - `web/PROJECT.md`

 **验收标准**

 - 新开发者只看文档即可按同一模式启动并连接
 - 默认值、脚本、文档的连接方式一致

 ### 任务 T0-2：修复前端签名算法并建立对照样例

 **目标**

 保证前端签名输出与后端完全一致。

 **涉及文件**

 - `web/src/lib/crypto/sign.ts`
 - `utils/challenge.go`

 **实施建议**

 - 以固定请求体、固定 Startup Token、固定 Build Token 生成签名样例
 - 前端和后端分别输出同一结果
 - 未达到字节级一致前，不要继续调业务逻辑

 **验收标准**

 - 同一请求体的 Challenge 在前后端完全一致
 - 后端不再因签名问题拒绝请求

 ### 任务 T0-3：打通 Build Token 配置链路

 **目标**

 让 Build Token 的来源和生效逻辑清晰、唯一、可验证。

 **涉及文件**

 - `web/src/components/settings-dialog.tsx`
 - `web/src/lib/crypto/sign.ts`
 - `web/src/types/miaospeed.ts`
 - `web/.env`

 **实施建议**

 - 保留 UI 时，就必须让配置真正参与签名
 - 不保留 UI 时，就必须删除输入项和相关文档
 - 明确优先级：`UI/localStorage > env > hardcoded default`

 **验收标准**

 - 用户修改 Build Token 后，请求签名随之变化
 - 文档说明与真实行为一致

 ### 任务 T0-4：拆分 TLS 联调说明

 **目标**

 避免把 TLS 复杂度和基础联调复杂度混在一起。

 **涉及文件**

 - `start-dev.bat`
 - `scripts/setup-dev.ps1`
 - `DEV_GUIDE.md`
 - `web/PROJECT.md`

 **实施建议**

 - 默认本地联调先关闭 `-mtls`
 - 单独提供一节“如何启用 TLS 联调”
 - 如果保留 TLS 快速启动脚本，则必须完整补充 `wss://` 与浏览器信任说明

 **验收标准**

 - 文档不再出现“后端启用 TLS，但前端仍用 ws://”的矛盾表述

 ## 5.2 P1 任务（联调稳定性与一致性）

 ### 任务 T1-1：统一路径与连接错误提示

 **目标**

 降低 `/` 与 `/ws` 带来的误配风险。

 **涉及文件**

 - `web/src/types/miaospeed.ts`
 - `web/src/hooks/use-miaospeed.ts`
 - `DEV_GUIDE.md`

 **验收标准**

 - 路径错误时，前端能给出明确提示
 - 文档中明确说明路径必须与后端完全一致

 ### 任务 T1-2：修复节点清空残留问题

 **目标**

 确保清空导入内容后，父组件中的节点数据也同步清空。

 **涉及文件**

 - `web/src/components/node-importer.tsx`
 - `web/src/App.tsx`

 **验收标准**

 - 点击 Clear 后，节点数量归零
 - 测试按钮不可继续对旧节点发起请求

 ### 任务 T1-3：统一测试预设来源

 **目标**

 避免测试项展示与实际发送请求再次漂移。

 **涉及文件**

 - `web/src/App.tsx`
 - `web/src/components/test-panel.tsx`
 - 建议新增：`web/src/lib/test-presets.ts`

 **验收标准**

 - 一个预设只维护一份定义
 - UI 展示与实际请求完全一致

 ### 任务 T1-4：调整上传测速展示策略

 **目标**

 让表格展示与请求内容保持一致。

 **涉及文件**

 - `web/src/components/results-table.tsx`
 - `web/src/App.tsx`
 - `web/src/components/test-panel.tsx`

 **验收标准**

 - 若未请求上传测速，UI 不误导用户期待上传结果
 - 若启用上传测速，文档和预设同步更新

 ### 任务 T1-5：清理文档与环境变量漂移

 **目标**

 把 `.env`、默认值、文档、脚本统一到一套明确口径。

 **涉及文件**

 - `web/.env`
 - `web/src/types/miaospeed.ts`
 - `web/PROJECT.md`
 - `web/README.md`
 - `DEV_GUIDE.md`

 **验收标准**

 - 文档中的变量名、默认值、行为与代码一致
 - 不再出现过期的前端技术栈和不存在的文件说明

 ### 任务 T1-6：重做启动脚本说明

 **目标**

 让脚本成为“能帮助联调”的工具，而不是制造歧义的入口。

 **涉及文件**

 - `start-dev.bat`
 - `scripts/setup-dev.ps1`
 - `DEV_GUIDE.md`

 **验收标准**

 - 启动脚本展示的地址、路径、TLS 状态与真实运行一致
 - 文档明确说明是否会复用旧二进制与旧依赖

 ## 5.3 P2 任务（体验与维护性优化）

 ### 任务 T2-1：让结果表格支持实时结果流

 **目标**

 在测试过程中就能看到节点结果逐步出现，而不是只显示最终结果。

 ### 任务 T2-2：增加配置重置与来源说明

 **目标**

 让用户知道当前用的是默认值、环境值还是本地持久化值。

 ### 任务 T2-3：增加设置变更后的重连策略

 **目标**

 让配置修改与连接状态之间的关系明确可见。

 ### 任务 T2-4：清理未使用字段与死配置

 **目标**

 删除或重新定义 `path` 等未实际使用的配置项。

 ### 任务 T2-5：增加联调诊断面板

 **目标**

 直接在前端展示：

 - 当前最终 WS 地址
 - 当前路径
 - Startup Token 是否已填
 - Build Token 来源
 - 当前是否走代理模式

 ---

 ## 6. 推荐联调顺序

 建议按下面顺序推进，而不是同时改所有内容：

 1. **先确定标准联调模式**
   - 先决定本地到底走代理还是直连
   - 推荐先走“Vite 代理 + 非 TLS”
 2. **修签名算法**
   - 不先修这个，后面一切联调都可能是假象
 3. **打通 Build Token 生效链路**
 4. **统一路径配置和脚本说明**
 5. **修复节点清空、测试预设、上传展示等前端一致性问题**
 6. **最后再补体验优化与文档清理**

 这个顺序的原则是：

 - 先修协议级问题
 - 再修配置级问题
 - 再修 UI 一致性问题
 - 最后修体验和维护性问题

 ---

 ## 7. 验收标准

 当以下条件全部满足时，可以认为“前后端联调闭环已建立”：

 ### 7.1 基础连接验收

 - 前端能稳定连上目标 WebSocket
 - 路径错误、Token 错误、签名错误时，前端能给出明确提示

 ### 7.2 协议验收

 - 同一请求在前后端生成的 `Challenge` 完全一致
 - 后端不再因签名错误拒绝正常请求

 ### 7.3 功能验收

 - 节点导入后可正常提交测试
 - 清空节点后不会残留旧数据
 - 进度与结果展示符合真实请求内容

 ### 7.4 配置验收

 - 默认值、设置页、`.env`、脚本、文档之间不再冲突
 - 用户能清楚知道当前配置来源

 ### 7.5 文档验收

 - 新开发者只看文档即可完成本地联调
 - 文档中的默认地址、路径、TLS 状态、变量名与代码一致

 ---

 ## 8. 结论

 当前项目最大的问题，不是 UI 还不够好看，也不是某个单点 bug，而是：

 - **前端协议实现、联调模式、脚本行为、文档说明没有统一口径**

 真正影响联调闭环的关键优先级只有四个：

 1. 签名算法对齐
 2. Build Token 真正生效
 3. 本地联调模式统一
 4. TLS 与 `ws://`/`wss://` 说明统一

 只有把这四件事先做完，后续的前端优化、结果体验和扩展功能才有稳定基础。
