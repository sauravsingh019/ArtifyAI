'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser, UserButton } from '@clerk/nextjs';
import { 
  Home, 
  Sparkles, 
  Sliders, 
  Box as BoxIcon, 
  Users, 
  MessageSquare, 
  User, 
  Loader2 
} from 'lucide-react';
import styles from './Sidebar.module.css';

import { motion } from 'framer-motion';

const Sidebar = () => {
  const pathname = usePathname();
  const { user, isLoaded } = useUser();

  const menuItems = [
    { name: 'Feed', icon: Home, path: '/' },
    { name: 'AI Lab', icon: Sparkles, path: '/generate' },
    { name: 'Editor', icon: Sliders, path: '/edit' },
    { name: '3D Hub', icon: BoxIcon, path: '/models' },
    { name: 'Guilds', icon: Users, path: '/communities' },
    { name: 'DMs', icon: MessageSquare, path: '/chat' },
  ];

  // Derive dynamic profile path
  const profilePath = isLoaded && user ? `/profile/${user.username || `creator_${user.id.substring(5, 13).toLowerCase()}`}` : '#';

  return (
    <motion.nav 
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={styles.sidebar}
    >
      {/* Brand Header */}
      <div className={styles.logoContainer}>
        <span className={styles.logoText}>ArtifyAI</span>
        <span className={styles.logoDot}>.</span>
      </div>

      {/* Main Nav Items */}
      <ul className={styles.navList}>
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = pathname === item.path;

          return (
            <li key={item.name} className={styles.navItem}>
              <Link href={item.path} className={`${styles.navLink} ${isActive ? styles.active : ''}`}>
                <IconComponent size={22} className={styles.icon} />
                <span className={styles.linkText}>{item.name}</span>
              </Link>
            </li>
          );
        })}

        {/* Profile Link */}
        {isLoaded && user && (
          <li className={styles.navItem}>
            <Link 
              href={profilePath} 
              className={`${styles.navLink} ${pathname.startsWith('/profile') ? styles.active : ''}`}
            >
              <User size={22} className={styles.icon} />
              <span className={styles.linkText}>Profile</span>
            </Link>
          </li>
        )}
      </ul>

      {/* User Actions & Clerk Button */}
      <div className={styles.footer}>
        {!isLoaded ? (
          <Loader2 className={styles.loadingSpinner} />
        ) : user ? (
          <div className={styles.userInfo}>
            <UserButton afterSignOutUrl="/sign-in" />
            <Link href={profilePath} className={styles.userMeta} style={{ textDecoration: 'none' }}>
              <span className={styles.userName}>{user.fullName || user.username}</span>
              <span className={styles.userRole}>Creator</span>
            </Link>
          </div>
        ) : (
          <Link href="/sign-in" className={styles.loginBtn}>
            Sign In
          </Link>
        )}
      </div>
    </motion.nav>
  );
};

export default Sidebar;
