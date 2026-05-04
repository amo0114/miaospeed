import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useMiaoSpeed } from '@/hooks/use-miaospeed'
import type { MiaoSpeedConfig, SlaveRequestMatrixType, SlaveResponse } from '@/types/miaospeed'

class MockWebSocket {
  static instances: MockWebSocket[] = []
  static CONNECTING = 0
  static OPEN = 1
  static CLOSED = 3

  readyState = MockWebSocket.CONNECTING
  url: string
  sent: string[] = []

  onopen: ((event: Event) => void) | null = null
  onmessage: ((event: MessageEvent) => void) | null = null
  onerror: ((event: Event) => void) | null = null
  onclose: ((event: CloseEvent) => void) | null = null

  constructor(url: string) {
    this.url = url
    MockWebSocket.instances.push(this)
  }

  send(data: string) {
    this.sent.push(data)
  }

  close() {
    this.emitClose()
  }

  emitOpen() {
    this.readyState = MockWebSocket.OPEN
    this.onopen?.({} as Event)
  }

  emitMessage(response: SlaveResponse) {
    this.onmessage?.({ data: JSON.stringify(response) } as MessageEvent)
  }

  emitClose() {
    this.readyState = MockWebSocket.CLOSED
    this.onclose?.({} as CloseEvent)
  }
}

const BASE_CONFIG: MiaoSpeedConfig = {
  serverUrl: 'ws://localhost:5173',
  token: 'dev-token-123',
  buildToken: 'MIAOKO4|580JxAo049R|GEnERAl|1X571R930|T0kEN',
  path: '/ws',
  wsPath: '/ws',
}

const TEST_NODE = { Name: 'Smoke-Test', Payload: 'payload-1' }
const TEST_MATRICES: SlaveRequestMatrixType[] = ['TEST_PING_RTT']
const SERVER_ERROR = 'cannot verify the request, please check your token'

describe('useMiaoSpeed', () => {
  let originalWebSocket: typeof WebSocket

  beforeEach(() => {
    originalWebSocket = globalThis.WebSocket
    MockWebSocket.instances = []
    globalThis.WebSocket = MockWebSocket as unknown as typeof WebSocket
  })

  afterEach(() => {
    globalThis.WebSocket = originalWebSocket
    vi.restoreAllMocks()
  })

  it('clears pending progress and keeps error status when the server rejects the request and closes the socket', async () => {
    const onError = vi.fn()
    const { result } = renderHook(() => useMiaoSpeed({ config: BASE_CONFIG, onError }))

    act(() => {
      result.current.connect()
    })

    const socket = MockWebSocket.instances[0]

    act(() => {
      socket.emitOpen()
    })

    expect(result.current.status).toBe('connected')

    await act(async () => {
      await result.current.submitTest([TEST_NODE], TEST_MATRICES, {})
    })

    expect(result.current.progress?.queuing).toBe(1)

    act(() => {
      socket.emitMessage({
        ID: 'task-1',
        MiaoSpeedVersion: '4.6.X',
        Error: SERVER_ERROR,
        Progress: null,
        Result: null,
      })
    })

    expect(result.current.status).toBe('error')
    expect(result.current.error).toBe(SERVER_ERROR)
    expect(result.current.progress).toBeNull()

    act(() => {
      socket.emitClose()
    })

    expect(result.current.status).toBe('error')
    expect(result.current.progress).toBeNull()
    expect(onError).toHaveBeenCalledWith(SERVER_ERROR)
  })

  it('clears stale progress and error before reconnecting after a failed request', async () => {
    const { result } = renderHook(() => useMiaoSpeed({ config: BASE_CONFIG }))

    act(() => {
      result.current.connect()
    })

    const firstSocket = MockWebSocket.instances[0]

    act(() => {
      firstSocket.emitOpen()
    })

    await act(async () => {
      await result.current.submitTest([TEST_NODE], TEST_MATRICES, {})
    })

    act(() => {
      firstSocket.emitMessage({
        ID: 'task-1',
        MiaoSpeedVersion: '4.6.X',
        Error: SERVER_ERROR,
        Progress: null,
        Result: null,
      })
      firstSocket.emitClose()
    })

    expect(result.current.status).toBe('error')
    expect(result.current.progress).toBeNull()

    act(() => {
      result.current.connect()
    })

    expect(result.current.error).toBeNull()
    expect(result.current.progress).toBeNull()

    const secondSocket = MockWebSocket.instances[1]

    act(() => {
      secondSocket.emitOpen()
    })

    expect(result.current.status).toBe('connected')
  })
})
