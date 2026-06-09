'use client';

import React, { useState, useEffect } from 'react';
import { useUser, useAuth, RedirectToSignIn } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, LayoutGrid, Check, Loader, ChevronRight } from 'lucide-react';
import styles from './page.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const DEFAULT_COMMUNITIES = [
  {
    id: 'c-demo-1',
    name: 'Blender Masters',
    description: 'A hub for procedural node graphs, hard-surface modeling, and Cycles renderings.',
    coverImage: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=600',
    _count: { members: 342 }
  },
  {
    id: 'c-demo-2',
    name: 'Stable Diffusion Art',
    description: 'Prompts sharing, LoRA training discussions, and generative art showcases.',
    coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600',
    _count: { members: 512 }
  }
];

export default function CommunitiesPage() {
  const { user, isLoaded: userLoaded } = useUser();
  const { getToken } = useAuth();

  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form states
  const [commName, setCommName] = useState('');
  const [commDesc, setCommDesc] = useState('');
  const [commCover, setCommCover] = useState('');
  const [creating, setCreating] = useState(false);

  // Detail View State
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [communityPosts, setCommunityPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  const fetchCommunities = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/communities`);
      if (res.ok) {
        const data = await res.json();
        setCommunities(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunities();
  }, []);

  const fetchCommunityDetail = async (comm) => {
    setSelectedCommunity(comm);
    setLoadingPosts(true);
    try {
      // If it's a demo community, we render mock posts
      if (comm.id.startsWith('c-demo')) {
        await new Promise(r => setTimeout(r, 600));
        setCommunityPosts([]);
        setLoadingPosts(false);
        return;
      }

      const res = await fetch(`${API_URL}/communities/${comm.id}`);
      if (res.ok) {
        const data = await res.json();
        setCommunityPosts(data.posts);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPosts(false);
    }
  };

  if (userLoaded && !user) {
    return <RedirectToSignIn />;
  }

  const handleCreateCommunity = async (e) => {
    e.preventDefault();
    if (!commName) return;

    setCreating(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/communities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: commName,
          description: commDesc,
          coverImage: commCover,
        }),
      });

      if (res.ok) {
        const newComm = await res.json();
        setCommunities([newComm, ...communities]);
        setCommName('');
        setCommDesc('');
        setCommCover('');
        setShowCreateModal(false);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create community.');
      }
    } catch (err) {
      console.error(err);
      alert('Error creating community.');
    } finally {
      setCreating(false);
    }
  };

  const handleJoinToggle = async (commId) => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/communities/${commId}/join`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        // Update local list count
        setCommunities(communities.map(c => {
          if (c.id === commId) {
            return {
              ...c,
              _count: { members: data.community.members.length }
            };
          }
          return c;
        }));

        if (selectedCommunity?.id === commId) {
          setSelectedCommunity({
            ...selectedCommunity,
            _count: { members: data.community.members.length }
          });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const allCommunities = [...communities, ...DEFAULT_COMMUNITIES];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={styles.container}
    >
      <div className={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className={styles.title}>Creator Guilds</h1>
            <p className={styles.subtitle}>Gather with fellow designers, developers, and AI researchers in specialized hubs</p>
          </div>
          <button className="glass-btn" onClick={() => setShowCreateModal(true)}>
            <Plus size={18} /> Create Guild
          </button>
        </div>
      </div>

      <div className={styles.contentGrid}>
        {/* Left column: Guild list */}
        <div className={styles.listSection}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
              <Loader className={styles.spin} />
            </div>
          ) : (
            <div className={styles.cardsStack}>
              {allCommunities.map((comm) => (
                <div 
                  key={comm.id} 
                  className={`glass-card ${styles.commCard} ${selectedCommunity?.id === comm.id ? styles.activeComm : ''}`}
                  onClick={() => fetchCommunityDetail(comm)}
                >
                  <div className={styles.commCover} style={{ backgroundImage: `url(${comm.coverImage || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200'})` }} />
                  <div className={styles.commBody}>
                    <h3 className={styles.commName}>{comm.name}</h3>
                    <p className={styles.commDesc}>{comm.description}</p>
                    <span className={styles.commStats}>{comm._count?.members || 0} members</span>
                  </div>
                  <ChevronRight size={18} className={styles.arrowIcon} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column: Selected Guild Viewport */}
        <div className={`glass-container ${styles.detailSection}`}>
          {selectedCommunity ? (
            <div className={styles.detailWrapper}>
              <div 
                className={styles.detailBanner} 
                style={{ backgroundImage: `url(${selectedCommunity.coverImage || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600'})` }}
              >
                <div className={styles.bannerOverlay}>
                  <h2>{selectedCommunity.name}</h2>
                  <p>{selectedCommunity._count?.members || 0} active creators</p>
                </div>
              </div>

              <div className={styles.detailBody}>
                <p className={styles.detailDesc}>{selectedCommunity.description}</p>
                
                <div style={{ display: 'flex', gap: '10px', margin: '20px 0' }}>
                  <button 
                    className="glass-btn" 
                    onClick={() => handleJoinToggle(selectedCommunity.id)}
                    style={{ flex: 1 }}
                  >
                    Join Hub Workspace
                  </button>
                </div>

                <div className={styles.guildFeed}>
                  <h3>Guild Publications</h3>
                  {loadingPosts ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                      <Loader className={styles.spin} />
                    </div>
                  ) : communityPosts.length === 0 ? (
                    <p className={styles.emptyFeed}>No publication matches found in this guild yet.</p>
                  ) : (
                    <div className={styles.postMiniGrid}>
                      {communityPosts.map(post => (
                        <div key={post.id} className={styles.miniPostCard}>
                          <img src={post.imageUrl} alt={post.caption} className={styles.miniImg} />
                          <div className={styles.miniMeta}>
                            <span>@{post.author?.username}</span>
                            <p>{post.caption}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.detailPlaceholder}>
              <Users size={50} className={styles.placeholderIcon} />
              <h3>Guild Viewport</h3>
              <p>Select a creator guild from the list directory to view details, active posts, and workspaces.</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Community Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.modalBackdrop}
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25 }}
              className={`glass-container ${styles.modalContent}`}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className={styles.modalTitle}>Establish Creator Guild</h2>
              <form onSubmit={handleCreateCommunity} className={styles.modalForm}>
                <div className={styles.formGroup}>
                  <label>Guild Name (Unique Category)</label>
                  <input 
                    type="text" required className="glass-input" 
                    placeholder="e.g., Unreal Engine 5"
                    value={commName} onChange={(e) => setCommName(e.target.value)} 
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Description</label>
                  <textarea 
                    className="glass-input" placeholder="What kind of creations are shared here?"
                    style={{ height: '80px', resize: 'none' }}
                    value={commDesc} onChange={(e) => setCommDesc(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Cover Banner Image URL</label>
                  <input 
                    type="url" className="glass-input" 
                    placeholder="https://images.unsplash.com/photo-..."
                    value={commCover} onChange={(e) => setCommCover(e.target.value)}
                  />
                </div>

                <div className={styles.formActions}>
                  <button 
                    type="button" className="glass-btn glass-btn-secondary" 
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="glass-btn" disabled={creating}>
                    {creating ? 'Establishing...' : 'Establish Guild'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
