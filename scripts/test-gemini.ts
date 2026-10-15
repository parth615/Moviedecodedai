import { GoogleGenerativeAI } from '@google/generative-ai';

async function checkGemini() {
  try {
    const apiKey = process.env.GEMINI_API_KEY || '';
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    console.log('Sending test request to Gemini...');
    const result = await model.generateContent('Hi');
    console.log('Success! Response:', result.response.text());
  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

checkGemini();
