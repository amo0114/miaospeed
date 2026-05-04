import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { TestProgress } from '@/hooks/use-miaospeed'
import { useTranslation } from 'react-i18next'

interface ProgressIndicatorProps {
  progress: TestProgress
}

export function ProgressIndicator({ progress }: ProgressIndicatorProps) {
  const { t } = useTranslation()
  const percentage = progress.total > 0 
    ? Math.round((progress.current / progress.total) * 100)
    : 0

  return (
    <Card className="border-primary/50 bg-primary/5">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <Loader2 className="h-5 w-5 text-primary animate-spin" />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                {progress.currentNode 
                  ? t('progress.testing', { node: progress.currentNode }) 
                  : t('progress.initializing')}
              </span>
              <span className="text-sm text-muted-foreground">
                {progress.current} / {progress.total}
              </span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300 ease-out"
                style={{ width: `${percentage}%` }}
              />
            </div>
            {progress.queuing > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {t('progress.in_queue', { count: progress.queuing })}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
