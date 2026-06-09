import express from 'express';
import { supabase } from '../lib/supabase.js';
import { requireDBUser } from '../middleware/auth.js';

const router = express.Router();

// ─── Seed demo data once ─────────────────────────────────────────────────────
const DEMO_USERS = [
  { id: 'mock_u1', email: 'nebula@artify.io', username: 'nebulalab', name: 'Nebula Lab', avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100', bio: 'Verified Artify Creator & Designer' },
  { id: 'mock_u2', email: 'blender@artify.io', username: 'blender_god', name: 'Blender Masters', avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100', bio: 'Verified Artify Creator & Designer' },
  { id: 'mock_u3', email: 'neural@artify.io', username: 'neural_painter', name: 'AI Synthesizer', avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', bio: 'Verified Artify Creator & Designer' },
  { id: 'mock_u4', email: 'cyber@artify.io', username: 'cyber_canvas', name: 'Composite Artist', avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100', bio: 'Verified Artify Creator & Designer' },
  { id: 'mock_u5', email: 'concept@artify.io', username: 'concept_hq', name: 'Art Director', avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100', bio: 'Verified Artify Creator & Designer' },
];

const DEMO_POSTS = [
  { id: 'demo_p1', image_url: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=800', caption: 'Quantum spatial node mesh rendered in Blender Cycles with custom chromatic refraction shaders.', category: '3D Render', author_id: 'mock_u1' },
  { id: 'demo_p2', image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800', caption: 'Abstract glass torus geometric projection in octane render.', category: '3D Render', author_id: 'mock_u1' },
  { id: 'demo_p3', image_url: 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=800', caption: 'Hard-surface detailing exercise. Sub-d modeling method, 4k texture sets.', category: 'Blender', author_id: 'mock_u2' },
  { id: 'demo_p4', image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800', caption: 'Stylized low-poly environment study rendered in Eevee.', category: 'Blender', author_id: 'mock_u2' },
  { id: 'demo_p5', image_url: 'https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?w=800', caption: 'Futuristic cybernetic cathedral constructed from tinted smart glass and gold trim, octane render, 8k.', category: 'AI Art', author_id: 'mock_u3' },
  { id: 'demo_p6', image_url: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=800', caption: 'Deep space anomaly visualised through diffusion model prompt strings.', category: 'AI Art', author_id: 'mock_u3' },
  { id: 'demo_p7', image_url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800', caption: 'Composite artwork overlaying double-exposure city grids and glowing prompt coordinate strings.', category: 'Photoshop', author_id: 'mock_u4' },
  { id: 'demo_p8', image_url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800', caption: 'Cyberpunk street overlay graphic design and photo manipulation.', category: 'Photoshop', author_id: 'mock_u4' },
  { id: 'demo_p9', image_url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800', caption: 'Early mood-board concept sketch for a deep-space docking station biome.', category: 'Concept Art', author_id: 'mock_u5' },
  { id: 'demo_p10', image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800', caption: 'Sci-fi structural ruins concept sketch for game design environment.', category: 'Concept Art', author_id: 'mock_u5' },
];

let seeded = false;
async function seedDemoData() {
  if (seeded) return;
  seeded = true;
  try {
    for (const u of DEMO_USERS) {
      await supabase.from('users').upsert(
        { ...u, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { onConflict: 'id', ignoreDuplicates: true }
      );
    }
    for (const p of DEMO_POSTS) {
      await supabase.from('posts').upsert(
        { ...p, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { onConflict: 'id', ignoreDuplicates: true }
      );
    }
    console.log('[Seed] Demo data seeded to Supabase');
  } catch (err) {
    console.error('[Seed Error]', err.message);
  }
}

// ─── GET all posts (feed) ─────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  await seedDemoData();

  try {
    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        *,
        author:users(id, username, name, avatar_url),
        likes(*),
        comments(*, user:users(username, avatar_url))
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(posts.map(mapPost));
  } catch (error) {
    console.error('[Fetch Posts Error]', error.message);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// ─── POST create post ─────────────────────────────────────────────────────────
router.post('/', requireDBUser, async (req, res) => {
  const { imageUrl, caption, category } = req.body;
  if (!imageUrl || !caption) {
    return res.status(400).json({ error: 'Image URL and Caption are required' });
  }

  try {
    const { data: post, error } = await supabase
      .from('posts')
      .insert({
        image_url: imageUrl,
        caption,
        category: category || 'General',
        author_id: req.dbUser.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select(`*, author:users(id, username, name, avatar_url), likes(*), comments(*)`)
      .single();

    if (error) throw error;
    res.status(201).json(mapPost(post));
  } catch (error) {
    console.error('[Create Post Error]', error.message);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// ─── POST toggle like ─────────────────────────────────────────────────────────
router.post('/:id/like', requireDBUser, async (req, res) => {
  const postId = req.params.id;
  const userId = req.dbUser.id;

  try {
    const { data: existing } = await supabase
      .from('likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .single();

    if (existing) {
      await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', userId);
      return res.json({ liked: false });
    } else {
      await supabase.from('likes').insert({
        post_id: postId,
        user_id: userId,
        created_at: new Date().toISOString(),
      });
      return res.json({ liked: true });
    }
  } catch (error) {
    console.error('[Like Toggle Error]', error.message);
    res.status(500).json({ error: 'Failed to toggle like' });
  }
});

// ─── POST add comment ─────────────────────────────────────────────────────────
router.post('/:id/comment', requireDBUser, async (req, res) => {
  const postId = req.params.id;
  const userId = req.dbUser.id;
  const { content } = req.body;

  if (!content) return res.status(400).json({ error: 'Comment content cannot be empty' });

  try {
    const { data: comment, error } = await supabase
      .from('comments')
      .insert({
        content,
        post_id: postId,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('*, user:users(username, avatar_url)')
      .single();

    if (error) throw error;
    res.status(201).json(comment);
  } catch (error) {
    console.error('[Comment Error]', error.message);
    res.status(500).json({ error: 'Failed to post comment' });
  }
});

// ─── DELETE post ──────────────────────────────────────────────────────────────
router.delete('/:id', requireDBUser, async (req, res) => {
  const postId = req.params.id;

  try {
    const { data: post } = await supabase
      .from('posts')
      .select('author_id')
      .eq('id', postId)
      .single();

    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.author_id !== req.dbUser.id) return res.status(403).json({ error: 'Unauthorized' });

    await supabase.from('posts').delete().eq('id', postId);
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('[Delete Post Error]', error.message);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function mapUser(u) {
  if (!u) return null;
  return { id: u.id, username: u.username, name: u.name, avatarUrl: u.avatar_url };
}

function mapPost(p) {
  if (!p) return null;
  return {
    id: p.id,
    imageUrl: p.image_url,
    caption: p.caption,
    category: p.category,
    authorId: p.author_id,
    author: p.author ? mapUser(p.author) : undefined,
    likes: p.likes || [],
    comments: (p.comments || []).map(c => ({
      ...c,
      user: c.user ? { username: c.user.username, avatarUrl: c.user.avatar_url } : undefined,
    })),
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  };
}

export default router;
