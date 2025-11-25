import { useState } from 'react'
import { AISTestPage } from './pages/AISTestPage'
import { CalculationWizard } from './components/calculation'
import { Ship, Calculator } from 'lucide-react'
import { cn } from '@/lib/utils'

type AppMode = 'glec' | 'ais'

function App() {
  const [mode, setMode] = useState<AppMode>('glec')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 앱 모드 전환 탭 (상단) */}
      <div className="fixed top-0 left-0 right-0 z-[100] bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-1 h-12">
            <button
              onClick={() => setMode('glec')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-colors -mb-px',
                mode === 'glec'
                  ? 'bg-gray-50 text-green-700 border border-gray-200 border-b-gray-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              )}
            >
              <Calculator className="w-4 h-4" />
              GLEC API Demo
            </button>
            <button
              onClick={() => setMode('ais')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-colors -mb-px',
                mode === 'ais'
                  ? 'bg-gray-50 text-blue-700 border border-gray-200 border-b-gray-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              )}
            >
              <Ship className="w-4 h-4" />
              AIS Tracking
            </button>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 (탭 높이만큼 상단 패딩) */}
      <div className="pt-12">
        {mode === 'glec' ? <CalculationWizard /> : <AISTestPage />}
      </div>
    </div>
  )
}

export default App
