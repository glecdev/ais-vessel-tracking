/**
 * GLEC API 계산 마법사 - 메인 컨테이너
 * 6단계 워크플로우로 탄소배출량 계산을 진행
 */
import { useState } from 'react'
import { useCalculationStore } from '@/stores/calculationStore'
import { Step1DatePicker } from './Step1DatePicker'
import { Step2ShipperSelector } from './Step2ShipperSelector'
import { Step3TransportMode } from './Step3TransportMode'
import { Step4CargoInfo } from './Step4CargoInfo'
import { Step5RouteInfo } from './Step5RouteInfo'
import { Step6Summary } from './Step6Summary'
import { DeveloperModePanel } from './DeveloperModePanel'
import {
  Calendar,
  Building2,
  Truck,
  Package,
  Map,
  Calculator,
  Code,
  Palette,
  ChevronLeft,
  ChevronRight,
  RotateCcw
} from 'lucide-react'
import { cn } from '@/lib/utils'

type Mode = 'design' | 'developer'

interface StepConfig {
  id: number
  title: string
  description: string
  icon: React.ReactNode
}

const STEPS: StepConfig[] = [
  { id: 1, title: '운송 일시', description: '운송이 이루어지는 날짜 선택', icon: <Calendar className="w-5 h-5" /> },
  { id: 2, title: '화주사', description: '화물 소유 기업 선택', icon: <Building2 className="w-5 h-5" /> },
  { id: 3, title: '운송 수단', description: '운송 방식 및 경로 설정', icon: <Truck className="w-5 h-5" /> },
  { id: 4, title: '화물 정보', description: '화물 종류 및 중량 입력', icon: <Package className="w-5 h-5" /> },
  { id: 5, title: '경로 정보', description: '출발지/도착지 설정', icon: <Map className="w-5 h-5" /> },
  { id: 6, title: '계산 결과', description: 'ISO-14083 기준 배출량 확인', icon: <Calculator className="w-5 h-5" /> },
]

export function CalculationWizard() {
  const [currentStep, setCurrentStep] = useState(1)
  const [mode, setMode] = useState<Mode>('design')

  const { formData, resetForm, isCalculating } = useCalculationStore()

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 1:
        return !!formData.transportDate
      case 2:
        return !!formData.shipper
      case 3:
        return formData.routes.length > 0
      case 4:
        return !!formData.cargo
      case 5:
        return !!formData.origin && !!formData.destination
      default:
        return true
    }
  }

  const handleNext = () => {
    if (currentStep < 6 && canProceed()) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleReset = () => {
    resetForm()
    setCurrentStep(1)
  }

  const handleStepClick = (stepId: number) => {
    // 현재 단계 이전까지만 이동 가능
    if (stepId <= currentStep) {
      setCurrentStep(stepId)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <Step1DatePicker />
      case 2:
        return <Step2ShipperSelector />
      case 3:
        return <Step3TransportMode />
      case 4:
        return <Step4CargoInfo />
      case 5:
        return <Step5RouteInfo />
      case 6:
        return <Step6Summary />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <Calculator className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">GLEC LCS API Demo</h1>
                <p className="text-xs text-gray-500">ISO-14083 탄소배출량 계산</p>
              </div>
            </div>

            {/* 모드 전환 토글 */}
            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setMode('design')}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                  mode === 'design'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                <Palette className="w-4 h-4" />
                Design Mode
              </button>
              <button
                onClick={() => setMode('developer')}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                  mode === 'developer'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                <Code className="w-4 h-4" />
                Developer Mode
              </button>
            </div>

            {/* 리셋 버튼 */}
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              초기화
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {mode === 'design' ? (
          <>
            {/* 단계 표시기 */}
            <nav className="mb-8">
              <ol className="flex items-center justify-between">
                {STEPS.map((step, index) => (
                  <li key={step.id} className="flex-1">
                    <button
                      onClick={() => handleStepClick(step.id)}
                      disabled={step.id > currentStep}
                      className={cn(
                        'w-full group flex flex-col items-center',
                        step.id <= currentStep ? 'cursor-pointer' : 'cursor-not-allowed'
                      )}
                    >
                      {/* 아이콘 */}
                      <div className={cn(
                        'flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all',
                        step.id < currentStep
                          ? 'bg-green-600 border-green-600 text-white'
                          : step.id === currentStep
                          ? 'bg-green-50 border-green-600 text-green-600'
                          : 'bg-gray-100 border-gray-300 text-gray-400'
                      )}>
                        {step.icon}
                      </div>

                      {/* 텍스트 */}
                      <div className="mt-2 text-center">
                        <span className={cn(
                          'text-sm font-medium block',
                          step.id <= currentStep ? 'text-gray-900' : 'text-gray-400'
                        )}>
                          {step.title}
                        </span>
                        <span className="text-xs text-gray-500 hidden sm:block">
                          {step.description}
                        </span>
                      </div>
                    </button>

                    {/* 연결선 */}
                    {index < STEPS.length - 1 && (
                      <div className={cn(
                        'hidden sm:block h-0.5 w-full mt-6 -translate-y-6',
                        step.id < currentStep ? 'bg-green-600' : 'bg-gray-200'
                      )} />
                    )}
                  </li>
                ))}
              </ol>
            </nav>

            {/* 메인 콘텐츠 영역 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                    {STEPS[currentStep - 1].icon}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Step {currentStep}: {STEPS[currentStep - 1].title}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {STEPS[currentStep - 1].description}
                    </p>
                  </div>
                </div>
              </div>

              {/* 단계별 콘텐츠 */}
              <div className="p-6 min-h-[400px]">
                {renderStepContent()}
              </div>

              {/* 네비게이션 버튼 */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl flex items-center justify-between">
                <button
                  onClick={handlePrev}
                  disabled={currentStep === 1}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
                    currentStep === 1
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-700 hover:bg-gray-200'
                  )}
                >
                  <ChevronLeft className="w-5 h-5" />
                  이전
                </button>

                <div className="flex items-center gap-2 text-sm text-gray-500">
                  {currentStep} / {STEPS.length}
                </div>

                {currentStep < 6 ? (
                  <button
                    onClick={handleNext}
                    disabled={!canProceed()}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
                      canProceed()
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    )}
                  >
                    다음
                    <ChevronRight className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    disabled={isCalculating}
                    className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 transition-colors"
                  >
                    {isCalculating ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        계산 중...
                      </>
                    ) : (
                      <>
                        <Calculator className="w-5 h-5" />
                        계산 완료
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </>
        ) : (
          /* Developer Mode */
          <DeveloperModePanel />
        )}
      </div>
    </div>
  )
}
