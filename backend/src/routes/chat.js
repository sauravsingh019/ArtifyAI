import express from 'express';
import { supabase } from '../lib/supabase.js';
import { requireDBUser } from '../middleware/auth.js';

const router = express.Router();

// ─── GET all creators for chat directory ──────────────────────────────────────
router.get('/users', requireDBUser, async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, username, name, avatar_url, bio')
      .neq('id', req.dbUser.id);

    if (error) throw error;

    res.json(users.map(u => ({
      id: u.id,
      username: u.username,
      name: u.name,
      avatarUrl: u.avatar_url,
      bio: u.bio,
    })));
  } catch (error) {
    console.error('[Fetch Chat Users Error]', error.message);
    res.status(500).json({ error: 'Failed to fetch creators list' });
  }
});

// ─── GET messages between two users ──────────────────────────────────────────
router.get('/messages/:receiverId', requireDBUser, async (req, res) => {
  const currentUserId = req.dbUser.id;
  const { receiverId } = req.params;

  try {
    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select('*')
      .or(
        `and(sender_id.eq."${currentUserId}",receiver_id.eq."${receiverId}"),and(sender_id.eq."${receiverId}",receiver_id.eq."${currentUserId}")`
      )
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json(messages.map(m => ({
      id: m.id,
      senderId: m.sender_id || m.senderId,
      receiverId: m.receiver_id || m.receiverId,
      content: m.content,
      createdAt: m.created_at || m.createdAt
    })));
  } catch (error) {
    console.error('[Fetch Messages Error]', error.message);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// ─── POST save message (REST fallback) ───────────────────────────────────────
router.post('/message', requireDBUser, async (req, res) => {
  const senderId = req.dbUser.id;
  const { receiverId, content } = req.body;

  if (!receiverId || !content) {
    return res.status(400).json({ error: 'Receiver ID and content are required' });
  }

  try {
    const { data: msg, error } = await supabase
      .from('chat_messages')
      .insert({
        sender_id: senderId,
        receiver_id: receiverId,
        content,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({
      id: msg.id,
      senderId: msg.sender_id,
      receiverId: msg.receiver_id,
      content: msg.content,
      createdAt: msg.created_at
    });
  } catch (error) {
    console.error('[Send Message Error]', error.message);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

export default router;
