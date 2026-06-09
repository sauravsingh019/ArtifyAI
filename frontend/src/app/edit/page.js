'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser, useAuth, RedirectToSignIn } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import { Sliders, SlidersHorizontal, Upload, Download, Share, RefreshCw, Undo, Eye } from 'lucide-react';
import styles from './page.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function EditPage() {
  const { user, isLoaded: userLoaded } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef(null);
  const imageRef = useRef(null);

  // States
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  // Filter Adjustments
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [blur, setBlur] = useState(0);
  const [hueRotate, setHueRotate] = useState(0);
  const [grayscale, setGrayscale] = useState(0);

  // Publishing State
  const [caption, setCaption] = useState('');
  const [publishing, setPublishing] = useState(false);

  // Check query params for generated images from Art Lab
  useEffect(() => {
    const queryUrl = searchParams.get('imageUrl');
    if (queryUrl) {
      setImageUrl(decodeURIComponent(queryUrl));
    }
  }, [searchParams]);

  if (userLoaded && !user) {
    return <RedirectToSignIn />;
  }

  // Pre-packaged Premium Presets
  const presets = [
    { name: 'Original', brightness: 100, contrast: 100, saturation: 100, blur: 0, hueRotate: 0, grayscale: 0 },
    { name: 'Cyberpunk', brightness: 110, contrast: 120, saturation: 180, blur: 0, hueRotate: 310, grayscale: 0 },
    { name: 'Mono Chrome', brightness: 100, contrast: 140, saturation: 0, blur: 0, hueRotate: 0, grayscale: 100 },
    { name: 'Nordic Chill', brightness: 95, contrast: 110, saturation: 70, blur: 0, hueRotate: 190, grayscale: 0 },
    { name: 'Retro Gold', brightness: 105, contrast: 95, saturation: 120, blur: 0, hueRotate: 35, grayscale: 0 },
    { name: 'Dream Glow', brightness: 115, contrast: 105, saturation: 130, blur: 1, hueRotate: 0, grayscale: 0 }
  ];

  const applyPreset = (preset) => {
    setBrightness(preset.brightness);
    setContrast(preset.contrast);
    setSaturation(preset.saturation);
    setBlur(preset.blur);
    setHueRotate(preset.hueRotate);
    setGrayscale(preset.grayscale);
  };

  const resetAdjustments = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setBlur(0);
    setHueRotate(0);
    setGrayscale(0);
  };

  // Handle local image file upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Exporter: Render filters to HTML5 Canvas and trigger local download
  const handleExport = () => {
    if (!imageUrl) return;

    const img = new Image();
    img.crossOrigin = 'anonymous'; // prevent tainted canvas
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      // Apply filters to canvas context
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) blur(${blur}px) hue-rotate(${hueRotate}deg) grayscale(${grayscale}%)`;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `artify-edit-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };
    img.src = imageUrl;
  };

  // Publish edited image back to the public feed
  const handlePublish = async () => {
    if (!imageUrl || !caption.trim()) return;

    setPublishing(true);
    try {
      const token = await getToken();
      
      // Note: We upload the URL (if generated) or we draw the canvas and send the dataURI.
      // For simplicity, we draw to canvas to capture filters, convert to base64 dataURI and upload.
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.naturalWidth || 800;
        canvas.height = img.naturalHeight || 600;

        ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) blur(${blur}px) hue-rotate(${hueRotate}deg) grayscale(${grayscale}%)`;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        const filteredDataUri = canvas.toDataURL('image/jpeg', 0.85);

        const res = await fetch(`${API_URL}/posts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            imageUrl: filteredDataUri, // backend handles base64 image strings natively!
            caption,
            category: 'Photoshop',
          }),
        });

        if (res.ok) {
          router.push('/');
        } else {
          alert('Failed to publish post.');
        }
        setPublishing(false);
      };
      img.src = imageUrl;

    } catch (err) {
      console.error(err);
      alert('Error during publishing.');
      setPublishing(false);
    }
  };

  const filterString = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) blur(${blur}px) hue-rotate(${hueRotate}deg) grayscale(${grayscale}%)`;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={styles.container}
    >
      <div className={styles.header}>
        <h1 className={styles.title}>Refinement Canvas</h1>
        <p className={styles.subtitle}>Apply custom post-production values and chromatic corrections</p>
      </div>

      <div className={styles.mainGrid}>
        {/* Left Side: Viewport Container */}
        <div className={`glass-card ${styles.viewportContainer}`}>
          {!imageUrl ? (
            <div className={styles.uploadState} onClick={() => fileInputRef.current?.click()}>
              <Upload size={50} className={styles.uploadIcon} />
              <h3>Load Artwork</h3>
              <p>Drag & drop or browse your local system files to apply adjustments</p>
              <button className="glass-btn" style={{ marginTop: '10px' }}>Browse Files</button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                style={{ display: 'none' }} 
              />
            </div>
          ) : (
            <div className={styles.imageWorkspace}>
              <div className={styles.imageFrame}>
                <img
                  ref={imageRef}
                  src={imageUrl}
                  alt="Source asset"
                  className={styles.canvasImage}
                  style={{ filter: filterString }}
                />
              </div>

              <div className={styles.workspaceFooter}>
                <button className="glass-btn glass-btn-secondary" onClick={() => setImageUrl('')}>
                  Replace Asset
                </button>
                <button className="glass-btn glass-btn-secondary" onClick={resetAdjustments}>
                  <Undo size={16} /> Reset
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Configuration Panel */}
        <div className={`glass-container ${styles.panel}`}>
          <div className={styles.panelHeader}>
            <SlidersHorizontal size={18} />
            <h2>Creative Controls</h2>
          </div>

          {/* Adjustments */}
          <div className={styles.slidersList}>
            <div className={styles.sliderGroup}>
              <div className={styles.sliderMeta}>
                <span>Brightness</span>
                <span>{brightness}%</span>
              </div>
              <input 
                type="range" min="0" max="200" value={brightness} 
                className={styles.sliderRange} onChange={(e) => setBrightness(e.target.value)} 
              />
            </div>

            <div className={styles.sliderGroup}>
              <div className={styles.sliderMeta}>
                <span>Contrast</span>
                <span>{contrast}%</span>
              </div>
              <input 
                type="range" min="0" max="200" value={contrast} 
                className={styles.sliderRange} onChange={(e) => setContrast(e.target.value)} 
              />
            </div>

            <div className={styles.sliderGroup}>
              <div className={styles.sliderMeta}>
                <span>Saturation</span>
                <span>{saturation}%</span>
              </div>
              <input 
                type="range" min="0" max="200" value={saturation} 
                className={styles.sliderRange} onChange={(e) => setSaturation(e.target.value)} 
              />
            </div>

            <div className={styles.sliderGroup}>
              <div className={styles.sliderMeta}>
                <span>Chromatic Blur</span>
                <span>{blur}px</span>
              </div>
              <input 
                type="range" min="0" max="10" step="0.5" value={blur} 
                className={styles.sliderRange} onChange={(e) => setBlur(e.target.value)} 
              />
            </div>

            <div className={styles.sliderGroup}>
              <div className={styles.sliderMeta}>
                <span>Hue Rotation</span>
                <span>{hueRotate}°</span>
              </div>
              <input 
                type="range" min="0" max="360" value={hueRotate} 
                className={styles.sliderRange} onChange={(e) => setHueRotate(e.target.value)} 
              />
            </div>

            <div className={styles.sliderGroup}>
              <div className={styles.sliderMeta}>
                <span>Grayscale</span>
                <span>{grayscale}%</span>
              </div>
              <input 
                type="range" min="0" max="100" value={grayscale} 
                className={styles.sliderRange} onChange={(e) => setGrayscale(e.target.value)} 
              />
            </div>
          </div>

          {/* Preset Styles */}
          <div className={styles.section}>
            <span className={styles.label}>Style Presets</span>
            <div className={styles.presetGrid}>
              {presets.map((preset) => (
                <button
                  key={preset.name}
                  className={`glass-btn glass-btn-secondary ${styles.presetBtn}`}
                  onClick={() => applyPreset(preset)}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Export Box */}
          {imageUrl && (
            <div className={styles.publishBox}>
              <span className={styles.label}>Export / Publish</span>
              
              <input 
                type="text" 
                placeholder="Enter post description..." 
                className="glass-input" 
                style={{ width: '100%', marginBottom: '12px', marginTop: '6px' }}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
              />

              <div className={styles.actions}>
                <button className="glass-btn glass-btn-secondary" onClick={handleExport} style={{ flex: 1 }}>
                  <Download size={16} /> Export
                </button>
                <button 
                  className="glass-btn" 
                  onClick={handlePublish} 
                  disabled={publishing || !caption.trim()} 
                  style={{ flex: 1.3 }}
                >
                  {publishing ? 'Publishing...' : 'Share to Feed'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
