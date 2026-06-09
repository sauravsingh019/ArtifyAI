import express from 'express';
import { supabase } from '../lib/supabase.js';
import fs from 'fs';

const router = express.Router();

// ─── Sync Clerk user → Supabase users table ───────────────────────────────────
router.post('/sync', async (req, res) => {
  const userId = req.auth?.userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized: Session missing' });

  const { email, username, name, avatarUrl, bannerUrl } = req.body;

  try {
    // Check if user already exists
    const { data: existing } = await supabase
      .from('users')
      .select('id, avatar_url')
      .eq('id', userId)
      .single();

    let user;
    if (existing) {
      // Smart avatar logic:
      // - If user has a Supabase Storage photo (supabase.co URL) → keep it, don't overwrite
      // - If user has a Clerk/external photo or no photo → update with latest Clerk photo
      const hasSupabaseAvatar = existing.avatar_url?.includes('supabase.co');

      const { data, error } = await supabase
        .from('users')
        .update({
          ...(email && { email }),
          ...(username && { username }),
          ...(name && { name }),
          ...(!hasSupabaseAvatar && avatarUrl && { avatar_url: avatarUrl }),
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      user = data;
    } else {

      // Create new user
      const { data, error } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: email || `temp_${userId}@artify.io`,
          username: username || `creator_${userId.substring(5, 13).toLowerCase()}`,
          name: name || 'Creator',
          avatar_url: avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
          banner_url: bannerUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&q=80',
          bio: '3D Developer & AI Content Creator',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      user = data;
    }

    // Map snake_case → camelCase for frontend compatibility
    res.status(200).json(mapUser(user));
  } catch (error) {
    console.error('[Auth Sync Error]', error.message);
    res.status(500).json({ error: error.message || 'Failed to sync user session' });
  }
});

// ─── Update profile (bio, name, avatar, banner) ───────────────────────────────
router.put('/profile', async (req, res) => {
  const userId = req.auth?.userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { name, bio, avatarUrl, bannerUrl } = req.body;

  try {
    // First check if user exists
    const { data: existing } = await supabase
      .from('users')
      .select('id, email, username')
      .eq('id', userId)
      .single();

    let data, error;

    if (existing) {
      // Update existing user
      ({ data, error } = await supabase
        .from('users')
        .update({
          ...(name !== undefined && { name }),
          ...(bio !== undefined && { bio }),
          ...(avatarUrl !== undefined && { avatar_url: avatarUrl }),
          ...(bannerUrl !== undefined && { banner_url: bannerUrl }),
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single());
    } else {
      // User not in DB yet — create them
      ({ data, error } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: `temp_${userId}@artify.io`,
          username: `creator_${userId.substring(5, 13).toLowerCase()}`,
          name: name || 'Creator',
          bio: bio || '',
          avatar_url: avatarUrl || '',
          banner_url: bannerUrl || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single());
    }

    if (error) {
      console.error('[Update Profile DB Error]', error);
      throw error;
    }

    console.log('[Profile Updated]', userId, '→ avatarUrl:', data.avatar_url?.substring(0, 60));
    res.json(mapUser(data));
  } catch (error) {
    console.error('[Update Profile Error]', error.message);
    try {
      fs.writeFileSync('upload-error.txt', `[${new Date().toISOString()}] Profile update DB failed: ${error.message}\nStack: ${error.stack}`);
    } catch (e) {}
    res.status(500).json({ error: 'Failed to update profile' });
  }
});


// ─── Get profile by username ──────────────────────────────────────────────────
router.get('/profile/:username', async (req, res) => {
  const { username } = req.params;

  try {
    // Get user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .ilike('username', username)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's posts with likes and comments
    const { data: posts } = await supabase
      .from('posts')
      .select(`
        *,
        likes(*),
        comments(*, user:users(username, avatar_url))
      `)
      .eq('author_id', user.id)
      .order('created_at', { ascending: false });

    // Get user's 3D models
    const { data: models } = await supabase
      .from('models')
      .select('*')
      .eq('author_id', user.id)
      .order('created_at', { ascending: false });

    // Get posts the user liked
    const { data: likedPosts } = await supabase
      .from('likes')
      .select(`
        post:posts(
          *,
          author:users(id, username, name, avatar_url),
          likes(*),
          comments(*)
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    res.json({
      ...mapUser(user),
      posts: (posts || []).map(mapPost),
      models: models || [],
      likes: (likedPosts || []).map(l => l.post ? { post: mapPost(l.post) } : null).filter(Boolean),
    });
  } catch (error) {
    console.error('[Get Profile Error]', error.message);
    res.status(500).json({ error: 'Failed to retrieve profile' });
  }
});

// ─── Helpers: map DB snake_case → frontend camelCase ─────────────────────────
function mapUser(u) {
  if (!u) return null;
  return {
    id: u.id,
    email: u.email,
    username: u.username,
    name: u.name,
    bio: u.bio,
    avatarUrl: u.avatar_url,
    bannerUrl: u.banner_url,
    createdAt: u.created_at,
    updatedAt: u.updated_at,
  };
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
    comments: p.comments || [],
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  };
}

export default router;
