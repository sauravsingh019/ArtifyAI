'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useUser, useAuth, RedirectToSignIn } from '@clerk/nextjs';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, User, Search, Loader2 } from 'lucide-react';
import styles from './page.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

export default function ChatPage() {
  const { user, isLoaded: userLoaded } = useUser();
  const { getToken } = useAuth();
  
  const [creators, setCreators] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selection
  const [activeCreator, setActiveCreator] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Connect Socket.io
  useEffect(() => {
    if (!user) return;

    socketRef.current = io(SOCKET_URL);

    socketRef.current.on('connect', () => {
      console.log('Connected to socket server');
      // Join private message room
      socketRef.current.emit('join_room', user.id);
    });

    // Listen to incoming real-time DMs
    socketRef.current.on('receive_message', (payload) => {
      // If the message is from our active chat partner or from ourselves to them, push to view log
      if (
        (payload.senderId === activeCreator?.id && payload.receiverId === user.id) ||
        (payload.senderId === user.id && payload.receiverId === activeCreator?.id)
      ) {
        setMessages((prev) => [...prev, payload]);
      }
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [user, activeCreator]);

  // Fetch chat users directory
  const fetchCreators = async () => {
    try {
      setLoadingUsers(true);
      const token = await getToken();
      const res = await fetch(`${API_URL}/chat/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setCreators(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (userLoaded && user) {
      fetchCreators();
    }
  }, [userLoaded, user]);

  // Load message logs when switching chats
  const handleSelectCreator = async (creator) => {
    setActiveCreator(creator);
    setLoadingMessages(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/chat/messages/${creator.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Send Message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeCreator || !user) return;

    const msgPayload = {
      senderId: user.id,
      receiverId: activeCreator.id,
      content: newMessage.trim(),
    };

    // 1. Emit socket message for real-time display push
    socketRef.current?.emit('send_message', msgPayload);

    // 2. Persist in database
    try {
      const token = await getToken();
      await fetch(`${API_URL}/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(msgPayload),
      });
    } catch (err) {
      console.error('Failed to persist chat message:', err);
    }

    setNewMessage('');
  };

  if (userLoaded && !user) {
    return <RedirectToSignIn />;
  }

  const filteredCreators = creators.filter((c) =>
    c.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.name && c.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={styles.container}
    >
      <div className={styles.header}>
        <h1 className={styles.title}>Direct Messages</h1>
        <p className={styles.subtitle}>Collaborate and chat in real-time with other developers and creators</p>
      </div>

      <div className={styles.chatWorkspace}>
        {/* Left column: Creators Directory */}
        <div className={`glass-container ${styles.directory}`}>
          <div className={styles.searchBar}>
            <Search size={18} className={styles.searchIcon} />
            <input 
              type="text" 
              placeholder="Search creators..." 
              className="glass-input" 
              style={{ width: '100%', paddingLeft: '40px' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className={styles.creatorsList}>
            {loadingUsers ? (
              <div className={styles.spinnerWrapper}>
                <Loader2 className={styles.spin} />
              </div>
            ) : filteredCreators.length === 0 ? (
              <p className={styles.emptyDirectory}>No creators found.</p>
            ) : (
              filteredCreators.map((creator) => (
                <div 
                  key={creator.id} 
                  className={`${styles.creatorItem} ${activeCreator?.id === creator.id ? styles.activeCreator : ''}`}
                  onClick={() => handleSelectCreator(creator)}
                >
                  <img 
                    src={creator.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'} 
                    alt={creator.username} 
                    className={styles.creatorAvatar}
                  />
                  <div className={styles.creatorMeta}>
                    <span className={styles.creatorName}>{creator.name || 'Creator'}</span>
                    <span className={styles.creatorUsername}>@{creator.username}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right column: Chat Log Viewport */}
        <div className={`glass-card ${styles.viewport}`}>
          {activeCreator ? (
            <div className={styles.viewportWrapper}>
              {/* Header */}
              <div className={styles.viewportHeader}>
                <img 
                  src={activeCreator.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'} 
                  alt={activeCreator.username} 
                  className={styles.activeAvatar}
                />
                <div>
                  <h3 className={styles.activeName}>{activeCreator.name || 'Creator'}</h3>
                  <span className={styles.activeUsername}>@{activeCreator.username}</span>
                </div>
              </div>

              {/* Chat Messages Logs */}
              <div className={styles.chatLogs}>
                {loadingMessages ? (
                  <div className={styles.spinnerWrapper}>
                    <Loader2 className={styles.spin} />
                  </div>
                ) : messages.length === 0 ? (
                  <div className={styles.emptyLog}>
                    <MessageSquare size={40} style={{ opacity: 0.15, marginBottom: '10px' }} />
                    <p>No messages yet. Send a ping to start collaborating!</p>
                  </div>
                ) : (
                  <div className={styles.messagesContainer}>
                    {messages.map((msg, idx) => {
                      const isMe = (msg.senderId || msg.sender_id) === user.id;
                      return (
                        <motion.div
                          key={msg.id || idx}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                          className={`${styles.messageBubbleWrapper} ${isMe ? styles.bubbleMeWrapper : styles.bubbleThemWrapper}`}
                        >
                          <div className={`${styles.messageBubble} ${isMe ? styles.bubbleMe : styles.bubbleThem}`}>
                            <p className={styles.bubbleText}>{msg.content}</p>
                          </div>
                        </motion.div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Form Input */}
              <form onSubmit={handleSendMessage} className={styles.chatInputForm}>
                <input 
                  type="text" 
                  placeholder={`Send message to @${activeCreator.username}...`} 
                  className="glass-input"
                  style={{ flex: 1, padding: '14px 20px', borderRadius: '14px' }}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <button type="submit" className="glass-btn" style={{ padding: '14px', borderRadius: '14px' }}>
                  <Send size={18} />
                </button>
              </form>
            </div>
          ) : (
            <div className={styles.viewportPlaceholder}>
              <MessageSquare size={60} className={styles.placeholderIcon} />
              <h3>Direct Messaging Viewport</h3>
              <p>Select a creator collaborator from the left directory to connect a secure real-time chat socket.</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
