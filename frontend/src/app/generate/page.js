'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useAuth, RedirectToSignIn } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Image as ImageIcon, Sliders, ArrowRight, Download, Share, RefreshCw, Wand2 } from 'lucide-react';
import styles from './page.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function GeneratePage() {
  const { user, isLoaded: userLoaded } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();

  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [category, setCategory] = useState('AI Art');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [generatedImage, setGeneratedImage] = useState(null);
  
  // Post-generation publishing fields
  const [publishCaption, setPublishCaption] = useState('');
  const [publishing, setPublishing] = useState(false);

  const aspectRatios = [
    { label: 'Square (1:1)', value: '1:1', width: 40, height: 40 },
    { label: 'Landscape (16:9)', value: '16:9', width: 56, height: 32 },
    { label: 'Portrait (9:16)', value: '9:16', width: 32, height: 56 },
  ];

  const loadingMessages = [
    'Connecting to Neural Clusters...',
    'Allocating GPU Tensor Cores...',
    'Synthesizing latent space textures...',
    'Rendering high-fidelity features...',
    'Polishing final high-res pixels...'
  ];

  // Cycle loading messages during image synthesis
  useEffect(() => {
    let interval;
    if (loading) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % loadingMessages.length);
      }, 1800);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  if (userLoaded && !user) {
    return <RedirectToSignIn />;
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setGeneratedImage(null);
    setPublishCaption(prompt); // Default publish caption to the prompt itself

    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt, aspectRatio }),
      });

      if (res.ok) {
        const data = await res.json();
        setGeneratedImage(data.imageUrl);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to generate image.');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred. Check backend console.');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!generatedImage || !publishCaption.trim()) return;

    setPublishing(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          imageUrl: generatedImage,
          caption: publishCaption,
          category,
        }),
      });

      if (res.ok) {
        router.push('/');
      } else {
        alert('Failed to publish post.');
      }
    } catch (err) {
      console.error(err);
      alert('Publishing failed.');
    } finally {
      setPublishing(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const a = document.createElement('a');
    a.href = generatedImage;
    a.download = `artify-gen-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleOpenInEditor = () => {
    if (!generatedImage) return;
    // Encode generated image URL and redirect to editor
    router.push(`/edit?imageUrl=${encodeURIComponent(generatedImage)}`);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={styles.container}
    >
      <div className={styles.header}>
        <h1 className={styles.title}>AI Image Lab</h1>
        <p className={styles.subtitle}>Unlock artificial imagination with high-performance generation models</p>
      </div>

      <div className={styles.mainGrid}>
        {/* Left Side: Input Panel */}
        <div className={`glass-container ${styles.panel}`}>
          <div className={styles.panelSection}>
            <label className={styles.sectionLabel}>
              <Wand2 size={16} /> Describe your creation
            </label>
            <textarea
              className={`glass-input ${styles.promptTextarea}`}
              placeholder="A futuristic cybernetic cathedral made of tinted glass and gold, cinematic lighting, 3D render, octane render, 8k..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>

          <div className={styles.panelSection}>
            <label className={styles.sectionLabel}>
              <Sliders size={16} /> Aspect Ratio
            </label>
            <div className={styles.ratioGrid}>
              {aspectRatios.map((ratio) => (
                <button
                  key={ratio.value}
                  className={`${styles.ratioCard} ${aspectRatio === ratio.value ? styles.ratioActive : ''}`}
                  onClick={() => setAspectRatio(ratio.value)}
                >
                  <div 
                    className={styles.ratioVisual} 
                    style={{ width: `${ratio.width}px`, height: `${ratio.height}px` }}
                  />
                  <span className={styles.ratioLabel}>{ratio.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className={styles.panelSection}>
            <label className={styles.sectionLabel}>Category Tag</label>
            <select 
              className={`glass-input ${styles.categorySelect}`}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="AI Art">AI Art</option>
              <option value="Concept Art">Concept Art</option>
              <option value="3D Render">3D Render</option>
              <option value="General">General</option>
            </select>
          </div>

          <button
            className={`glass-btn ${styles.generateBtn}`}
            disabled={loading || !prompt.trim()}
            onClick={handleGenerate}
          >
            {loading ? (
              <>
                <RefreshCw className={styles.spin} size={18} />
                Synthesizing...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Generate Creation
              </>
            )}
          </button>
        </div>

        {/* Right Side: Output Panel */}
        <div className={`glass-card ${styles.outputPanel}`}>
          <AnimatePresence mode="wait">
            {loading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={styles.loaderContainer}
              >
                <div className={styles.pulsingGlow} />
                <div className={styles.loaderSpinnerContainer}>
                  <RefreshCw className={styles.spinLarge} size={50} />
                </div>
                <h3 className={styles.loadingMessage}>{loadingMessages[loadingStep]}</h3>
                <p className={styles.loadingSubtitle}>We are cooking your pixels. Hang tight.</p>
              </motion.div>
            )}

            {!loading && !generatedImage && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={styles.emptyState}
              >
                <ImageIcon size={60} className={styles.emptyIcon} />
                <h3>Art Lab Viewport</h3>
                <p>Your generated masterworks will manifest inside this glass containment frame.</p>
              </motion.div>
            )}

            {!loading && generatedImage && (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', damping: 20 }}
                className={styles.resultContainer}
              >
                {/* Generated Image Viewport */}
                <div className={styles.viewportFrame}>
                  <img src={generatedImage} alt="Generated Art" className={styles.resultImage} />
                  
                  {/* Actions overlay */}
                  <div className={styles.imageOverlay}>
                    <button className={styles.overlayBtn} onClick={handleDownload} title="Download Image">
                      <Download size={18} />
                    </button>
                    <button className={styles.overlayBtn} onClick={handleOpenInEditor} title="Open in Image Editor">
                      <Sliders size={18} />
                    </button>
                  </div>
                </div>

                {/* Publish details */}
                <div className={styles.publishBox}>
                  <h4 className={styles.publishHeading}>Publish to Public Feed</h4>
                  <input
                    type="text"
                    className="glass-input"
                    placeholder="Enter post caption..."
                    style={{ width: '100%', marginBottom: '12px' }}
                    value={publishCaption}
                    onChange={(e) => setPublishCaption(e.target.value)}
                  />
                  <div className={styles.publishActions}>
                    <button
                      className="glass-btn glass-btn-secondary"
                      style={{ flex: 1 }}
                      onClick={handleOpenInEditor}
                    >
                      Refine in Editor
                    </button>
                    <button
                      className="glass-btn"
                      style={{ flex: 1 }}
                      disabled={publishing || !publishCaption.trim()}
                      onClick={handlePublish}
                    >
                      {publishing ? 'Publishing...' : 'Publish Feed'}
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
