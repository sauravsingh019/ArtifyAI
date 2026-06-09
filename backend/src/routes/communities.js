import express from 'express';
import { supabase } from '../lib/supabase.js';
import { requireDBUser } from '../middleware/auth.js';

const router = express.Router();

// ─── GET all communities ──────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { data: communities, error } = await supabase
      .from('communities')
      .select(`
        *,
        creator:users(username),
        community_members(user_id)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(communities.map(c => ({
      ...c,
      _count: { members: c.community_members?.length || 0 },
    })));
  } catch (error) {
    console.error('[Fetch Communities Error]', error.message);
    res.status(500).json({ error: 'Failed to fetch communities' });
  }
});

// ─── GET single community + its posts ────────────────────────────────────────
router.get('/:id', async (req, res) => {
  const communityId = req.params.id;

  try {
    const { data: community, error } = await supabase
      .from('communities')
      .select(`
        *,
        creator:users(id, username, avatar_url),
        community_members(user:users(id, username, avatar_url))
      `)
      .eq('id', communityId)
      .single();

    if (error || !community) return res.status(404).json({ error: 'Community not found' });

    const { data: posts } = await supabase
      .from('posts')
      .select(`
        *,
        author:users(username, avatar_url),
        likes(*),
        comments(*)
      `)
      .ilike('category', community.name)
      .order('created_at', { ascending: false });

    res.json({ community, posts: posts || [] });
  } catch (error) {
    console.error('[Community Details Error]', error.message);
    res.status(500).json({ error: 'Failed to fetch community details' });
  }
});

// ─── POST create community ────────────────────────────────────────────────────
router.post('/', requireDBUser, async (req, res) => {
  const { name, description, coverImage } = req.body;
  if (!name) return res.status(400).json({ error: 'Community name is required' });

  try {
    const { data: existing } = await supabase
      .from('communities')
      .select('id')
      .ilike('name', name)
      .single();

    if (existing) return res.status(400).json({ error: 'Community name already exists' });

    const { data: community, error } = await supabase
      .from('communities')
      .insert({
        name,
        description: description || '',
        cover_image: coverImage || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600',
        creator_id: req.dbUser.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // Creator auto-joins
    await supabase.from('community_members').insert({
      community_id: community.id,
      user_id: req.dbUser.id,
      joined_at: new Date().toISOString(),
    });

    res.status(201).json(community);
  } catch (error) {
    console.error('[Create Community Error]', error.message);
    res.status(500).json({ error: 'Failed to create community' });
  }
});

// ─── POST join / leave community ─────────────────────────────────────────────
router.post('/:id/join', requireDBUser, async (req, res) => {
  const communityId = req.params.id;
  const userId = req.dbUser.id;

  try {
    const { data: existing } = await supabase
      .from('community_members')
      .select('user_id')
      .eq('community_id', communityId)
      .eq('user_id', userId)
      .single();

    if (existing) {
      await supabase.from('community_members').delete()
        .eq('community_id', communityId).eq('user_id', userId);
      return res.json({ joined: false });
    } else {
      await supabase.from('community_members').insert({
        community_id: communityId,
        user_id: userId,
        joined_at: new Date().toISOString(),
      });
      return res.json({ joined: true });
    }
  } catch (error) {
    console.error('[Community Join/Leave Error]', error.message);
    res.status(500).json({ error: 'Failed to join/leave community' });
  }
});

export default router;
