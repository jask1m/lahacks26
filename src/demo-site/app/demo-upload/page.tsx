'use client'

import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import { 
  Upload, 
  File, 
  FileImage, 
  FileText, 
  X, 
  CheckCircle, 
  AlertCircle, 
  RotateCcw,
  Download,
  Loader2
} from 'lucide-react'
import { Button } from '@/demo-site/components/ui/button'
import { Progress } from '@/demo-site/components/ui/progress'
import { Alert, AlertDescription } from '@/demo-site/components/ui/alert'
import { cn } from '@/demo-site/lib/utils'

type FileStatus = 'queued' | 'uploading' | 'processing' | 'success' | 'failed'

interface UploadedFile {
  id: string
  file: File
  status: FileStatus
  progress: number
  error?: string
  previewUrl?: string
  downloadUrl?: string
}

const ACCEPTED_TYPES = {
  'application/pdf': 'PDF',
  'image/png': 'PNG',
  'image/jpeg': 'JPG',
  'text/plain': 'TXT',
  'text/csv': 'CSV',
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export default function DemoUploadPage() {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const hasValidSuccessfulUpload = files.some(f => f.status === 'success')
  const isUploading = files.some(f => f.status === 'uploading' || f.status === 'processing')

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return FileImage
    if (type === 'application/pdf') return File
    return FileText
  }

  const validateFile = (file: File): string | null => {
    if (!Object.keys(ACCEPTED_TYPES).includes(file.type)) {
      return 'File type not supported'
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File too large (max 10MB)'
    }
    return null
  }

  const simulateUpload = async (uploadFile: UploadedFile) => {
    const updateFile = (updates: Partial<UploadedFile>) => {
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { ...f, ...updates } : f
      ))
    }

    // Start uploading
    updateFile({ status: 'uploading', progress: 0 })

    // Simulate progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 100))
      updateFile({ progress: i })
    }

    // Processing phase
    updateFile({ status: 'processing' })
    await new Promise(resolve => setTimeout(resolve, 500))

    // 90% success rate for QA testing
    if (Math.random() > 0.1) {
      updateFile({ 
        status: 'success', 
        downloadUrl: '#download-' + uploadFile.id,
        progress: 100 
      })
    } else {
      updateFile({ 
        status: 'failed', 
        error: 'Upload failed. Please try again.',
        progress: 0 
      })
    }
  }

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const filesToAdd: UploadedFile[] = []

    Array.from(newFiles).forEach(file => {
      const error = validateFile(file)
      const id = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      const uploadFile: UploadedFile = {
        id,
        file,
        status: error ? 'failed' : 'queued',
        progress: 0,
        error: error || undefined,
        previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      }

      filesToAdd.push(uploadFile)
    })

    setFiles(prev => [...prev, ...filesToAdd])

    // Start uploading valid files
    filesToAdd.forEach(file => {
      if (file.status === 'queued') {
        simulateUpload(file)
      }
    })
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    if (e.dataTransfer.files?.length) {
      addFiles(e.dataTransfer.files)
    }
  }, [addFiles])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      addFiles(e.target.files)
    }
    // Reset input to allow selecting the same file again
    e.target.value = ''
  }, [addFiles])

  const removeFile = (fileId: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === fileId)
      if (file?.previewUrl) {
        URL.revokeObjectURL(file.previewUrl)
      }
      return prev.filter(f => f.id !== fileId)
    })
  }

  const retryFile = (fileId: string) => {
    const file = files.find(f => f.id === fileId)
    if (file) {
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, status: 'queued', error: undefined, progress: 0 } : f
      ))
      simulateUpload({ ...file, status: 'queued', error: undefined, progress: 0 })
    }
  }

  const handleSubmit = async () => {
    setSubmitStatus('submitting')
    await new Promise(resolve => setTimeout(resolve, 1500))
    setSubmitStatus('success')
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" data-testid="upload-title">
          File Upload Demo
        </h1>
        <p className="text-muted-foreground">
          Test file upload functionality with drag and drop, validation, progress tracking, and more.
        </p>
      </div>

      {/* Upload Instructions */}
      <div className="mb-6 p-4 border rounded-lg bg-muted/30">
        <h3 className="font-medium mb-2">Accepted file types:</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>Images: PNG, JPG (max 10MB)</li>
          <li>Documents: PDF, TXT, CSV (max 10MB)</li>
        </ul>
      </div>

      {/* Drop Zone */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer",
          isDragging 
            ? "border-primary bg-primary/5" 
            : "border-muted-foreground/25 hover:border-primary/50"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        data-testid="upload-dropzone"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            fileInputRef.current?.click()
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={Object.keys(ACCEPTED_TYPES).join(',')}
          onChange={handleFileSelect}
          className="hidden"
          data-testid="upload-input"
        />
        
        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-lg font-medium mb-1">
          {isDragging ? 'Drop files here' : 'Drag and drop files here'}
        </p>
        <p className="text-muted-foreground mb-4">or</p>
        <Button variant="outline" type="button" data-testid="choose-file-btn">
          Choose Files
        </Button>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-8 space-y-4" data-testid="file-list">
          <h3 className="font-semibold">Uploaded Files ({files.length})</h3>
          
          <div className="space-y-3">
            {files.map((uploadFile) => {
              const FileIcon = getFileIcon(uploadFile.file.type)
              const isImage = uploadFile.file.type.startsWith('image/')
              
              return (
                <div 
                  key={uploadFile.id}
                  className="flex items-start gap-4 p-4 border rounded-lg"
                  data-testid="file-item"
                  data-file-status={uploadFile.status}
                >
                  {/* Preview/Icon */}
                  <div className="w-12 h-12 flex-shrink-0 rounded bg-muted flex items-center justify-center overflow-hidden">
                    {isImage && uploadFile.previewUrl ? (
                      <Image
                        src={uploadFile.previewUrl}
                        alt={uploadFile.file.name}
                        width={48}
                        height={48}
                        className="object-cover w-full h-full"
                        data-testid="file-thumbnail"
                      />
                    ) : (
                      <FileIcon className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate" data-testid="file-name">
                        {uploadFile.file.name}
                      </p>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {formatFileSize(uploadFile.file.size)}
                      </span>
                    </div>

                    {/* Progress/Status */}
                    {uploadFile.status === 'uploading' && (
                      <div className="mt-2" data-testid="upload-progress">
                        <Progress value={uploadFile.progress} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">
                          Uploading... {uploadFile.progress}%
                        </p>
                      </div>
                    )}

                    {uploadFile.status === 'processing' && (
                      <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing...
                      </div>
                    )}

                    {uploadFile.status === 'success' && (
                      <div 
                        className="flex items-center gap-2 mt-2 text-sm text-green-600"
                        data-testid="upload-success"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Upload completed successfully
                      </div>
                    )}

                    {uploadFile.status === 'failed' && (
                      <div 
                        className="flex items-center gap-2 mt-2 text-sm text-destructive"
                        data-testid="upload-error"
                      >
                        <AlertCircle className="h-4 w-4" />
                        {uploadFile.error}
                      </div>
                    )}

                    {uploadFile.status === 'queued' && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Waiting to upload...
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {uploadFile.status === 'success' && uploadFile.downloadUrl && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        data-testid="file-download"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {uploadFile.status === 'failed' && !uploadFile.error?.includes('not supported') && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => retryFile(uploadFile.id)}
                        data-testid="file-retry"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => removeFile(uploadFile.id)}
                      data-testid="file-remove"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Submit Section */}
      <div className="mt-8 pt-8 border-t">
        {submitStatus === 'success' ? (
          <Alert className="border-green-200 bg-green-50" data-testid="submit-success">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              All files submitted successfully!
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              {!hasValidSuccessfulUpload 
                ? 'Upload at least one file to submit'
                : `${files.filter(f => f.status === 'success').length} file(s) ready to submit`
              }
            </p>
            
            <Button
              size="lg"
              className="w-full"
              disabled={!hasValidSuccessfulUpload || isUploading || submitStatus === 'submitting'}
              onClick={handleSubmit}
              data-testid="submit-after-upload"
            >
              {submitStatus === 'submitting' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Files'
              )}
            </Button>
          </>
        )}
      </div>

      {/* QA Testing Info */}
      <div className="mt-12 p-4 border rounded-lg bg-yellow-50 border-yellow-200" data-testid="qa-info">
        <h3 className="font-medium text-yellow-800 mb-2">QA Testing Information</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>Test IDs are provided on all interactive elements</li>
          <li>File uploads have a 90% success rate for testing retry functionality</li>
          <li>Invalid file types and oversized files will fail validation</li>
          <li>Upload progress is simulated with deterministic timing</li>
          <li>Submit button is disabled until at least one successful upload</li>
        </ul>
      </div>
    </div>
  )
}
