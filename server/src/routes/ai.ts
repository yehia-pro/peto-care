import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Define route for AI
router.post('/ask', async (req, res) => {
    try {
        const { prompt, question } = req.body;
        const userPrompt = prompt || question;

        if (!userPrompt) {
            return res.status(400).json({ error: 'السؤال مطلوب', answer: 'من فضلك اكتب سؤالك لأستطيع مساعدتك.' });
        }

        if (!process.env.GEMINI_API_KEY) {
            console.error('GEMINI_API_KEY is missing');
            // مشكلة خارجية/تهيئة: المفتاح غير مضبوط
            return res.status(503).json({
                error: 'خدمة الذكاء الاصطناعي غير مفعلة حالياً',
                answer: 'خدمة المساعد الذكي غير متاحة حالياً بسبب إعدادات الخادم (مفتاح GEMINI غير موجود). إذا كانت الحالة طارئة يُرجى التوجه لأقرب عيادة بيطرية.'
            });
        }

        // Use lighter and faster model
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const systemInstruction = `
أنت مساعد بيطري خبير باسم "د. بيت".
أجب باللغة العربية فقط.
قدّم نصائح مفيدة ودقيقة ومختصرة عن صحة الحيوان الأليف والتغذية والسلوك.
تحذير مهم جداً: إذا ذكر المستخدم أعراضاً خطيرة (نزيف، تسمم، تشنجات، صعوبة تنفس، فقدان وعي) فاطلب منه التوجه للطبيب البيطري فوراً ولا تقدّم وصفات منزلية.
    `;

        const result = await model.generateContent(`${systemInstruction}\n\nUser Question: ${userPrompt}`);
        const response = await result.response;
        const text = response.text();

        if (!text) {
            throw new Error('Empty response from AI');
        }

        res.json({ reply: text, answer: text });

    } catch (error: any) {
        console.error('Gemini API Error:', error);

        // Return a safe fallback if AI fails
        res.status(500).json({
            error: 'خدمة الذكاء الاصطناعي غير متاحة حالياً',
            details: error.message,
            answer: 'عذراً، تعذّر الوصول لخدمة الذكاء الاصطناعي حالياً. إذا كانت الحالة طارئة يُرجى التوجه للطبيب البيطري فوراً.'
        });
    }
});

export default router;
