import { useState, useEffect } from 'react';
import { getSettings, saveSettings } from '../services/settings';
import { getProspects, clearAllProspects, DEFAULT_SEED_PROSPECTS, saveProspect } from '../services/api';
import { X, Check, Download, RefreshCw, Settings, CheckCircle2 } from 'lucide-react';

const SettingsModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('general');
  const [form, setForm] = useState(getSettings());
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [leadCount, setLeadCount] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setForm(getSettings());
      setSavedSuccess(false);
      getProspects().then(data => setLeadCount(data.length));
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    saveSettings(form);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const handleExportJSON = async () => {
    const data = await getProspects();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prospects_export_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = async () => {
    const data = await getProspects();
    if (data.length === 0) return;
    const headers = ['Business Name', 'Category', 'Location', 'Phone', 'Website', 'Opportunity Score', 'Status', 'Last Contact'];
    const rows = data.map(p => [
      `"${p.businessName || ''}"`,
      `"${p.category || ''}"`,
      `"${p.location || ''}"`,
      `"${p.phone || ''}"`,
      `"${p.website || ''}"`,
      p.opportunityScore || 0,
      `"${p.status || ''}"`,
      `"${p.lastContact || ''}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prospects_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleResetData = async () => {
    if (window.confirm('Reset all prospects in pipeline back to default 5 verified Chennai businesses?')) {
      await clearAllProspects();
      for (const p of DEFAULT_SEED_PROSPECTS) {
        await saveProspect(p);
      }
      setLeadCount(DEFAULT_SEED_PROSPECTS.length);
      window.location.reload();
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1rem'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="card"
        style={{
          width: '580px',
          maxWidth: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          padding: 0,
          overflow: 'hidden'
        }}
      >
        {/* Modal Header */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{ padding: '0.4rem', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '8px', display: 'flex' }}>
              <Settings size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>Application Settings</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: '2px 0 0 0' }}>Configure outreach profile, WhatsApp routing & pipeline preferences</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '0.25rem', borderRadius: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', backgroundColor: '#f8fafc', padding: '0 1.5rem', gap: '0.5rem' }}>
          <button 
            type="button"
            onClick={() => setActiveTab('general')}
            style={{
              padding: '0.75rem 1rem',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: activeTab === 'general' ? 'var(--primary)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'general' ? '2px solid var(--primary)' : '2px solid transparent'
            }}
          >
            Profile & Agency
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('outreach')}
            style={{
              padding: '0.75rem 1rem',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: activeTab === 'outreach' ? 'var(--primary)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'outreach' ? '2px solid var(--primary)' : '2px solid transparent'
            }}
          >
            WhatsApp & Outreach
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('data')}
            style={{
              padding: '0.75rem 1rem',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: activeTab === 'data' ? 'var(--primary)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'data' ? '2px solid var(--primary)' : '2px solid transparent'
            }}
          >
            Pipeline & Data
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {savedSuccess && (
              <div style={{ padding: '0.75rem 1rem', borderRadius: '6px', backgroundColor: '#dcfce7', border: '1px solid #86efac', color: '#166534', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={18} />
                <span>Settings saved successfully!</span>
              </div>
            )}

            {/* TAB 1: General & Profile */}
            {activeTab === 'general' && (
              <>
                <div className="input-group">
                  <label className="label">Your Name / Freelancer Name</label>
                  <input 
                    type="text" 
                    className="input" 
                    value={form.userName} 
                    onChange={e => setForm({ ...form, userName: e.target.value })} 
                    placeholder="e.g. John Doe" 
                    required 
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                    Avatar initials will display: <strong>{form.userName ? form.userName.slice(0, 2).toUpperCase() : 'JD'}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="input-group">
                    <label className="label">Agency / Studio Brand</label>
                    <input 
                      type="text" 
                      className="input" 
                      value={form.agencyName} 
                      onChange={e => setForm({ ...form, agencyName: e.target.value })} 
                      placeholder="e.g. GrowthPilot Media" 
                    />
                  </div>

                  <div className="input-group">
                    <label className="label">Professional Role</label>
                    <input 
                      type="text" 
                      className="input" 
                      value={form.userRole} 
                      onChange={e => setForm({ ...form, userRole: e.target.value })} 
                      placeholder="e.g. Web Growth Consultant" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="input-group">
                    <label className="label">Portfolio / Sample Demo Link</label>
                    <input 
                      type="text" 
                      className="input" 
                      value={form.portfolioUrl} 
                      onChange={e => setForm({ ...form, portfolioUrl: e.target.value })} 
                      placeholder="https://yourportfolio.com" 
                    />
                  </div>

                  <div className="input-group">
                    <label className="label">Primary Target City / Market</label>
                    <input 
                      type="text" 
                      className="input" 
                      value={form.targetCity} 
                      onChange={e => setForm({ ...form, targetCity: e.target.value })} 
                      placeholder="Chennai, Tamil Nadu" 
                    />
                  </div>
                </div>
              </>
            )}

            {/* TAB 2: WhatsApp & Outreach Engine */}
            {activeTab === 'outreach' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="input-group">
                    <label className="label">Default Country Dialing Code</label>
                    <select 
                      className="input" 
                      value={form.defaultCountryCode} 
                      onChange={e => setForm({ ...form, defaultCountryCode: e.target.value })}
                    >
                      <option value="91">+91 (India)</option>
                      <option value="1">+1 (USA / Canada)</option>
                      <option value="44">+44 (United Kingdom)</option>
                      <option value="971">+971 (United Arab Emirates)</option>
                      <option value="61">+61 (Australia)</option>
                      <option value="65">+65 (Singapore)</option>
                      <option value="49">+49 (Germany)</option>
                    </select>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                      Auto-prepends to 10-digit mobile numbers
                    </span>
                  </div>

                  <div className="input-group">
                    <label className="label">Preferred WhatsApp Client</label>
                    <select 
                      className="input" 
                      value={form.preferredWhatsAppClient} 
                      onChange={e => setForm({ ...form, preferredWhatsAppClient: e.target.value })}
                    >
                      <option value="app">WhatsApp Desktop App (Native)</option>
                      <option value="web">WhatsApp Web (Browser Tab)</option>
                    </select>
                  </div>
                </div>

                <div className="input-group">
                  <label className="label">Default Pitch Tone</label>
                  <select 
                    className="input" 
                    value={form.defaultTone} 
                    onChange={e => setForm({ ...form, defaultTone: e.target.value })}
                  >
                    <option value="Conversational">💬 Friendly & Natural (Conversational)</option>
                    <option value="Direct">⚡ Short & Catchy (15-Second Direct Hook)</option>
                    <option value="Value">🎯 Value & Demo (Concrete Feature Bullets)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}>
                    <input 
                      type="checkbox" 
                      checked={form.autoCopyClipboard} 
                      onChange={e => setForm({ ...form, autoCopyClipboard: e.target.checked })} 
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    <span>Automatically copy pitch to clipboard when clicking WhatsApp Send</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}>
                    <input 
                      type="checkbox" 
                      checked={form.enableDesktopNotifications} 
                      onChange={e => setForm({ ...form, enableDesktopNotifications: e.target.checked })} 
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    <span>Show on-screen notification badge on analysis completions</span>
                  </label>
                </div>
              </>
            )}

            {/* TAB 3: Pipeline & Data Export */}
            {activeTab === 'data' && (
              <>
                <div style={{ padding: '1rem', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#166534', margin: 0 }}>Pipeline Database Status</h4>
                    <p style={{ fontSize: '0.8125rem', color: '#15803d', margin: '2px 0 0 0' }}>Currently tracking <strong>{leadCount} qualified prospects</strong> in local browser storage.</p>
                  </div>
                  <span className="badge badge-success">Online & Synced</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button 
                    type="button" 
                    onClick={handleExportCSV}
                    className="btn btn-secondary" 
                    style={{ justifyContent: 'center', padding: '0.75rem' }}
                  >
                    <Download size={16} />
                    Export CSV Spreadsheet
                  </button>

                  <button 
                    type="button" 
                    onClick={handleExportJSON}
                    className="btn btn-secondary" 
                    style={{ justifyContent: 'center', padding: '0.75rem' }}
                  >
                    <Download size={16} />
                    Export Raw JSON Data
                  </button>
                </div>

                <div style={{ marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Maintenance & Demo Data</h4>
                  <button 
                    type="button" 
                    onClick={handleResetData}
                    className="btn btn-secondary" 
                    style={{ color: '#dc2626', borderColor: '#fca5a5', width: '100%', justifyContent: 'center' }}
                  >
                    <RefreshCw size={15} />
                    Reset Pipeline to Default Verified Prospects
                  </button>
                </div>
              </>
            )}

          </div>

          {/* Modal Footer */}
          <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              style={{ minWidth: '130px', justifyContent: 'center' }}
            >
              <Check size={16} />
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsModal;
