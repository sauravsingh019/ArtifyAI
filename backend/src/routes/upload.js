import express from 'express';
import { uploadFile } from '../lib/supabase.js';
import fs from 'fs';

const router = express.Router();

// ─── Upload avatar to Supabase Storage ───────────────────────────────────────
router.post('/avatar', async (req, res) => {
  const userId = req.auth?.userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { fileData, fileType } = req.body;
  if (!fileData) return res.status(400).json({ error: 'No file data provided' });

  try {
    const ext = fileType?.split('/')[1] || 'jpg';
    const url = await uploadFile('avatars', `${userId}/avatar.${ext}`, fileData, fileType || 'image/jpeg');
    res.json({ url });
  } catch (err) {
    console.error('[Upload Avatar Error]', err.message);
    try {
      fs.writeFileSync('upload-error.txt', `[${new Date().toISOString()}] Avatar upload failed: ${err.message}\nStack: ${err.stack}`);
    } catch (e) {}
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
});

// ─── Upload banner to Supabase Storage ───────────────────────────────────────
router.post('/banner', async (req, res) => {
  const userId = req.auth?.userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { fileData, fileType } = req.body;
  if (!fileData) return res.status(400).json({ error: 'No file data provided' });

  try {
    const ext = fileType?.split('/')[1] || 'jpg';
    const url = await uploadFile('banners', `${userId}/banner.${ext}`, fileData, fileType || 'image/jpeg');
    res.json({ url });
  } catch (err) {
    console.error('[Upload Banner Error]', err.message);
    try {
      fs.writeFileSync('upload-error.txt', `[${new Date().toISOString()}] Banner upload failed: ${err.message}\nStack: ${err.stack}`);
    } catch (e) {}
    res.status(500).json({ error: 'Failed to upload banner' });
  }
});

// ─── Upload post image to Supabase Storage ───────────────────────────────────
router.post('/post', async (req, res) => {
  const userId = req.auth?.userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { fileData, fileType } = req.body;
  if (!fileData) return res.status(400).json({ error: 'No file data provided' });

  try {
    const ext = fileType?.split('/')[1] || 'jpg';
    const timestamp = Date.now();
    const url = await uploadFile('posts', `${userId}/${timestamp}.${ext}`, fileData, fileType || 'image/jpeg');
    res.json({ url });
  } catch (err) {
    console.error('[Upload Post Error]', err.message);
    res.status(500).json({ error: 'Failed to upload post image' });
  }
});

// ─── Upload 3D model to Supabase Storage ─────────────────────────────────────
router.post('/model', async (req, res) => {
  const userId = req.auth?.userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { fileData, fileType, fileName, thumbnailData, thumbnailType } = req.body;
  if (!fileData) return res.status(400).json({ error: 'No file data provided' });

  try {
    const timestamp = Date.now();
    const ext = fileName?.split('.').pop() || 'glb';
    const modelUrl = await uploadFile('models', `${userId}/${timestamp}.${ext}`, fileData, fileType || 'model/gltf-binary');

    let thumbnailUrl = null;
    if (thumbnailData) {
      const thumbExt = thumbnailType?.split('/')[1] || 'jpg';
      thumbnailUrl = await uploadFile('models', `${userId}/${timestamp}_thumb.${thumbExt}`, thumbnailData, thumbnailType || 'image/jpeg');
    }

    res.json({ modelUrl, thumbnailUrl });
  } catch (err) {
    console.error('[Upload Model Error]', err.message);
    res.status(500).json({ error: 'Failed to upload 3D model' });
  }
});

export default router;
