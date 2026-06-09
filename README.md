# Artify — Creative Hub for 3D & AI Artists 🎨🚀

Artify is a high-performance, premium web application designed for 3D modelers and AI digital artists. Creators can share their publications, upload and display spatial 3D models (GLTF/GLB) with an interactive 3D viewer, generate brand-new AI masterworks using Google AI Studio (Gemini API with Imagen 4), and chat with fellow designers in real-time.

---

## 🛠️ Technology Stack

- **Frontend**: Next.js (App Router), React, Lucide Icons, Framer Motion, Three.js / React Three Fiber (for 3D preview), CSS Modules
- **Backend**: Node.js, Express API, Socket.io (Real-time DMs)
- **Database & Storage**: Supabase (PostgreSQL Database & S3 Storage Buckets)
- **Authentication**: Clerk (User sessions, Profile management, Secure Auth)
- **AI Synthesis**: Google AI Studio (Gemini API - Imagen 4 model `imagen-4.0-generate-001`)

---

## 📁 Repository Structure

```text
Artify/
├── backend/                  # Express API server & Sockets
│   ├── src/
│   │   ├── lib/supabase.js   # Supabase client & storage helpers
│   │   ├── routes/           # REST endpoints (auth, posts, chat, upload, generate)
│   │   └── server.js         # Entry point (Express + Socket.io listener)
│   ├── .env                  # Backend credentials (Supabase, Clerk, Gemini)
│   └── package.json
├── frontend/                 # Next.js web application
│   ├── src/app/              # Next.js pages (profile, chat, generate, feed)
│   ├── .env.local            # Frontend credentials (Clerk, Supabase)
│   └── package.json
├── supabase-schema.sql       # PostgreSQL table schemas & RLS policies
└── .gitignore                # Global git ignore configuration
```

---

## 🔑 Environment Setup

### 1. Backend (`backend/.env`)
Create a `.env` file in the `backend/` folder:
```env
PORT=5000

# Supabase Credentials (uses service_role key to bypass RLS)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key

# Clerk Authentication Secrets
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Gemini API Key (AI Image Lab)
GEMINI_API_KEY=your_gemini_api_key_here
```

### 2. Frontend (`frontend/.env.local`)
Create a `.env.local` file in the `frontend/` folder:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000

# Clerk Keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Supabase Keys
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## 💾 Database & Storage Setup

1. **Database Tables**: Go to **Supabase Dashboard > SQL Editor > New Query**, paste the contents of `supabase-schema.sql` (located in the root folder), and click **Run**. This will create the required tables (`profiles`, `posts`, `messages`, `models`) and configure relations.
2. **Storage Buckets**: The backend is configured to **automatically verify and create** all required storage buckets on startup. When you start the backend server, it will check for and create the following buckets as **Public**:
   - `avatars` (For profile photos)
   - `banners` (For profile header banners)
   - `posts` (For user publications)
   - `models` (For 3D spatial files & thumbnails)

---

## ⚡ How to Run

Open two terminal windows:

### Run Backend
```bash
cd backend
npm install
npm run dev
```

### Run Frontend
```bash
cd frontend
npm install
npm run dev
```
Open your browser and navigate to `http://localhost:3000`.

---

## 🚀 Key Improvements & Updates (June 2026)

- **AI Lab Integration (Gemini Imagen 4)**: Transitioned image generation from Replicate completely to Google AI Studio's **Imagen 4** model (`imagen-4.0-generate-001`). Cleaned up and removed all old Replicate references and packages from the project.
- **Robust Keyword Fallback (LoremFlickr)**: Integrated a high-speed, 100% free fallback using LoremFlickr (extracting relevant prompt keywords using a smart stop-word filter) if the AI key is missing, hits a quota, or returns a billing limit error.
- **Base64 Server-Side Encoding**: Base64 data encoding has been shifted entirely to the backend, ensuring browser-level requests bypass CORS, mixed content, or domain blocks.
- **Auto-Provisioning Buckets**: Backend automatically initializes and configures Supabase Storage buckets on startup with proper public access.
- **Cache-Busting for Profile Images**: Implemented dynamic URL query tags (`?t=timestamp`) to bypass aggressive browser caching so new avatars and banners load instantly on upload.
- **Secure File Uploads**: Replaced base64 database writes inside the Edit Profile Modal with direct-to-Supabase file streams, ensuring lightweight database records and avoiding database payload limits.
- **DM Alignment & Key Mapping**: Aligned database message schemas (snake_case) with Socket.io objects (camelCase) to ensure sent/received messages align on the correct sides of the viewport on refresh.
- **Publication Deletion**: Added a responsive, animated delete button on profile publication cards (only visible to profile owners) to easily remove posts with soft confirmation dialogs.
- **Category-Balanced Seed Merge**: Seeded exactly 10 mock posts across 5 categories and 5 creators. Implemented a smart frontend merging system that displays database uploads at the top while keeping the feed populated with seed posts.
- **Codebase Sanitization**: Deleted all 15+ legacy test scripts, test images, and temporary folders to keep the repository extremely clean, lightweight, and production-ready.
