import { useState, useCallback, useEffect } from 'react'
import { Header } from '@/components/header'
import { NodeImporter } from '@/components/node-importer'
import { TestPanel } from '@/components/test-panel'
import { ResultsTable } from '@/components/results-table'
import { ProgressIndicator } from '@/components/progress-indicator'
import { SettingsDialog } from '@/components/settings-dialog'
import { useMiaoSpeed } from '@/hooks/use-miaospeed'
import { loadStoredConfig } from '@/lib/miaospeed-config'
import { getTestPreset, type TestPresetType } from '@/lib/test-presets'
import { type MiaoSpeedConfig } from '@/types/miaospeed'
import type { ParsedNode } from '@/lib/yaml/parser'
import { useTranslation } from 'react-i18next'

function App() {
  const { t } = useTranslation()
  const [config, setConfig] = useState<MiaoSpeedConfig>(() => loadStoredConfig())
  const [showSettings, setShowSettings] = useState(false)
  const [nodes, setNodes] = useState<ParsedNode[]>([])
  const [isRunning, setIsRunning] = useState(false)

  // Save config to localStorage
  useEffect(() => {
    localStorage.setItem('miaospeed-config', JSON.stringify(config))
  }, [config])

  // MiaoSpeed WebSocket hook
  const {
    status,
    progress,
    results,
    error,
    connect,
    disconnect,
    submitTest,
    isConnected,
  } = useMiaoSpeed({
    config,
    onError: (err) => {
      console.error('MiaoSpeed error:', err)
      setIsRunning(false)
    },
    onComplete: (results) => {
      console.log('Test complete:', results)
      setIsRunning(false)
    },
  })

  // Handle nodes imported
  const handleNodesImported = useCallback((importedNodes: ParsedNode[]) => {
    setNodes(importedNodes)
  }, [])

  // Handle start test
  const handleStartTest = useCallback(
    async (testType: TestPresetType) => {
      if (nodes.length === 0) return

      setIsRunning(true)

      const preset = getTestPreset(testType)

      await submitTest(
        nodes.map((n) => ({ Name: n.name, Payload: n.payload })),
        preset.matrices,
        preset.requestConfig
      )
    },
    [nodes, submitTest]
  )

  // Handle save config
  const handleSaveConfig = useCallback((newConfig: MiaoSpeedConfig) => {
    setConfig(newConfig)
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        status={status}
        onConnect={connect}
        onDisconnect={disconnect}
        onOpenSettings={() => setShowSettings(true)}
      />

      <main className="flex-1 w-full max-w-[1600px] mx-auto py-6 px-4 md:px-6 space-y-6">
        {/* Error Display */}
        {error && (
          <div className="p-4 rounded-lg border border-destructive/50 bg-destructive/10 text-destructive">
            <span className="font-bold">{t('app.error_prefix')}</span> {error}
          </div>
        )}

        {/* Progress Indicator */}
        {progress && <ProgressIndicator progress={progress} />}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Import & Test Config */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-6 lg:sticky lg:top-20">
            <NodeImporter onNodesImported={handleNodesImported} />
            <TestPanel
              nodes={nodes}
              isConnected={isConnected}
              isRunning={isRunning}
              onStartTest={handleStartTest}
            />
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-7 xl:col-span-8 min-w-0">
            <ResultsTable results={results} isLoading={isRunning} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-4 px-4">
        <div className="container flex items-center justify-between text-sm text-muted-foreground">
          <span>{t('app.footer')}</span>
          <span>v4.6.4</span>
        </div>
      </footer>

      {/* Settings Dialog */}
      {showSettings && (
        <SettingsDialog
          config={config}
          onSave={handleSaveConfig}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}

export default App
