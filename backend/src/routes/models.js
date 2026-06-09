import express from 'express';
import { supabase } from '../lib/supabase.js';
import { requireDBUser } from '../middleware/auth.js';

const router = express.Router();

// ─── GET all 3D models ────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { data: models, error } = await supabase
      .from('models')
      .select(`*, author:users(id, username, name, avatar_url)`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(models.map(mapModel));
  } catch (error) {
    console.error('[Fetch Models Error]', error.message);
    res.status(500).json({ error: 'Failed to fetch 3D models' });
  }
});

// ─── POST create 3D model ─────────────────────────────────────────────────────
router.post('/', requireDBUser, async (req, res) => {
  const { name, description, modelUrl, thumbnailUrl, category } = req.body;

  if (!name || !modelUrl) {
    return res.status(400).json({ error: 'Model name and file URL are required' });
  }

  try {
    const { data: model, error } = await supabase
      .from('models')
      .insert({
        name,
        description: description || '',
        model_url: modelUrl,
        thumbnail_url: thumbnailUrl || 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=300',
        category: category || 'General',
        author_id: req.dbUser.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select(`*, author:users(id, username, name, avatar_url)`)
      .single();

    if (error) throw error;
    res.status(201).json(mapModel(model));
  } catch (error) {
    console.error('[Create Model Error]', error.message);
    res.status(500).json({ error: 'Failed to save 3D model' });
  }
});

// ─── DELETE 3D model ──────────────────────────────────────────────────────────
router.delete('/:id', requireDBUser, async (req, res) => {
  const modelId = req.params.id;

  try {
    const { data: model } = await supabase
      .from('models')
      .select('author_id')
      .eq('id', modelId)
      .single();

    if (!model) return res.status(404).json({ error: 'Model not found' });
    if (model.author_id !== req.dbUser.id) return res.status(403).json({ error: 'Unauthorized' });

    await supabase.from('models').delete().eq('id', modelId);
    res.json({ message: 'Model deleted successfully' });
  } catch (error) {
    console.error('[Delete Model Error]', error.message);
    res.status(500).json({ error: 'Failed to delete model' });
  }
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function mapModel(m) {
  if (!m) return null;
  return {
    id: m.id,
    name: m.name,
    description: m.description,
    modelUrl: m.model_url,
    thumbnailUrl: m.thumbnail_url,
    category: m.category,
    authorId: m.author_id,
    author: m.author ? { id: m.author.id, username: m.author.username, name: m.author.name, avatarUrl: m.author.avatar_url } : undefined,
    createdAt: m.created_at,
    updatedAt: m.updated_at,
  };
}

export default router;
