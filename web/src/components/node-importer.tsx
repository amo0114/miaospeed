import { useState, useCallback } from 'react'
import { Upload, FileText, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { parseClashYaml, parseSubscription, type ParsedNode } from '@/lib/yaml/parser'
import { useTranslation } from 'react-i18next'

interface NodeImporterProps {
  onNodesImported: (nodes: ParsedNode[]) => void
}

export function NodeImporter({ onNodesImported }: NodeImporterProps) {
  const { t } = useTranslation()
  const [input, setInput] = useState('')
  const [nodes, setNodes] = useState<ParsedNode[]>([])
  const [error, setError] = useState<string | null>(null)

  const handleParse = useCallback(() => {
    setError(null)

    if (!input.trim()) {
      setError(t('importer.error_empty'))
      return
    }

    let parsed: ParsedNode[] = []

    // Try parsing as Clash YAML first
    if (input.includes('proxies:')) {
      parsed = parseClashYaml(input)
    }

    // If no results, try as subscription
    if (parsed.length === 0) {
      parsed = parseSubscription(input)
    }

    if (parsed.length === 0) {
      setError(t('importer.error_invalid'))
      return
    }

    setNodes(parsed)
    onNodesImported(parsed)
  }, [input, onNodesImported, t])

  const handleClear = () => {
    setInput('')
    setNodes([])
    setError(null)
    onNodesImported([])
  }

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const content = event.target?.result as string
        setInput(content)
      }
      reader.readAsText(file)
    }
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const content = event.target?.result as string
        setInput(content)
      }
      reader.readAsText(file)
    }
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="bg-secondary p-2 rounded-xl text-foreground">
            <Upload className="h-5 w-5" />
          </div>
          {t('importer.title')}
        </CardTitle>
        <CardDescription>
          {t('importer.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div
          className="relative"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFileDrop}
        >
          <Textarea
            placeholder={t('importer.placeholder')}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-[220px] font-mono text-sm rounded-2xl resize-none p-5 bg-secondary/30 border-transparent hover:bg-secondary/50 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
          />
          <div className="absolute bottom-3 right-3">
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".yaml,.yml,.txt,.conf"
                className="hidden"
                onChange={handleFileSelect}
              />
              <Button variant="secondary" size="sm" asChild className="rounded-full shadow-sm active:scale-95 transition-transform hover:bg-background">
                <span>
                  <FileText className="h-4 w-4 mr-2" />
                  {t('importer.file')}
                </span>
              </Button>
            </label>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-sm font-medium border border-destructive/20 shadow-sm animate-in slide-in-from-top-1">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Button 
            onClick={handleParse} 
            disabled={!input.trim()}
            className="flex-1 rounded-full font-medium active:scale-[0.98] transition-all shadow-sm disabled:opacity-50"
            size="lg"
          >
            {t('importer.parse')}
          </Button>
          {nodes.length > 0 && (
            <Button 
              variant="outline" 
              onClick={handleClear}
              className="rounded-full px-6 active:scale-95 transition-transform border-transparent bg-secondary/50 hover:bg-secondary shadow-sm"
              size="lg"
            >
              <X className="h-4 w-4 mr-2" />
              {t('importer.clear')}
            </Button>
          )}
        </div>

        {nodes.length > 0 && (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center gap-2 px-1">
              <div className="bg-success/20 p-1 rounded-full">
                <Check className="h-4 w-4 text-success" />
              </div>
              <span className="text-sm font-medium">
                {t('importer.imported', { count: nodes.length })}
              </span>
            </div>
            <div className="max-h-[220px] overflow-y-auto space-y-1.5 rounded-2xl bg-secondary/20 p-3 shadow-inner">
              {nodes.map((node, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2 px-3 rounded-xl bg-background shadow-sm hover:shadow-md transition-shadow"
                >
                  <span className="text-sm font-medium truncate flex-1">{node.name}</span>
                  <Badge variant="secondary" className="ml-3 rounded-md font-mono text-[10px]">
                    {node.type}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
