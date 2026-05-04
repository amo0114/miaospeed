import { Settings, Wifi, WifiOff, Zap, Moon, Sun, Languages } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { ConnectionStatus } from '@/hooks/use-miaospeed'
import { useTranslation } from 'react-i18next'
import { useTheme } from './theme-provider'

interface HeaderProps {
  status: ConnectionStatus
  onConnect: () => void
  onDisconnect: () => void
  onOpenSettings: () => void
}

export function Header({ status, onConnect, onDisconnect, onOpenSettings }: HeaderProps) {
  const { t, i18n } = useTranslation()
  const { theme, setTheme } = useTheme()

  const statusConfig = {
    disconnected: {
      label: t('header.disconnected'),
      variant: 'secondary' as const,
      icon: WifiOff,
      action: onConnect,
      actionLabel: t('header.connect'),
    },
    connecting: {
      label: t('header.connecting'),
      variant: 'warning' as const,
      icon: Wifi,
      action: () => {},
      actionLabel: t('header.connecting'),
    },
    connected: {
      label: t('header.connected'),
      variant: 'success' as const,
      icon: Wifi,
      action: onDisconnect,
      actionLabel: t('header.disconnect'),
    },
    error: {
      label: t('header.error'),
      variant: 'destructive' as const,
      icon: WifiOff,
      action: onConnect,
      actionLabel: t('header.retry'),
    },
  }

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.disconnected
  const Icon = config.icon

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language.startsWith('en') ? 'zh' : 'en')
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-background/60 backdrop-blur-2xl border-b border-white/10 dark:border-white/5 shadow-sm transition-all">
      <div className="w-full max-w-[1600px] mx-auto flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground p-1.5 rounded-lg shadow-sm">
              <Zap className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">{t('header.title')}</span>
          </div>
          <Badge variant={config.variant} className="flex items-center gap-1 rounded-full px-3 py-1 bg-secondary/50 hover:bg-secondary border-none shadow-none font-medium">
            <Icon className="h-3 w-3" />
            {config.label}
          </Badge>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={toggleLanguage} title={t('header.toggleLang')} className="rounded-full active:scale-95 transition-transform hover:bg-secondary">
            <Languages className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title={t('header.toggleTheme')}
            className="rounded-full active:scale-95 transition-transform hover:bg-secondary"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
          <Button
            variant={status === 'connected' ? 'secondary' : 'default'}
            size="sm"
            onClick={config.action}
            disabled={status === 'connecting'}
            className="rounded-full font-medium px-4 active:scale-95 transition-transform shadow-sm"
          >
            <Icon className="h-4 w-4 mr-1.5" />
            {config.actionLabel}
          </Button>
          <Button variant="ghost" size="icon" onClick={onOpenSettings} className="rounded-full active:scale-95 transition-transform hover:bg-secondary">
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}
