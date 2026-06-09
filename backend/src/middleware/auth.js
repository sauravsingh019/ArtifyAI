import { supabase } from '../lib/supabase.js';

/**
 * Middleware: Ensure Clerk-authenticated user exists in Supabase `users` table.
 * Attaches req.dbUser for downstream route handlers.
 */
export const requireDBUser = async (req, res, next) => {
  const userId = req.auth?.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized: No user session found' });
  }

  try {
    // Look up user in Supabase
    let { data: dbUser, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    // If not found, create a placeholder (will be updated on /auth/sync)
    if (!dbUser || error?.code === 'PGRST116') {
      const placeholder = {
        id: userId,
        email: `temp_${userId}@artify.io`,
        username: `creator_${userId.substring(5, 13).toLowerCase()}`,
        name: 'Creator',
        avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        bio: '3D Developer & AI Content Creator',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert(placeholder)
        .select()
        .single();

      if (createError) throw createError;
      dbUser = newUser;
    } else if (error) {
      throw error;
    }

    req.dbUser = dbUser;
    next();
  } catch (error) {
    console.error('[Auth Middleware] Error:', error.message);
    res.status(500).json({ error: 'Internal Server Error during user validation' });
  }
};
