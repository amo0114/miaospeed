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
