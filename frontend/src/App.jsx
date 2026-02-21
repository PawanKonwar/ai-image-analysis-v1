import { useState, useEffect } from 'react'
import ImageAnalyzer from './components/ImageAnalyzer'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

function getCategoryColor(category) {
  const c = (category || '').toLowerCase()
  const map = {
    nature: 'bg-green-100 text-green-800',
    product: 'bg-blue-100 text-blue-800',
    architecture: 'bg-purple-100 text-purple-800',
    animal: 'bg-orange-100 text-orange-800',
    portrait: 'bg-pink-100 text-pink-800',
    document: 'bg-slate-100 text-slate-800',
    landscape: 'bg-emerald-100 text-emerald-800',
    food: 'bg-amber-100 text-amber-800',
  }
  return map[c] || 'bg-slate-100 text-slate-700'
}

function HistoryCard({ item, onDelete, formatDate, getCategoryColor }) {
  const [imageError, setImageError] = useState(false)

  return (
    <div className="relative overflow-hidden rounded-xl bg-white border border-slate-200 shadow-sm">
      <div className="relative h-40 bg-slate-100">
        {item.image_url && !imageError ? (
          <img
            src={item.image_url}
            alt=""
            className="w-full h-40 object-cover rounded-t-lg"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-40 flex items-center justify-center rounded-t-lg bg-slate-200 text-slate-500 text-sm">
            Image unavailable
          </div>
        )}
        <button
          type="button"
          onClick={() => onDelete(item.id)}
          className="absolute top-2 right-2 p-1.5 rounded-md bg-white/80 backdrop-blur-sm text-slate-500 hover:text-red-500 hover:bg-white/90 transition-colors"
          aria-label="Delete"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
      <div className="p-4">
        {item.category && (
          <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-medium mb-2 ${getCategoryColor(item.category)}`}>
            {item.category}
          </span>
        )}
        <p className="text-slate-700 text-sm line-clamp-2 mb-2">
          {item.description || 'No description'}
        </p>
        <p className="text-slate-400 text-xs">{formatDate(item.created_at)}</p>
      </div>
    </div>
  )
}

function formatDate(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function App() {
  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

  useEffect(() => {
    async function fetchHistory() {
      setHistoryLoading(true)
      try {
        const res = await fetch(`${API_URL}/api/history`)
        if (!res.ok) throw new Error('Failed to fetch history')
        const data = await res.json()
        setHistory(data)
      } catch (err) {
        console.error(err)
        setHistory([])
      } finally {
        setHistoryLoading(false)
      }
    }
    fetchHistory()
  }, [])

  const handleAnalyzed = () => {
    fetch(`${API_URL}/api/history`)
      .then((res) => res.ok ? res.json() : [])
      .then((data) => {
        setHistory(data)
        setToast('Analysis successful')
      })
      .catch(() => {})
  }

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/history/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setHistory((prev) => prev.filter((item) => item.id !== id))
        setToast('Image deleted')
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <main className="flex flex-col items-center pt-6 sm:pt-8 pb-12 sm:pb-16 px-4">
        <ImageAnalyzer
          onAnalyzed={handleAnalyzed}
          onUploadLoadingChange={setUploadLoading}
          uploadLoading={uploadLoading}
        />
        <section className="w-full max-w-6xl mt-10">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Analysis History</h2>
          {historyLoading ? (
            <p className="text-slate-500 text-sm">Loading history…</p>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-slate-600 font-medium">No history yet</p>
              <p className="text-slate-400 text-sm mt-1">Upload an image to start your analysis.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {history.map((item) => (
                <HistoryCard
                  key={item.id}
                  item={item}
                  onDelete={handleDelete}
                  formatDate={formatDate}
                  getCategoryColor={getCategoryColor}
                />
              ))}
            </div>
          )}
        </section>
      </main>
      {toast && (
        <div className="fixed bottom-6 right-6 px-4 py-2 rounded-lg bg-slate-800 text-white text-sm font-medium shadow-lg animate-fade-in z-50">
          {toast}
        </div>
      )}
    </div>
  )
}

export default App
