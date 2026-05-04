import { ArrowUpDown, Download, Copy, ExternalLink, Activity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { ParsedNodeResult } from '@/types/miaospeed'
import {
  formatSpeed,
  formatMs,
  formatPacketLoss,
  getSpeedColor,
  getRttColor,
} from '@/hooks/use-miaospeed'
import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

interface ResultsTableProps {
  results: ParsedNodeResult[]
  isLoading?: boolean
}

type SortKey = 'name' | 'rtt' | 'downloadSpeed' | 'uploadSpeed' | 'packetLoss' | 'duration'
type SortDir = 'asc' | 'desc'

export function ResultsTable({ results, isLoading }: ResultsTableProps) {
  const { t } = useTranslation()
  const [sortKey, setSortKey] = useState<SortKey>('rtt')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const showUpload = useMemo(
    () => results.some((result) => result.uploadSpeed !== null),
    [results]
  )

  const sortedResults = useMemo(() => {
    return [...results].sort((a, b) => {
      let aVal: number | string = 0
      let bVal: number | string = 0

      switch (sortKey) {
        case 'name':
          aVal = a.name
          bVal = b.name
          break
        case 'rtt':
          aVal = a.rtt ?? Infinity
          bVal = b.rtt ?? Infinity
          break
        case 'downloadSpeed':
          aVal = a.downloadSpeed ?? 0
          bVal = b.downloadSpeed ?? 0
          break
        case 'uploadSpeed':
          aVal = a.uploadSpeed ?? 0
          bVal = b.uploadSpeed ?? 0
          break
        case 'packetLoss':
          aVal = a.packetLoss ?? 1
          bVal = b.packetLoss ?? 1
          break
        case 'duration':
          aVal = a.duration
          bVal = b.duration
          break
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }

      return sortDir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number)
    })
  }, [results, sortKey, sortDir])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const handleExportCSV = () => {
    const headers = ['Name', 'Type', 'RTT (ms)', 'Download']
    if (showUpload) {
      headers.push('Upload')
    }
    headers.push('Packet Loss', 'GeoIP', 'Duration (ms)')

    const rows = results.map((r) => [
      r.name,
      r.proxyType,
      r.rtt ?? '',
      r.downloadSpeed ?? '',
      ...(showUpload ? [r.uploadSpeed ?? ''] : []),
      r.packetLoss != null ? (r.packetLoss * 100).toFixed(1) + '%' : '',
      r.geoIP?.country ?? '',
      r.duration,
    ])

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `miaospeed-results-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleCopyAll = () => {
    const text = results
      .map(
        (r) =>
          [
            r.name,
            r.proxyType,
            formatMs(r.rtt),
            formatSpeed(r.downloadSpeed),
            ...(showUpload ? [formatSpeed(r.uploadSpeed)] : []),
            formatPacketLoss(r.packetLoss),
            r.geoIP?.country ?? '-',
          ].join('\t')
      )
      .join('\n')
    navigator.clipboard.writeText(text)
  }

  if (results.length === 0) {
    return (
      <Card className="min-h-[500px] flex flex-col border-none shadow-none bg-secondary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="bg-secondary p-2 rounded-xl text-foreground">
              <Activity className="h-5 w-5" />
            </div>
            {t('results_table.title')}
          </CardTitle>
          <CardDescription>
            {isLoading
              ? t('results_table.description_loading')
              : t('results_table.description_empty')}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col items-center justify-center text-center p-8">
          {isLoading ? (
            <div className="flex flex-col items-center text-muted-foreground gap-5">
              <div className="relative">
                <div className="absolute inset-0 rounded-full blur-2xl bg-primary/30 animate-pulse"></div>
                <div className="bg-background p-4 rounded-full shadow-lg relative z-10">
                  <Activity className="h-10 w-10 text-primary animate-pulse" />
                </div>
              </div>
              <div className="text-sm font-semibold tracking-tight animate-pulse">{t('results_table.testing')}</div>
            </div>
          ) : (
            <div className="flex flex-col items-center text-muted-foreground gap-4 max-w-[280px]">
              <div className="h-20 w-20 rounded-[28px] bg-background shadow-sm flex items-center justify-center -rotate-3 transition-transform hover:rotate-0 hover:scale-105 duration-300">
                <Activity className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <div className="text-sm font-medium tracking-tight text-muted-foreground/80">{t('results_table.description_empty')}</div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <div className="bg-success/10 p-2 rounded-xl text-success">
                <Activity className="h-5 w-5" />
              </div>
              {t('results_table.title')}
            </CardTitle>
            <CardDescription className="mt-1">
              {t('results_table.description_tested', { count: results.length })}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={handleCopyAll} className="rounded-full shadow-sm active:scale-95 transition-transform font-medium">
              <Copy className="h-4 w-4 mr-2" />
              {t('results_table.copy')}
            </Button>
            <Button variant="secondary" size="sm" onClick={handleExportCSV} className="rounded-full shadow-sm active:scale-95 transition-transform font-medium">
              <Download className="h-4 w-4 mr-2" />
              {t('results_table.csv')}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-2xl bg-secondary/20 p-2 shadow-inner">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-muted-foreground">
                <th className="text-left py-4 px-3 font-medium">
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center hover:text-foreground transition-colors group"
                  >
                    {t('results_table.col_node')}
                    <ArrowUpDown className="h-3 w-3 ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </th>
                <th className="text-left py-4 px-3 font-medium">{t('results_table.col_type')}</th>
                <th className="text-right py-4 px-3 font-medium">
                  <button
                    onClick={() => handleSort('rtt')}
                    className="flex items-center justify-end w-full hover:text-foreground transition-colors group"
                  >
                    {t('results_table.col_rtt')}
                    <ArrowUpDown className="h-3 w-3 ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </th>
                <th className="text-right py-4 px-3 font-medium">
                  <button
                    onClick={() => handleSort('downloadSpeed')}
                    className="flex items-center justify-end w-full hover:text-foreground transition-colors group"
                  >
                    {t('results_table.col_download')}
                    <ArrowUpDown className="h-3 w-3 ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </th>
                {showUpload && (
                  <th className="text-right py-4 px-3 font-medium">
                    <button
                      onClick={() => handleSort('uploadSpeed')}
                      className="flex items-center justify-end w-full hover:text-foreground transition-colors group"
                    >
                      {t('results_table.col_upload')}
                      <ArrowUpDown className="h-3 w-3 ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  </th>
                )}
                <th className="text-right py-4 px-3 font-medium">
                  <button
                    onClick={() => handleSort('packetLoss')}
                    className="flex items-center justify-end w-full hover:text-foreground transition-colors group"
                  >
                    {t('results_table.col_loss')}
                    <ArrowUpDown className="h-3 w-3 ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </th>
                <th className="text-left py-4 px-3 font-medium">{t('results_table.col_geoip')}</th>
                <th className="text-right py-4 px-3 font-medium">
                  <button
                    onClick={() => handleSort('duration')}
                    className="flex items-center justify-end w-full hover:text-foreground transition-colors group"
                  >
                    {t('results_table.col_time')}
                    <ArrowUpDown className="h-3 w-3 ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedResults.map((result, i) => (
                <tr
                  key={i}
                  className="border-b border-black/5 dark:border-white/5 last:border-0 hover:bg-background/80 transition-colors rounded-xl"
                >
                  <td className="py-3 px-3">
                    <div className="flex flex-col">
                      <span className="font-semibold truncate max-w-[200px]">{result.name}</span>
                      <span className="text-[11px] text-muted-foreground truncate max-w-[200px] mt-0.5">
                        {result.address}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <Badge variant="outline" className="text-[10px] bg-background shadow-sm border-none font-mono text-muted-foreground">
                      {result.proxyType}
                    </Badge>
                  </td>
                  <td className={`py-3 px-3 text-right font-mono text-[13px] font-semibold tracking-tight ${getRttColor(result.rtt)}`}>
                    {formatMs(result.rtt)}
                  </td>
                  <td className={`py-3 px-3 text-right font-mono text-[13px] font-semibold tracking-tight ${getSpeedColor(result.downloadSpeed)}`}>
                    {formatSpeed(result.downloadSpeed)}
                  </td>
                  {showUpload && (
                    <td className={`py-3 px-3 text-right font-mono text-[13px] font-semibold tracking-tight ${getSpeedColor(result.uploadSpeed)}`}>
                      {formatSpeed(result.uploadSpeed)}
                    </td>
                  )}
                  <td className="py-3 px-3 text-right font-mono text-[13px] font-semibold tracking-tight">
                    <span
                      className={
                        result.packetLoss != null && result.packetLoss > 0
                          ? 'text-destructive'
                          : 'text-success'
                      }
                    >
                      {formatPacketLoss(result.packetLoss)}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    {result.geoIP ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium">{result.geoIP.country}</span>
                        <span className="text-[10px] text-muted-foreground bg-background px-1.5 py-0.5 rounded-md shadow-sm border-none">
                          {result.geoIP.country_code}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right text-[12px] text-muted-foreground font-mono">
                    {result.duration > 0 ? `${(result.duration / 1000).toFixed(1)}s` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
