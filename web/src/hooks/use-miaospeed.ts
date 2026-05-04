/**

 * useMiaoSpeed - Core WebSocket Hook for MiaoSpeed Backend

 * Handles connection, message signing, and response parsing

 */



import { useCallback, useEffect, useRef, useState } from 'react'

import { buildRequest } from '@/lib/crypto/sign'

import type {

  MiaoSpeedConfig,

  MatrixResponse,

  ParsedNodeResult,

  SlaveEntrySlot,

  SlaveResponse,

  SlaveRequestMatrixType,

  GeoInfo,

  GeoIPPayload,

  SpeedPayload,

  PingPayload,

  PacketLossPayload,

  HijackPayload,

  ScriptTestPayload,

  PerSecondSpeedPayload,

  SlaveRequest,

} from '@/types/miaospeed'



// ==================== Types ====================



export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error'



export interface TestProgress {

  current: number

  total: number

  queuing: number

  currentNode: string

  results: ParsedNodeResult[]

}



export interface UseMiaoSpeedOptions {

  config: MiaoSpeedConfig

  onProgress?: (progress: TestProgress) => void

  onComplete?: (results: ParsedNodeResult[]) => void

  onError?: (error: string) => void

}



// ==================== Matrix Payload Parsers ====================



function parseMatrixPayload<T>(payload: string): T | null {

  try {

    return JSON.parse(payload) as T

  } catch {

    return null

  }

}



function extractRtt(matrices: MatrixResponse[]): number | null {

  const m = matrices.find((m) => m.Type === 'TEST_PING_RTT')

  if (!m) return null

  const p = parseMatrixPayload<PingPayload>(m.Payload)

  return p?.Value ?? null

}



function extractHttpPing(matrices: MatrixResponse[]): number | null {

  const m = matrices.find((m) => m.Type === 'TEST_PING_CONN')

  if (!m) return null

  const p = parseMatrixPayload<PingPayload>(m.Payload)

  return p?.Value ?? null

}



function extractDownloadSpeed(matrices: MatrixResponse[]): number | null {

  const m = matrices.find((m) => m.Type === 'SPEED_AVERAGE')

  if (!m) return null

  const p = parseMatrixPayload<SpeedPayload>(m.Payload)

  return p?.Value ?? null

}



function extractUploadSpeed(matrices: MatrixResponse[]): number | null {

  const m = matrices.find((m) => m.Type === 'USPEED_AVERAGE')

  if (!m) return null

  const p = parseMatrixPayload<SpeedPayload>(m.Payload)

  return p?.Value ?? null

}



function extractPacketLoss(matrices: MatrixResponse[]): number | null {

  const m = matrices.find((m) => m.Type === 'TEST_PING_PACKET_LOSS')

  if (!m) return null

  const p = parseMatrixPayload<PacketLossPayload>(m.Payload)

  return p?.Value ?? null

}



function extractGeoIP(matrices: MatrixResponse[]): GeoInfo | null {

  const m = matrices.find((m) => m.Type === 'GEOIP_OUTBOUND')

  if (!m) return null

  const p = parseMatrixPayload<GeoIPPayload>(m.Payload)

  if (!p) return null

  return p.IPv4Stack?.[0] ?? p.IPv6Stack?.[0] ?? p.MainStack ?? null

}



function extractUdpType(matrices: MatrixResponse[]): string | null {

  const m = matrices.find((m) => m.Type === 'UDP_TYPE')

  if (!m) return null

  const payload = parseMatrixPayload<{ Value: string }>(m.Payload)

  return payload?.Value ?? null

}



function extractHijack(matrices: MatrixResponse[]): HijackPayload | null {

  const m = matrices.find((m) => m.Type === 'TEST_HIJACK_DETECTION')

  if (!m) return null

  return parseMatrixPayload<HijackPayload>(m.Payload)

}



function extractScriptResults(matrices: MatrixResponse[]): ScriptTestPayload[] {

  return matrices

    .filter((m) => m.Type === 'TEST_SCRIPT')

    .map((m) => parseMatrixPayload<ScriptTestPayload>(m.Payload))

    .filter((p): p is ScriptTestPayload => p !== null)

}



function parseSlotToResult(slot: SlaveEntrySlot): ParsedNodeResult {

  return {

    name: slot.ProxyInfo.Name,

    address: slot.ProxyInfo.Address,

    proxyType: slot.ProxyInfo.Type,

    duration: slot.InvokeDuration,

    rtt: extractRtt(slot.Matrices),

    httpPing: extractHttpPing(slot.Matrices),

    downloadSpeed: extractDownloadSpeed(slot.Matrices),

    uploadSpeed: extractUploadSpeed(slot.Matrices),

    packetLoss: extractPacketLoss(slot.Matrices),

    geoIP: extractGeoIP(slot.Matrices),

    udpType: extractUdpType(slot.Matrices),

    hijack: extractHijack(slot.Matrices),

    scriptResults: extractScriptResults(slot.Matrices),

    matrices: slot.Matrices,

  }

}



// ==================== Hook ====================



export function useMiaoSpeed(options: UseMiaoSpeedOptions) {

  const { config, onProgress, onComplete, onError } = options



  const [status, setStatus] = useState<ConnectionStatus>('disconnected')

  const [progress, setProgress] = useState<TestProgress | null>(null)

  const [results, setResults] = useState<ParsedNodeResult[]>([])

  const [error, setError] = useState<string | null>(null)



  const wsRef = useRef<WebSocket | null>(null)

  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const closeReasonRef = useRef<'manual' | 'transport_error' | 'server_error' | null>(null)



  // Connect to WebSocket

  const connect = useCallback(() => {

    if (
      wsRef.current?.readyState === WebSocket.OPEN ||
      wsRef.current?.readyState === WebSocket.CONNECTING
    ) return



    closeReasonRef.current = null

    setStatus('connecting')

    setError(null)

    setProgress(null)



    try {

      const wsUrl = `${config.serverUrl}${config.wsPath}`

      const ws = new WebSocket(wsUrl)



      ws.onopen = () => {

        setStatus('connected')

        console.log('[MiaoSpeed] Connected to', wsUrl)

      }



      ws.onmessage = (event) => {

        try {

          const response: SlaveResponse = JSON.parse(event.data)

          handleMessage(response)

        } catch (err) {

          console.error('[MiaoSpeed] Failed to parse message:', err)

        }

      }



      ws.onerror = (event) => {

        console.error('[MiaoSpeed] WebSocket error:', event)

        closeReasonRef.current = 'transport_error'

        setStatus('error')

        setError('WebSocket connection error')

        onError?.('WebSocket connection error')

      }



      ws.onclose = () => {

        wsRef.current = null

        setProgress(null)

        const closeReason = closeReasonRef.current

        closeReasonRef.current = null

        if (closeReason === 'transport_error' || closeReason === 'server_error') {

          console.log('[MiaoSpeed] Disconnected after error')

          return

        }

        setStatus('disconnected')


        console.log('[MiaoSpeed] Disconnected')

      }



      wsRef.current = ws

    } catch (err) {

      setStatus('error')

      const msg = err instanceof Error ? err.message : 'Failed to connect'

      setError(msg)

      onError?.(msg)

    }

  }, [config.serverUrl, config.wsPath, onError])



  // Disconnect

  const disconnect = useCallback(() => {

    closeReasonRef.current = 'manual'

    if (reconnectTimeoutRef.current) {

      clearTimeout(reconnectTimeoutRef.current)

    }

    if (wsRef.current) {

      wsRef.current.close()

      wsRef.current = null

    }

    setProgress(null)

    setStatus('disconnected')

  }, [])



  // Handle incoming messages

  const handleMessage = useCallback(

    (response: SlaveResponse) => {

      if (response.Error) {

        closeReasonRef.current = 'server_error'

        setStatus('error')

        setProgress(null)

        setError(response.Error)

        onError?.(response.Error)

        return

      }



      // Progress update

      if (response.Progress) {

        const record = response.Progress.Record

        const parsedResult = parseSlotToResult(record)



        setProgress((prev) => {

          const newResults = prev ? [...prev.results, parsedResult] : [parsedResult]

          const newProgress: TestProgress = {

            current: response.Progress!.Index + 1,

            total: response.Progress!.Index + 1 + response.Progress!.Queuing,

            queuing: response.Progress!.Queuing,

            currentNode: record.ProxyInfo.Name,

            results: newResults,

          }

          onProgress?.(newProgress)

          return newProgress

        })

      }



      // Final result

      if (response.Result) {

        const allResults = response.Result.Results.map(parseSlotToResult)

        setResults(allResults)

        setProgress(null)

        onComplete?.(allResults)

      }

    },

    [onProgress, onComplete, onError]

  )



  // Submit test

  const submitTest = useCallback(

    async (

      nodes: Array<{ Name: string; Payload: string }>,

      matrices: SlaveRequestMatrixType[],

      requestConfig: Partial<SlaveRequest['Configs']> = {}

    ) => {

      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {

        setError('Not connected to server')

        return

      }



      setError(null)

      setResults([])

      setProgress({

        current: 0,

        total: nodes.length,

        queuing: nodes.length,

        currentNode: '',

        results: [],

      })




      const matrixEntries = buildMatrixEntries(matrices)



      try {

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



        wsRef.current.send(JSON.stringify(request))

      } catch (err) {

        const msg = err instanceof Error ? err.message : 'Failed to build request'

        setError(msg)

        onError?.(msg)

      }

    },

    [config.buildToken, config.token, onError]

  )



  // Cleanup on unmount

  useEffect(() => {

    return () => {

      disconnect()

    }

  }, [disconnect])



  return {

    status,

    progress,

    results,

    error,

    connect,

    disconnect,

    submitTest,

    isConnected: status === 'connected',

  }

}



// ==================== Helper Functions ====================



function buildMatrixEntries(

  matrices: SlaveRequestMatrixType[]

) {

  return matrices.map((Type) => ({ Type, Params: '' }))

}



// ==================== Utility Functions ====================



/**

 * Format bytes/s to human readable speed

 */

export function formatSpeed(bytesPerSec: number | null): string {

  if (bytesPerSec === null || bytesPerSec === undefined) return '-'

  if (bytesPerSec === 0) return '0 B/s'



  const units = ['B/s', 'KB/s', 'MB/s', 'GB/s']

  const k = 1024

  const i = Math.floor(Math.log(bytesPerSec) / Math.log(k))

  const value = bytesPerSec / Math.pow(k, i)



  return `${value.toFixed(2)} ${units[i]}`

}



/**

 * Format milliseconds

 */

export function formatMs(ms: number | null): string {

  if (ms === null || ms === undefined) return '-'

  return `${ms} ms`

}



/**

 * Format packet loss percentage

 */

export function formatPacketLoss(value: number | null): string {

  if (value === null || value === undefined) return '-'

  return `${(value * 100).toFixed(1)}%`

}



/**

 * Get speed color based on value

 */

export function getSpeedColor(bytesPerSec: number | null): string {

  if (!bytesPerSec) return 'text-muted-foreground'

  const mbps = (bytesPerSec * 8) / 1_000_000

  if (mbps >= 100) return 'text-success'

  if (mbps >= 50) return 'text-info'

  if (mbps >= 10) return 'text-warning'

  return 'text-destructive'

}



/**

 * Get RTT color based on value

 */

export function getRttColor(ms: number | null): string {

  if (!ms) return 'text-muted-foreground'

  if (ms <= 100) return 'text-success'

  if (ms <= 200) return 'text-info'

  if (ms <= 500) return 'text-warning'

  return 'text-destructive'

}

