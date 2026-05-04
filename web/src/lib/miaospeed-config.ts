import { DEFAULT_CONFIG, type MiaoSpeedConfig } from '@/types/miaospeed'

export const MIAOSPEED_CONFIG_STORAGE_KEY = 'miaospeed-config'

export const DEFAULT_DEV_CONFIG: MiaoSpeedConfig = {
  ...DEFAULT_CONFIG,
  serverUrl: 'ws://localhost:5173',
  path: '/ws',
  wsPath: '/ws',
}

export function loadStoredConfig(
  storage: Pick<Storage, 'getItem'> | null = typeof window !== 'undefined' ? window.localStorage : null
): MiaoSpeedConfig {
  if (!storage) return DEFAULT_DEV_CONFIG

  const raw = storage.getItem(MIAOSPEED_CONFIG_STORAGE_KEY)
  if (!raw) return DEFAULT_DEV_CONFIG

  try {
    const parsed = JSON.parse(raw) as Partial<MiaoSpeedConfig>

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return DEFAULT_DEV_CONFIG
    }

    return {
      ...DEFAULT_DEV_CONFIG,
      ...parsed,
    }
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
