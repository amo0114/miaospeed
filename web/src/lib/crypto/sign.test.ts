import { describe, expect, it } from 'vitest'
import { buildRequest, signRequest } from '@/lib/crypto/sign'
import type { SlaveRequest } from '@/types/miaospeed'

async function sha512(bytes: Uint8Array): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest('SHA-512', new Uint8Array(bytes)))
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

function toGoSignableRequest(request: SlaveRequest) {
  return {
    Basics: {
      ID: request.Basics.ID,
      Slave: request.Basics.Slave,
      SlaveName: request.Basics.SlaveName,
      Invoker: request.Basics.Invoker,
      Version: request.Basics.Version,
    },
    Options: {
      Filter: request.Options.Filter,
      Matrices: request.Options.Matrices.map((matrix) => ({
        Type: matrix.Type,
        Params: matrix.Params,
      })),
    },
    Configs: {
      STUNURL: request.Configs.STUNURL,
      DownloadURL: request.Configs.DownloadURL,
      DownloadDuration: request.Configs.DownloadDuration,
      DownloadThreading: request.Configs.DownloadThreading,
      PingAverageOver: request.Configs.PingAverageOver,
      PingAddress: request.Configs.PingAddress,
      TaskRetry: request.Configs.TaskRetry,
      DNSServers: [...request.Configs.DNSServers],
      TaskTimeout: request.Configs.TaskTimeout,
      Scripts: [...request.Configs.Scripts],
      ApiVersion: request.Configs.ApiVersion,
      UploadURL: request.Configs.UploadURL,
      UploadDuration: request.Configs.UploadDuration,
      UploadThreading: request.Configs.UploadThreading,
    },
    Vendor: '',
    Nodes: request.Nodes.map((node) => ({
      Name: node.Name,
      Payload: node.Payload,
    })),
    RandomSequence: request.RandomSequence,
    Challenge: '',
  }
}

async function goStyleSignRequest(token: string, buildToken: string, request: SlaveRequest) {
  const tokenChain = [token, ...buildToken.trim().split('|')]
  let state = textToBytes(JSON.stringify(toGoSignableRequest(request)).trim())

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
