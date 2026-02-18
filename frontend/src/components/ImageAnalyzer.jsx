import { useState, useCallback, useRef } from 'react';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function ImageAnalyzer({ onAnalyzed }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const validateFile = useCallback((f) => {
    if (!ACCEPTED_TYPES.includes(f.type)) {
      return `Invalid file type. Accept: JPEG, PNG, GIF, WebP`;
    }
    if (f.size > MAX_SIZE) {
      return `File too large. Max size: 10MB`;
    }
    return null;
  }, []);

  const handleFile = useCallback((f) => {
    setError(null);
    setResult(null);
    const err = validateFile(f);
    if (err) {
      setError(err);
      setFile(null);
      setPreview(null);
      return;
    }
    setFile(f);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(f);
  }, [validateFile]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e) => {
    const f = e.target.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const handleClear = useCallback(() => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!file) return;
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const reader = new FileReader();
      const base64 = await new Promise((resolve, reject) => {
        reader.onload = () => {
          const dataUrl = reader.result;
          const base64 = dataUrl.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const mimeType = file.type || 'image/jpeg';
      const res = await fetch(`${API_URL}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ image: base64, mime_type: mimeType }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message || 'Analysis failed');
      }

      setResult(data);
      onAnalyzed?.();
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  }, [file]);

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-800 mb-2 tracking-tight">
        AI Image Analysis
      </h1>
      <p className="text-slate-500 mb-8">
        Upload an image to get a description, detected objects, and extracted text.
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Upload zone - only show drop zone when no preview */}
      {!preview ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`
            relative border-2 border-dashed rounded-2xl p-8 transition-all duration-200 cursor-pointer
            ${isDragging ? 'border-amber-400 bg-amber-50/50 scale-[1.01]' : 'border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50/50'}
          `}
        >
          <div className="text-center text-slate-500">
            <svg className="w-14 h-14 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="font-medium text-slate-600">Drop your image here</p>
            <p className="text-sm mt-1">or click to browse</p>
            <p className="text-xs mt-3 text-slate-400">JPEG, PNG, GIF, WebP • Max 10MB</p>
          </div>
        </div>
      ) : (
        /* Preview area - no file input overlay, buttons work correctly */
        <div className="border-2 border-slate-200 rounded-2xl p-8 bg-white">
          <div className="flex flex-col sm:flex-row gap-6 items-center">
            <div className="flex-shrink-0">
              <img
                src={preview}
                alt="Preview"
                className="w-32 h-32 object-cover rounded-xl border-2 border-slate-200 shadow-sm"
              />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <p className="font-medium text-slate-700 truncate">{file?.name}</p>
              <p className="text-sm text-slate-500">{(file?.size / 1024).toFixed(1)} KB</p>
              <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={isLoading}
                  className="px-4 py-2 rounded-lg font-medium bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  {isLoading ? 'Analyzing…' : 'Analyze Image'}
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={isLoading}
                  className="px-4 py-2 rounded-lg font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-60 transition-colors"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className="px-4 py-2 rounded-lg font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-60 transition-colors"
                >
                  Change image
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading animation */}
      {isLoading && (
        <div className="mt-8 p-6 rounded-2xl bg-slate-50 border border-slate-200 transition-opacity duration-300">
          <div className="flex items-center gap-4">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 rounded-full border-2 border-amber-200" />
              <div className="absolute inset-0 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
            </div>
            <div>
              <p className="font-medium text-slate-700">Analyzing your image…</p>
              <p className="text-sm text-slate-500 animate-pulse">Detecting objects and extracting text</p>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && !isLoading && (
        <div className="mt-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
          {error}
        </div>
      )}

      {/* Results card */}
      {result && !isLoading && (
        <div className="mt-8 rounded-2xl overflow-hidden shadow-lg border border-slate-200 bg-white transition-all duration-500">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 px-6 py-4">
            <h2 className="text-lg font-semibold text-white">Analysis Results</h2>
            <p className="text-sm text-slate-300">Scene description, objects, and text</p>
          </div>
          <div className="p-6 space-y-6">
            {result.description && (
              <section>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Description</h3>
                <p className="text-slate-700 leading-relaxed">{result.description}</p>
              </section>
            )}
            {result.objects && result.objects.length > 0 && (
              <section>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Detected Objects</h3>
                <ul className="space-y-2">
                  {result.objects.map((obj, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                      <span className="text-slate-700">{obj.name}</span>
                      <span className="ml-auto text-sm font-medium text-amber-600">
                        {Math.round((obj.confidence ?? 0) * 100)}%
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {result.text && result.text.length > 0 && (
              <section>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Text Found</h3>
                <ul className="space-y-2">
                  {result.text.map((t, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-slate-400 mt-1">•</span>
                      <span className="text-slate-700">{t}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {(!result.description && (!result.objects || result.objects.length === 0) && (!result.text || result.text.length === 0)) && (
              <p className="text-slate-500 italic">No analysis data returned.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ImageAnalyzer;
