'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser, useAuth, RedirectToSignIn } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit3, Eye, Box as BoxIcon, Image as ImageIcon, Loader2, ArrowLeft, Bookmark, Plus, X, Upload, Trash2 } from 'lucide-react';
import styles from './page.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const getBustedUrl = (url, updatedAt) => {
  if (!url) return '';
  if (url.includes('supabase.co')) {
    const t = updatedAt ? new Date(updatedAt).getTime() : Date.now();
    return `${url}?t=${t}`;
  }
  return url;
};

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser, isLoaded: currentUserLoaded } = useUser();
  const { getToken } = useAuth();
  
  const username = params.username;

  // Profile States
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState('posts'); // 'posts' or 'models'

  // Edit states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [editBannerUrl, setEditBannerUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const avatarInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  // Create Post Modal State
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [postCaption, setPostCaption] = useState('');
  const [postCategory, setPostCategory] = useState('3D Render');
  const [postImageFile, setPostImageFile] = useState('');
  const [postImagePreview, setPostImagePreview] = useState('');
  const [postPublishing, setPostPublishing] = useState(false);

  // Create Model Modal State
  const [showCreateModelModal, setShowCreateModelModal] = useState(false);
  const [modelNameInput, setModelNameInput] = useState('');
  const [modelDescInput, setModelDescInput] = useState('');
  const [modelCategoryInput, setModelCategoryInput] = useState('Hard Surface');
  const [modelFile, setModelFile] = useState('');
  const [modelFileName, setModelFileName] = useState('');
  const [modelThumbnailFile, setModelThumbnailFile] = useState('');
  const [modelThumbnailPreview, setModelThumbnailPreview] = useState('');
  const [modelPublishing, setModelPublishing] = useState(false);

  const handlePostImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPostImagePreview(reader.result);
        setPostImageFile(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleModelFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setModelFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setModelFile(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleModelThumbnailChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setModelThumbnailPreview(reader.result);
        setModelThumbnailFile(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!postImageFile || !postCaption) return;

    setPostPublishing(true);
    try {
      const token = await getToken();

      // Step 1: Upload image to Supabase Storage
      let imageUrl = postImageFile;
      if (postImageFile.startsWith('data:')) {
        const uploadRes = await fetch(`${API_URL}/upload/post`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ 
            fileData: postImageFile, 
            fileType: postImageFile.match(/data:([^;]+)/)?.[1] || 'image/jpeg'
          }),
        });
        if (!uploadRes.ok) throw new Error('Image upload failed');
        const uploadData = await uploadRes.json();
        imageUrl = uploadData.url;
      }

      // Step 2: Create post in DB with permanent URL
      const res = await fetch(`${API_URL}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          imageUrl,
          caption: postCaption,
          category: postCategory,
        }),
      });

      if (res.ok) {
        const newPost = await res.json();
        setProfileUser(prev => ({
          ...prev,
          posts: [newPost, ...(prev.posts || [])]
        }));
        
        // Reset states
        setPostCaption('');
        setPostImageFile('');
        setPostImagePreview('');
        setShowCreatePostModal(false);
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || 'Failed to publish creation.');
      }
    } catch (err) {
      console.error(err);
      alert('Error publishing creation.');
    } finally {
      setPostPublishing(false);
    }
  };


  const handleDeletePost = async (postId) => {
    if (!confirm('Are you sure you want to delete this publication?')) return;
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        // Remove from local state
        setProfileUser(prev => ({
          ...prev,
          posts: (prev.posts || []).filter(p => p.id !== postId)
        }));
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || 'Failed to delete publication.');
      }
    } catch (err) {
      console.error('Error deleting post:', err);
      alert('Error deleting publication.');
    }
  };

  const handleCreateModel = async (e) => {
    e.preventDefault();
    if (!modelFile || !modelNameInput) return;

    setModelPublishing(true);
    try {
      const token = await getToken();

      // Step 1: Upload model file + thumbnail to Supabase Storage
      const uploadRes = await fetch(`${API_URL}/upload/model`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          fileData: modelFile,
          fileType: 'model/gltf-binary',
          fileName: modelFileName,
          thumbnailData: modelThumbnailFile || undefined,
          thumbnailType: modelThumbnailFile ? modelThumbnailFile.match(/data:([^;]+)/)?.[1] : undefined,
        }),
      });

      if (!uploadRes.ok) throw new Error('Model upload failed');
      const { modelUrl, thumbnailUrl } = await uploadRes.json();

      // Step 2: Save model metadata in DB with permanent URLs
      const res = await fetch(`${API_URL}/models`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: modelNameInput,
          description: modelDescInput,
          modelUrl,
          thumbnailUrl: thumbnailUrl || undefined,
          category: modelCategoryInput,
        }),
      });

      if (res.ok) {
        const newModel = await res.json();
        setProfileUser(prev => ({
          ...prev,
          models: [newModel, ...(prev.models || [])]
        }));

        // Reset states
        setModelNameInput('');
        setModelDescInput('');
        setModelFile('');
        setModelFileName('');
        setModelThumbnailFile('');
        setModelThumbnailPreview('');
        setShowCreateModelModal(false);
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || 'Failed to upload 3D model.');

      }
    } catch (err) {
      console.error(err);
      alert('Error uploading 3D model.');
    } finally {
      setModelPublishing(false);
    }
  };

  const handleAvatarDirectUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSaving(true);
    try {
      const token = await getToken();
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          // Step 1: Upload to Supabase Storage via backend
          const uploadRes = await fetch(`${API_URL}/upload/avatar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ fileData: reader.result, fileType: file.type, fileName: file.name }),
          });
          if (!uploadRes.ok) throw new Error('Upload to Supabase Storage failed');
          const { url } = await uploadRes.json();

          // Step 2: Update Clerk profile image (so it shows in Clerk UI too)
          try {
            await currentUser.setProfileImage({ file });
          } catch (clerkErr) {
            console.warn('Clerk profile image update failed (non-critical):', clerkErr.message);
          }

          // Step 3: Save Supabase Storage URL to DB
          setEditAvatarUrl(url);
          await saveProfileField({ avatarUrl: url });

        } catch (err) {
          console.error('Avatar upload error:', err);
          alert('Avatar upload failed. Please try again.');
        } finally {
          setSaving(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setSaving(false);
    }
  };


  const handleBannerDirectUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSaving(true);
    try {
      const token = await getToken();
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          // Step 1: Upload to Supabase Storage via backend
          const uploadRes = await fetch(`${API_URL}/upload/banner`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ fileData: reader.result, fileType: file.type, fileName: file.name }),
          });
          if (!uploadRes.ok) throw new Error('Upload failed');
          const { url } = await uploadRes.json();
          
          // Step 2: Save the permanent URL to DB
          setEditBannerUrl(url);
          await saveProfileField({ bannerUrl: url });
        } catch (err) {
          console.error('Banner upload error:', err);
          alert('Banner upload failed. Please try again.');
        } finally {
          setSaving(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setSaving(false);
    }
  };


  const saveProfileField = async (fieldsToUpdate) => {
    setSaving(true);
    const name = fieldsToUpdate.name !== undefined ? fieldsToUpdate.name : (profileUser?.name || '');
    const bio = fieldsToUpdate.bio !== undefined ? fieldsToUpdate.bio : (profileUser?.bio || '');
    const avatarUrl = fieldsToUpdate.avatarUrl !== undefined ? fieldsToUpdate.avatarUrl : (profileUser?.avatarUrl || '');
    const bannerUrl = fieldsToUpdate.bannerUrl !== undefined ? fieldsToUpdate.bannerUrl : (profileUser?.bannerUrl || '');

    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, bio, avatarUrl, bannerUrl }),
      });

      if (res.ok) {
        const updated = await res.json();
        setProfileUser({
          ...profileUser,
          name: updated.name,
          bio: updated.bio,
          avatarUrl: updated.avatarUrl,
          bannerUrl: updated.bannerUrl
        });
      } else {
        console.warn('Backend save failed. Updating local state.');
        setProfileUser({
          ...profileUser,
          ...fieldsToUpdate
        });
      }
    } catch (err) {
      console.error('Error saving profile changes, updating locally:', err);
      setProfileUser({
        ...profileUser,
        ...fieldsToUpdate
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSaving(true);
    try {
      const token = await getToken();
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const uploadRes = await fetch(`${API_URL}/upload/avatar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ fileData: reader.result, fileType: file.type, fileName: file.name }),
          });
          if (!uploadRes.ok) throw new Error('Avatar upload failed');
          const { url } = await uploadRes.json();
          setEditAvatarUrl(url);
        } catch (err) {
          console.error('Avatar upload error in modal:', err);
          alert('Avatar upload failed. Please try again.');
        } finally {
          setSaving(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setSaving(false);
    }
  };

  const handleBannerFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSaving(true);
    try {
      const token = await getToken();
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const uploadRes = await fetch(`${API_URL}/upload/banner`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ fileData: reader.result, fileType: file.type, fileName: file.name }),
          });
          if (!uploadRes.ok) throw new Error('Banner upload failed');
          const { url } = await uploadRes.json();
          setEditBannerUrl(url);
        } catch (err) {
          console.error('Banner upload error in modal:', err);
          alert('Banner upload failed. Please try again.');
        } finally {
          setSaving(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setSaving(false);
    }
  };

  const getFallbackProfile = (uname) => {
    if (!currentUser) return null;
    const isCurrentUser = uname === currentUser.username || 
      uname === `creator_${currentUser.id.substring(5, 13).toLowerCase()}` ||
      uname === `creator_${currentUser.id.substring(5, 12).toLowerCase()}`;

    if (isCurrentUser) {
      return {
        id: currentUser.id,
        email: currentUser.primaryEmailAddress?.emailAddress || 'creator@artify.io',
        username: currentUser.username || `creator_${currentUser.id.substring(5, 13).toLowerCase()}`,
        name: currentUser.fullName || 'Anonymous Creator',
        avatarUrl: currentUser.imageUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        bannerUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&q=80',
        bio: '3D Developer & AI Content Creator',
        posts: [],
        models: [],
        likes: []
      };
    }

    const mockUsers = {
      nebulalab: {
        id: 'mock_u1',
        email: 'nebula@artify.io',
        username: 'nebulalab',
        name: 'Nebula Lab',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
        bannerUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&q=80',
        bio: 'Verified Artify Creator & Designer. Specializes in 3D Mesh and Chromatic shaders.',
        posts: [
          {
            id: 'demo_p1',
            imageUrl: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=800',
            caption: 'Quantum spatial node mesh rendered in Blender Cycles with custom chromatic refraction shaders.',
            category: '3D Render',
          }
        ],
        models: [],
        likes: []
      },
      blender_god: {
        id: 'mock_u2',
        email: 'blender@artify.io',
        username: 'blender_god',
        name: 'Blender Masters',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
        bannerUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&q=80',
        bio: 'Verified Artify Creator & Designer. Specializes in sub-d modeling and texturing.',
        posts: [
          {
            id: 'demo_p2',
            imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800',
            caption: 'Hard-surface detailing exercise. Sub-d modeling method, 4k texture sets.',
            category: 'Blender',
          }
        ],
        models: [],
        likes: []
      },
      neural_painter: {
        id: 'mock_u3',
        email: 'neural@artify.io',
        username: 'neural_painter',
        name: 'AI Synthesizer',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
        bannerUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&q=80',
        bio: 'Verified Artify Creator & Designer. Specializes in octane renders and prompt generation.',
        posts: [
          {
            id: 'demo_p3',
            imageUrl: 'https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?w=800',
            caption: 'Futuristic cybernetic cathedral constructed from tinted smart glass and gold trim, octane render, 8k.',
            category: 'AI Art',
          }
        ],
        models: [],
        likes: []
      },
      cyber_canvas: {
        id: 'mock_u4',
        email: 'cyber@artify.io',
        username: 'cyber_canvas',
        name: 'Composite Artist',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
        bannerUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&q=80',
        bio: 'Verified Artify Creator & Designer. Specializes in composite double-exposure artwork.',
        posts: [
          {
            id: 'demo_p4',
            imageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800',
            caption: 'Composite artwork overlaying double-exposure city grids and glowing prompt coordinate strings.',
            category: 'Photoshop',
          }
        ],
        models: [],
        likes: []
      },
      concept_hq: {
        id: 'mock_u5',
        email: 'concept@artify.io',
        username: 'concept_hq',
        name: 'Art Director',
        avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
        bannerUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&q=80',
        bio: 'Verified Artify Creator & Designer. Specializes in conceptual sketches and spatial biome artwork.',
        posts: [
          {
            id: 'demo_p5',
            imageUrl: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800',
            caption: 'Early mood-board concept sketch for a deep-space docking station biome.',
            category: 'Concept Art',
          }
        ],
        models: [],
        likes: []
      },
      creative_mind: {
        id: 'mock_u6',
        email: 'general@artify.io',
        username: 'creative_mind',
        name: 'Global Creator',
        avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
        bannerUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&q=80',
        bio: 'Verified Artify Creator & Designer. Specializes in coffee, shaders, and workspace layouts.',
        posts: [
          {
            id: 'demo_p6',
            imageUrl: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800',
            caption: 'Morning workspace vibes. Coffee, shaders, and music. Ready to build something epic today.',
            category: 'General',
          }
        ],
        models: [],
        likes: []
      }
    };

    return mockUsers[uname.toLowerCase()] || null;
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(false);
      setErrorMessage('');
      const res = await fetch(`${API_URL}/auth/profile/${username}`);
      if (res.ok) {
        const data = await res.json();
        setProfileUser(data);
        setEditName(data.name || '');
        setEditBio(data.bio || '');
        setEditAvatarUrl(data.avatarUrl || '');
        setEditBannerUrl(data.bannerUrl || '');
      } else {
        const errData = await res.json().catch(() => ({}));
        const errMsg = errData.error || `Response status: ${res.status}`;
        setErrorMessage(errMsg);
        
        // Fail-safe: If it is the current user's own profile but not synced in DB yet, auto-sync it
        const isSelf = currentUser && (
          username === currentUser.username || 
          username === `creator_${currentUser.id.substring(5, 13).toLowerCase()}` ||
          username === `creator_${currentUser.id.substring(5, 12).toLowerCase()}`
        );
        if (isSelf) {
          try {
            const token = await getToken();
            const correctUsername = currentUser.username || `creator_${currentUser.id.substring(5, 13).toLowerCase()}`;
            
            const syncRes = await fetch(`${API_URL}/auth/sync`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                email: currentUser.primaryEmailAddress?.emailAddress,
                username: correctUsername,
                name: currentUser.fullName || 'Anonymous Creator',
                avatarUrl: currentUser.imageUrl,
              }),
            });
            if (syncRes.ok) {
              if (username !== correctUsername) {
                // Redirect to the correct, newly synced username URL
                router.push(`/profile/${correctUsername}`);
                return;
              }
              const retryRes = await fetch(`${API_URL}/auth/profile/${username}`);
              if (retryRes.ok) {
                const data = await retryRes.json();
                setProfileUser(data);
                setEditName(data.name || '');
                setEditBio(data.bio || '');
                setEditAvatarUrl(data.avatarUrl || '');
                setEditBannerUrl(data.bannerUrl || '');
                setErrorMessage('');
                return;
              }
            } else {
              const syncErrData = await syncRes.json().catch(() => ({}));
              setErrorMessage(`Sync failed: ${syncErrData.error || syncRes.status}`);
            }
          } catch (syncErr) {
            console.error('Auto-sync failed:', syncErr);
            setErrorMessage(`Auto-sync error: ${syncErr.message}`);
          }
        }
        
        // Fallback to local mock profile if DB sync or profile call fails
        const fallback = getFallbackProfile(username);
        if (fallback) {
          setProfileUser(fallback);
          setEditName(fallback.name || '');
          setEditBio(fallback.bio || '');
          setEditAvatarUrl(fallback.avatarUrl || '');
          setEditBannerUrl(fallback.bannerUrl || '');
          setErrorMessage('');
        } else {
          setError(true);
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(`Network or client-side error: ${err.message}`);
      
      const fallback = getFallbackProfile(username);
      if (fallback) {
        setProfileUser(fallback);
        setEditName(fallback.name || '');
        setEditBio(fallback.bio || '');
        setEditAvatarUrl(fallback.avatarUrl || '');
        setEditBannerUrl(fallback.bannerUrl || '');
        setErrorMessage('');
      } else {
        setError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (username && currentUserLoaded) {
      fetchProfile();
    }
  }, [username, currentUserLoaded, currentUser]);

  // Proactively sync user details with DB whenever logged in
  useEffect(() => {
    const syncCurrentUser = async () => {
      if (currentUserLoaded && currentUser) {
        try {
          const token = await getToken();
          const correctUsername = currentUser.username || `creator_${currentUser.id.substring(5, 13).toLowerCase()}`;
          const res = await fetch(`${API_URL}/auth/sync`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              email: currentUser.primaryEmailAddress?.emailAddress,
              username: correctUsername,
              name: currentUser.fullName || 'Anonymous Creator',
              avatarUrl: currentUser.imageUrl, // Clerk photo — backend will NOT overwrite Supabase Storage uploads
            }),
          });
          
          if (res.ok) {
            const syncedUser = await res.json();
            
            // Check if we need to redirect
            const correctPath = `/profile/${syncedUser.username}`;
            if (window.location.pathname !== correctPath && window.location.pathname.startsWith('/profile/creator_')) {
              router.replace(correctPath);
            } else {
              // Otherwise, just refresh the profile data to show correct name/details
              fetchProfile();
            }
          }
        } catch (err) {
          console.error('Proactive sync failed:', err);
        }
      }
    };
    syncCurrentUser();
  }, [currentUser, currentUserLoaded, getToken]);



  if (currentUserLoaded && !currentUser) {
    return <RedirectToSignIn />;
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    await saveProfileField({ name: editName, bio: editBio, avatarUrl: editAvatarUrl, bannerUrl: editBannerUrl });
    setShowEditModal(false);
  };

  const isOwner = currentUser && profileUser && currentUser.id === profileUser.id;

  const badges = profileUser ? [
    ...(profileUser.models?.length > 0 ? [{ text: '3D Architect', class: styles.badgePurple }] : []),
    ...(profileUser.posts?.length > 0 ? [{ text: 'AI Synthesizer', class: styles.badgePink }] : []),
    ...(profileUser.likes?.length > 0 ? [{ text: 'Guild Member', class: styles.badgeBlue }] : []),
  ] : [];

  if (loading) {
    return (
      <div className={styles.loadingWrapper}>
        <Loader2 className={styles.spin} size={40} />
        <p>Loading creator profile...</p>
      </div>
    );
  }

  if (error || !profileUser) {
    return (
      <div className={styles.errorWrapper}>
        <h2>Creator Not Found</h2>
        <p>The profile you are seeking is either non-existent or has moved coordinates.</p>
        {errorMessage && (
          <p style={{ color: '#ec4899', fontSize: '0.85rem', marginTop: '15px', background: 'rgba(236, 72, 153, 0.08)', padding: '10px 16px', borderRadius: '10px', border: '1px solid rgba(236, 72, 153, 0.15)', maxWidth: '450px', wordBreak: 'break-word' }}>
            <strong>Debug details:</strong> {errorMessage}
          </p>
        )}
        <button className="glass-btn" onClick={() => router.push('/')} style={{ marginTop: '20px' }}>
          <ArrowLeft size={16} /> Return Feed
        </button>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={styles.container}
    >
      {/* Dynamic Profile Header Banner */}
      <div className={`glass-card ${styles.profileHeader}`}>
        <div 
          className={styles.bannerGrid} 
          style={{ 
            backgroundImage: `url('${getBustedUrl(profileUser.bannerUrl, profileUser.updatedAt) || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&q=80'}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          {isOwner && (
            <>
              <button 
                className={styles.bannerEditBtn} 
                onClick={() => bannerInputRef.current?.click()}
                title="Edit Banner"
              >
                <Edit3 size={16} />
              </button>
              <input 
                type="file" 
                ref={bannerInputRef} 
                style={{ display: 'none' }} 
                accept="image/*" 
                onChange={handleBannerDirectUpload} 
              />
            </>
          )}
        </div>
        
        {/* User Stats/Meta */}
        <div className={styles.profileContent}>
          <div className={styles.avatarWrapper}>
            <div className={styles.avatarContainer}>
              <img 
                src={getBustedUrl(profileUser.avatarUrl, profileUser.updatedAt) || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'} 
                alt={profileUser.username} 
                className={styles.avatar}
              />
              {isOwner && (
                <>
                  <button 
                    className={styles.avatarEditOverlay} 
                    onClick={() => avatarInputRef.current?.click()}
                    title="Change Profile Photo"
                  >
                    <Edit3 size={20} />
                  </button>
                  <input 
                    type="file" 
                    ref={avatarInputRef} 
                    style={{ display: 'none' }} 
                    accept="image/*" 
                    onChange={handleAvatarDirectUpload} 
                  />
                </>
              )}
            </div>
          </div>
          
          <div className={styles.detailsWrapper}>
            <div className={styles.creatorDetails}>
              <div className={styles.nameRow}>
                <h2 className={styles.name}>{profileUser.name || 'Anonymous Creator'}</h2>
                {isOwner && (
                  <button className={styles.editBtn} onClick={() => setShowEditModal(true)}>
                    <Edit3 size={15} /> Edit Profile
                  </button>
                )}
              </div>
              <div className={styles.usernameRow}>
                <span className={styles.username}>@{profileUser.username}</span>
                {badges.map((badge, idx) => (
                  <span key={idx} className={`${styles.badge} ${badge.class}`}>
                    {badge.text}
                  </span>
                ))}
              </div>
              <p className={styles.bio}>{profileUser.bio || 'This creator hasn\'t set a bio coordinates yet.'}</p>
            </div>
            
            <div className={styles.statsPanel}>
              <div className={styles.statBox}>
                <span className={styles.statNum}>{profileUser.posts?.length || 0}</span>
                <span className={styles.statLabel}>Creations</span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statNum}>{profileUser.models?.length || 0}</span>
                <span className={styles.statLabel}>3D Files</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabContainer}>
        <div className={styles.tabSection}>
          <button 
            className={`${styles.tabBtn} ${activeTab === 'posts' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('posts')}
          >
            <ImageIcon size={16} /> Publications
          </button>
          <button 
            className={`${styles.tabBtn} ${activeTab === 'models' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('models')}
          >
            <BoxIcon size={16} /> Spatial Files (3D)
          </button>
          <button 
            className={`${styles.tabBtn} ${activeTab === 'saved' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('saved')}
          >
            <Bookmark size={16} /> Saved
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      <div className={styles.tabContent}>
        {activeTab === 'posts' ? (
          profileUser.posts?.length === 0 ? (
            <div className={styles.emptyTab}>
              <p>No publications shared yet.</p>
              {isOwner && (
                <button className="glass-btn" onClick={() => setShowCreatePostModal(true)} style={{ marginTop: '15px' }}>
                  <Plus size={16} /> Create Publication
                </button>
              )}
            </div>
          ) : (
            <div className={styles.publicationsGrid}>
              {isOwner && (
                <div 
                  className={`glass-card ${styles.gridCard} ${styles.createCard}`} 
                  onClick={() => setShowCreatePostModal(true)}
                >
                  <div className={styles.createCardContent}>
                    <Plus size={28} />
                    <span>Create Publication</span>
                  </div>
                </div>
              )}
              {profileUser.posts.map(post => (
                <div key={post.id} className={`glass-card ${styles.gridCard}`}>
                  <img 
                    src={post.imageUrl} 
                    alt={post.caption} 
                    className={styles.gridImg} 
                    onClick={() => router.push('/')}
                    style={{ cursor: 'pointer' }}
                  />
                  <div className={styles.cardGlowHover} onClick={() => router.push('/')} />
                  <div className={styles.gridCardMeta} onClick={() => router.push('/')}>
                    <p>{post.caption}</p>
                  </div>
                  {isOwner && (
                    <button 
                      className={styles.deletePostBtn} 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePost(post.id);
                      }}
                      title="Delete Publication"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )
        ) : activeTab === 'models' ? (
          profileUser.models?.length === 0 ? (
            <div className={styles.emptyTab}>
              <p>No 3D models uploaded yet.</p>
              {isOwner && (
                <button className="glass-btn" onClick={() => setShowCreateModelModal(true)} style={{ marginTop: '15px' }}>
                  <Plus size={16} /> Upload 3D Model
                </button>
              )}
            </div>
          ) : (
            <div className={styles.publicationsGrid}>
              {isOwner && (
                <div 
                  className={`glass-card ${styles.gridCard} ${styles.createCard}`} 
                  onClick={() => setShowCreateModelModal(true)}
                >
                  <div className={styles.createCardContent}>
                    <Plus size={28} />
                    <span>Upload 3D Model</span>
                  </div>
                </div>
              )}
              {profileUser.models.map(model => (
                <div key={model.id} className={`glass-card ${styles.gridCard}`} onClick={() => router.push('/models')}>
                  <img src={model.thumbnailUrl || 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=300'} alt={model.name} className={styles.gridImg} />
                  <div className={styles.cardGlowHover} />
                  <div className={styles.gridCardMeta}>
                    <h4>{model.name}</h4>
                    <span className={styles.modelCatBadge}>{model.category}</span>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          // Saved / Liked Publications Tab
          !profileUser.likes || profileUser.likes.length === 0 ? (
            <div className={styles.emptyTab}>
              <p>No saved or liked creations yet.</p>
            </div>
          ) : (
            <div className={styles.publicationsGrid}>
              {profileUser.likes.map(like => {
                const post = like.post;
                if (!post) return null;
                return (
                  <div key={like.id} className={`glass-card ${styles.gridCard}`} onClick={() => router.push('/')}>
                    <img src={post.imageUrl} alt={post.caption} className={styles.gridImg} />
                    <div className={styles.cardGlowHover} />
                    <div className={styles.gridCardMeta}>
                      <p>{post.caption}</p>
                      <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>by @{post.author?.username || 'creator'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.modalBackdrop}
            onClick={() => setShowEditModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25 }}
              className={`glass-container ${styles.modalContent}`}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className={styles.modalTitle}>Refine Creator Profile</h2>
              <form onSubmit={handleUpdateProfile} className={styles.modalForm}>
                <div className={styles.formGroup}>
                  <label>Display Name</label>
                  <input 
                    type="text" required className="glass-input" 
                    placeholder="Enter your name"
                    value={editName} onChange={(e) => setEditName(e.target.value)} 
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Biography</label>
                  <textarea 
                    className="glass-input" placeholder="Tell the world about your 3D and AI workflow..."
                    style={{ height: '100px', resize: 'none' }}
                    value={editBio} onChange={(e) => setEditBio(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Profile Photo</label>
                  {editAvatarUrl && (
                    <img 
                      src={getBustedUrl(editAvatarUrl, profileUser.updatedAt)} 
                      alt="Avatar Preview" 
                      style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', marginBottom: '8px', border: '2px solid var(--accent-primary)' }} 
                    />
                  )}
                  <input 
                    type="text" className="glass-input" 
                    placeholder="Paste avatar image URL"
                    value={editAvatarUrl.startsWith('data:image') ? '' : editAvatarUrl} 
                    onChange={(e) => setEditAvatarUrl(e.target.value)} 
                    style={{ marginBottom: '8px' }}
                  />
                  <div className={styles.fileUploadContainer}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Or upload file from Explorer:</span>
                    <input 
                      type="file" accept="image/*" className={styles.fileInput} 
                      onChange={handleAvatarFileChange} 
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Banner Image</label>
                  {editBannerUrl && (
                    <img 
                      src={getBustedUrl(editBannerUrl, profileUser.updatedAt)} 
                      alt="Banner Preview" 
                      style={{ width: '100%', height: '60px', borderRadius: '8px', objectFit: 'cover', marginBottom: '8px', border: '1px solid var(--border-glass)' }} 
                    />
                  )}
                  <input 
                    type="text" className="glass-input" 
                    placeholder="Paste banner image URL"
                    value={editBannerUrl.startsWith('data:image') ? '' : editBannerUrl} 
                    onChange={(e) => setEditBannerUrl(e.target.value)} 
                    style={{ marginBottom: '8px' }}
                  />
                  <div className={styles.fileUploadContainer}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Or upload file from Explorer:</span>
                    <input 
                      type="file" accept="image/*" className={styles.fileInput} 
                      onChange={handleBannerFileChange} 
                    />
                  </div>
                </div>

                <div className={styles.formActions}>
                  <button 
                    type="button" className="glass-btn glass-btn-secondary" 
                    onClick={() => setShowEditModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="glass-btn" disabled={saving}>
                    {saving ? 'Refining...' : 'Save Refinements'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Publication Modal */}
      <AnimatePresence>
        {showCreatePostModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.modalBackdrop}
            onClick={() => setShowCreatePostModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25 }}
              className={`glass-container ${styles.modalContent}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 className={styles.modalTitle} style={{ margin: 0 }}>Create New Publication</h2>
                <button onClick={() => setShowCreatePostModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreatePost} className={styles.modalForm}>
                <div className={styles.formGroup}>
                  <label>Select Image File</label>
                  <div className={styles.fileDropzone} onClick={() => document.getElementById('postImageInput').click()}>
                    <Upload size={24} className={styles.uploadIcon} />
                    {postImagePreview ? (
                      <p style={{ color: 'var(--text-primary)' }}>Change Image File</p>
                    ) : (
                      <p>Click to browse and upload image</p>
                    )}
                    <input 
                      type="file" 
                      id="postImageInput"
                      accept="image/*" 
                      required
                      style={{ display: 'none' }}
                      onChange={handlePostImageChange} 
                    />
                  </div>
                  {postImagePreview && (
                    <div className={styles.imagePreviewContainer}>
                      <img 
                        src={postImagePreview} 
                        alt="Post Preview" 
                        className={styles.imagePreview}
                      />
                    </div>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label>Caption</label>
                  <textarea 
                    required
                    className="glass-input" 
                    placeholder="Describe your creative work, prompts, or workflow..."
                    style={{ height: '80px', resize: 'none' }}
                    value={postCaption} 
                    onChange={(e) => setPostCaption(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Category</label>
                  <select 
                    className="glass-input"
                    value={postCategory} 
                    onChange={(e) => setPostCategory(e.target.value)}
                  >
                    <option value="3D Render">3D Render</option>
                    <option value="AI Art">AI Art</option>
                    <option value="Concept Art">Concept Art</option>
                    <option value="Blender">Blender</option>
                    <option value="Photoshop">Photoshop</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div className={styles.formActions}>
                  <button 
                    type="button" className="glass-btn glass-btn-secondary" 
                    onClick={() => setShowCreatePostModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="glass-btn" disabled={postPublishing || !postImageFile}>
                    {postPublishing ? 'Publishing...' : 'Publish Creation'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload 3D Model Modal */}
      <AnimatePresence>
        {showCreateModelModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.modalBackdrop}
            onClick={() => setShowCreateModelModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25 }}
              className={`glass-container ${styles.modalContent}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 className={styles.modalTitle} style={{ margin: 0 }}>Upload Spatial 3D Asset</h2>
                <button onClick={() => setShowCreateModelModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateModel} className={styles.modalForm}>
                <div className={styles.formGroup}>
                  <label>Asset Name</label>
                  <input 
                    type="text" 
                    required 
                    className="glass-input" 
                    placeholder="e.g. Holographic Cyber Engine"
                    value={modelNameInput} 
                    onChange={(e) => setModelNameInput(e.target.value)} 
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Description</label>
                  <textarea 
                    className="glass-input" 
                    placeholder="Details about mesh coordinates, polygon budget, textures..."
                    style={{ height: '70px', resize: 'none' }}
                    value={modelDescInput} 
                    onChange={(e) => setModelDescInput(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Select 3D Model File (.glb, .gltf)</label>
                  <div className={styles.fileDropzone} onClick={() => document.getElementById('modelFileInput').click()}>
                    <Upload size={24} className={styles.uploadIcon} />
                    {modelFileName ? (
                      <p style={{ color: 'var(--text-primary)' }}>Selected: {modelFileName}</p>
                    ) : (
                      <p>Click to browse and upload GLB/GLTF model</p>
                    )}
                    <input 
                      type="file" 
                      id="modelFileInput"
                      accept=".glb,.gltf" 
                      required
                      style={{ display: 'none' }}
                      onChange={handleModelFileChange} 
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Select Thumbnail Image</label>
                  <div className={styles.fileDropzone} onClick={() => document.getElementById('modelThumbnailInput').click()}>
                    <Upload size={24} className={styles.uploadIcon} />
                    {modelThumbnailPreview ? (
                      <p style={{ color: 'var(--text-primary)' }}>Change Thumbnail Image</p>
                    ) : (
                      <p>Click to browse and upload thumbnail image</p>
                    )}
                    <input 
                      type="file" 
                      id="modelThumbnailInput"
                      accept="image/*" 
                      style={{ display: 'none' }}
                      onChange={handleModelThumbnailChange} 
                    />
                  </div>
                  {modelThumbnailPreview && (
                    <div className={styles.imagePreviewContainer}>
                      <img 
                        src={modelThumbnailPreview} 
                        alt="Thumbnail Preview" 
                        className={styles.imagePreview}
                      />
                    </div>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label>Category</label>
                  <select 
                    className="glass-input"
                    value={modelCategoryInput} 
                    onChange={(e) => setModelCategoryInput(e.target.value)}
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
                    onClick={() => setShowCreateModelModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="glass-btn" disabled={modelPublishing || !modelFile}>
                    {modelPublishing ? 'Uploading...' : 'Publish 3D Asset'}
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
