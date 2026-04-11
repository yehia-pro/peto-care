import express from 'express'
import bodyParser from 'body-parser'
import { GoogleGenerativeAI } from '@google/generative-ai'

const app = express()
app.use(bodyParser.json())

const PORT = process.env.PORT || 5001
const API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || ''

let client = null
let model = null

if (!API_KEY) {
  console.warn('[gemini-proxy] GEMINI API key not set. Proxy will return 503 until configured.')
} else {
  try {
    client = new GoogleGenerativeAI(API_KEY)
    model = client.getGenerativeModel({ model: 'gemini-pro' })
  } catch (err) {
    console.error('[gemini-proxy] Failed to initialize Gemini client:', err)
  }
}

app.post('/api/gemini/translate', async (req, res) => {
  const { text, target } = req.body || {}
  if (!text || !target) return res.status(400).json({ error: 'Missing text or target' })
  if (!model) return res.status(503).json({ error: 'Gemini service not available' })

  // Prompt: ask the model to return a JSON with a single key `translated`.
  const prompt = `Translate the following text to ${target}. Return only a JSON object with the key \"translated\" and the translated text as its value. Do not add extra commentary.\n\nText:\n${text}`

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    const content = response.text()

    // Extract JSON object from model response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0])
        if (parsed.translated) return res.json({ translated: parsed.translated })
      } catch (e) {
        // fallback to raw content
      }
    }

    // If JSON not found, return the raw text as translated
    return res.json({ translated: content })
  } catch (err) {
    console.error('[gemini-proxy] translate error:', err)
    return res.status(500).json({ error: 'Translation failed' })
  }
})

app.listen(PORT, () => {
  console.log(`[gemini-proxy] listening on http://localhost:${PORT}`)
})
