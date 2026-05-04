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
    matrices: [
      'TEST_PING_RTT',
      'TEST_PING_CONN',
      'TEST_PING_PACKET_LOSS',
      'SPEED_AVERAGE',
      'SPEED_MAX',
      'GEOIP_OUTBOUND',
    ],
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
