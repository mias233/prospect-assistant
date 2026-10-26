import { useState, useEffect } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { Search, LayoutDashboard, Users, FileText, Menu, Bell, Settings } from 'lucide-react';
import { getSettings } from '../services/settings';
import SettingsModal from './SettingsModal';
import NotificationsDropdown from './NotificationsDropdown';
import ProfileDropdown from './ProfileDropdown';

const Layout = () => {
  const location = useLocation();

  // Header Interactive States
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const [settings, setSettings] = useState(getSettings());

  useEffect(() => {
    const syncSettings = () => {
      setSettings(getSettings());
    };
    window.addEventListener('prospect_assistant_settings_updated', syncSettings);
    return () => window.removeEventListener('prospect_assistant_settings_updated', syncSettings);
  }, []);

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/analyze', label: 'Analyze Business', icon: Search },
    { path: '/prospects', label: 'Prospects', icon: Users },
  ];

  const sidebarWidth = sidebarCollapsed ? 76 : 260;

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside 
        className="sidebar"
        style={{
          width: `${sidebarWidth}px`,
          transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          overflowX: 'hidden'
        }}
      >
        <div className="sidebar-header" style={{ padding: sidebarCollapsed ? '1.5rem 0.75rem' : '1.5rem', justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}>
          <div className="bg-primary flex items-center justify-center rounded-sm" style={{ width: '32px', height: '32px', backgroundColor: 'var(--primary)', color: 'white', borderRadius: '8px', flexShrink: 0 }}>
            <FileText size={20} />
          </div>
          {!sidebarCollapsed && <span className="font-semibold text-lg" style={{ whiteSpace: 'nowrap' }}>ProspectAI</span>}
        </div>
        
        <nav className="sidebar-nav" style={{ padding: sidebarCollapsed ? '1.5rem 0.5rem' : '1.5rem 1rem' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link 
                key={item.path} 
                to={item.path} 
                className={`nav-item ${isActive ? 'active' : ''}`}
                style={{
                  justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                  padding: sidebarCollapsed ? '0.75rem 0' : '0.75rem 1rem'
                }}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon size={20} style={{ flexShrink: 0 }} />
                {!sidebarCollapsed && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main 
        className="main-content"
        style={{
          marginLeft: `${sidebarWidth}px`,
          transition: 'margin-left 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {/* Header */}
        <header className="header" style={{ position: 'sticky', top: 0, zIndex: 100 }}>
          <div className="flex items-center gap-4">
            <button 
              type="button"
              className="btn btn-secondary" 
              style={{ padding: '0.5rem' }}
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <Menu size={20} />
            </button>
            <h2 className="text-lg font-medium">
              {navItems.find(item => item.path === location.pathname)?.label || 'Prospect Assistant'}
            </h2>
          </div>
          
          <div className="flex items-center gap-3" style={{ position: 'relative' }}>
            {/* Bell / Notification Button */}
            <div style={{ position: 'relative' }}>
              <button 
                type="button"
                className="text-secondary hover:text-primary transition" 
                style={{ 
                  background: isNotificationsOpen ? 'var(--bg-surface-hover)' : 'none', 
                  border: 'none', 
                  cursor: 'pointer', 
                  padding: '8px', 
                  borderRadius: '50%',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onClick={() => {
                  setIsNotificationsOpen(!isNotificationsOpen);
                  setIsProfileOpen(false);
                  setHasUnread(false);
                }}
                title="Notifications & Activity"
              >
                <Bell size={20} />
                {hasUnread && (
                  <span 
                    style={{
                      position: 'absolute',
                      top: '6px',
                      right: '6px',
                      width: '8px',
                      height: '8px',
                      backgroundColor: '#ef4444',
                      borderRadius: '50%',
                      border: '2px solid #ffffff'
                    }} 
                  />
                )}
              </button>

              {/* Notifications Dropdown */}
              <NotificationsDropdown 
                isOpen={isNotificationsOpen} 
                onClose={() => setIsNotificationsOpen(false)} 
              />
            </div>

            {/* Settings Gear Button */}
            <button 
              type="button"
              className="text-secondary hover:text-primary transition" 
              style={{ 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer', 
                padding: '8px', 
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onClick={() => {
                setIsSettingsOpen(true);
                setIsNotificationsOpen(false);
                setIsProfileOpen(false);
              }}
              title="Application Settings"
            >
              <Settings size={20} />
            </button>

            {/* Profile Avatar Button */}
            <div style={{ position: 'relative' }}>
              <div 
                className="rounded-full bg-primary-light flex items-center justify-center font-bold text-primary transition" 
                style={{ 
                  width: '36px', 
                  height: '36px', 
                  borderRadius: '50%', 
                  cursor: 'pointer',
                  border: isProfileOpen ? '2px solid var(--primary)' : '2px solid transparent',
                  userSelect: 'none'
                }}
                onClick={() => {
                  setIsProfileOpen(!isProfileOpen);
                  setIsNotificationsOpen(false);
                }}
                title={`${settings.userName || 'John Doe'} (${settings.userRole || 'Lead Growth Consultant'})`}
              >
                {settings.userInitials || 'JD'}
              </div>

              {/* Profile Dropdown */}
              <ProfileDropdown 
                isOpen={isProfileOpen} 
                onClose={() => setIsProfileOpen(false)} 
                onOpenSettings={() => setIsSettingsOpen(true)}
                settings={settings}
              />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="page-container">
          <Outlet />
        </div>
      </main>

      {/* Global Interactive Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </div>
  );
};

export default Layout;

