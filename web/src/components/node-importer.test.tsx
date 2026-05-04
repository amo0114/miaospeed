import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { NodeImporter } from '@/components/node-importer'

vi.mock('@/lib/yaml/parser', () => ({
  parseClashYaml: () => [{ name: 'HK-01', type: 'Trojan', payload: 'payload-1' }],
  parseSubscription: () => [],
}))

describe('NodeImporter', () => {
  it('clears the parent node state when the user clicks clear', () => {
    const onNodesImported = vi.fn()

    render(React.createElement(NodeImporter, { onNodesImported }))

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'proxies:\n  - name: HK-01' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'importer.parse' }))
    fireEvent.click(screen.getByRole('button', { name: 'importer.clear' }))

    expect(onNodesImported).toHaveBeenLastCalledWith([])
  })
})
