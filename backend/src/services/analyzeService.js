import OpenAI from 'openai';
import Analysis from '../models/Analysis.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ANALYSIS_PROMPT = `Analyze this image and respond with a valid JSON object containing exactly these keys (no markdown, no code blocks, just raw JSON):
{
  "description": "A detailed description of the image",
  "objects": [{"name": "object name", "confidence": 0.95}, ...],
  "text": ["any text found in the image", ...]
}

Rules:
- description: 1-3 sentences describing the image
- objects: list all detectable objects with confidence as decimal 0-1
- text: list any visible text (OCR). Empty array if none found`;

export async function analyzeImage(imageBase64, mimeType = 'image/jpeg') {
  const imageUrl = imageBase64.startsWith('data:')
    ? imageBase64
    : `data:image/jpeg;base64,${imageBase64}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: imageUrl },
          },
          {
            type: 'text',
            text: ANALYSIS_PROMPT,
          },
        ],
      },
    ],
    max_tokens: 1024,
  });

  const content = response.choices[0]?.message?.content?.trim();
  if (!content) {
    throw new Error('No response from OpenAI');
  }

  // Parse JSON (handle potential markdown wrapping)
  let parsed;
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    parsed = JSON.parse(jsonMatch[0]);
  } else {
    parsed = JSON.parse(content);
  }

  const analysis = await Analysis.create({
    image_metadata: { format: 'base64', length: imageBase64.length, data: imageBase64, mime: mimeType },
    ai_response: JSON.stringify(parsed),
  });

  return {
    id: analysis.id,
    ...parsed,
    created_at: analysis.createdAt,
  };
}
