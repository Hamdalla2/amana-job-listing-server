# Testing Gemini API in Postman

## Method 1: Test Gemini API Directly

### GET Request - List Available Models
**URL**: `https://generativelanguage.googleapis.com/v1/models?key=YOUR_API_KEY`
**Method**: GET
**Headers**: None needed

Replace `YOUR_API_KEY` with: `AIzaSyBlGME1tj8WO5_GtHi7TPPH5r56RPYmcRM`

This will show you which models are actually available.

### POST Request - Generate Content
**URL**: `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=YOUR_API_KEY`
**Method**: POST
**Headers**: 
- `Content-Type: application/json`

**Body** (raw JSON):
```json
{
  "contents": [{
    "parts": [{
      "text": "Analyze this CV: [Your CV text here]. Return JSON with jobMatches and cvAnalysis."
    }]
  }],
  "generationConfig": {
    "temperature": 0.2,
    "maxOutputTokens": 8192
  }
}
```

## Method 2: Use Groq API (Recommended - More Reliable)

Groq is free, fast, and actually works! Let me switch the code to use Groq instead.

**URL**: `https://api.groq.com/openai/v1/chat/completions`
**Method**: POST
**Headers**:
- `Authorization: Bearer YOUR_GROQ_API_KEY`
- `Content-Type: application/json`

**Body**:
```json
{
  "model": "llama-3.1-70b-versatile",
  "messages": [
    {
      "role": "system",
      "content": "You are a CV analyzer. Always respond with valid JSON."
    },
    {
      "role": "user",
      "content": "Analyze this CV: [Your CV text]"
    }
  ],
  "temperature": 0.2
}
```

**Get Groq API Key**: https://console.groq.com (free signup)

