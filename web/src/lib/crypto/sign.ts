import { resolveBuildToken } from '@/lib/miaospeed-config'
import type { MiaoSpeedConfig, SlaveRequest } from '@/types/miaospeed'

function arrayBufferToBase64Url(bytes: Uint8Array): string {
  let binary = ''

  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_')
}

async function sha512(data: Uint8Array): Promise<Uint8Array> {
  const hashBuffer = await crypto.subtle.digest('SHA-512', new Uint8Array(data))
  return new Uint8Array(hashBuffer)
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

async function hashMiaoSpeed(startupToken: string, buildToken: string, request: string): Promise<string> {
  const tokenChain = [startupToken, ...buildToken.trim().split('|')]
  let state = textToBytes(request)

  for (const raw of tokenChain) {
    const token = raw || 'SOME_TOKEN'
    const digest = await sha512(state)
    state = concatBytes(state, concatBytes(textToBytes(token), digest))
  }

  const finalDigest = await sha512(state)
  return arrayBufferToBase64Url(finalDigest)
}

export async function signRequest(
  config: Pick<MiaoSpeedConfig, 'token' | 'buildToken'>,
  request: SlaveRequest
): Promise<string> {
  const signableRequest = toGoSignableRequest(request)

  return hashMiaoSpeed(
    config.token,
    resolveBuildToken({ buildToken: config.buildToken }),
    JSON.stringify(signableRequest).trim()
  )
}

export function generateUUID(): string {
  return crypto.randomUUID()
}

export async function buildRequest(
  config: Pick<MiaoSpeedConfig, 'token' | 'buildToken'>,
  nodes: Array<{ Name: string; Payload: string }>,
  matrices: Array<{ Type: string; Params?: string }>,
  configs?: Partial<SlaveRequest['Configs']>
): Promise<SlaveRequest> {
  const request: SlaveRequest = {
    Basics: {
      ID: generateUUID(),
      Slave: 'web-client',
      SlaveName: 'MiaoSpeed WebUI',
      Invoker: 'miaospeed-web',
      Version: '1.0.0',
    },
    Options: {
      Filter: '',
      Matrices: matrices.map((m) => ({
        Type: m.Type as SlaveRequest['Options']['Matrices'][0]['Type'],
        Params: m.Params || '',
      })),
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
    RandomSequence: generateUUID(),
    Challenge: '',
  }

  request.Challenge = await signRequest(config, request)
  return request
}
