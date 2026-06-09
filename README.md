# 🎨 ArtifyAI — AI-Powered Creative Platform for 3D Artists & Digital Creators
🌐 Live App: https://artify-ai-virid.vercel.app/

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![React](https://img.shields.io/badge/React-19-blue)
![Node.js](https://img.shields.io/badge/Node.js-Backend-green)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E)
![Clerk](https://img.shields.io/badge/Authentication-Clerk-purple)
![Socket.io](https://img.shields.io/badge/Socket.io-Real--Time-orange)
![Google AI](https://img.shields.io/badge/Google_AI-Gemini_Imagen_4-red)

---

## 🚀 Overview

**Artify** is a modern full-stack creative platform built for **3D artists, AI creators, digital designers, and creative communities**. The platform enables users to showcase their artwork, upload interactive 3D models, generate AI-powered images, publish creative content, and communicate with other creators through real-time messaging.

The application combines **Artificial Intelligence, Cloud Infrastructure, Real-Time Communication, Secure Authentication, and Interactive 3D Visualization** into a unified creator ecosystem.

---

## ✨ Core Features

### 🤖 AI Image Generation

* Generate high-quality artwork using **Google AI Studio (Gemini API - Imagen 4)**.
* Intelligent fallback mechanism for uninterrupted image generation.
* Server-side image processing for enhanced reliability.
* Fast response times with optimized API workflows.

### 🧊 Interactive 3D Model Showcase

* Upload and display GLTF/GLB models.
* Real-time rendering using Three.js and React Three Fiber.
* Interactive controls including:

  * Rotation
  * Zoom
  * Pan
  * Model Inspection

### 📝 Creative Publishing

* Create and share publications.
* Showcase artwork and projects.
* Category-based content organization.
* Responsive publication management.

### 👤 Professional Creator Profiles

* Custom profile avatars.
* Personalized profile banners.
* Creator portfolio pages.
* Publication history and activity tracking.

### 💬 Real-Time Messaging

* Instant creator-to-creator communication.
* WebSocket-powered messaging.
* Message synchronization.
* Persistent chat history.

### 🔒 Authentication & Security

* Secure authentication with Clerk.
* Session management.
* Protected routes.
* Role-based access control.
* Supabase Row-Level Security (RLS).

### ☁️ Cloud Storage

* Secure file uploads.
* Scalable storage architecture.
* Automatic storage bucket management.
* Optimized media delivery.

---

# 🏗️ System Architecture

```text
┌───────────────────────────────────────────┐
│                 Users                     │
│  Artists • Creators • Designers           │
└─────────────────┬─────────────────────────┘
                  │
                  ▼
┌───────────────────────────────────────────┐
│          Next.js Frontend (React)         │
│                                           │
│ • Feed & Publications                     │
│ • Profile Management                      │
│ • AI Image Generator                      │
│ • 3D Model Viewer                         │
│ • Real-Time Chat                          │
└───────────────┬───────────────┬───────────┘
                │               │
                │ REST API      │ WebSocket
                ▼               ▼
┌─────────────────────┐   ┌────────────────┐
│   Express Backend   │   │   Socket.io    │
│                     │   │ Real-Time Chat │
│ • Posts API         │   └────────────────┘
│ • Upload API        │
│ • Profile API       │
│ • AI Generation API │
└──────┬─────────┬────┘
       │         │
       ▼         ▼
┌────────────┐  ┌───────────────────┐
│   Clerk    │  │ Google AI Studio  │
│ Auth       │  │ Gemini + Imagen 4 │
└────────────┘  └───────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│             Supabase                │
│                                     │
│ PostgreSQL Database                 │
│ • Profiles                          │
│ • Posts                             │
│ • Messages                          │
│ • Models                            │
│                                     │
│ Storage Buckets                     │
│ • Avatars                           │
│ • Banners                           │
│ • Posts                             │
│ • Models                            │
└─────────────────────────────────────┘
```

---

# 🔄 Application Workflow

```text
Start
 │
 ▼
User Login / Registration
 │
 ▼
Access Dashboard
 │
 ├─────────────┬─────────────┬─────────────┐
 ▼             ▼             ▼             ▼

Create Post  Upload 3D   Generate AI    Chat
             Model       Artwork        Users

 │             │             │             │
 ▼             ▼             ▼             ▼

Store in    Store in     Gemini API    Socket.io
Database    Storage      Processing    Messaging

 │             │             │             │
 └─────────────┴─────────────┴─────────────┘
               │
               ▼

      Feed & Community Hub

               │
               ▼

              End
```

---

# 🤖 AI Generation Workflow

```text
User Prompt
     │
     ▼
Frontend Interface
     │
     ▼
Express API
     │
     ▼
Gemini Imagen 4
     │
     ├── Success
     │      │
     │      ▼
     │ Generated Image
     │      │
     │      ▼
     │ Display Result
     │
     └── Failure / Quota Limit
             │
             ▼
      LoremFlickr Fallback
             │
             ▼
       Display Result
```

---

# 💬 Real-Time Messaging Workflow

```text
User A
 │
 ▼
Socket.io Client
 │
 ▼
Socket.io Server
 │
 ▼
Store Message
(Supabase)
 │
 ▼
Broadcast Event
 │
 ▼
User B
```

---

# 🛠️ Technology Stack

## Frontend

* Next.js (App Router)
* React.js
* TypeScript
* CSS Modules
* Framer Motion
* Lucide Icons
* Three.js
* React Three Fiber

## Backend

* Node.js
* Express.js
* Socket.io

## Database & Storage

* Supabase PostgreSQL
* Supabase Storage Buckets

## Authentication

* Clerk

## Artificial Intelligence

* Google AI Studio
* Gemini API
* Imagen 4

## Deployment Ready

* Vercel
* Railway
* Render
* VPS
* Docker Compatible

---

# 📂 Project Structure

```text
Artify/
│
├── backend/
│   ├── src/
│   │   ├── lib/
│   │   │   └── supabase.js
│   │   │
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── posts.js
│   │   │   ├── upload.js
│   │   │   ├── generate.js
│   │   │   └── chat.js
│   │   │
│   │   └── server.js
│   │
│   ├── .env
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── styles/
│   │
│   ├── .env.local
│   └── package.json
│
├── supabase-schema.sql
├── README.md
└── .gitignore
```

---

# 🔐 Environment Variables

## Backend (.env)

```env
PORT=5000

SUPABASE_URL=
SUPABASE_SERVICE_KEY=

CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

GEMINI_API_KEY=
```

## Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

---

# ⚡ Installation

## Clone Repository

```bash
git clone https://github.com/yourusername/artify.git
cd artify
```

---

## Backend Setup

```bash
cd backend
npm install
npm run dev
```

---

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## Open Application

```bash
http://localhost:3000
```

---

# 📈 Major Enhancements (2026)

### AI Infrastructure

* Migrated from Replicate to Gemini Imagen 4.
* Implemented intelligent fallback generation.

### Storage Optimization

* Automatic Supabase bucket provisioning.
* Direct file uploads.
* Optimized storage workflows.

### Performance Improvements

* Server-side image encoding.
* Cache-busting profile updates.
* Faster media delivery.

### Messaging Enhancements

* Schema alignment between database and Socket.io.
* Reliable real-time synchronization.

### Feed Management

* Category-balanced seeded content.
* Dynamic database content merging.

### Codebase Maintenance

* Removed legacy test files.
* Reduced technical debt.
* Improved maintainability.

---

# 🎯 Learning Outcomes

This project demonstrates expertise in:

* Full-Stack Development
* Next.js Application Architecture
* REST API Development
* Real-Time Systems
* WebSocket Communication
* AI Integration
* Cloud Storage Management
* Database Design
* Authentication & Security
* 3D Rendering & Visualization
* Performance Optimization
* Scalable System Design

---
