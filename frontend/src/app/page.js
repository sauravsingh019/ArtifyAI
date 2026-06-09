'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUser, useAuth, SignedIn, SignedOut, SignIn, SignUp } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  MessageSquare, 
  Send, 
  Tag, 
  Share2, 
  Loader, 
  Sparkles, 
  Box as BoxIcon, 
  Sliders, 
  Users, 
  ArrowRight,
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import styles from './page.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const FALLBACK_POSTS = [
  {
    id: 'demo_p1',
    imageUrl: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=800',
    caption: 'Quantum spatial node mesh rendered in Blender Cycles with custom chromatic refraction shaders.',
    category: '3D Render',
    likes: [],
    comments: [],
    author: {
      id: 'mock_u1',
      username: 'nebulalab',
      name: 'Nebula Lab',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
    }
  },
  {
    id: 'demo_p2',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800',
    caption: 'Abstract glass torus geometric projection in octane render.',
    category: '3D Render',
    likes: [],
    comments: [],
    author: {
      id: 'mock_u1',
      username: 'nebulalab',
      name: 'Nebula Lab',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
    }
  },
  {
    id: 'demo_p3',
    imageUrl: 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=800',
    caption: 'Hard-surface detailing exercise. Sub-d modeling method, 4k texture sets.',
    category: 'Blender',
    likes: [],
    comments: [],
    author: {
      id: 'mock_u2',
      username: 'blender_god',
      name: 'Blender Masters',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'
    }
  },
  {
    id: 'demo_p4',
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800',
    caption: 'Stylized low-poly environment study rendered in Eevee.',
    category: 'Blender',
    likes: [],
    comments: [],
    author: {
      id: 'mock_u2',
      username: 'blender_god',
      name: 'Blender Masters',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'
    }
  },
  {
    id: 'demo_p5',
    imageUrl: 'https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?w=800',
    caption: 'Futuristic cybernetic cathedral constructed from tinted smart glass and gold trim, octane render, 8k.',
    category: 'AI Art',
    likes: [],
    comments: [],
    author: {
      id: 'mock_u3',
      username: 'neural_painter',
      name: 'AI Synthesizer',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100'
    }
  },
  {
    id: 'demo_p6',
    imageUrl: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=800',
    caption: 'Deep space anomaly visualised through diffusion model prompt strings.',
    category: 'AI Art',
    likes: [],
    comments: [],
    author: {
      id: 'mock_u3',
      username: 'neural_painter',
      name: 'AI Synthesizer',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100'
    }
  },
  {
    id: 'demo_p7',
    imageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800',
    caption: 'Composite artwork overlaying double-exposure city grids and glowing prompt coordinate strings.',
    category: 'Photoshop',
    likes: [],
    comments: [],
    author: {
      id: 'mock_u4',
      username: 'cyber_canvas',
      name: 'Composite Artist',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100'
    }
  },
  {
    id: 'demo_p8',
    imageUrl: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800',
    caption: 'Cyberpunk street overlay graphic design and photo manipulation.',
    category: 'Photoshop',
    likes: [],
    comments: [],
    author: {
      id: 'mock_u4',
      username: 'cyber_canvas',
      name: 'Composite Artist',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100'
    }
  },
  {
    id: 'demo_p9',
    imageUrl: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800',
    caption: 'Early mood-board concept sketch for a deep-space docking station biome.',
    category: 'Concept Art',
    likes: [],
    comments: [],
    author: {
      id: 'mock_u5',
      username: 'concept_hq',
      name: 'Art Director',
      avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100'
    }
  },
  {
    id: 'demo_p10',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800',
    caption: 'Sci-fi structural ruins concept sketch for game design environment.',
    category: 'Concept Art',
    likes: [],
    comments: [],
    author: {
      id: 'mock_u5',
      username: 'concept_hq',
      name: 'Art Director',
      avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100'
    }
  }
];

// --- FEED CONTENT FOR SIGNED-IN USERS ---
function FeedPageContent() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeCommentsPostId, setActiveCommentsPostId] = useState(null);
  const [newCommentText, setNewCommentText] = useState('');

  const categories = ['All', '3D Render', 'AI Art', 'Concept Art', 'Blender', 'Photoshop', 'General'];

  // Sync Clerk User with PostgreSQL
  useEffect(() => {
    const syncUser = async () => {
      if (!user) return;
      try {
        const token = await getToken();
        await fetch(`${API_URL}/auth/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            email: user.primaryEmailAddress?.emailAddress,
            username: user.username || `creator_${user.id.substring(5, 13).toLowerCase()}`,
            name: user.fullName || 'Anonymous Creator',
            avatarUrl: user.imageUrl,
          }),
        });
      } catch (err) {
        console.error('Failed to sync user with DB:', err);
      }
    };

    syncUser();
  }, [user, getToken]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/posts`);
      if (res.ok) {
        const data = await res.json();
        
        // Merge database uploads with missing fallback posts to keep the feed full
        const dbPostIds = new Set((data || []).map(p => p.id));
        const missingFallbacks = FALLBACK_POSTS.filter(p => !dbPostIds.has(p.id));
        
        // Put database uploads at the top, followed by mock posts
        setPosts([...(data || []), ...missingFallbacks]);
      } else {
        setPosts(FALLBACK_POSTS);
      }
    } catch (err) {
      console.error('Error fetching posts, using fallback mock data:', err);
      setPosts(FALLBACK_POSTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleLike = async (postId) => {
    if (!user) return;

    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        setPosts(posts.map(post => {
          if (post.id === postId) {
            const userId = user.id;
            const alreadyLiked = post.likes.some(like => like.userId === userId);
            
            let updatedLikes = [...post.likes];
            if (alreadyLiked) {
              updatedLikes = updatedLikes.filter(like => like.userId !== userId);
            } else {
              updatedLikes.push({ userId, postId });
            }

            return { ...post, likes: updatedLikes };
          }
          return post;
        }));
      }
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  const handleAddComment = async (postId) => {
    if (!newCommentText.trim()) return;

    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/posts/${postId}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newCommentText }),
      });

      if (res.ok) {
        const newComment = await res.json();
        setPosts(posts.map(post => {
          if (post.id === postId) {
            return { ...post, comments: [...post.comments, newComment] };
          }
          return post;
        }));
        setNewCommentText('');
      }
    } catch (err) {
      console.error('Error posting comment:', err);
    }
  };

  const filteredPosts = selectedCategory === 'All' 
    ? posts 
    : posts.filter(post => post.category.toLowerCase() === selectedCategory.toLowerCase());

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={styles.feedWrapper}
    >
      <div className={styles.header}>
        <h1 className={styles.title}>Creator Feed</h1>
        <p className={styles.subtitle}>Discover next-generation 3D renders and AI masterpieces</p>
      </div>

      <div className={styles.categoryBar}>
        {categories.map((cat) => (
          <button
            key={cat}
            className={`${styles.categoryButton} ${selectedCategory === cat ? styles.catActive : ''}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className={styles.loaderContainer}>
          <Loader className={styles.spinner} size={40} />
          <p>Loading creator feed...</p>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="glass-container" style={{ padding: '60px', textAlign: 'center', margin: '40px 0' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>No creations in this category yet. Be the first to share one!</p>
        </div>
      ) : (
        <motion.div layout className={styles.feedGrid}>
          <AnimatePresence>
            {filteredPosts.map((post, idx) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.6, delay: idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
                className={`glass-card ${styles.postCard}`}
              >
                <div className={styles.postHeader}>
                  <div className={styles.authorMeta}>
                    <img 
                      src={post.author?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'} 
                      alt={post.author?.username} 
                      className={styles.authorAvatar}
                    />
                    <div className={styles.authorDetails}>
                      <span className={styles.authorName}>{post.author?.name || 'Creator'}</span>
                      <span className={styles.authorUsername}>@{post.author?.username}</span>
                    </div>
                  </div>
                  <span className={styles.postCategory}>
                    <Tag size={12} />
                    {post.category}
                  </span>
                </div>

                <div className={styles.postImageContainer}>
                  <img src={post.imageUrl} alt={post.caption} className={styles.postImage} />
                </div>

                <div className={styles.postBody}>
                  <p className={styles.caption}>{post.caption}</p>
                  
                  <div className={styles.postActions}>
                    <button 
                      className={`${styles.actionButton} ${user && post.likes.some(l => l.userId === user.id) ? styles.liked : ''}`}
                      onClick={() => handleLike(post.id)}
                    >
                      <Heart size={20} fill={user && post.likes.some(l => l.userId === user.id) ? "currentColor" : "none"} />
                      <span>{post.likes.length}</span>
                    </button>

                    <button 
                      className={styles.actionButton}
                      onClick={() => setActiveCommentsPostId(activeCommentsPostId === post.id ? null : post.id)}
                    >
                      <MessageSquare size={20} />
                      <span>{post.comments.length}</span>
                    </button>

                    <button 
                      className={styles.actionButton}
                      onClick={() => {
                        navigator.clipboard.writeText(post.imageUrl);
                        alert('Link copied to clipboard!');
                      }}
                    >
                      <Share2 size={19} />
                    </button>
                  </div>

                  {activeCommentsPostId === post.id && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className={styles.commentsSection}
                    >
                      <div className={styles.commentsList}>
                        {post.comments.length === 0 ? (
                          <p className={styles.noComments}>No comments yet.</p>
                        ) : (
                          post.comments.map(comment => (
                            <div key={comment.id} className={styles.commentItem}>
                              <img 
                                src={comment.user?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'} 
                                alt={comment.user?.username} 
                                className={styles.commentAvatar}
                              />
                              <div className={styles.commentMeta}>
                                <span className={styles.commentAuthor}>@{comment.user?.username}</span>
                                <p className={styles.commentContent}>{comment.content}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      <div className={styles.commentInputContainer}>
                        <input 
                          type="text" 
                          placeholder="Add a comment..." 
                          className="glass-input"
                          style={{ flex: 1, padding: '10px 14px', borderRadius: '10px' }}
                          value={newCommentText}
                          onChange={(e) => setNewCommentText(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                        />
                        <button 
                          className="glass-btn" 
                          style={{ padding: '10px', borderRadius: '10px' }}
                          onClick={() => handleAddComment(post.id)}
                        >
                          <Send size={16} />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </motion.div>
  );
}

// --- LANDING PAGE CONTENT FOR SIGNED-OUT GUESTS ---
function LandingPageContent({ onAuthClick }) {
  const subtitleText = "The Premium Workspace for 3D Developers and AI Artists to Render, Edit, and Share Spatial Assets.";
  const characters = Array.from(subtitleText);

  // Staggered letter variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.012, delayChildren: 0.3 * i },
    }),
  };

  const childVariants = {
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100,
      },
    },
    hidden: {
      opacity: 0,
      y: 8,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100,
      },
    },
  };

  // 4 Feature columns styled in 4 corners of the viewport with slide-in animations
  const pillars = [
    {
      title: 'AI Synthesis Lab',
      desc: 'Formulate neural image generation layers using custom prompt vectors.',
      icon: Sparkles,
      className: styles.topLeft,
      initial: { x: -80, y: -40, opacity: 0 },
      animate: { x: 0, y: 0, opacity: 1 },
      transition: { duration: 1.0, delay: 1.6, ease: [0.16, 1, 0.3, 1] }
    },
    {
      title: 'WebGL 3D Viewport',
      desc: 'Inspect GLTF/GLB models in full 3D orbit browser environments.',
      icon: BoxIcon,
      className: styles.topRight,
      initial: { x: 80, y: -40, opacity: 0 },
      animate: { x: 0, y: 0, opacity: 1 },
      transition: { duration: 1.0, delay: 1.8, ease: [0.16, 1, 0.3, 1] }
    },
    {
      title: 'Refinement Canvas',
      desc: 'Apply composite chromatic filters and parameters in real-time.',
      icon: Sliders,
      className: styles.bottomLeft,
      initial: { x: -80, y: 40, opacity: 0 },
      animate: { x: 0, y: 0, opacity: 1 },
      transition: { duration: 1.0, delay: 2.0, ease: [0.16, 1, 0.3, 1] }
    },
    {
      title: 'Collaborative Guilds',
      desc: 'Formulate topic channels and message logs with global creators.',
      icon: Users,
      className: styles.bottomRight,
      initial: { x: 80, y: 40, opacity: 0 },
      animate: { x: 0, y: 0, opacity: 1 },
      transition: { duration: 1.0, delay: 2.2, ease: [0.16, 1, 0.3, 1] }
    }
  ];

  // Floating AI/Tech Code snippets and coordinates for background animation
  const techParticles = [
    { text: "010110", top: "22%", left: "12%", delay: "0s", duration: "20s" },
    { text: "float *px = &val", top: "72%", left: "18%", delay: "3s", duration: "24s" },
    { text: "AI_MODEL_SYNTH", top: "28%", right: "16%", delay: "1s", duration: "22s" },
    { text: "RENDER_MESH_GLTF", top: "68%", right: "14%", delay: "4s", duration: "26s" },
    { text: "const node = new Node()", top: "48%", left: "8%", delay: "5s", duration: "18s" },
    { text: "101101", top: "52%", right: "8%", delay: "2s", duration: "21s" },
    { text: "vec4 pos = proj * view", top: "15%", left: "32%", delay: "6s", duration: "28s" },
    { text: "shader.compile()", top: "82%", right: "32%", delay: "7s", duration: "23s" },
  ];

  return (
    <div className={styles.landingWrapper}>
      {/* Cybernetic Digital Grid Background */}
      <div className={styles.digitalGrid} />

      {/* Floating Tech/AI Particles */}
      {techParticles.map((pt, idx) => (
        <div 
          key={idx} 
          className={styles.techParticle}
          style={{
            top: pt.top,
            left: pt.left,
            right: pt.right,
            animationDelay: pt.delay,
            animationDuration: pt.duration
          }}
        >
          {pt.text}
        </div>
      ))}

      {/* Background Animated Blurs */}
      <div className={styles.glowBlob1} />
      <div className={styles.glowBlob2} />
      <div className={styles.glowBlob3} />

      {/* 4 Feature Columns sliding in from the sides */}
      <div className={styles.pillarsGrid}>
        {pillars.map((item, idx) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={idx}
              initial={item.initial}
              animate={item.animate}
              transition={item.transition}
              className={`${styles.pillarCard} ${item.className}`}
            >
              <div className={styles.pillarIconFrame}>
                <Icon size={20} />
              </div>
              <div className={styles.pillarContent}>
                <h4>{item.title}</h4>
                <p>{item.desc}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Hero Header */}
      <div className={styles.heroSection}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className={styles.brandBadge}
        >
          <span className={styles.badgePulse} />
          CREATIVE PIPELINE ENVIRONMENT
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className={`${styles.heroTitle} ${styles.floatingTitle}`}
        >
          ArtifyAI
        </motion.h1>

        {/* Character-by-character typing animation */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className={styles.heroSubtitle}
          style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}
        >
          {characters.map((char, index) => (
            <motion.span
              key={index}
              variants={childVariants}
              style={{ display: 'inline-block', whiteSpace: char === ' ' ? 'pre' : 'normal' }}
            >
              {char}
            </motion.span>
          ))}
        </motion.div>

        {/* CTA Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.4, ease: [0.16, 1, 0.3, 1] }}
          className={styles.ctaGroup}
        >
          <button onClick={() => onAuthClick('signin')} className="glass-btn">
            Launch Workspace <ArrowRight size={16} />
          </button>
          <button onClick={() => onAuthClick('signup')} className="glass-btn glass-btn-secondary">
            Join the Guild
          </button>
        </motion.div>
      </div>
    </div>
  );
}

// --- CORE ENTRY POINT WITH MODALS ---
export default function HomePage() {
  const [authModal, setAuthModal] = useState(null); // 'signin', 'signup', or null

  // Clerk appearance configurations designed to be EXTRA compact to fit in modal viewport without scroll
  const clerkAppearanceConfig = (isSignUp = false) => ({
    variables: {
      colorPrimary: '#8b5cf6',
      colorBackground: '#0a0b10',
      colorText: '#ffffff',
      colorTextSecondary: '#a0aec0',
      colorInputBackground: 'rgba(255, 255, 255, 0.06)',
      colorInputText: '#ffffff',
      colorBorder: 'rgba(255, 255, 255, 0.25)',
    },
    elements: {
      card: {
        background: 'transparent',
        boxShadow: 'none',
        border: 'none',
        padding: '0px',
        margin: '0px',
        width: '100%',
        maxWidth: '380px',
      },
      headerTitle: { 
        color: '#ffffff',
        fontSize: '1.2rem',
        fontWeight: '700',
        background: 'linear-gradient(135deg, #fff 0%, #a855f7 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        marginBottom: '0px',
      },
      headerSubtitle: { color: '#a0aec0', fontSize: '0.72rem', marginBottom: '4px' },
      socialButtonsBlockButton: {
        background: 'rgba(255, 255, 255, 0.04)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        color: '#ffffff',
        height: '32px', // slightly larger for visibility
        marginBottom: '0px',
        transition: 'all 0.2s ease',
        '&:hover': {
          background: 'rgba(255, 255, 255, 0.08)',
          borderColor: 'rgba(255, 255, 255, 0.35)',
        }
      },
      socialButtonsBlockButtonText: { color: '#ffffff', fontSize: '0.75rem' },
      dividerRow: { margin: '6px 0px' },
      dividerLine: { background: 'rgba(255, 255, 255, 0.1)' },
      dividerText: { color: '#a0aec0', fontSize: '0.65rem' },
      form: { gap: '6px' }, // extra tight spacing
      formFieldRow: { gap: '6px', marginBottom: '0px' },
      formFieldLabel: { color: '#ffffff', fontSize: '0.72rem', fontWeight: '500', marginBottom: '1px' },
      formFieldInput: {
        background: 'rgba(255, 255, 255, 0.06)',
        border: '1px solid rgba(255, 255, 255, 0.25)',
        color: '#ffffff',
        height: '32px', // slightly taller for better readability and usability, but still compact
        borderRadius: '6px',
        fontSize: '0.82rem',
        padding: '6px 10px',
        transition: 'all 0.2s ease',
        '&:focus': {
          borderColor: '#8b5cf6',
          background: 'rgba(255, 255, 255, 0.1)',
          boxShadow: '0 0 0 2px rgba(139, 92, 246, 0.25)',
        }
      },
      formButtonPrimary: {
        background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
        height: '32px',
        borderRadius: '6px',
        fontSize: '0.8rem',
        fontWeight: '600',
        marginTop: '6px',
        transition: 'all 0.2s ease',
        '&:hover': {
          filter: 'brightness(1.15)',
        }
      },
      // Hides Clerk's default footer to prevent routing/navigation redirect issues!
      footer: {
        display: 'none'
      }
    }
  });

  return (
    <>
      <SignedIn>
        <FeedPageContent />
      </SignedIn>
      
      <SignedOut>
        <LandingPageContent onAuthClick={setAuthModal} />

        {/* Modal Overlay */}
        <AnimatePresence>
          {authModal && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={styles.modalBackdrop}
              onClick={() => setAuthModal(null)}
            >
              <motion.div
                initial={{ scale: 0.95, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 15 }}
                transition={{ type: 'spring', damping: 25 }}
                className={`glass-container ${styles.authModalContent}`}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close Button */}
                <button className={styles.modalCloseBtn} onClick={() => setAuthModal(null)}>
                  <X size={16} />
                </button>

                {authModal === 'signin' && (
                  <div key="clerk-signin-wrapper" style={{ width: '100%' }}>
                    <SignIn 
                      routing="hash"
                      appearance={clerkAppearanceConfig(false)}
                    />
                  </div>
                )}
                {authModal === 'signup' && (
                  <div key="clerk-signup-wrapper" style={{ width: '100%' }}>
                    <SignUp 
                      routing="hash"
                      appearance={clerkAppearanceConfig(true)}
                    />
                  </div>
                )}

                {/* Custom Modal Switch Footer Link (Keeps users entirely on-page within the modal) */}
                <div className={styles.customModalFooter}>
                  {authModal === 'signin' ? (
                    <>
                      <span>Don't have an account? </span>
                      <button className={styles.switchAuthBtn} onClick={() => setAuthModal('signup')}>
                        Sign Up
                      </button>
                    </>
                  ) : (
                    <>
                      <span>Already have an account? </span>
                      <button className={styles.switchAuthBtn} onClick={() => setAuthModal('signin')}>
                        Sign In
                      </button>
                    </>
                  )}
                </div>

              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </SignedOut>
    </>
  );
}
