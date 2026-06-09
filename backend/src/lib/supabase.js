import { createClient } from '@supabase/supabase-js';

// Lazy client - created only when first used (after dotenv loads)
let _client = null;

export function getSupabase() {
  if (!_client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;

    if (!url || !key) {
      throw new Error('[Supabase] SUPABASE_URL or SUPABASE_SERVICE_KEY missing in .env file!');
    }

    _client = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    console.log('[Supabase] Client initialized:', url);
    
    // Automatically verify and create required buckets in the background
    ensureBucketsExist(_client);
  }
  return _client;
}

import fs from 'fs';

async function ensureBucketsExist(client) {
  let log = `[${new Date().toISOString()}] Starting bucket verification...\n`;
  try {
    const { data: buckets, error: listError } = await client.storage.listBuckets();
    if (listError) {
      log += `Error listing buckets: ${listError.message}\n`;
      try {
        fs.writeFileSync('storage-debug.txt', log);
      } catch (e) {}
      return;
    }
    const existingNames = (buckets || []).map(b => b.name);
    log += `Existing buckets: ${existingNames.join(', ')}\n`;
    const required = ['avatars', 'banners', 'posts', 'models'];
    for (const bucket of required) {
      if (!existingNames.includes(bucket)) {
        log += `Bucket "${bucket}" is missing. Creating...\n`;
        const { error } = await client.storage.createBucket(bucket, {
          public: true,
          fileSizeLimit: 52428800 // 50MB
        });
        if (error) {
          log += `Failed to create bucket "${bucket}": ${error.message}\n`;
        } else {
          log += `Created bucket "${bucket}" successfully!\n`;
        }
      } else {
        log += `Bucket "${bucket}" already exists. Ensuring it is public...\n`;
        const { error } = await client.storage.updateBucket(bucket, {
          public: true
        });
        if (error) {
          log += `Failed to update bucket "${bucket}" to public: ${error.message}\n`;
        } else {
          log += `Bucket "${bucket}" is verified public.\n`;
        }
      }
    }

    // Diagnostics: Query users table to verify avatar_url and banner_url values
    try {
      const { data: users, error: userError } = await client.from('users').select('id, username, avatar_url, banner_url');
      let dbLog = `[${new Date().toISOString()}] Database Users:\n`;
      if (userError) {
        dbLog += `Error querying users table: ${userError.message}\n`;
      } else {
        dbLog += `Found ${users.length} users in DB:\n`;
        users.forEach(u => {
          dbLog += `- User ID: ${u.id}\n  Username: @${u.username}\n  Avatar URL: ${u.avatar_url}\n  Banner URL: ${u.banner_url}\n\n`;
        });
      }
      fs.writeFileSync('db-user-debug.txt', dbLog);
    } catch (dbErr) {
      console.error('Failed to log DB users:', dbErr.message);
    }

  } catch (err) {
    log += `Auto-bucket check failed: ${err.message}\n`;
  }
  try {
    fs.writeFileSync('storage-debug.txt', log);
  } catch (fsErr) {
    console.error('Failed to write storage-debug.txt:', fsErr.message);
  }
}
// Shorthand — use this in routes: const supabase = getSupabase()
export const supabase = new Proxy({}, {
  get(_, prop) {
    return getSupabase()[prop];
  }
});

// ─── Storage Helpers ─────────────────────────────────────────────────────────

export async function uploadFile(bucket, path, base64, mime) {
  const client = getSupabase();
  const raw = base64.replace(/^data:[^;]+;base64,/, '');
  const buffer = Buffer.from(raw, 'base64');

  const { error } = await client.storage
    .from(bucket)
    .upload(path, buffer, { contentType: mime, upsert: true });

  if (error) throw new Error(`Storage upload failed [${bucket}/${path}]: ${error.message}`);

  const { data } = client.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteFile(bucket, path) {
  const client = getSupabase();
  await client.storage.from(bucket).remove([path]);
}
