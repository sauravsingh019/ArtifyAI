'use client';

import React, { useState, useEffect } from 'react';
import { useUser, useAuth, RedirectToSignIn } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import { Box as BoxIcon, Upload, Trash2, Download, Eye, Plus, ArrowLeft } from 'lucide-react';
import ThreeViewer from '@/components/ThreeViewer';
import styles from './page.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const DEFAULT_MODELS = [
  {
    id: 'demo-1',
    name: 'Cyberpunk Torus Knot',
    description: 'Quantum physical wireframe knot rendered in metallic chrome.',
    category: 'Hard Surface',
    modelUrl: null, // triggers local wireframe fallback
    geometryType: 'torusKnot',
    thumbnailUrl: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=300',
    author: { name: 'Artify Core', username: 'artify' }
  },
  {
    id: 'demo-2',
    name: 'Holographic Node',
    description: 'Deep-space energy node geometry with light emissive coordinates.',
    category: 'Abstract',
    modelUrl: null,
    geometryType: 'node',
    thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300',
    author: { name: 'Nebula Lab', username: 'nebulalab' }
  },
  {
    id: 'demo-3',
    name: 'Low-Poly Monkey',
    description: 'Stylized 3D monkey head composed of geometric primitives.',
    category: 'Character',
    modelUrl: null,
    geometryType: 'monkey',
    thumbnailUrl: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=300',
    author: { name: 'Artify Core', username: 'artify' }
  },
  {
    id: 'demo-4',
    name: 'Retro Fedora Hat',
    description: 'Classic fedora hat shape rendered in glowing vector outlines.',
    category: 'Hard Surface',
    modelUrl: null,
    geometryType: 'hat',
    thumbnailUrl: 'https://images.unsplash.com/photo-1514327605112-b887c0e61c0a?w=300',
    author: { name: 'Voxel Wizard', username: 'voxelwiz' }
  },
  {
    id: 'demo-5',
    name: 'Cyber Cruiser Car',
    description: 'Futuristic sci-fi vehicle outline with glowing chassis lines.',
    category: 'Environment',
    modelUrl: null,
    geometryType: 'car',
    thumbnailUrl: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=300',
    author: { name: 'Synth Wave', username: 'synthwave' }
  },
  {
    id: 'demo-6',
    name: 'Cosmic Ice Cream',
    description: 'Stylized ice cream cone with double scoop of orbital energy.',
    category: 'Abstract',
    modelUrl: null,
    geometryType: 'iceCream',
    thumbnailUrl: 'https://images.unsplash.com/photo-1576506295286-5cda18df43e7?w=300',
    author: { name: 'Sweet Poly', username: 'sweetpoly' }
  },
  {
    id: 'demo-7',
    name: 'Glazed Donut',
    description: 'Mathematical torus geometry with topological sprinkles.',
    category: 'Abstract',
    modelUrl: null,
    geometryType: 'donut',
    thumbnailUrl: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=300',
    author: { name: 'Blender Cadet', username: 'blendercadet' }
  }
];

export default function ModelsPage() {
  const { user, isLoaded: userLoaded } = useUser();
  const { getToken } = useAuth();

  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Model creation
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [modelName, setModelName] = useState('');
  const [modelDesc, setModelDesc] = useState('');
  const [modelFileUrl, setModelFileUrl] = useState('');
  const [modelCategory, setModelCategory] = useState('Hard Surface');
  const [uploading, setUploading] = useState(false);

  // Active 3D viewport state
  const [activeModel, setActiveModel] = useState(null);

  const fetchModels = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/models`);
      if (res.ok) {
        const data = await res.json();
        setModels(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  if (userLoaded && !user) {
    return <RedirectToSignIn />;
  }

  const handleUploadModel = async (e) => {
    e.preventDefault();
    if (!modelName || !modelFileUrl) return;

    setUploading(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/models`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: modelName,
          description: modelDesc,
          modelUrl: modelFileUrl,
          category: modelCategory,
        }),
      });

      if (res.ok) {
        const newModel = await res.json();
        setModels([newModel, ...models]);
        // Reset form
        setModelName('');
        setModelDesc('');
        setModelFileUrl('');
        setShowUploadModal(false);
      } else {
        alert('Failed to save 3D model.');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving model.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteModel = async (modelId) => {
    if (!confirm('Are you sure you want to delete this 3D model?')) return;

    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/models/${modelId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        setModels(models.filter((m) => m.id !== modelId));
        if (activeModel?.id === modelId) {
          setActiveModel(null);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Combine DB models and default demo models
  const allModels = [...models, ...DEFAULT_MODELS];

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
            <h1 className={styles.title}>3D Hub</h1>
            <p className={styles.subtitle}>Upload, preview, and share spatial assets in real-time GLTF/GLB web viewports</p>
          </div>
          <button className="glass-btn" onClick={() => setShowUploadModal(true)}>
            <Plus size={18} /> Upload Asset
          </button>
        </div>
      </div>

      <div className={styles.contentLayout}>
        {/* Left Side: Interactive Viewport detail */}
        <div className={`glass-card ${styles.viewportSection}`}>
          {activeModel ? (
            <div className={styles.viewportWrapper}>
              <div className={styles.viewportHeader}>
                <button className={styles.backBtn} onClick={() => setActiveModel(null)}>
                  <ArrowLeft size={16} /> Close Viewport
                </button>
                <h3>{activeModel.name}</h3>
              </div>
              <div className={styles.canvasContainer}>
                <ThreeViewer modelUrl={activeModel.modelUrl} geometryType={activeModel.geometryType} />
              </div>
              <div className={styles.viewportFooter}>
                <p>{activeModel.description || 'No description provided.'}</p>
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <span className={styles.categoryBadge}>{activeModel.category}</span>
                  {activeModel.modelUrl && (
                    <a href={activeModel.modelUrl} download className="glass-btn" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                      <Download size={14} /> Download GLB
                    </a>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.viewportPlaceholder}>
              <BoxIcon size={64} className={styles.placeholderIcon} />
              <h3>Spatial Viewport</h3>
              <p>Select a 3D model card from the list to load the real-time WebGL orbit rendering environment.</p>
            </div>
          )}
        </div>

        {/* Right Side: Assets Directory Grid */}
        <div className={styles.modelsGrid}>
          {allModels.map((model) => (
            <div 
              key={model.id} 
              className={`glass-card ${styles.modelCard} ${activeModel?.id === model.id ? styles.activeCard : ''}`}
            >
              <div className={styles.thumbnailFrame} onClick={() => setActiveModel(model)}>
                <img src={model.thumbnailUrl || 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=300'} alt={model.name} />
                <div className={styles.cardOverlay}>
                  <Eye size={24} />
                  <span>Inspect in 3D</span>
                </div>
              </div>

              <div className={styles.cardBody}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h4 className={styles.cardTitle} onClick={() => setActiveModel(model)}>{model.name}</h4>
                  {user && model.authorId === user.id && (
                    <button className={styles.deleteBtn} onClick={() => handleDeleteModel(model.id)}>
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
                <p className={styles.cardDesc}>{model.description}</p>
                <div className={styles.cardFooter}>
                  <span className={styles.cardAuthor}>by @{model.author?.username || 'creator'}</span>
                  <span className={styles.cardCategory}>{model.category}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upload Model Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.modalBackdrop}
            onClick={() => setShowUploadModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25 }}
              className={`glass-container ${styles.modalContent}`}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className={styles.modalTitle}>Upload Spatial Model</h2>
              <form onSubmit={handleUploadModel} className={styles.modalForm}>
                <div className={styles.formGroup}>
                  <label>Asset Name</label>
                  <input 
                    type="text" required className="glass-input" 
                    placeholder="e.g., Cyberpunk Hovercar"
                    value={modelName} onChange={(e) => setModelName(e.target.value)} 
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Description</label>
                  <textarea 
                    className="glass-input" placeholder="Explain the mesh details, polygon budget, texture sizes..."
                    style={{ height: '80px', resize: 'none' }}
                    value={modelDesc} onChange={(e) => setModelDesc(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Model File URL (.glb / .gltf)</label>
                  <input 
                    type="url" required className="glass-input" 
                    placeholder="https://example.com/assets/model.glb"
                    value={modelFileUrl} onChange={(e) => setModelFileUrl(e.target.value)}
                  />
                  <p className={styles.helperText}>Provide a direct link to your compiled GLB mesh binary.</p>
                </div>

                <div className={styles.formGroup}>
                  <label>Category</label>
                  <select 
                    className="glass-input"
                    value={modelCategory} onChange={(e) => setModelCategory(e.target.value)}
                  >
                    <option value="Hard Surface">Hard Surface</option>
                    <option value="Character">Character</option>
                    <option value="Environment">Environment</option>
                    <option value="Abstract">Abstract</option>
                  </select>
                </div>

                <div className={styles.formActions}>
                  <button 
                    type="button" className="glass-btn glass-btn-secondary" 
                    onClick={() => setShowUploadModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="glass-btn" disabled={uploading}>
                    {uploading ? 'Registering...' : 'Publish Asset'}
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
