/**
 * Step 1: 운송 일시 선택
 * ISO-14083 표준에 따른 운송 시점 기록
 */
import { useCalculationStore } from '@/stores/calculationStore'
import { Calendar, Info, Clock } from 'lucide-react'
import { format, addDays, subDays, isToday, isTomorrow, isYesterday } from 'date-fns'
import { ko } from 'date-fns/locale'

const QUICK_SELECT_OPTIONS = [
  { label: '어제', getDays: () => -1 },
  { label: '오늘', getDays: () => 0 },
  { label: '내일', getDays: () => 1 },
  { label: '3일 후', getDays: () => 3 },
  { label: '1주일 후', getDays: () => 7 },
]

export function Step1DatePicker() {
  const { formData, updateFormData } = useCalculationStore()

  const selectedDate = formData.transportDate
    ? new Date(formData.transportDate)
    : new Date()

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFormData({ transportDate: e.target.value })
  }

  const handleQuickSelect = (days: number) => {
    const date = days === 0 ? new Date() : days > 0 ? addDays(new Date(), days) : subDays(new Date(), Math.abs(days))
    updateFormData({ transportDate: format(date, 'yyyy-MM-dd') })
  }

  const getDateLabel = (date: Date): string => {
    if (isToday(date)) return '오늘'
    if (isTomorrow(date)) return '내일'
    if (isYesterday(date)) return '어제'
    return format(date, 'EEEE', { locale: ko })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* 설명 카드 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900">ISO-14083 운송 시점 기록</h3>
            <p className="text-sm text-blue-700 mt-1">
              탄소배출량은 운송 시점의 배출 계수를 기준으로 계산됩니다.
              실제 운송이 이루어지는 날짜를 선택해주세요.
            </p>
          </div>
        </div>
      </div>

      {/* 날짜 선택 */}
      <div className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4" />
            운송 예정일
          </span>
          <input
            type="date"
            value={formData.transportDate}
            onChange={handleDateChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg"
          />
        </label>

        {/* 선택된 날짜 표시 */}
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
          <Clock className="w-5 h-5 text-gray-500" />
          <div>
            <p className="font-medium text-gray-900">
              {format(selectedDate, 'yyyy년 M월 d일', { locale: ko })}
            </p>
            <p className="text-sm text-gray-500">
              {getDateLabel(selectedDate)}
            </p>
          </div>
        </div>
      </div>

      {/* 빠른 선택 */}
      <div className="space-y-3">
        <span className="text-sm font-medium text-gray-700">빠른 선택</span>
        <div className="flex flex-wrap gap-2">
          {QUICK_SELECT_OPTIONS.map((option) => {
            const days = option.getDays()
            const targetDate = format(
              days === 0 ? new Date() : days > 0 ? addDays(new Date(), days) : subDays(new Date(), Math.abs(days)),
              'yyyy-MM-dd'
            )
            const isSelected = formData.transportDate === targetDate

            return (
              <button
                key={option.label}
                onClick={() => handleQuickSelect(days)}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                  isSelected
                    ? 'bg-green-600 border-green-600 text-white'
                    : 'bg-white border-gray-300 text-gray-700 hover:border-green-500 hover:text-green-600'
                }`}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* API Request 미리보기 */}
      <div className="bg-gray-900 rounded-lg p-4 text-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-400 text-xs font-mono">API Request Preview</span>
          <span className="text-green-400 text-xs">transportDate</span>
        </div>
        <pre className="text-green-300 font-mono">
{`{
  "transportDate": "${formData.transportDate || 'YYYY-MM-DD'}"
}`}
        </pre>
      </div>
    </div>
  )
}
