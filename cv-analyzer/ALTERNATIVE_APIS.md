# Alternative Free AI APIs for CV Analysis

## Current Setup: Gemini API (Google)
- **Status**: Fixed - using v1 API with `gemini-pro` model
- **Free Tier**: Yes, generous free tier
- **Endpoint**: `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent`

## Alternative Free APIs:

### 1. **Groq API** (Recommended - Very Fast & Free)
- **Free Tier**: Generous free tier
- **Speed**: Extremely fast (uses LPUs)
- **Models**: llama-3.1-70b-versatile, mixtral-8x7b-32768
- **Setup**: 
  - Sign up at: https://console.groq.com
  - Get API key
  - Endpoint: `https://api.groq.com/openai/v1/chat/completions`
- **Cost**: Free tier available

### 2. **Hugging Face Inference API** (Free)
- **Free Tier**: Yes, with rate limits
- **Models**: Many open-source models
- **Setup**: 
  - Sign up at: https://huggingface.co
  - Get API token
  - Endpoint: `https://api-inference.huggingface.co/models/{model-name}`
- **Cost**: Free with rate limits

### 3. **Cohere API** (Free Tier)
- **Free Tier**: Limited free tier
- **Models**: Command, Command-Light
- **Setup**: 
  - Sign up at: https://cohere.com
  - Get API key
  - Endpoint: `https://api.cohere.ai/v1/generate`
- **Cost**: Free tier available

### 4. **OpenAI API** (Limited Free Tier)
- **Free Tier**: $5 credit (expires after 3 months)
- **Models**: gpt-3.5-turbo (cheapest)
- **Setup**: 
  - Sign up at: https://platform.openai.com
  - Get API key
  - Endpoint: `https://api.openai.com/v1/chat/completions`
- **Cost**: Pay-as-you-go after free credit

### 5. **Anthropic Claude API** (Free Tier)
- **Free Tier**: Limited free tier
- **Models**: claude-3-haiku (fastest/cheapest)
- **Setup**: 
  - Sign up at: https://console.anthropic.com
  - Get API key
  - Endpoint: `https://api.anthropic.com/v1/messages`
- **Cost**: Free tier available

## Quick Implementation Guide:

To switch APIs, you'll need to:
1. Update the API endpoint in `analyzeResume.js`
2. Adjust the request payload format
3. Update the response parsing logic
4. Add the new API key to `.env`

## Recommended: Groq API (Fastest & Free)
Groq is currently the best free alternative - very fast responses and good quality.

Example implementation would be in a separate file `analyzeResume-groq.js` if you want to switch.

