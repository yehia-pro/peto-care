import { GoogleGenerativeAI } from '@google/generative-ai'

interface PetCondition {
  petType: string
  petName: string
  age: string
  gender: string
  symptoms: string
  duration: string
  severity: string
  previousTreatment: string
  medications: string
  urgency: string
  additionalInfo: string
}

interface AIAnalysis {
  summary: string
  possibleConditions: string[]
  urgencyLevel: 'low' | 'medium' | 'high' | 'emergency'
  recommendations: string[]
  nextSteps: string[]
  warning: string
}

class GeminiService {
  private genAI: GoogleGenerativeAI | null = null
  private model: any | null = null

  constructor() {
    this.initializeAI()
  }

  private initializeAI() {
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY
      if (!apiKey) {
        console.warn('لم يتم العثور على مفتاح Gemini. سيتم تعطيل ميزات الذكاء الاصطناعي.')
        return
      }

      this.genAI = new GoogleGenerativeAI(apiKey)
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' })
    } catch (error) {
      console.error('Failed to initialize Gemini AI:', error)
    }
  }

  async analyzePetCondition(condition: PetCondition): Promise<AIAnalysis> {
    if (!this.model) {
      return {
        summary: 'خدمة التحليل الذكي غير مفعلة. يرجى مراجعة الطبيب البيطري.',
        possibleConditions: ['فحص مهني مطلوب'],
        urgencyLevel: 'medium',
        recommendations: [
          'راقب الحالة عن قرب',
          'احجز موعداً لدى طبيب بيطري',
          'حافظ على راحة الحيوان وتزويده بالماء'
        ],
        nextSteps: [
          'سجل الأعراض ومدتها',
          'جهّز التاريخ الطبي للحيوان',
          'تواصل مع الطبيب البيطري'
        ],
        warning: 'هذه معلومات إرشادية ولا تغني عن التشخيص والعلاج المهني.'
      }
    }

    const prompt = this.buildAnalysisPrompt(condition)

    try {
      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      return this.parseAIResponse(text)
    } catch (error: any) {
      console.error('AI analysis failed:', error)

      // معالجة أخطاء محددة وتحسين الرسائل للمستخدم
      if (error.message?.includes('quota')) {
        throw new Error('عذراً، تم الوصول للحد الأقصى اليومي للاستخدام. يرجى المحاولة غداً.')
      } else if (error.message?.includes('key') || error.message?.includes('API_KEY')) {
        throw new Error('مفتاح API غير صحيح أو مفقود. يرجى التحقق من التكوين.')
      } else if (error.message?.includes('network') || error.message?.includes('fetch') || error.message?.includes('Failed to fetch')) {
        throw new Error('لا يوجد اتصال بالإنترنت. يرجى التحقق من الشبكة والمحاولة مرة أخرى.')
      } else if (error.message?.includes('candidate')) {
        throw new Error('صياغة الطلب غير واضحة للذكاء الاصطناعي، يرجى تقديم تفاصيل أكثر دقة.')
      }

      throw new Error('حدث خطأ غير متوقع أثناء التحليل. يرجى المحاولة مرة أخرى لاحقاً.')
    }
  }

  private buildAnalysisPrompt(condition: PetCondition): string {
    return `أنت مساعد بيطري ذكي. حلّل حالة الحيوان التالية وقدّم تقييماً مهنياً باللغة العربية.

معلومات الحيوان:
- النوع: ${condition.petType}
- الاسم: ${condition.petName}
- العمر: ${condition.age}
- الجنس: ${condition.gender}

الأعراض:
${condition.symptoms}

مدة الأعراض: ${condition.duration}
شدة الحالة: ${condition.severity}
مدى الإلحاح: ${condition.urgency}

علاجات سابقة: ${condition.previousTreatment || 'لا يوجد'}
أدوية حالية: ${condition.medications || 'لا يوجد'}
معلومات إضافية: ${condition.additionalInfo || 'لا يوجد'}

يرجى تقديم:
1) ملخص مختصر للحالة
2) 3-5 احتمالات تشخيصية مرتبة بالأكثر احتمالاً
3) مستوى الإلحاح (low/medium/high/emergency)
4) 4-6 توصيات محددة
5) الخطوات التالية لصاحب الحيوان
6) تحذير/إخلاء مسؤولية

أعد النتيجة بصيغة JSON فقط وبالمفاتيح التالية حرفياً:
summary, possibleConditions, urgencyLevel, recommendations, nextSteps, warning

تنبيه: هذه معلومات إرشادية ولا تغني عن الطبيب البيطري.`
  }

  private parseAIResponse(text: string): AIAnalysis {
    try {
      // تنظيف النص من علامات الماركداون إذا وجدت
      // Clean up markdown code blocks if present (standard Gemini behavior)
      let cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

      // Attempt to extract the JSON object specifically
      const startIndex = cleanText.indexOf('{');
      const endIndex = cleanText.lastIndexOf('}');

      if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
        cleanText = cleanText.substring(startIndex, endIndex + 1);
        return JSON.parse(cleanText);
      }

      // If direct parsing works (rare if extra text exists)
      return JSON.parse(cleanText);

      // Fallback: create a basic structure if JSON parsing fails
      return {
        summary: 'تعذّر تحليل الاستجابة بالتفصيل. يُرجى استشارة طبيب بيطري.',
        possibleConditions: ['يتطلب فحصاً مهنياً'],
        urgencyLevel: 'medium',
        recommendations: [
          'راقب الحيوان عن قرب',
          'تواصل مع طبيب بيطري للتشخيص الصحيح',
          'حافظ على راحة الحيوان وتوفّر الماء'
        ],
        nextSteps: [
          'احجز موعداً لدى طبيب بيطري',
          'دوّن الأعراض وتطورها',
          'جهّز التاريخ الطبي للحيوان'
        ],
        warning: 'هذا التحليل معلوماتي فقط ولا يغني عن الرعاية البيطرية المهنية.'
      }
    } catch (error) {
      console.error('Failed to parse AI response:', error)
      return {
        summary: 'تعذّر إكمال التحليل. يُرجى استشارة طبيب بيطري فوراً.',
        possibleConditions: ['فحص مهني مطلوب'],
        urgencyLevel: 'high',
        recommendations: ['اطلب رعاية بيطرية عاجلة'],
        nextSteps: ['تواصل مع الطوارئ البيطرية أو أقرب عيادة'],
        warning: 'هذه الخدمة إرشادية فقط. استشر طبيباً بيطرياً للتشخيص والعلاج.'
      }
    }
  }

  async generateHealthTips(petType: string): Promise<string[]> {
    if (!this.model) {
      return [
        'وفّر ماءً نظيفاً ومتجدداً يومياً',
        'حافظ على جدول تغذية منتظم ومناسب للعمر',
        'وفّر نشاطاً وحركة يومية مناسبة',
        'التزم بجدول التطعيمات والوقاية من الطفيليات',
        'احجز فحصاً بيطرياً دورياً حتى دون وجود أعراض'
      ]
    }

    const prompt = `اكتب 5 نصائح صحية محددة لمُربي ${petType} باللغة العربية. اجعل كل نصيحة قصيرة وعملية.`

    try {
      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      // Simple parsing - split by newlines or numbers
      return text.split('\n')
        .filter((line: string) => line.trim())
        .map((line: string) => line.replace(/^\d+\.\s*/, '').trim())
        .slice(0, 5)
    } catch (error) {
      console.error('Failed to generate health tips:', error)
      return [
        'توفير ماء نظيف بشكل يومي',
        'الحفاظ على جدول التغذية المنتظم',
        'ضمان التمارين الكافية',
        'الحفاظ على تحديث التطعيمات',
        'جدولة الفحوصات البيطرية الدورية'
      ]
    }
  }

  isAvailable(): boolean {
    return this.model !== null
  }
}

export const geminiService = new GeminiService()
export type { AIAnalysis, PetCondition }
