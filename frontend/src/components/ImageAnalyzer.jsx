import { useState, useCallback, useRef } from 'react'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_SIZE = 10 * 1024 * 1024 // 10MB

const API_URL = import.meta.env.VITE_API_URL || 'https://ai-image-analysis-v1.onrender.com'

function ResultsCard({ result, onClear, isFromHistory }) {
  if (!result) return null
  return (
    <div className="mt-6 sm:mt-8 rounded-2xl overflow-hidden shadow-lg border border-slate-200 bg-white">
      {isFromHistory && (
        <div className="px-4 sm:px-6 py-2 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
          <span className="text-sm text-slate-600">Viewing past analysis</span>
          <button
            type="button"
            onClick={onClear}
            className="text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
          >
            Clear view
          </button>
        </div>
      )}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 px-4 sm:px-6 py-3 sm:py-4">
        <h2 className="text-base sm:text-lg font-semibold text-white">Analysis Results</h2>
        {result.category && (
          <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-200 text-xs sm:text-sm font-medium">
            {result.category}
          </span>
        )}
      </div>
      <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
        {result.description && (
          <section>
            <h3 className="text-xs sm:text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Scene Description
            </h3>
            <p className="text-slate-700 leading-relaxed text-sm sm:text-base">{result.description}</p>
          </section>
        )}
        {result.objects && result.objects.length > 0 && (
          <section>
            <h3 className="text-xs sm:text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2 sm:mb-3">
              Detected Objects
            </h3>
            <ul className="space-y-2">
              {result.objects.map((obj, i) => (
                <li key={i} className="flex items-center gap-3 flex-wrap">
                  <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                  <span className="text-slate-700 text-sm sm:text-base">{obj.name}</span>
                  <span className="text-sm font-medium text-amber-600">
                    {Math.round((obj.confidence ?? 0) * 100)}%
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
        {result.text && result.text.length > 0 && (
          <section>
            <h3 className="text-xs sm:text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2 sm:mb-3">
              Text Found
            </h3>
            <ul className="space-y-2">
              {result.text.map((t, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-slate-400 mt-1 flex-shrink-0">•</span>
                  <span className="text-slate-700 text-sm sm:text-base">{t}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
        {result.dominant_colors && result.dominant_colors.length > 0 && (
          <section>
            <h3 className="text-xs sm:text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2 sm:mb-3">
              Dominant Colors
            </h3>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {result.dominant_colors.map((color, i) => (
                <div key={i} className="flex items-center gap-2" title={color}>
                  <span
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg border-2 border-slate-200 shadow-sm flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-xs sm:text-sm text-slate-600 font-mono hidden sm:inline">
                    {color}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
        {!result.description &&
          (!result.objects || result.objects.length === 0) &&
          (!result.text || result.text.length === 0) &&
          (!result.dominant_colors || result.dominant_colors.length === 0) && (
            <p className="text-slate-500 italic text-sm">No analysis data returned.</p>
          )}
      </div>
    </div>
  )
}

function ImageAnalyzer({ onAnalyzed, onUploadLoadingChange, uploadLoading = false }) {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  const validateFile = useCallback((f) => {
    if (!ACCEPTED_TYPES.includes(f.type)) {
      return 'Invalid file type. Accept: JPEG, PNG, GIF, WebP'
    }
    if (f.size > MAX_SIZE) {
      return 'File too large. Max size: 10MB'
    }
    return null
  }, [])

  const handleFile = useCallback((f) => {
    setError(null)
    setResult(null)
    const err = validateFile(f)
    if (err) {
      setError(err)
      setFile(null)
      setPreview(null)
      return
    }
    setFile(f)
    const reader = new FileReader()
    reader.onload = () => setPreview(reader.result)
    reader.readAsDataURL(f)
  }, [validateFile])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [handleFile])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleInputChange = useCallback((e) => {
    const f = e.target.files[0]
    if (f) handleFile(f)
  }, [handleFile])

  const handleClear = useCallback(() => {
    setFile(null)
    setPreview(null)
    setResult(null)
    setError(null)
    }, [])

  const handleAnalyze = useCallback(async () => {
    if (!file) return
    setIsLoading(true)
    onUploadLoadingChange?.(true)
    setError(null)
    setResult(null)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Analysis failed')
      }

      setResult(data)
      onAnalyzed?.()
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setIsLoading(false)
      onUploadLoadingChange?.(false)
    }
  }, [file, onAnalyzed, onUploadLoadingChange])

  const displayResult = result

  return (
    <div className="w-full max-w-2xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2 tracking-tight">
        AI Image Analysis
      </h1>
      <p className="text-slate-500 mb-6 sm:mb-8 text-sm sm:text-base">
        Upload an image to get a description, detected objects, extracted text, and dominant colors.
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        onChange={handleInputChange}
        className="hidden"
      />

      {!preview ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`
            relative border-2 border-dashed rounded-2xl p-6 sm:p-8 md:p-10 transition-all duration-300 cursor-pointer
            select-none touch-manipulation
            ${isDragging
              ? 'border-amber-400 bg-amber-50/60 scale-[1.02] shadow-lg'
              : 'border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50/50'
            }
          `}
        >
          <div className="text-center text-slate-500">
            <svg
              className="w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-3 sm:mb-4 text-slate-300 transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="font-medium text-slate-600 text-base sm:text-lg">Drop your image here</p>
            <p className="text-sm mt-1">or click to browse</p>
            <p className="text-xs mt-3 text-slate-400">JPEG, PNG, GIF, WebP • Max 10MB</p>
          </div>
        </div>
      ) : (
        <div className="border-2 border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 bg-white shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center">
            <div className="flex-shrink-0">
              <img
                src={preview}
                alt="Preview"
                className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-xl border-2 border-slate-200 shadow-sm"
              />
            </div>
            <div className="flex-1 text-center sm:text-left min-w-0">
              <p className="font-medium text-slate-700 truncate text-sm sm:text-base">{file?.name}</p>
              <p className="text-xs sm:text-sm text-slate-500">{(file?.size / 1024).toFixed(1)} KB</p>
              <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={isLoading || uploadLoading}
                  className="px-4 py-2 rounded-lg font-medium bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow active:scale-[0.98] inline-flex items-center gap-2"
                >
                  {(isLoading || uploadLoading) ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Analyzing…
                    </>
                  ) : (
                    'Analyze Image'
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={isLoading || uploadLoading}
                  className="px-4 py-2 rounded-lg font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-60 transition-colors"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading || uploadLoading}
                  className="px-4 py-2 rounded-lg font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-60 transition-colors"
                >
                  Change image
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {(isLoading || uploadLoading) && (
        <div className="mt-6 sm:mt-8 p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm animate-fade-in">
          <div className="flex items-center gap-4">
            <div className="relative w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
              <div className="absolute inset-0 rounded-full border-2 border-amber-200" />
              <div className="absolute inset-0 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-slate-700 text-sm sm:text-base">Analyzing your image…</p>
              <p className="text-xs sm:text-sm text-slate-500 animate-pulse">Detecting objects, text, and colors</p>
            </div>
          </div>
        </div>
      )}

      {error && !isLoading && !uploadLoading && (
        <div className="mt-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm sm:text-base">
          {error}
        </div>
      )}

      {displayResult && !isLoading && !uploadLoading && (
        <ResultsCard
          result={displayResult}
          onClear={() => setResult(null)}
          isFromHistory={false}
        />
      )}
    </div>
  )
}

export default ImageAnalyzer
