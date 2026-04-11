import express from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import mongoose from 'mongoose';
import { GoogleGenerativeAI } from '@google/generative-ai';
import authRoutes from './src/routes/auth.routes.js';
import passwordRoutes from './src/routes/password.routes.js';

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/vet_network';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/password', passwordRoutes);

const PORT = 4000; // Fixed port as requested
const API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || ''
process.env.JWT_SECRET = process.env.JWT_SECRET || 'v3tN3tw0rk-S3cur3-K3y-2023!@#_M0d1f13d'

// Simple in-memory rate limiter per IP (sliding window)
const RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX = 30 // max requests per window
const ipCounters = new Map()

function rateLimit(req, res, next) {
	try {
		const ip = req.ip || req.connection.remoteAddress || 'unknown'
		const now = Date.now()
		let entry = ipCounters.get(ip)
		if (!entry) {
			entry = { ts: now, count: 1 }
			ipCounters.set(ip, entry)
			return next()
		}
		if (now - entry.ts > RATE_LIMIT_WINDOW_MS) {
			entry.ts = now
			entry.count = 1
			ipCounters.set(ip, entry)
			return next()
		}
		if (entry.count >= RATE_LIMIT_MAX) {
			res.status(429).json({ error: 'Too many requests' })
			return
		}
		entry.count += 1
		ipCounters.set(ip, entry)
		return next()
	} catch (e) {
		return next()
	}
}

let client = null
let model = null

if (!API_KEY) {
	console.warn('[server/app] GEMINI API key not set. AI features will be disabled.')
} else {
	try {
		client = new GoogleGenerativeAI(API_KEY)
		model = client.getGenerativeModel({ model: 'gemini-pro' })
	} catch (err) {
		console.error('[server/app] Failed to initialize Gemini client:', err)
	}
}

app.get('/health', (req, res) => {
  res.json({ 
    ok: true, 
    aiAvailable: !!model,
    mongoConnected: mongoose.connection.readyState === 1
  });
});

app.post('/api/gemini/translate', rateLimit, async (req, res) => {
	const { text, target } = req.body || {}
	if (!text || typeof text !== 'string' || !target || typeof target !== 'string') {
		return res.status(400).json({ error: 'Missing or invalid text/target' })
	}
	if (!model) return res.status(503).json({ error: 'Gemini service not available' })

	const safeText = String(text).substring(0, 3000)
	const prompt = `Translate the following text to ${target}. Return only a JSON object with the key \"translated\" and the translated text as its value. Do not add extra commentary.\n\nText:\n${safeText}`

	try {
		const result = await model.generateContent(prompt)
		const response = await result.response
		const content = response.text()

		const jsonMatch = content.match(/\{[\s\S]*\}/)
		if (jsonMatch) {
			try {
				const parsed = JSON.parse(jsonMatch[0])
				if (parsed.translated) return res.json({ translated: parsed.translated })
			} catch (e) {
				// fallthrough
			}
		}

		return res.json({ translated: content })
	} catch (err) {
		console.error('[server/app] translate error:', err)
		return res.status(500).json({ error: 'Translation failed' })
	}
})

app.listen(PORT, () => {
	console.log(`[server/app] listening on http://localhost:${PORT}`)
})
