import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

let openaiInstance: OpenAI | null = null;

function getOpenAI() {
  if (!openaiInstance) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY not found in environment. DALL-E generation will fail.");
    }
    openaiInstance = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiInstance;
}

export async function generateImage(prompt: string, scriptId: string, sceneIndex: number): Promise<{ url: string, provider: string }> {
  const openai = getOpenAI();
  
  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: `Vertical 9:16 aspect ratio, cinematic style, hyper-realistic, dark theme: ${prompt}`,
      n: 1,
      size: "1024x1792", // Vertical aspect ratio available in DALL-E 3
      quality: "standard",
    });

    const imageUrl = response?.data?.[0]?.url;
    
    if (!imageUrl) {
      throw new Error("No image URL returned from DALL-E API.");
    }

    // Fetch the image and save it locally
    const imageRes = await fetch(imageUrl);
    if (!imageRes.ok) throw new Error(`Failed to download image from OpenAI: ${imageRes.statusText}`);
    
    const arrayBuffer = await imageRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const filename = `visual_${scriptId}_scene${sceneIndex}_${Date.now()}.png`;
    const relativePath = `/visuals/${filename}`;
    const absolutePath = path.join(process.cwd(), 'public', 'visuals', filename);
    
    // Ensure dir exists
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    fs.writeFileSync(absolutePath, buffer);

    return {
      url: relativePath,
      provider: "OpenAI_DALLE3"
    };

  } catch (error: any) {
    console.error(`DALL-E Generation Error (Scene ${sceneIndex}):`, error);
    throw new Error(`Visual generation failed: ${error.message}`);
  }
}
