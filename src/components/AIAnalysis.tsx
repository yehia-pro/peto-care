import { useState } from 'react'
import { Brain, AlertCircle, AlertTriangle, CheckCircle, Clock, ArrowRight } from 'lucide-react'
import { geminiService } from '@/services/geminiService'
import { useLanguageStore } from '@/stores/languageStore'
import type { AIAnalysis, PetCondition } from '@/services/geminiService'

interface AIAnalysisProps {
  condition: PetCondition
  onAnalysisComplete: (analysis: AIAnalysis) => void
}

export default function AIAnalysis({ condition, onAnalysisComplete }: AIAnalysisProps) {
  const { t } = useLanguageStore()
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleAnalyze = async () => {
    if (!geminiService.isAvailable()) {
      setError('خدمة التحليل الذكي غير متوفرة حالياً. يرجى التحقق من إعدادات API.')
      return
    }

    setIsAnalyzing(true)
    setError(null)

    try {
      const result = await geminiService.analyzePetCondition(condition)
      setAnalysis(result)
      onAnalysisComplete(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل التحليل. يرجى المحاولة مرة أخرى.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-success-600 bg-success-100'
      case 'medium': return 'text-accent-600 bg-accent-100'
      case 'high': return 'text-secondary-600 bg-secondary-100'
      case 'emergency': return 'text-red-600 bg-red-100'
      default: return 'text-neutral-600 bg-neutral-100'
    }
  }

  const getUrgencyIcon = (level: string) => {
    switch (level) {
      case 'low': return <CheckCircle className="h-5 w-5" />
      case 'medium': return <Clock className="h-5 w-5" />
      case 'high': return <AlertCircle className="h-5 w-5" />
      case 'emergency': return <AlertCircle className="h-5 w-5" />
      default: return <Clock className="h-5 w-5" />
    }
  }

  const getUrgencyLabel = (level: string) => {
    switch (level) {
      case 'low': return 'منخفضة'
      case 'medium': return 'متوسطة'
      case 'high': return 'عالية'
      case 'emergency': return 'طارئة'
      default: return 'غير محدد'
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="bg-secondary-100 rounded-full p-3">
            <Brain className="h-6 w-6 text-secondary-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-neutral-900">تحليل الذكاء الاصطناعي</h3>
            <p className="text-sm text-neutral-600">تحليل ذكي لحالة حيوانك الأليف</p>
          </div>
        </div>
        
        {!analysis && (
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="bg-secondary-600 text-white px-6 py-2 rounded-lg hover:bg-secondary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2 space-x-reverse"
          >
            {isAnalyzing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>جاري التحليل...</span>
              </>
            ) : (
              <>
                <Brain className="h-4 w-4" />
                <span>تحليل الحالة</span>
              </>
            )}
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center space-x-2 space-x-reverse">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {analysis && (
        <div className="space-y-6">
          {/* Urgency Level */}
          <div className={`rounded-lg p-4 ${getUrgencyColor(analysis.urgencyLevel)}`}>
            <div className="flex items-center space-x-2 space-x-reverse">
              {getUrgencyIcon(analysis.urgencyLevel)}
              <span className="font-semibold">
                مستوى الإلحاح: {getUrgencyLabel(analysis.urgencyLevel)}
              </span>
            </div>
          </div>

          {/* Summary */}
          <div>
            <h4 className="font-semibold text-neutral-900 mb-2">ملخص الحالة</h4>
            <p className="text-neutral-700 bg-neutral-50 rounded-lg p-4">{analysis.summary}</p>
          </div>

          {/* Possible Conditions */}
          <div>
            <h4 className="font-semibold text-neutral-900 mb-3">الظروف المحتملة</h4>
            <div className="space-y-2">
              {analysis.possibleConditions.map((condition, index) => (
                <div key={index} className="flex items-center space-x-2 space-x-reverse bg-secondary-50 rounded-lg p-3">
                  <ArrowRight className="h-4 w-4 text-secondary-600" />
                  <span className="text-secondary-800">{condition}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div>
            <h4 className="font-semibold text-neutral-900 mb-3">التوصيات</h4>
            <div className="space-y-2">
              {analysis.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-center space-x-2 space-x-reverse bg-success-50 rounded-lg p-3">
                  <CheckCircle className="h-4 w-4 text-success-600" />
                  <span className="text-success-800">{recommendation}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Next Steps */}
          <div>
            <h4 className="font-semibold text-neutral-900 mb-3">الخطوات التالية</h4>
            <div className="space-y-2">
              {analysis.nextSteps.map((step, index) => (
                <div key={index} className="flex items-center space-x-2 space-x-reverse bg-accent-50 rounded-lg p-3">
                  <ArrowRight className="h-4 w-4 text-accent-600" />
                  <span className="text-accent-800">{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start space-x-2 space-x-reverse">
              <AlertTriangle className="h-5 w-5 text-[var(--color-vet-accent)] mt-0.5" />
              <div>
                <h5 className="font-semibold text-amber-900 mb-1">تحذير هام</h5>
                <p className="text-amber-800 text-sm">{analysis.warning}</p>
              </div>
            </div>
          </div>

          {/* Re-analyze Button */}
          <div className="flex justify-center">
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="bg-secondary-600 text-white px-6 py-2 rounded-lg hover:bg-secondary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2 space-x-reverse"
            >
              {isAnalyzing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>جاري إعادة التحليل...</span>
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4" />
                  <span>إعادة التحليل</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {!analysis && !isAnalyzing && !error && (
        <div className="text-center py-8">
          <div className="bg-neutral-100 rounded-full p-6 inline-block mb-4">
            <Brain className="h-12 w-12 text-neutral-400" />
          </div>
          <h4 className="text-lg font-medium text-neutral-900 mb-2">تحليل ذكي متاح</h4>
          <p className="text-neutral-600 mb-4">
            انقر على زر "تحليل الحالة" للحصول على تحليل ذكي لحالة حيوانك الأليف باستخدام أحدث تقنيات الذكاء الاصطناعي.
          </p>
          <div className="bg-secondary-50 border border-secondary-200 rounded-lg p-4">
            <p className="text-sm text-secondary-800">
              <strong>ملاحظة:</strong> هذا التحليل للإرشاد فقط ولا يغني عن استشارة طبيب بيطري مؤهل.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}