import { Link, useLocation, Outlet } from 'react-router-dom';
import { Search, LayoutDashboard, Users, FileText, Menu, Bell, Settings } from 'lucide-react';

const Layout = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/analyze', label: 'Analyze Business', icon: Search },
    { path: '/prospects', label: 'Prospects', icon: Users },
  ];

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="bg-primary flex items-center justify-center rounded-sm" style={{ width: '32px', height: '32px', backgroundColor: 'var(--primary)', color: 'white', borderRadius: '8px' }}>
            <FileText size={20} />
          </div>
          <span className="font-semibold text-lg">ProspectAI</span>
        </div>
        
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link 
                key={item.path} 
                to={item.path} 
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={20} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Header */}
        <header className="header">
          <div className="flex items-center gap-4">
            <button className="btn btn-secondary" style={{ padding: '0.5rem' }}>
              <Menu size={20} />
            </button>
            <h2 className="text-lg font-medium">
              {navItems.find(item => item.path === location.pathname)?.label || 'Prospect Assistant'}
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="text-secondary hover:text-primary transition" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <Bell size={20} />
            </button>
            <button className="text-secondary hover:text-primary transition" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <Settings size={20} />
            </button>
            <div className="rounded-full bg-primary-light flex items-center justify-center font-medium text-primary" style={{ width: '36px', height: '36px', borderRadius: '50%' }}>
              JD
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="page-container">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
