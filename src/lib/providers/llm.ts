import OpenAI from 'openai';
import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';
import { getSetting } from '../settings';

// ─── Provider Interface ───────────────────────────────────────────────────────
interface LLMProvider {
  generate<T extends z.ZodTypeAny>(
    systemPrompt: string,
    userPrompt: string,
    schema: T,
    schemaName: string
  ): Promise<z.infer<T>>;
}

// ─── OpenAI Provider ─────────────────────────────────────────────────────────
class OpenAIProvider implements LLMProvider {
  async generate<T extends z.ZodTypeAny>(
    systemPrompt: string,
    userPrompt: string,
    schema: T,
    schemaName: string
  ): Promise<z.infer<T>> {
    const apiKey = process.env.OPENAI_API_KEY || await getSetting('OPENAI_API_KEY');
    if (!apiKey) throw new Error('OPENAI_API_KEY not configured.');
    
    const client = new OpenAI({ apiKey });
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    const response = await client.chat.completions.parse({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: zodResponseFormat(schema, schemaName),
      temperature: 0.7
    });
    const parsed = response.choices[0].message.parsed;
    if (!parsed) throw new Error('Failed to parse OpenAI structured output.');
    return parsed as z.infer<T>;
  }
}

// ─── Gemini Rate Limiter ─────────────────────────────────────────────────────
// Free tier: 20 requests/day = 1 request per 72 seconds minimum.
// We use 75s to be safe. The limiter is in-process only.
let lastGeminiCallTime = 0;
const GEMINI_MIN_INTERVAL_MS = 0; // Removed 75s delay since billing is active

async function waitForGeminiRateLimit(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastGeminiCallTime;
  if (elapsed < GEMINI_MIN_INTERVAL_MS && lastGeminiCallTime > 0) {
    const waitMs = GEMINI_MIN_INTERVAL_MS - elapsed;
    console.log(`[GEMINI RATE LIMIT] Waiting ${(waitMs / 1000).toFixed(0)}s before next API call...`);
    await new Promise(r => setTimeout(r, waitMs));
  }
  lastGeminiCallTime = Date.now();
}

// ─── Gemini Provider ─────────────────────────────────────────────────────────
class GeminiProvider implements LLMProvider {
  async generate<T extends z.ZodTypeAny>(
    systemPrompt: string,
    userPrompt: string,
    schema: T,
    schemaName: string
  ): Promise<z.infer<T>> {
    const apiKey = process.env.GEMINI_API_KEY || await getSetting('GEMINI_API_KEY');
    if (!apiKey) throw new Error('GEMINI_API_KEY not configured. Add it in Settings > Providers.');

    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    // gemini-3.5-flash-lite and gemini-3.8-flash are active and supported on this API key
    const candidateModels = ['gemini-3.5-flash-lite', 'gemini-3.8-flash'];

    const schemaDescriptions: Record<string, string> = {
      'topics': `{ "topics": [ { "title": "string", "category": "string", "hook": "string", "description": "string", "viralityScore": "number (0-100)", "difficultyScore": "number (0-100)" } ] }`,
      'research': `{ "findings": "string", "angles": ["string"], "confidenceScore": "number", "sources": ["string"] }`,
      'script': `{ "title": "string", "hook": "string", "narration": "string", "scenes": [ { "sceneNumber": "number", "duration": "number", "narration": "string", "visualPrompt": "string", "visualType": "image|video" } ], "cta": "string", "description": "string", "hashtags": ["string"], "wordCount": "number", "claims": [ { "claim": "string", "type": "confirmed|theory|alleged|opinion", "source": "string" } ] }`,
      'factCheck': `{ "approved": "boolean", "corrections": ["string"], "riskLevel": "LOW|MEDIUM|HIGH" }`
    };
    const schemaDesc = schemaDescriptions[schemaName] || "{}";

    const fullPrompt = `${systemPrompt}\n\nUser Request: ${userPrompt}\n\nRespond ONLY with valid JSON. Your JSON MUST EXACTLY match this structure:\n${schemaDesc}\n\nNo markdown, no explanation, just the raw JSON object.`;
    
    // Built-in retry for transient API errors (429, 503)
    let lastError: Error | null = null;
    for (let attempt = 0; attempt < 4; attempt++) {
      if (attempt > 0) {
        const delay = Math.min(attempt * 2000, 10000); // 2s, 4s, 6s
        console.log(`[GEMINI] Retry ${attempt}/3 after ${delay / 1000}s for transient error...`);
        await new Promise(r => setTimeout(r, delay));
      }
      
      // Enforce rate limiting before each API call
      await waitForGeminiRateLimit();
      
      const currentModelName = candidateModels[attempt % candidateModels.length];
      const model = genAI.getGenerativeModel({
        model: currentModelName,
        generationConfig: { 
          responseMimeType: 'application/json',
          maxOutputTokens: 8192,
          temperature: 0.9
        }
      });
      
      try {
        const result = await model.generateContent(fullPrompt);
        const text = result.response.text();

        // Clean up common Gemini quirks
        let cleaned = text.trim();
        if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
        else if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
        if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
        cleaned = cleaned.trim();
        
        if (!cleaned.startsWith('{') && !cleaned.startsWith('[')) {
          const jsonMatch = cleaned.match(/(\{[\s\S]*\})/);
          if (jsonMatch) cleaned = jsonMatch[1];
        }
        
        const parsed = JSON.parse(cleaned);
        return schema.parse(parsed) as z.infer<T>;
      } catch (e: any) {
        lastError = e;
        const msg = e.message || '';
        
        // Retry on transient errors (429 rate limit, 503 overloaded)
        if (msg.includes('429') || msg.includes('503') || msg.includes('Too Many Requests') || msg.includes('Service Unavailable') || msg.includes('high demand')) {
          continue; // Will retry with backoff
        }
        
        // Zod validation error — not transient, throw immediately
        if (e.issues) {
          const issues = e.issues.map((i: any) => `${i.path.join('.')}: ${i.message}`).join(', ');
          throw new Error(`Gemini JSON validation failed for "${schemaName}": ${issues}. Raw: ${msg.slice(0, 300)}`);
        }
        
        // JSON parse error — might be truncation, retry once
        if (msg.includes('JSON') || msg.includes('Unexpected end') || msg.includes('Unexpected token')) {
          continue;
        }
        
        // Unknown error — throw immediately
        throw e;
      }
    }
    
    throw lastError || new Error(`Gemini failed after 4 attempts for "${schemaName}"`);
  }
}

// ─── Mock Provider ────────────────────────────────────────────────────────────
class MockLLMProvider implements LLMProvider {
  async generate<T extends z.ZodTypeAny>(
    _sys: string,
    _user: string,
    _schema: T,
    schemaName: string
  ): Promise<z.infer<T>> {
    return generateMockResponse(schemaName) as z.infer<T>;
  }
}

// ─── Provider Factory ─────────────────────────────────────────────────────────
export async function getLLMProvider(): Promise<LLMProvider> {
  const providerMode = await getSetting('PROVIDER_MODE');
  if (providerMode === 'mock') return new MockLLMProvider();

  const defaultProvider = await getSetting('DEFAULT_LLM_PROVIDER');

  if (defaultProvider === 'gemini') {
    return new GeminiProvider();
  }

  if (defaultProvider === 'openai') {
    return new OpenAIProvider();
  }

  // 'auto': prefer Gemini if key exists, else OpenAI
  const geminiKey = process.env.GEMINI_API_KEY || await getSetting('GEMINI_API_KEY');
  if (geminiKey) return new GeminiProvider();

  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) return new OpenAIProvider();

  // Fallback
  console.warn('[LLM] No API keys found. Falling back to mock.');
  return new MockLLMProvider();
}

// ─── Public API ───────────────────────────────────────────────────────────────
export async function generateStructuredLLM<T extends z.ZodTypeAny>(
  systemPrompt: string,
  userPrompt: string,
  schema: T,
  schemaName: string
): Promise<z.infer<T>> {
  const provider = await getLLMProvider();

  try {
    return await provider.generate(systemPrompt, userPrompt, schema, schemaName);
  } catch (error: any) {
    console.error(`LLM Error (${schemaName}):`, error.message);
    
    // Automatic Fallback from Gemini -> OpenAI on Quota Exceeded (Free Tier limit)
    const isQuotaError = error.message.toLowerCase().includes('429') || 
                         error.message.toLowerCase().includes('quota') || 
                         error.message.toLowerCase().includes('exceeded');
                         
    if (provider.constructor.name === 'GeminiProvider' && isQuotaError) {
      const openaiKey = process.env.OPENAI_API_KEY || await getSetting('OPENAI_API_KEY');
      if (openaiKey) {
        console.warn('[LLM FALLBACK] Gemini quota exceeded. Instantly falling back to OpenAI...');
        const fallbackProvider = new OpenAIProvider();
        return await fallbackProvider.generate(systemPrompt, userPrompt, schema, schemaName);
      }
    }

    throw new Error(`LLM Generation failed: ${error.message}`);
  }
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
// Universal multi-category mock responses
function generateMockResponse(schemaName: string): any {
  if (schemaName === 'topics') {
    const pool = [
      {
        title: 'The Matrix: Was Neo Actually the Villain?',
        category: 'Movie Theories',
        hook: "What if everything you knew about The Matrix was wrong?",
        description: "Neo's rebellion wasn't freedom — it was just a controlled system reboot.",
        viralityScore: 95,
        difficultyScore: 60
      },
      {
        title: "Why Your Brain Lies to You Every Single Day",
        category: 'Psychology',
        hook: "Your brain is not as trustworthy as you think.",
        description: "Cognitive biases that make you predictably irrational.",
        viralityScore: 90,
        difficultyScore: 40
      },
      {
        title: "The Real Reason Sharks Almost Never Attack Humans",
        category: 'Science Facts',
        hook: "Sharks have been misunderstood for decades.",
        description: "The data behind shark attacks is shocking — but not in the way you think.",
        viralityScore: 88,
        difficultyScore: 30
      },
      {
        title: "How Zerodha Made ₹2800 Crore Without Spending on Ads",
        category: 'Business',
        hook: "No ads. No Bollywood. Just product.",
        description: "India's most profitable startup never ran a single advertisement.",
        viralityScore: 92,
        difficultyScore: 45
      },
      {
        title: "The Science Behind Why You Can't Stop Scrolling",
        category: 'Technology',
        hook: "Your phone is designed like a slot machine.",
        description: "How infinite scroll exploits your dopamine system.",
        viralityScore: 93,
        difficultyScore: 35
      },
      {
        title: "The King Who Used a $200 Million Diamond as a Paperweight",
        category: 'Crazy Historical Facts',
        hook: "Imagine using a priceless 140-carat gem to hold down your tax papers.",
        description: "The unbelievable true story of the Nizam of Hyderabad and the Jacob Diamond.",
        viralityScore: 96,
        difficultyScore: 40
      },
      {
        title: "The Secret Code Hidden Inside Mona Lisa's Eye",
        category: 'Bizarre Art Mysteries',
        hook: "Zoom in close enough, and Da Vinci left an eerie message.",
        description: "Microscopic letters and symbols found inside the pupils of the Mona Lisa.",
        viralityScore: 91,
        difficultyScore: 50
      },
      {
        title: "The Creature That Can Survive the Vacuum of Space",
        category: 'Weird Science',
        hook: "Boil them, freeze them, blast them with radiation — they survive it all.",
        description: "Tardigrades possess an almost indestructible biological shield.",
        viralityScore: 94,
        difficultyScore: 35
      }
    ];
    // Shuffle and pick 5, adding unique randomized suffix if needed
    const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, 5);
    return { topics: shuffled };
  }

  if (schemaName === 'research') {
    return {
      findings: "Multiple verified sources confirm this topic. Academic research, news reports, and primary data all support the core claims. The topic has significant audience interest based on search trends.",
      angles: ["Shocking revelation", "Science explains it", "India angle", "Global context"],
      confidenceScore: 85,
      sources: [
        "https://en.wikipedia.org/wiki/topic",
        "https://scholar.google.com/search?q=topic"
      ]
    };
  }

  if (schemaName === 'script') {
    return {
      title: 'The Truth Your Brain Hides From You',
      hook: "Your brain lies to you more than any person ever could.",
      narration: "Scientists call it the confirmation bias. You only see what you already believe. Every single day, your brain filters out 11 million bits of information and keeps just 40. Those 40 bits? They confirm what you already think. This is why smart people believe wrong things. And why knowing this fact — right now — changes everything.",
      scenes: [
        {
          sceneNumber: 1,
          duration: 5,
          narration: "Your brain lies to you more than any person ever could.",
          visualPrompt: "human brain neural network glowing animation",
          visualType: "image"
        },
        {
          sceneNumber: 2,
          duration: 10,
          narration: "Scientists call it the confirmation bias. You only see what you already believe.",
          visualPrompt: "cognitive bias psychology visual explanation",
          visualType: "image"
        }
      ],
      cta: "Follow for more mind-blowing psychology facts!",
      description: "The shocking truth about how your brain processes reality.",
      hashtags: ["#psychology", "#mindblown", "#brainfacts", "#science"],
      wordCount: 95,
      claims: [
        {
          claim: "Brain processes 11 million bits per second, conscious mind only 40",
          type: "confirmed",
          source: "Timothy Wilson, 'Strangers to Ourselves' (2002)"
        }
      ]
    };
  }

  if (schemaName === 'factCheck') {
    return {
      approved: true,
      corrections: [],
      riskLevel: 'LOW'
    };
  }

  throw new Error(`No mock data available for schema: ${schemaName}`);
}
