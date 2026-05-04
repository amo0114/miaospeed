import { useState } from 'react'
import { Play, Zap, Wifi, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TEST_PRESETS, type TestPresetType } from '@/lib/test-presets'
import type { ParsedNode } from '@/lib/yaml/parser'
import { useTranslation } from 'react-i18next'

interface TestPanelProps {
  nodes: ParsedNode[]
  isConnected: boolean
  isRunning: boolean
  onStartTest: (testType: TestPresetType) => void
}

export function TestPanel({ nodes, isConnected, isRunning, onStartTest }: TestPanelProps) {
  const { t } = useTranslation()
  const [selectedType, setSelectedType] = useState<TestPresetType>('all')

  const testOptions = [
    {
      type: 'ping' as const,
      label: t('test_panel.ping_only'),
      icon: Wifi,
      description: t('test_panel.ping_desc'),
      matrices: TEST_PRESETS.ping.matrices,
    },
    {
      type: 'speed' as const,
      label: t('test_panel.speed_test'),
      icon: Zap,
      description: t('test_panel.speed_desc'),
      matrices: TEST_PRESETS.speed.matrices,
    },
    {
      type: 'all' as const,
      label: t('test_panel.full_test'),
      icon: Play,
      description: t('test_panel.full_desc'),
      matrices: TEST_PRESETS.all.matrices,
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="bg-secondary p-2 rounded-xl text-foreground">
            <Play className="h-5 w-5" />
          </div>
          {t('test_panel.title')}
        </CardTitle>
        <CardDescription>
          {t('test_panel.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Test Type Selection */}
        <div className="grid grid-cols-3 gap-3">
          {testOptions.map((option) => {
            const Icon = option.icon
            const isSelected = selectedType === option.type
            return (
              <button
                key={option.type}
                onClick={() => setSelectedType(option.type)}
                className={`flex flex-col items-center justify-center text-center gap-3 p-4 rounded-[20px] transition-all duration-300 active:scale-95 cursor-pointer ${
                  isSelected
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.02]'
                    : 'bg-secondary/40 hover:bg-secondary shadow-sm text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className={`h-7 w-7 ${isSelected ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                <div className="space-y-1">
                  <span className="block text-sm font-semibold tracking-tight">{option.label}</span>
                  <span className={`block text-[10px] leading-tight ${isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground/80'}`}>
                    {option.description}
                  </span>
                </div>
              </button>
            )
          })}
        </div>

        {/* Selected Matrices */}
        <div className="space-y-3 bg-secondary/20 p-5 rounded-2xl shadow-inner">
          <span className="text-sm font-semibold text-muted-foreground">{t('test_panel.included_tests')}</span>
          <div className="flex flex-wrap gap-2">
            {testOptions
              .find((o) => o.type === selectedType)
              ?.matrices.map((m) => (
                <Badge key={m} variant="secondary" className="px-2.5 py-0.5 rounded-lg font-medium bg-background shadow-sm text-xs">
                  {t(`matrices.${m}`, m)}
                </Badge>
              ))}
          </div>
        </div>

        {/* Node Count & Start */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-sm font-medium">{t('test_panel.nodes_to_test')}</span>
            <Badge variant={nodes.length > 0 ? 'default' : 'secondary'} className="rounded-full px-3 shadow-sm">
              {nodes.length}
            </Badge>
          </div>

          <Button
            onClick={() => onStartTest(selectedType)}
            disabled={!isConnected || nodes.length === 0 || isRunning}
            className="w-full rounded-full h-14 text-base font-semibold shadow-lg active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                {t('test_panel.testing')}
              </>
            ) : (
              <>
                <Play className="h-5 w-5 mr-2 fill-current" />
                {t('test_panel.start_test', { count: nodes.length })}
              </>
            )}
          </Button>
        </div>

        {/* Connection Status */}
        <div className="flex items-center justify-center gap-2 pt-2">
          <div className="relative flex h-3 w-3">
            {isConnected && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-40"></span>
            )}
            <span className={`relative inline-flex rounded-full h-3 w-3 ${isConnected ? 'bg-success' : 'bg-destructive'}`}></span>
          </div>
          <span className="text-sm font-medium text-muted-foreground">
            {isConnected ? t('test_panel.connected') : t('test_panel.disconnected')}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
