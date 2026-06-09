# Artify Deployment Guide (Vercel & Render)

This guide provides step-by-step instructions to deploy your **Artify** application, with the frontend on **Vercel** and the backend on **Render**.

---

## Part 1: Deploying the Backend on Render

Render is a cloud platform that makes it easy to host backend API servers and Socket.io services.

### Steps:
1. Log in or sign up at [Render](https://render.com/).
2. On the Dashboard, click **New +** and select **Web Service**.
3. Connect your GitHub repository containing the project.
4. Configure the Web Service settings:
   * **Name**: `artify-backend` (or any name you prefer)
   * **Region**: Choose the region closest to you or your database
   * **Branch**: `main` (or your active development branch)
   * **Root Directory**: `backend` (⚠️ **CRITICAL**: Set this to `backend` because the Express code is in the subfolder).
   * **Runtime**: `Node`
   * **Build Command**: `npm install`
   * **Start Command**: `npm start`
   * **Instance Type**: `Free` (or any tier of your choice)
5. Scroll down and click **Advanced** -> **Add Environment Variable**. Add the following environment variables:

| Key | Value | Notes |
| :--- | :--- | :--- |
| `PORT` | `10000` (or leave default) | Render sets this automatically, but Express binds to it via `process.env.PORT`. |
| `SUPABASE_URL` | `https://your-project.supabase.co` | Your Supabase project API URL. |
| `SUPABASE_SERVICE_KEY` | `sb_secret_...` | Supabase **service_role** secret key (required for auto-bucket creation and storage management). |
| `CLERK_PUBLISHABLE_KEY` | `pk_test_...` | Clerk publishable key for user authentication. |
| `CLERK_SECRET_KEY` | `sk_test_...` | Clerk secret key. |
| `GEMINI_API_KEY` | `AIzaSy...` | Google AI Studio API key for image generation. |

6. Click **Create Web Service**. 
7. Once the build finishes and status is **Live**, copy your Web Service URL (e.g., `https://artify-backend.onrender.com`). You will need this for the frontend configuration.

---

## Part 2: Deploying the Frontend on Vercel

Vercel is the native hosting platform for Next.js, providing optimal speed, auto-scaling, and easy configuration.

### Steps:
1. Log in or sign up at [Vercel](https://vercel.com/).
2. Click **Add New** and select **Project**.
3. Import the Git repository containing your project.
4. In the **Configure Project** screen:
   * **Framework Preset**: `Next.js`
   * **Root Directory**: Click *Edit* and select the `frontend` folder (⚠️ **CRITICAL**: The Next.js app is inside the `frontend` directory).
   * **Build and Development Settings**: Leave as default.
5. Expand the **Environment Variables** section and add the following keys:

| Key | Value | Notes |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | `https://artify-backend.onrender.com/api` | Point this to your Render backend API endpoint. |
| `NEXT_PUBLIC_SOCKET_URL` | `https://artify-backend.onrender.com` | Point this to your Render backend root (for Socket.io DM connections). |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_test_...` | Your Clerk publishable key. |
| `CLERK_SECRET_KEY` | `sk_test_...` | Your Clerk secret key. |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` | Path to Sign-in page. |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` | Path to Sign-up page. |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project.supabase.co` | Your Supabase project API URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_...` | Supabase publishable anon key. |

6. Click **Deploy**.
7. Vercel will build and host your Next.js frontend app.

---

## Part 3: Post-Deployment Setup (Clerk Configuration)

Since your frontend domain will change from `localhost` to your new Vercel domain (e.g., `https://artify-frontend.vercel.app`), you must configure Clerk:

1. Open your **Clerk Dashboard** and go to **Paths** or **Paths & Redirects**.
2. Update the **Allowed Redirect Origins** or production application URLs to include your new Vercel domain.
3. If using Clerk in development mode, you can add your Vercel URL to the development domain testing list, or transition to a Production Clerk instance for official launch.
