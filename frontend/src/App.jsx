import { useState, useCallback } from 'react'
import ImageAnalyzer from './components/ImageAnalyzer'
import History from './components/History'

function App() {
  const [tab, setTab] = useState('analyze')
  const [historyRefresh, setHistoryRefresh] = useState(0)

  const handleAnalyzed = useCallback(() => {
    setHistoryRefresh((c) => c + 1)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <nav className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 flex gap-1">
          <button
            type="button"
            onClick={() => setTab('analyze')}
            className={`px-4 py-3 font-medium text-sm transition-colors ${
              tab === 'analyze'
                ? 'text-amber-600 border-b-2 border-amber-500'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Analyze
          </button>
          <button
            type="button"
            onClick={() => setTab('history')}
            className={`px-4 py-3 font-medium text-sm transition-colors ${
              tab === 'history'
                ? 'text-amber-600 border-b-2 border-amber-500'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            History
          </button>
        </div>
      </nav>

      <main className="flex items-start justify-center pt-8 pb-16">
        {tab === 'analyze' && <ImageAnalyzer onAnalyzed={handleAnalyzed} />}
        {tab === 'history' && <History refreshTrigger={historyRefresh} />}
      </main>
    </div>
  )
}

export default App
