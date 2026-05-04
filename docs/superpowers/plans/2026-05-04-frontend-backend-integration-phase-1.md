# Frontend-Backend Integration Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish a stable local frontend-backend integration path by fixing signing parity, build token wiring, shared test presets, stale node state, and the default local dev connection mode.

**Architecture:** Treat the Go backend contract as the source of truth and keep the first repair phase narrow. Centralize frontend config resolution and test presets, route all signing through a config-aware signer that matches `utils/challenge.go`, and standardize local development around one non-TLS Vite-proxy flow before revisiting optional direct/TLS modes.

**Tech Stack:** React 19, TypeScript 6, Vite 8, Vitest, React Testing Library, Web Crypto API, Go 1.25 backend, PowerShell/Batch startup scripts.

---

## File Structure

### Files to create

- `web/vitest.config.ts` - frontend unit test runner configuration.
- `web/src/test/setup.ts` - shared Vitest setup and `react-i18next` test mock.
- `web/src/lib/miaospeed-config.ts` - safe config loading, default resolution, build-token precedence helpers.
- `web/src/lib/miaospeed-config.test.ts` - regression tests for config resolution and localStorage fallback.
- `web/src/lib/test-presets.ts` - single source of truth for test presets shown in the UI and sent to the backend.
- `web/src/lib/test-presets.test.ts` - regression tests for preset consistency.
- `web/src/components/node-importer.test.tsx` - regression test for clearing parent node state.
- `web/src/lib/crypto/sign.test.ts` - signing parity tests against a Go-style accumulation helper.

### Files to modify

- `web/package.json` - add `test` scripts and frontend test dependencies.
- `web/src/App.tsx` - use centralized config loader and shared test presets.
- `web/src/types/miaospeed.ts` - keep type definitions, but trim default ownership to config helpers.
- `web/src/components/node-importer.tsx` - notify parent when clearing imported nodes.
- `web/src/components/test-panel.tsx` - render matrices from shared presets instead of duplicating them.
- `web/src/components/results-table.tsx` - keep upload display aligned with the selected preset.
- `web/src/hooks/use-miaospeed.ts` - build requests with the full config and keep messaging aligned with backend failures.
- `web/src/lib/crypto/sign.ts` - reimplement signing to match `utils/challenge.go` and use runtime build token precedence.
- `start-dev.bat` - standardize local startup around `-path /ws` without `-mtls`.
- `scripts/setup-dev.ps1` - standardize local startup around `-path /ws` without `-mtls`.
- `DEV_GUIDE.md` - make the Vite-proxy, non-TLS local flow the primary documented flow.
- `web/PROJECT.md` - update frontend doc drift and document direct mode/TLS as optional follow-up modes.
- `web/README.md` - replace the stock Vite template readme with repo-specific frontend startup notes.
- `web/.env` - align documented default URL/path with the chosen local mode.

### Files referenced but not modified

- `utils/challenge.go` - source-of-truth signing contract.
- `service/server.go` - source-of-truth backend path verification and request error messages.
- `cli_server.go` - source-of-truth backend default path and CLI startup flags.

---

### Task 1: Add safe frontend config resolution and test coverage

**Files:**
- Create: `web/vitest.config.ts`
- Create: `web/src/test/setup.ts`
- Create: `web/src/lib/miaospeed-config.ts`
- Create: `web/src/lib/miaospeed-config.test.ts`
- Modify: `web/package.json`
- Modify: `web/src/App.tsx`
- Modify: `web/src/types/miaospeed.ts`

- [ ] **Step 1: Write the failing tests and test runner wiring**

Add the test script and create the config test file first.

`web/package.json`

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

`web/vitest.config.ts`

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
})
```

`web/src/test/setup.ts`

```ts
import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}))
```

`web/src/lib/miaospeed-config.test.ts`

```ts
import { describe, expect, it } from 'vitest'
import {
  DEFAULT_DEV_CONFIG,
  loadStoredConfig,
  resolveBuildToken,
} from '@/lib/miaospeed-config'

describe('loadStoredConfig', () => {
  it('falls back to the shared defaults when localStorage is invalid JSON', () => {
    const storage = { getItem: () => '{bad json' } as Pick<Storage, 'getItem'>

    expect(loadStoredConfig(storage)).toEqual(DEFAULT_DEV_CONFIG)
  })

  it('merges stored partial config over shared defaults', () => {
    const storage = {
      getItem: () => JSON.stringify({
        serverUrl: 'ws://example.test:9000',
        wsPath: '/socket',
        token: 'startup-token',
      }),
    } as Pick<Storage, 'getItem'>

    expect(loadStoredConfig(storage)).toEqual({
      ...DEFAULT_DEV_CONFIG,
      serverUrl: 'ws://example.test:9000',
      wsPath: '/socket',
      token: 'startup-token',
    })
  })
})

describe('resolveBuildToken', () => {
  it('prefers the runtime config build token', () => {
    expect(resolveBuildToken({ buildToken: 'UI_TOKEN', fallback: 'ENV_TOKEN' })).toBe('UI_TOKEN')
  })

  it('falls back to the env token when the runtime value is blank', () => {
    expect(resolveBuildToken({ buildToken: '   ', fallback: 'ENV_TOKEN' })).toBe('ENV_TOKEN')
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
cd web
npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom
npm run test -- src/lib/miaospeed-config.test.ts
```

Expected: FAIL because `@/lib/miaospeed-config` does not exist yet.

- [ ] **Step 3: Implement centralized config helpers and wire App to use them**

`web/src/lib/miaospeed-config.ts`

```ts
import { DEFAULT_CONFIG, type MiaoSpeedConfig } from '@/types/miaospeed'

export const DEFAULT_DEV_CONFIG: MiaoSpeedConfig = {
  ...DEFAULT_CONFIG,
  serverUrl: 'ws://localhost:5173',
  wsPath: '/ws',
  path: '/ws',
}

export function loadStoredConfig(
  storage: Pick<Storage, 'getItem'> | null = typeof window !== 'undefined' ? window.localStorage : null
): MiaoSpeedConfig {
  if (!storage) return DEFAULT_DEV_CONFIG

  const raw = storage.getItem('miaospeed-config')
  if (!raw) return DEFAULT_DEV_CONFIG

  try {
    const parsed = JSON.parse(raw) as Partial<MiaoSpeedConfig>
    return { ...DEFAULT_DEV_CONFIG, ...parsed }
  } catch {
    return DEFAULT_DEV_CONFIG
  }
}

export function resolveBuildToken({
  buildToken,
  fallback = import.meta.env.VITE_BUILD_TOKEN || DEFAULT_CONFIG.buildToken,
}: {
  buildToken: string
  fallback?: string
}): string {
  const runtime = buildToken.trim()
  const envToken = fallback.trim()

  if (runtime) return runtime
  if (envToken) return envToken
  return DEFAULT_CONFIG.buildToken
}
```

Update `web/src/App.tsx` so config initialization uses the helper instead of raw `JSON.parse`:

```ts
import { loadStoredConfig } from '@/lib/miaospeed-config'

const [config, setConfig] = useState<MiaoSpeedConfig>(() => loadStoredConfig())
```

Keep `web/src/types/miaospeed.ts` focused on the type shape and the base token/path fields:

```ts
export const DEFAULT_CONFIG: MiaoSpeedConfig = {
  serverUrl: 'ws://localhost:5173',
  token: '',
  buildToken: 'MIAOKO4|580JxAo049R|GEnERAl|1X571R930|T0kEN',
  path: '/ws',
  wsPath: '/ws',
}
```

- [ ] **Step 4: Run the targeted tests and the frontend build**

Run:

```bash
cd web
npm run test -- src/lib/miaospeed-config.test.ts
npm run build
```

Expected:
- `src/lib/miaospeed-config.test.ts` PASS
- `vite build` succeeds

- [ ] **Step 5: Commit**

```bash
git add web/package.json web/vitest.config.ts web/src/test/setup.ts web/src/lib/miaospeed-config.ts web/src/lib/miaospeed-config.test.ts web/src/App.tsx web/src/types/miaospeed.ts
git commit -m "fix: centralize frontend config defaults"
```

### Task 2: Centralize test presets and fix stale node clearing

**Files:**
- Create: `web/src/lib/test-presets.ts`
- Create: `web/src/lib/test-presets.test.ts`
- Create: `web/src/components/node-importer.test.tsx`
- Modify: `web/src/App.tsx`
- Modify: `web/src/components/test-panel.tsx`
- Modify: `web/src/components/node-importer.tsx`
- Modify: `web/src/components/results-table.tsx`

- [ ] **Step 1: Write failing regression tests for preset consistency and clear behavior**

`web/src/lib/test-presets.test.ts`

```ts
import { describe, expect, it } from 'vitest'
import { getTestPreset, TEST_PRESETS } from '@/lib/test-presets'

describe('TEST_PRESETS', () => {
  it('keeps the full test packet loss matrix in the shared preset', () => {
    expect(getTestPreset('all').matrices).toContain('TEST_PING_PACKET_LOSS')
  })

  it('marks upload as disabled for the default speed and full presets', () => {
    expect(TEST_PRESETS.speed.includesUpload).toBe(false)
    expect(TEST_PRESETS.all.includesUpload).toBe(false)
  })
})
```

`web/src/components/node-importer.test.tsx`

```tsx
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { NodeImporter } from '@/components/node-importer'

vi.mock('@/lib/yaml/parser', () => ({
  parseClashYaml: () => [
    { name: 'HK-01', type: 'Trojan', payload: 'payload-1' },
  ],
  parseSubscription: () => [],
}))

describe('NodeImporter', () => {
  it('clears the parent node state when the user clicks clear', () => {
    const onNodesImported = vi.fn()

    render(<NodeImporter onNodesImported={onNodesImported} />)

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'proxies:\n  - name: HK-01' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'importer.parse' }))
    fireEvent.click(screen.getByRole('button', { name: 'importer.clear' }))

    expect(onNodesImported).toHaveBeenLastCalledWith([])
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
cd web
npm run test -- src/lib/test-presets.test.ts src/components/node-importer.test.tsx
```

Expected: FAIL because the shared preset module does not exist and the clear handler does not notify the parent.

- [ ] **Step 3: Implement the shared preset module and clear behavior**

`web/src/lib/test-presets.ts`

```ts
import type { SlaveRequestConfigs, SlaveRequestMatrixType } from '@/types/miaospeed'

export type TestPresetType = 'ping' | 'speed' | 'all'

export interface TestPreset {
  type: TestPresetType
  matrices: SlaveRequestMatrixType[]
  requestConfig: Partial<SlaveRequestConfigs>
  includesUpload: boolean
}

export const TEST_PRESETS: Record<TestPresetType, TestPreset> = {
  ping: {
    type: 'ping',
    matrices: ['TEST_PING_RTT', 'TEST_PING_CONN', 'TEST_PING_PACKET_LOSS', 'GEOIP_OUTBOUND'],
    requestConfig: {
      DownloadDuration: 0,
      DownloadThreading: 0,
      UploadDuration: 0,
      UploadThreading: 0,
    },
    includesUpload: false,
  },
  speed: {
    type: 'speed',
    matrices: ['TEST_PING_RTT', 'SPEED_AVERAGE', 'SPEED_MAX', 'GEOIP_OUTBOUND'],
    requestConfig: {
      DownloadDuration: 3,
      DownloadThreading: 1,
      UploadDuration: 0,
      UploadThreading: 0,
    },
    includesUpload: false,
  },
  all: {
    type: 'all',
    matrices: ['TEST_PING_RTT', 'TEST_PING_CONN', 'TEST_PING_PACKET_LOSS', 'SPEED_AVERAGE', 'SPEED_MAX', 'GEOIP_OUTBOUND'],
    requestConfig: {
      DownloadDuration: 3,
      DownloadThreading: 1,
      UploadDuration: 0,
      UploadThreading: 0,
    },
    includesUpload: false,
  },
}

export function getTestPreset(type: TestPresetType): TestPreset {
  return TEST_PRESETS[type]
}
```

Update `web/src/components/node-importer.tsx`:

```ts
const handleClear = () => {
  setInput('')
  setNodes([])
  setError(null)
  onNodesImported([])
}
```

Update `web/src/App.tsx` so it uses the shared preset source:

```ts
import { getTestPreset, type TestPresetType } from '@/lib/test-presets'

const handleStartTest = useCallback(async (testType: TestPresetType) => {
  if (nodes.length === 0) return

  setIsRunning(true)

  const preset = getTestPreset(testType)

  await submitTest(
    nodes.map((n) => ({ Name: n.name, Payload: n.payload })),
    preset.matrices,
    preset.type
  )
}, [nodes, submitTest])
```

Update `web/src/components/test-panel.tsx` so it imports `TEST_PRESETS` rather than hard-coding the matrix list twice.

Update `web/src/components/results-table.tsx` so it hides the Upload column unless at least one result contains upload data:

```ts
const showUpload = results.some((result) => result.uploadSpeed !== null)
```

- [ ] **Step 4: Run the targeted tests and the frontend build**

Run:

```bash
cd web
npm run test -- src/lib/test-presets.test.ts src/components/node-importer.test.tsx
npm run build
```

Expected:
- both tests PASS
- `vite build` succeeds

- [ ] **Step 5: Commit**

```bash
git add web/src/lib/test-presets.ts web/src/lib/test-presets.test.ts web/src/components/node-importer.test.tsx web/src/App.tsx web/src/components/test-panel.tsx web/src/components/node-importer.tsx web/src/components/results-table.tsx
git commit -m "fix: share frontend test presets"
```

### Task 3: Rebuild the frontend signer to match the Go contract and use runtime build tokens

**Files:**
- Create: `web/src/lib/crypto/sign.test.ts`
- Modify: `web/src/App.tsx`
- Modify: `web/src/lib/crypto/sign.ts`
- Modify: `web/src/hooks/use-miaospeed.ts`

- [ ] **Step 1: Write the failing signing contract tests**

`web/src/lib/crypto/sign.test.ts`

```ts
import { describe, expect, it } from 'vitest'
import { buildRequest, signRequest } from '@/lib/crypto/sign'
import type { SlaveRequest } from '@/types/miaospeed'

async function sha512(bytes: Uint8Array): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest('SHA-512', bytes))
}

function textToBytes(text: string): Uint8Array {
  return new TextEncoder().encode(text)
}

function concatBytes(a: Uint8Array, b: Uint8Array): Uint8Array {
  const result = new Uint8Array(a.length + b.length)
  result.set(a, 0)
  result.set(b, a.length)
  return result
}

function toBase64UrlWithPadding(bytes: Uint8Array): string {
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_')
}

async function goStyleSignRequest(token: string, buildToken: string, request: SlaveRequest) {
  const cloned = JSON.parse(JSON.stringify(request)) as SlaveRequest
  cloned.Challenge = ''

  let state = textToBytes(JSON.stringify(cloned).trim())
  const tokenChain = [token, ...buildToken.trim().split('|')]

  for (const raw of tokenChain) {
    const segment = raw || 'SOME_TOKEN'
    const digest = await sha512(state)
    state = concatBytes(state, concatBytes(textToBytes(segment), digest))
  }

  return toBase64UrlWithPadding(await sha512(state))
}

const REQUEST_FIXTURE: SlaveRequest = {
  Basics: {
    ID: 'req-1',
    Slave: 'web-client',
    SlaveName: 'MiaoSpeed WebUI',
    Invoker: 'miaospeed-web',
    Version: '1.0.0',
  },
  Options: {
    Filter: '',
    Matrices: [
      { Type: 'TEST_PING_RTT', Params: '' },
      { Type: 'TEST_PING_PACKET_LOSS', Params: '' },
    ],
  },
  Configs: {
    ApiVersion: 3,
    STUNURL: '',
    DownloadURL: 'DYNAMIC:INTL',
    DownloadDuration: 3,
    DownloadThreading: 1,
    UploadURL: '',
    UploadDuration: 0,
    UploadThreading: 0,
    PingAverageOver: 1,
    PingAddress: '',
    TaskRetry: 3,
    DNSServers: [],
    TaskTimeout: 5000,
    Scripts: [],
  },
  Vendor: 'Clash',
  Nodes: [{ Name: 'HK-01', Payload: 'payload-1' }],
  RandomSequence: 'random-sequence',
  Challenge: '',
}

describe('signRequest', () => {
  it('matches the Go-style token accumulation and keeps base64 padding', async () => {
    const expected = await goStyleSignRequest('startup-token', 'A|B|C', REQUEST_FIXTURE)
    const actual = await signRequest(
      { token: 'startup-token', buildToken: 'A|B|C' },
      REQUEST_FIXTURE
    )

    expect(actual).toBe(expected)
    expect(actual.endsWith('=')).toBe(true)
  })

  it('uses the runtime build token when building a request', async () => {
    const request = await buildRequest(
      { token: 'startup-token', buildToken: 'UI_BUILD|TOKEN' },
      [{ Name: 'HK-01', Payload: 'payload-1' }],
      [{ Type: 'TEST_PING_RTT', Params: '' }]
    )

    const expected = await goStyleSignRequest('startup-token', 'UI_BUILD|TOKEN', request)
    expect(request.Challenge).toBe(expected)
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
cd web
npm run test -- src/lib/crypto/sign.test.ts
```

Expected: FAIL because the current implementation strips padding and uses a different accumulation algorithm.

- [ ] **Step 3: Reimplement the signer and pass full config from the hook**

Update `web/src/lib/crypto/sign.ts`:

```ts
import { resolveBuildToken } from '@/lib/miaospeed-config'
import type { MiaoSpeedConfig, SlaveRequest } from '@/types/miaospeed'

function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''

  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_')
}

function concatBytes(a: Uint8Array, b: Uint8Array): Uint8Array {
  const result = new Uint8Array(a.length + b.length)
  result.set(a, 0)
  result.set(b, a.length)
  return result
}

function textToBytes(text: string): Uint8Array {
  return new TextEncoder().encode(text)
}

async function sha512(data: Uint8Array): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest('SHA-512', data))
}

async function hashMiaoSpeed(startupToken: string, buildToken: string, request: string): Promise<string> {
  const tokenChain = [startupToken, ...buildToken.trim().split('|')]
  let state = textToBytes(request)

  for (const raw of tokenChain) {
    const token = raw || 'SOME_TOKEN'
    const digest = await sha512(state)
    state = concatBytes(state, concatBytes(textToBytes(token), digest))
  }

  return arrayBufferToBase64Url((await sha512(state)).buffer)
}

export async function signRequest(
  config: Pick<MiaoSpeedConfig, 'token' | 'buildToken'>,
  request: SlaveRequest
): Promise<string> {
  const cloned = JSON.parse(JSON.stringify(request)) as SlaveRequest
  cloned.Challenge = ''

  return hashMiaoSpeed(
    config.token,
    resolveBuildToken({ buildToken: config.buildToken }),
    JSON.stringify(cloned).trim()
  )
}

export async function buildRequest(
  config: Pick<MiaoSpeedConfig, 'token' | 'buildToken'>,
  nodes: Array<{ Name: string; Payload: string }>,
  matrices: Array<{ Type: string; Params?: string }>,
  configs?: Partial<SlaveRequest['Configs']>
): Promise<SlaveRequest> {
  const request: SlaveRequest = {
    Basics: {
      ID: crypto.randomUUID(),
      Slave: 'web-client',
      SlaveName: 'MiaoSpeed WebUI',
      Invoker: 'miaospeed-web',
      Version: '1.0.0',
    },
    Options: {
      Filter: '',
      Matrices: matrices.map((m) => ({ Type: m.Type as SlaveRequest['Options']['Matrices'][0]['Type'], Params: m.Params || '' })),
    },
    Configs: {
      ApiVersion: 3,
      STUNURL: '',
      DownloadURL: 'DYNAMIC:INTL',
      DownloadDuration: 3,
      DownloadThreading: 1,
      UploadURL: '',
      UploadDuration: 0,
      UploadThreading: 0,
      PingAverageOver: 1,
      PingAddress: '',
      TaskRetry: 3,
      DNSServers: [],
      TaskTimeout: 5000,
      Scripts: [],
      ...configs,
    },
    Vendor: 'Clash',
    Nodes: nodes,
    RandomSequence: crypto.randomUUID(),
    Challenge: '',
  }

  request.Challenge = await signRequest(config, request)
  return request
}
```

Update `web/src/hooks/use-miaospeed.ts` so `submitTest` passes the full config instead of only the startup token:

```ts
const request = await buildRequest(
  { token: config.token, buildToken: config.buildToken },
  nodes.map((n) => ({ Name: n.Name, Payload: n.Payload })),
  matrixEntries,
  {
    PingAverageOver: 1,
    TaskRetry: 3,
    TaskTimeout: 5000,
    ...requestConfig,
  }
)
```

Also change the `submitTest` signature from `(nodes, matrices, testType)` to `(nodes, matrices, requestConfig)` so Task 2's shared preset config feeds directly into the request builder.

Update `web/src/App.tsx` to pass the shared request config into `submitTest`:

```ts
const preset = getTestPreset(testType)

await submitTest(
  nodes.map((n) => ({ Name: n.name, Payload: n.payload })),
  preset.matrices,
  preset.requestConfig
)
```

- [ ] **Step 4: Run the signing tests and the frontend build**

Run:

```bash
cd web
npm run test -- src/lib/crypto/sign.test.ts src/lib/miaospeed-config.test.ts src/lib/test-presets.test.ts src/components/node-importer.test.tsx
npm run build
```

Expected:
- all listed tests PASS
- `vite build` succeeds

- [ ] **Step 5: Commit**

```bash
git add web/src/App.tsx web/src/lib/crypto/sign.ts web/src/lib/crypto/sign.test.ts web/src/hooks/use-miaospeed.ts
git commit -m "fix: align frontend signing with backend"
```

### Task 4: Standardize local development mode in scripts and docs

**Files:**
- Modify: `start-dev.bat`
- Modify: `scripts/setup-dev.ps1`
- Modify: `DEV_GUIDE.md`
- Modify: `web/PROJECT.md`
- Modify: `web/README.md`
- Modify: `web/.env`

- [ ] **Step 1: Write the failing expectations down in the docs and defaults**

Before editing prose, add one more assertion to `web/src/lib/miaospeed-config.test.ts` so the shared local default stays tied to the chosen mode:

```ts
it('uses the Vite proxy local development default', () => {
  expect(DEFAULT_DEV_CONFIG.serverUrl).toBe('ws://localhost:5173')
  expect(DEFAULT_DEV_CONFIG.wsPath).toBe('/ws')
})
```

- [ ] **Step 2: Run the test to confirm the current docs/scripts still drift from the intended mode**

Run:

```bash
cd web
npm run test -- src/lib/miaospeed-config.test.ts
```

Expected: PASS for the code assertion, while manual inspection still shows the scripts/docs are out of sync. Treat this as the trigger to update the scripts and prose in the same task.

- [ ] **Step 3: Update scripts, env defaults, and docs to the same non-TLS proxy flow**

Apply the following changes:

`start-dev.bat`

```bat
start "MiaoSpeed Backend" miaospeed.exe server -bind 127.0.0.1:8765 -path /ws -token dev-token-123
...
echo     Server URL: ws://localhost:5173
echo     WebSocket Path: /ws
echo     Startup Token: dev-token-123
```

`scripts/setup-dev.ps1`

```powershell
$arguments = @(
    "server"
    "-bind", "127.0.0.1:$Port"
    "-path", "/ws"
    "-token", $Token
    "-connthread", "32"
)

Write-Host "  TLS: disabled for the default local dev flow"
...
Write-Host "   - Server URL: ws://localhost:5173"
Write-Host "   - WebSocket Path: /ws"
```

`web/.env`

```env
VITE_BUILD_TOKEN=MIAOKO4|580JxAo049R|GEnERAl|1X571R930|T0kEN
VITE_DEFAULT_SERVER_URL=ws://localhost:5173
VITE_DEFAULT_WS_PATH=/ws
```

`DEV_GUIDE.md`, `web/PROJECT.md`, and `web/README.md`

```md
## Recommended local development flow

1. Start the Go backend without `-mtls` and with `-path /ws`.
2. Start the Vite dev server on `http://localhost:5173`.
3. In the UI, use:
   - Server URL: `ws://localhost:5173`
   - WebSocket Path: `/ws`
4. Treat direct backend mode and TLS mode as optional advanced setups, documented separately.
```

- [ ] **Step 4: Run the targeted tests and a manual smoke check**

Run:

```bash
cd web
npm run test -- src/lib/miaospeed-config.test.ts src/lib/crypto/sign.test.ts
npm run build
```

Manual smoke check afterward:

```bash
start-dev.bat
```

Expected:
- frontend tests PASS
- frontend build succeeds
- the startup script banner shows `ws://localhost:5173`, `/ws`, and no TLS for the default local flow

- [ ] **Step 5: Commit**

```bash
git add start-dev.bat scripts/setup-dev.ps1 DEV_GUIDE.md web/PROJECT.md web/README.md web/.env
git commit -m "docs: standardize local integration flow"
```

---

## Scope Notes

This first phase intentionally stops after the core integration blockers are fixed. The following items remain valuable but are explicitly deferred to a later plan:

- a live connection diagnostics panel
- streaming progress rows in the main results table
- direct/TLS mode UX polishing
- multi-profile connection presets
- historical test comparisons and advanced result filtering

These are still tracked in `docs/frontend-backend-taskbook.md` and `docs/frontend-extension-and-optimization.md`, but they should not delay restoring a stable local integration loop.
