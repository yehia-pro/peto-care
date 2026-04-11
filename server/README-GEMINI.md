Gemini Proxy
=============

This small proxy provides a safe server-side endpoint that the frontend can call to use Google Gemini for translations or other LLM tasks without exposing API keys in the browser.

Usage
-----
1. Set environment variable `GEMINI_API_KEY` (preferred) or `VITE_GEMINI_API_KEY`.
2. Run the server from project root (integrated):

```powershell
# Start the integrated server (uses GEMINI_API_KEY)
$env:GEMINI_API_KEY = 'your_real_key_here'; node server/app.mjs
```

Or run the standalone proxy if you prefer:

```powershell
node server/gemini-proxy.mjs
```

3. The endpoint will be available at `http://localhost:5001/api/gemini/translate` when using the standalone proxy, or at `http://localhost:5000/api/gemini/translate` when running the integrated `server/app.mjs` (default port 5000).

Request format (POST)
```json
{ "text": "Text to translate", "target": "ar" }
```

Response format
```json
{ "translated": "..." }
```

Notes
-----
- The proxy uses the `@google/generative-ai` package. Make sure it is installed in the project dependencies.
- This is a minimal example; for production you should add authentication, rate-limiting, request validation, and error handling.
