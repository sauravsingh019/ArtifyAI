import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY;

if (!url || !key) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(url, key);

async function inspect() {
  try {
    console.log('Connecting to Supabase:', url);
    
    // Check tables
    const { data: users, error: usersError } = await supabase.from('users').select('*');
    if (usersError) console.error('Error fetching users:', usersError.message);
    else console.log(`Users count: ${users.length}`, users);

    const { data: posts, error: postsError } = await supabase.from('posts').select('*');
    if (postsError) console.error('Error fetching posts:', postsError.message);
    else console.log(`Posts count: ${posts.length}`, posts);

    const { data: models, error: modelsError } = await supabase.from('models').select('*');
    if (modelsError) console.error('Error fetching models:', modelsError.message);
    else console.log(`Models count: ${models.length}`, models);

  } catch (err) {
    console.error('Inspection failed:', err);
  }
}

inspect();
