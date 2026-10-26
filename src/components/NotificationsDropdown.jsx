import { useState, useEffect, useRef } from 'react';
import { Bell, Trash2, ExternalLink, Sparkles, MessageSquare, Database, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const DEFAULT_NOTIFICATIONS = [
  {
    id: 'n_1',
    title: 'Mobile world 2.0 Ingested',
    message: '92/100 Opportunity Score calculated. Verified mobile (+91 88705 15351) ready for WhatsApp pitch.',
    time: '2 mins ago',
    type: 'analysis',
    unread: true,
    link: '/analyze'
  },
  {
    id: 'n_2',
    title: 'WhatsApp Desktop Dispatched',
    message: 'Pitch loaded into native WhatsApp app for The Wrap Lab (+91 98401 23456).',
    time: '1 hour ago',
    type: 'whatsapp',
    unread: true,
    link: '/prospects'
  },
  {
    id: 'n_3',
    title: 'Pipeline Synchronized',
    message: '5 verified Chennai prospects active in local database across automotive, phone repair, and salon niches.',
    time: '3 hours ago',
    type: 'pipeline',
    unread: false,
    link: '/prospects'
  }
];

const NotificationsDropdown = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState(DEFAULT_NOTIFICATIONS);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => n.unread).length;

  const handleMarkAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
  };

  const handleClear = () => {
    setNotifications([]);
  };

  const handleDismiss = (id, e) => {
    e.stopPropagation();
    setNotifications(notifications.filter(n => n.id !== id));
  };

  return (
    <div 
      ref={dropdownRef}
      style={{
        position: 'absolute',
        top: '56px',
        right: '50px',
        width: '360px',
        maxWidth: 'calc(100vw - 2rem)',
        backgroundColor: 'var(--bg-surface)',
        borderRadius: '12px',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.1), 0 0 0 1px var(--border)',
        zIndex: 1000,
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <div style={{ padding: '0.875rem 1rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8fafc' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Notifications</span>
          {unreadCount > 0 && (
            <span style={{ backgroundColor: 'var(--primary)', color: '#fff', fontSize: '0.6875rem', fontWeight: 700, padding: '1px 6px', borderRadius: '10px' }}>
              {unreadCount} new
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {unreadCount > 0 && (
            <button 
              type="button" 
              onClick={handleMarkAllRead}
              className="text-xs text-primary hover:underline"
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
            >
              Mark read
            </button>
          )}
          {notifications.length > 0 && (
            <button 
              type="button" 
              onClick={handleClear}
              className="text-xs text-secondary hover:text-danger"
              style={{ background: 'none', border: 'none', cursor: 'pointer', paddingLeft: '6px' }}
              title="Clear all notifications"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Notification List */}
      <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
        {notifications.length === 0 ? (
          <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.8125rem' }}>
            <Bell size={24} style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
            <p style={{ margin: 0 }}>No notifications right now</p>
          </div>
        ) : (
          notifications.map(n => (
            <div 
              key={n.id}
              onClick={onClose}
              style={{
                padding: '0.875rem 1rem',
                borderBottom: '1px solid var(--border)',
                backgroundColor: n.unread ? 'rgba(37, 99, 235, 0.04)' : 'transparent',
                display: 'flex',
                gap: '0.75rem',
                cursor: 'pointer',
                transition: 'background-color 0.15s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = n.unread ? 'rgba(37, 99, 235, 0.04)' : 'transparent'}
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: n.type === 'analysis' ? '#eff6ff' : n.type === 'whatsapp' ? '#dcfce7' : '#fef3c7',
                color: n.type === 'analysis' ? '#2563eb' : n.type === 'whatsapp' ? '#16a34a' : '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {n.type === 'analysis' ? <Sparkles size={16} /> : n.type === 'whatsapp' ? <MessageSquare size={16} /> : <Database size={16} />}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {n.title}
                  </span>
                  <button 
                    type="button" 
                    onClick={(e) => handleDismiss(n.id, e)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: '2px' }}
                    title="Dismiss"
                  >
                    <X size={12} />
                  </button>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '2px 0 4px 0', lineHeight: 1.4 }}>
                  {n.message}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>{n.time}</span>
                  <Link to={n.link} style={{ fontSize: '0.6875rem', color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
                    View <ExternalLink size={10} />
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '0.625rem 1rem', borderTop: '1px solid var(--border)', backgroundColor: '#f8fafc', textAlign: 'center' }}>
        <Link 
          to="/prospects" 
          onClick={onClose}
          style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)' }}
        >
          View Full Outreach Pipeline →
        </Link>
      </div>
    </div>
  );
};

export default NotificationsDropdown;
