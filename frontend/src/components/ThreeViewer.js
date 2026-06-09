'use client';

import React, { Suspense, useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Center, useGLTF, useProgress } from '@react-three/drei';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, prevUrl: props.url };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught loading error:", error, errorInfo);
    if (this.props.onError) {
      this.props.onError(error);
    }
  }

  static getDerivedStateFromProps(props, state) {
    if (props.url !== state.prevUrl) {
      return {
        hasError: false,
        prevUrl: props.url,
      };
    }
    return null;
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// A rotating, glowing fallback mesh that changes shape based on selected demo model
function FallbackMesh({ type }) {
  const meshRef = useRef();

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.4;
      // Floating animation
      meshRef.current.position.y = Math.sin(state.clock.getElapsedTime() * 1.5) * 0.08;
    }
  });

  // Solid material helper
  const createMaterial = (color, roughness = 0.5, metalness = 0.0, extra = {}) => (
    <meshStandardMaterial
      color={color}
      roughness={roughness}
      metalness={metalness}
      wireframe={false}
      {...extra}
    />
  );

  // Holographic wireframe material helper
  const createWireframeMaterial = (color, emissive, intensity = 1.5) => (
    <meshStandardMaterial
      color={color}
      emissive={emissive}
      emissiveIntensity={intensity}
      wireframe={true}
    />
  );

  const renderGeometry = () => {
    switch (type) {
      case 'node':
        // Wireframe energy node
        return (
          <group>
            <mesh>
              <dodecahedronGeometry args={[1.1, 1]} />
              {createWireframeMaterial('#c084fc', '#8b5cf6', 1.5)}
            </mesh>
            <mesh>
              <icosahedronGeometry args={[0.6, 1]} />
              {createWireframeMaterial('#f472b6', '#db2777', 2.0)}
            </mesh>
          </group>
        );

      case 'torusKnot':
        // Wireframe cyberpunk knot
        return (
          <mesh>
            <torusKnotGeometry args={[1, 0.28, 120, 16]} />
            {createWireframeMaterial('#c084fc', '#8b5cf6', 1.5)}
          </mesh>
        );

      case 'donut':
        // Solid glazed pink donut
        return (
          <group rotation={[0.4, 0, 0]}>
            {/* Doughnut Body */}
            <mesh>
              <torusGeometry args={[0.9, 0.35, 32, 64]} />
              {createMaterial('#f472b6', 0.15, 0.1)} {/* Glossy pink glaze */}
            </mesh>
            {/* Sprinkle mock geometries */}
            <mesh position={[0.2, 0.3, 0.2]}>
              <sphereGeometry args={[0.06, 8, 8]} />
              {createMaterial('#60a5fa', 0.2, 0.0)} {/* Blue sprinkle */}
            </mesh>
            <mesh position={[-0.3, 0.25, 0.15]}>
              <sphereGeometry args={[0.06, 8, 8]} />
              {createMaterial('#fbbf24', 0.2, 0.0)} {/* Gold sprinkle */}
            </mesh>
            <mesh position={[0, -0.38, 0.1]}>
              <sphereGeometry args={[0.06, 8, 8]} />
              {createMaterial('#34d399', 0.2, 0.0)} {/* Green sprinkle */}
            </mesh>
          </group>
        );

      case 'monkey':
        // Solid polished gold monkey head
        return (
          <group position={[0, 0.1, 0]}>
            {/* Head */}
            <mesh position={[0, 0, 0]}>
              <sphereGeometry args={[0.7, 32, 32]} />
              {createMaterial('#fbbf24', 0.15, 0.85)} {/* Polished Gold */}
            </mesh>
            {/* Left Ear */}
            <mesh position={[-0.8, 0.2, 0]}>
              <sphereGeometry args={[0.22, 16, 16]} />
              {createMaterial('#fbbf24', 0.15, 0.85)}
            </mesh>
            {/* Right Ear */}
            <mesh position={[0.8, 0.2, 0]}>
              <sphereGeometry args={[0.22, 16, 16]} />
              {createMaterial('#fbbf24', 0.15, 0.85)}
            </mesh>
            {/* Eyes (Glowing pink node-like eyes) */}
            <mesh position={[-0.22, 0.15, 0.58]}>
              <sphereGeometry args={[0.08, 16, 16]} />
              <meshStandardMaterial color="#f472b6" emissive="#ec4899" emissiveIntensity={2.0} />
            </mesh>
            <mesh position={[0.22, 0.15, 0.58]}>
              <sphereGeometry args={[0.08, 16, 16]} />
              <meshStandardMaterial color="#f472b6" emissive="#ec4899" emissiveIntensity={2.0} />
            </mesh>
            {/* Muzzle */}
            <mesh position={[0, -0.15, 0.5]}>
              <sphereGeometry args={[0.28, 16, 16]} />
              {createMaterial('#fef08a', 0.3, 0.3)} {/* Lighter gold */}
            </mesh>
          </group>
        );

      case 'hat':
        // Solid felt fedora hat
        return (
          <group position={[0, -0.2, 0]}>
            {/* Brim */}
            <mesh position={[0, -0.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[1.2, 1.2, 0.04, 32]} />
              {createMaterial('#1f2937', 0.85, 0.05)} {/* Charcoal black felt */}
            </mesh>
            {/* Crown */}
            <mesh position={[0, 0.2, 0]}>
              <cylinderGeometry args={[0.68, 0.72, 0.9, 32]} />
              {createMaterial('#1f2937', 0.85, 0.05)}
            </mesh>
            {/* Ribbon */}
            <mesh position={[0, -0.22, 0]}>
              <cylinderGeometry args={[0.69, 0.7, 0.12, 32]} />
              {createMaterial('#a855f7', 0.3, 0.4, { emissive: '#8b5cf6', emissiveIntensity: 0.5 })} {/* Silk Purple */}
            </mesh>
          </group>
        );

      case 'car':
        // Solid futuristic cyber cruiser car
        return (
          <group position={[0, 0.1, 0]}>
            {/* Chassis */}
            <mesh position={[0, -0.1, 0]}>
              <boxGeometry args={[1.7, 0.35, 0.8]} />
              {createMaterial('#cbd5e1', 0.1, 0.95)} {/* Silver Metallic Chrome */}
            </mesh>
            {/* Cabin */}
            <mesh position={[-0.1, 0.2, 0]}>
              <boxGeometry args={[0.85, 0.3, 0.65]} />
              {createMaterial('#0f172a', 0.0, 0.2)} {/* High-gloss windshield glass */}
            </mesh>
            {/* Wheels (Matte black with neon purple hubcaps) */}
            <group>
              {/* FL Wheel */}
              <mesh position={[0.5, -0.3, 0.42]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.22, 0.22, 0.12, 16]} />
                {createMaterial('#1e293b', 0.9, 0.0)}
              </mesh>
              <mesh position={[0.5, -0.3, 0.49]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.1, 0.1, 0.02, 16]} />
                <meshStandardMaterial color="#c084fc" emissive="#8b5cf6" emissiveIntensity={1.5} />
              </mesh>
              
              {/* FR Wheel */}
              <mesh position={[0.5, -0.3, -0.42]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.22, 0.22, 0.12, 16]} />
                {createMaterial('#1e293b', 0.9, 0.0)}
              </mesh>
              <mesh position={[0.5, -0.3, -0.49]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.1, 0.1, 0.02, 16]} />
                <meshStandardMaterial color="#c084fc" emissive="#8b5cf6" emissiveIntensity={1.5} />
              </mesh>

              {/* RL Wheel */}
              <mesh position={[-0.5, -0.3, 0.42]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.22, 0.22, 0.12, 16]} />
                {createMaterial('#1e293b', 0.9, 0.0)}
              </mesh>
              <mesh position={[-0.5, -0.3, 0.49]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.1, 0.1, 0.02, 16]} />
                <meshStandardMaterial color="#c084fc" emissive="#8b5cf6" emissiveIntensity={1.5} />
              </mesh>

              {/* RR Wheel */}
              <mesh position={[-0.5, -0.3, -0.42]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.22, 0.22, 0.12, 16]} />
                {createMaterial('#1e293b', 0.9, 0.0)}
              </mesh>
              <mesh position={[-0.5, -0.3, -0.49]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.1, 0.1, 0.02, 16]} />
                <meshStandardMaterial color="#c084fc" emissive="#8b5cf6" emissiveIntensity={1.5} />
              </mesh>
            </group>
          </group>
        );

      case 'iceCream':
        // Solid cosmic ice cream cone
        return (
          <group position={[0, 0.1, 0]}>
            {/* Cone */}
            <mesh position={[0, -0.5, 0]} rotation={[Math.PI, 0, 0]}>
              <coneGeometry args={[0.42, 1.0, 16]} />
              {createMaterial('#d97706', 0.8, 0.1)} {/* Waffle Brown */}
            </mesh>
            {/* Bottom Scoop (Mint Green) */}
            <mesh position={[0, 0.15, 0]}>
              <sphereGeometry args={[0.48, 32, 32]} />
              {createMaterial('#34d399', 0.6, 0.05)}
            </mesh>
            {/* Top Scoop (Strawberry Pink) */}
            <mesh position={[0, 0.52, 0]}>
              <sphereGeometry args={[0.36, 32, 32]} />
              {createMaterial('#f472b6', 0.6, 0.05)}
            </mesh>
            {/* Cherry (Shiny Red) */}
            <mesh position={[0, 0.78, 0]}>
              <sphereGeometry args={[0.1, 16, 16]} />
              {createMaterial('#ef4444', 0.1, 0.2)}
            </mesh>
          </group>
        );

      case 'torusKnot':
      default:
        // Default: rotating torus knot (wireframe)
        return (
          <mesh>
            <torusKnotGeometry args={[1, 0.28, 120, 16]} />
            {createWireframeMaterial('#c084fc', '#8b5cf6', 1.5)}
          </mesh>
        );
    }
  };

  return (
    <group ref={meshRef}>
      {renderGeometry()}
    </group>
  );
}

// Model loader component
function GLTFModel({ url, onError, fallback }) {
  try {
    // Attempt to load GLTF/GLB
    const { scene } = useGLTF(url);
    return <primitive object={scene} scale={1.5} />;
  } catch (err) {
    console.error('Error loading 3D model, using fallback wireframe:', err);
    if (onError) onError();
    return fallback || null;
  }
}

export default function ThreeViewer({ modelUrl, geometryType, modelName }) {
  const [hasError, setHasError] = useState(false);
  const { active, progress } = useProgress();
  const [loadableUrl, setLoadableUrl] = useState(null);

  // Convert Base64 data: URL to Blob URL
  useEffect(() => {
    let activeUrl = modelUrl;
    let isBlob = false;

    if (modelUrl && modelUrl.startsWith('data:')) {
      try {
        const parts = modelUrl.split(',');
        if (parts.length > 1) {
          const contentType = parts[0].split(':')[1].split(';')[0];
          const base64Data = parts[1];
          const byteCharacters = atob(base64Data);
          const byteArrays = [];
          for (let offset = 0; offset < byteCharacters.length; offset += 512) {
            const slice = byteCharacters.slice(offset, offset + 512);
            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
              byteNumbers[i] = slice.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
          }
          const blob = new Blob(byteArrays, { type: contentType });
          activeUrl = URL.createObjectURL(blob);
          isBlob = true;
        }
      } catch (err) {
        console.error('Failed to convert base64 model to Blob URL:', err);
      }
    }

    setLoadableUrl(activeUrl);

    return () => {
      if (isBlob && activeUrl) {
        URL.revokeObjectURL(activeUrl);
      }
    };
  }, [modelUrl]);

  // Reset error state if URL changes
  useEffect(() => {
    setHasError(false);
  }, [modelUrl]);

  let statusText = '';
  let statusColor = '#94a3b8';
  let icon = '✨';
  let isLoaderActive = active;

  if (isLoaderActive && loadableUrl) {
    statusText = `Loading 3D asset: ${Math.round(progress)}%`;
    statusColor = '#a855f7'; // Purple glow
    icon = '🔄';
  } else if (!loadableUrl) {
    statusText = `Rendering built-in ${modelName || '3D'} preset`;
    statusColor = '#60a5fa'; // Premium bright blue
    icon = '✨';
  } else if (hasError) {
    statusText = 'Failed to load file. Showing fallback preset.';
    statusColor = '#f43f5e'; // Red error
    icon = '⚠️';
  } else {
    statusText = '3D mesh loaded successfully';
    statusColor = '#34d399'; // Green success
    icon = '✅';
  }

  const bgStyle = 'radial-gradient(circle, #f5f3ff 0%, #edd8ff 100%)'; // Soft light lavender studio background for all viewports

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: bgStyle, transition: 'background 0.5s ease' }}>
      <style>{`
        @keyframes status-pulse {
          0% { transform: scale(0.95); opacity: 0.5; }
          50% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(0.95); opacity: 0.5; }
        }
      `}</style>

      {/* Floating HUD status indicator */}
      <div style={{
        position: 'absolute',
        top: '12px',
        left: '12px',
        background: 'rgba(10, 11, 16, 0.85)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(12px)',
        padding: '10px 14px',
        borderRadius: '10px',
        fontSize: '0.8rem',
        color: '#f8fafc',
        fontWeight: '500',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        zIndex: 10,
        pointerEvents: 'none',
        boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        minWidth: '220px',
        transition: 'all 0.3s ease'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: statusColor,
            boxShadow: `0 0 8px ${statusColor}`,
            display: 'inline-block',
            animation: (isLoaderActive && modelUrl) ? 'status-pulse 1.5s infinite ease-in-out' : 'none'
          }} />
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: statusColor, fontWeight: 'bold' }}>
            {icon} {isLoaderActive && modelUrl ? 'Loading' : !modelUrl ? '3D Preset' : hasError ? 'Error' : 'Ready'}
          </span>
        </div>
        <span style={{ color: '#e2e8f0', fontSize: '0.75rem' }}>{statusText}</span>
        
        {/* Progress bar if loading */}
        {isLoaderActive && modelUrl && (
          <div style={{
            width: '100%',
            height: '4px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '2px',
            overflow: 'hidden',
            marginTop: '4px'
          }}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #a855f7, #ec4899)',
              borderRadius: '2px',
              transition: 'width 0.2s ease-out'
            }} />
          </div>
        )}
      </div>

      <Canvas camera={{ position: [0, 0, 4], fov: 50 }}>
        {/* Lights */}
        <ambientLight intensity={0.9} />
        <directionalLight position={[10, 10, 5]} intensity={1.8} />
        <directionalLight position={[-10, -10, -5]} intensity={0.8} />
        <pointLight position={[0, 5, 0]} intensity={1.0} color="#8b5cf6" />
        <pointLight position={[5, -5, 5]} intensity={1.0} color="#ec4899" />

        {/* 3D Content Container */}
        <Suspense fallback={<FallbackMesh type={geometryType} />}>
          <Center>
            {loadableUrl && !hasError ? (
              <ErrorBoundary url={loadableUrl} fallback={<FallbackMesh type={geometryType} />} onError={() => setHasError(true)}>
                <GLTFModel url={loadableUrl} onError={() => setHasError(true)} fallback={<FallbackMesh type={geometryType} />} />
              </ErrorBoundary>
            ) : (
              <FallbackMesh type={geometryType} />
            )}
          </Center>
        </Suspense>

        {/* Orbit Controls (mouse click + drag to rotate, scroll to zoom) */}
        <OrbitControls 
          enableDamping 
          dampingFactor={0.05} 
          minDistance={1.5} 
          maxDistance={10} 
        />
      </Canvas>

      {/* Floating HUD controls info */}
      <div style={{
        position: 'absolute',
        bottom: '12px',
        left: '12px',
        background: 'rgba(15, 23, 42, 0.06)',
        border: '1px solid rgba(15, 23, 42, 0.08)',
        backdropFilter: 'blur(8px)',
        padding: '6px 12px',
        borderRadius: '8px',
        fontSize: '0.75rem',
        color: '#475569',
        pointerEvents: 'none',
        display: 'flex',
        gap: '12px',
        transition: 'all 0.3s ease'
      }}>
        <span>🖱️ Click + Drag to Orbit</span>
        <span>🔍 Scroll to Zoom</span>
      </div>
    </div>
  );
}
