import { useEffect, useRef } from 'react';
import { Settings, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

const ProfileDropdown = ({ isOpen, onClose, onOpenSettings, settings }) => {
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      ref={ref}
      style={{
        position: 'absolute',
        top: '56px',
        right: '16px',
        width: '260px',
        backgroundColor: 'var(--bg-surface)',
        borderRadius: '12px',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.1), 0 0 0 1px var(--border)',
        zIndex: 1000,
        overflow: 'hidden'
      }}
    >
      {/* User Info Card */}
      <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '50%',
          backgroundColor: 'var(--primary)',
          color: '#ffffff',
          fontWeight: 700,
          fontSize: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          {settings.userInitials || 'JD'}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {settings.userName || 'John Doe'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {settings.agencyName || 'GrowthPilot Studios'}
          </div>
        </div>
      </div>

      {/* Quick Menu Options */}
      <div style={{ padding: '0.5rem' }}>
        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenSettings();
          }}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
            padding: '0.625rem 0.75rem',
            borderRadius: '6px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontSize: '0.8125rem',
            color: 'var(--text-secondary)',
            fontWeight: 500,
            textAlign: 'left',
            transition: 'background-color 0.15s ease'
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <Settings size={16} />
          <span>Application Settings</span>
        </button>

        <Link
          to="/prospects"
          onClick={onClose}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
            padding: '0.625rem 0.75rem',
            borderRadius: '6px',
            fontSize: '0.8125rem',
            color: 'var(--text-secondary)',
            fontWeight: 500,
            textDecoration: 'none',
            transition: 'background-color 0.15s ease'
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <Users size={16} />
          <span>Prospect Database</span>
        </Link>
      </div>

      {/* Role / Status Badge */}
      <div style={{ padding: '0.625rem 1rem', borderTop: '1px solid var(--border)', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>{settings.userRole || 'Lead Growth Consultant'}</span>
        <span className="badge badge-success" style={{ fontSize: '0.6875rem' }}>Active</span>
      </div>
    </div>
  );
};

export default ProfileDropdown;
