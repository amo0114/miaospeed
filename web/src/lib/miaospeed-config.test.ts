import { describe, expect, it } from 'vitest'
import {
  DEFAULT_DEV_CONFIG,
  loadStoredConfig,
  resolveBuildToken,
} from '@/lib/miaospeed-config'

describe('loadStoredConfig', () => {
  it('uses the Vite proxy local development default', () => {
    expect(DEFAULT_DEV_CONFIG.serverUrl).toBe('ws://localhost:5173')
    expect(DEFAULT_DEV_CONFIG.wsPath).toBe('/ws')
  })

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
