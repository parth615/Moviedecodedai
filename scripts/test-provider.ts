import { getLLMProvider } from '../src/lib/providers/llm';
import { getSetting } from '../src/lib/settings';

async function main() {
  const defaultProvider = await getSetting('DEFAULT_LLM_PROVIDER');
  console.log('DB DEFAULT_LLM_PROVIDER:', defaultProvider);
  
  const provider = await getLLMProvider();
  console.log('getLLMProvider() returned:', provider.constructor.name);
}

main().catch(console.error);
