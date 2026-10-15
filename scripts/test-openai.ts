import OpenAI from 'openai';
const client = new OpenAI({ apiKey: 'test' });
console.log('client.chat.completions.parse exists?', typeof client.chat?.completions?.parse);
console.log('client.beta.chat?.completions.parse exists?', typeof (client.beta as any).chat?.completions?.parse);
