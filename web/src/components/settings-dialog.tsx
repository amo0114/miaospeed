import { useState } from 'react'
import { X, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import type { MiaoSpeedConfig } from '@/types/miaospeed'
import { useTranslation } from 'react-i18next'

interface SettingsDialogProps {
  config: MiaoSpeedConfig
  onSave: (config: MiaoSpeedConfig) => void
  onClose: () => void
}

export function SettingsDialog({ config, onSave, onClose }: SettingsDialogProps) {
  const { t } = useTranslation()
  const [localConfig, setLocalConfig] = useState<MiaoSpeedConfig>(config)

  const handleSave = () => {
    onSave(localConfig)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              <CardTitle>{t('settings.title')}</CardTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>{t('settings.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('settings.server_url')}</label>
            <Input
              placeholder="ws://localhost:8765"
              value={localConfig.serverUrl}
              onChange={(e) =>
                setLocalConfig((c) => ({ ...c, serverUrl: e.target.value }))
              }
            />
            <p className="text-xs text-muted-foreground">
              {t('settings.server_url_desc')}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t('settings.ws_path')}</label>
            <Input
              placeholder="/"
              value={localConfig.wsPath}
              onChange={(e) =>
                setLocalConfig((c) => ({ ...c, wsPath: e.target.value }))
              }
            />
            <p className="text-xs text-muted-foreground">
              {t('settings.ws_path_desc')}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t('settings.startup_token')}</label>
            <Input
              type="password"
              placeholder="Your startup token"
              value={localConfig.token}
              onChange={(e) =>
                setLocalConfig((c) => ({ ...c, token: e.target.value }))
              }
            />
            <p className="text-xs text-muted-foreground">
              {t('settings.startup_token_desc')}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t('settings.build_token')}</label>
            <Input
              placeholder="MIAOKO4|580JxAo049R|GEnERAl|1X571R930|T0kEN"
              value={localConfig.buildToken}
              onChange={(e) =>
                setLocalConfig((c) => ({ ...c, buildToken: e.target.value }))
              }
            />
            <p className="text-xs text-muted-foreground">
              {t('settings.build_token_desc')}
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              {t('settings.cancel')}
            </Button>
            <Button onClick={handleSave}>{t('settings.save')}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
