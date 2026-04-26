'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { Upload, FileImage, FileText, CheckCircle2, Loader2, ArrowRight } from 'lucide-react'
import { Button } from '@/demo-site/components/ui/button'
import { Progress } from '@/demo-site/components/ui/progress'
import { cn } from '@/demo-site/lib/utils'

const ACCEPTED_TYPES = ['application/pdf', 'image/png', 'image/jpeg']
const MAX_FILE_SIZE = 10 * 1024 * 1024

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error'

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function HomeInspoUpload() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<UploadStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [fileSize, setFileSize] = useState<string | null>(null)

  const startUpload = async (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setStatus('error')
      setError('Please upload a PDF, PNG, or JPG file.')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setStatus('error')
      setError('File is too large. Max size is 10MB.')
      return
    }

    setStatus('uploading')
    setError(null)
    setFileName(file.name)
    setFileSize(formatFileSize(file.size))
    setProgress(0)

    for (let next = 20; next <= 100; next += 20) {
      await new Promise((resolve) => setTimeout(resolve, 120))
      setProgress(next)
    }

    setStatus('success')
  }

  return (
    <section className="py-16 bg-muted/30" data-testid="inspo-upload-section">
      <div className="container mx-auto px-4">
        <div className="rounded-2xl border bg-background p-6 lg:p-8">
          <div className="flex flex-col gap-2 mb-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Style Lab</p>
            <h2 className="text-2xl font-bold">Upload Outfit Inspiration</h2>
            <p className="text-muted-foreground max-w-2xl">
              Share a JPG, PNG, or PDF of your inspo and we will keep it with your shopping journey so you can find matching pieces faster.
            </p>
          </div>

          <div
            role="button"
            tabIndex={0}
            className={cn(
              'rounded-xl border-2 border-dashed p-6 text-center transition-colors cursor-pointer',
              status === 'success' ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-border hover:border-primary/40'
            )}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') inputRef.current?.click()
            }}
            data-testid="home-inspo-upload-dropzone"
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              className="hidden"
              data-testid="home-inspo-upload-input"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) void startUpload(file)
                event.target.value = ''
              }}
            />

            <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="font-medium mb-1">Drop file here or click to upload</p>
            <p className="text-sm text-muted-foreground">PDF, PNG, JPG up to 10MB</p>
          </div>

          <div className="mt-4 min-h-14">
            {status === 'uploading' && (
              <div data-testid="home-inspo-upload-progress">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading {fileName}
                  </span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} />
              </div>
            )}

            {status === 'success' && (
              <div
                className="flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm"
                data-testid="home-inspo-upload-success"
              >
                {fileName?.toLowerCase().endsWith('.pdf') ? (
                  <FileText className="h-4 w-4 text-emerald-600" />
                ) : (
                  <FileImage className="h-4 w-4 text-emerald-600" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{fileName}</p>
                  <p className="text-muted-foreground">{fileSize}</p>
                </div>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
            )}

            {status === 'error' && (
              <p className="text-sm text-destructive" data-testid="home-inspo-upload-error">
                {error}
              </p>
            )}
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Button asChild variant="outline" data-testid="home-inspo-open-full-upload">
              <Link href="/demo-store/demo-upload">
                Open Full Upload Studio
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
