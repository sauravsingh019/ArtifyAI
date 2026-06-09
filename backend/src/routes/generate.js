import express from 'express';
import axios from 'axios';
import fs from 'fs';
import { requireDBUser } from '../middleware/auth.js';

const router = express.Router();

router.post('/', requireDBUser, async (req, res) => {
  const { prompt, aspectRatio = '1:1' } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  // Clean the prompt by removing surrounding double or single quotes
  let cleanPrompt = prompt.trim();
  if ((cleanPrompt.startsWith('"') && cleanPrompt.endsWith('"')) || 
      (cleanPrompt.startsWith("'") && cleanPrompt.endsWith("'"))) {
    cleanPrompt = cleanPrompt.substring(1, cleanPrompt.length - 1).trim();
  }
  
  console.log(`[AI Lab] Processing prompt with Gemini: "${cleanPrompt}"`);

  let base64DataUrl = null;
  let methodUsed = '';

  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      console.log('[AI Lab] Gemini API Key detected. Initializing request...');
      
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${geminiKey}`;
      
      // Map frontend aspectRatio to Gemini aspectRatio: '1:1', '16:9', '9:16'
      const mappedAspectRatio = aspectRatio === '16:9' ? '16:9' : aspectRatio === '9:16' ? '9:16' : '1:1';

      console.log(`[AI Lab] Requesting Imagen 4 with aspect ratio: ${mappedAspectRatio}`);
      
      const response = await axios.post(
        endpoint,
        {
          instances: [
            {
              prompt: cleanPrompt
            }
          ],
          parameters: {
            sampleCount: 1,
            aspectRatio: mappedAspectRatio,
            outputMimeType: 'image/png'
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30 seconds timeout
        }
      );

      if (response.data && response.data.predictions && response.data.predictions.length > 0) {
        const prediction = response.data.predictions[0];
        const base64Data = prediction.bytesBase64Encoded;
        const mimeType = prediction.mimeType || 'image/png';
        base64DataUrl = `data:${mimeType};base64,${base64Data}`;
        methodUsed = 'Gemini Imagen 3';
        console.log(`[AI Lab] Gemini image generated successfully. Base64 length: ${base64DataUrl.length}`);
      } else {
        throw new Error('Invalid or empty predictions returned from Gemini API.');
      }
    } catch (err) {
      const errMsg = err.response ? JSON.stringify(err.response.data) : err.message;
      console.error('[AI Lab] Gemini image generation failed:', errMsg);
      try {
        fs.writeFileSync('gemini-error.txt', 
          `[${new Date().toISOString()}] Gemini error: ${errMsg}\nStack: ${err.stack}\nPrompt: ${cleanPrompt}`
        );
      } catch (e) {}
    }
  } else {
    console.warn('[AI Lab] GEMINI_API_KEY is missing in backend/.env!');
  }

  // 2. Fallback to LoremFlickr if Gemini is not configured or fails
  if (!base64DataUrl) {
    try {
      console.log('[AI Lab] Falling back to keyword-based LoremFlickr image generation...');
      
      const stopWords = new Set(['a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'in', 'on', 'at', 'to', 'for', 'with', 'of', 'by']);
      const keywords = cleanPrompt
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 1 && !stopWords.has(w))
        .slice(0, 3)
        .join(',');

      const width = aspectRatio === '16:9' ? 1024 : aspectRatio === '9:16' ? 576 : 1024;
      const height = aspectRatio === '16:9' ? 576 : aspectRatio === '9:16' ? 1024 : 1024;
      
      const imageUrl = `https://loremflickr.com/${width}/${height}/${encodeURIComponent(keywords || 'abstract,art')}`;
      console.log(`[AI Lab] Fetching from LoremFlickr: ${imageUrl}`);
      
      const response = await axios.get(imageUrl, { 
        responseType: 'arraybuffer',
        timeout: 15000 
      });
      const base64Image = Buffer.from(response.data, 'binary').toString('base64');
      base64DataUrl = `data:image/png;base64,${base64Image}`;
      methodUsed = 'LoremFlickr (Keyword Match)';
      console.log(`[AI Lab] LoremFlickr image converted to Base64. Length: ${base64DataUrl.length}`);
    } catch (err) {
      console.error(`[AI Lab] LoremFlickr fallback failed: ${err.message}`);
    }
  }

  if (base64DataUrl) {
    console.log(`[AI Lab] Generation successful using ${methodUsed}`);
    return res.json({ imageUrl: base64DataUrl, prompt: cleanPrompt });
  } else {
    return res.status(500).json({
      error: 'Failed to generate image. Please check backend logs.',
    });
  }
});

export default router;
