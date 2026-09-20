import { useState } from 'react';
import { Search, MapPin, Phone, Globe, Star, CheckCircle2, ChevronRight, Copy, MessageSquare, Save, ExternalLink } from 'lucide-react';
import { analyzeBusiness, generateAudit, generatePitch, saveProspect } from '../services/api';

const Analyze = () => {
  const [url, setUrl] = useState('');
  
  // Stages
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [business, setBusiness] = useState(null);
  
  const [isAuditing, setIsAuditing] = useState(false);
  const [audit, setAudit] = useState(null);
  
  const [isPitching, setIsPitching] = useState(false);
  const [pitch, setPitch] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!url) return;
    
    setIsAnalyzing(true);
    setBusiness(null);
    setAudit(null);
    setPitch('');
    setSaved(false);
    
    try {
      const bData = await analyzeBusiness(url);
      setBusiness(bData);
      
      setIsAuditing(true);
      const aData = await generateAudit(bData);
      setAudit(aData);
    } catch (err) {
      console.error(err);
      alert("Failed to analyze. Please ensure it's a valid Maps link.");
    } finally {
      setIsAnalyzing(false);
      setIsAuditing(false);
    }
  };

  const handleGeneratePitch = async () => {
    setIsPitching(true);
    try {
      const pData = await generatePitch(business, audit);
      setPitch(pData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsPitching(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveProspect({
        businessName: business.name,
        category: business.category,
        location: business.address.split(',')[1]?.trim() || business.address,
        website: business.website ? 'Detected' : 'No website',
        opportunityScore: audit.opportunityScore
      });
      setSaved(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Analyze a Business</h1>
        <p className="text-secondary mt-1">Paste a Google Maps link to instantly generate a prospect profile and pitch.</p>
      </div>

      <div className="card mb-8">
        <form onSubmit={handleAnalyze} className="flex gap-4 items-end">
          <div className="input-group flex-1">
            <label className="label">Google Maps Place URL</label>
            <input 
              type="text" 
              className="input" 
              placeholder="https://maps.google.com/..." 
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isAnalyzing}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={isAnalyzing || !url} style={{ padding: '0.625rem 1.5rem' }}>
            {isAnalyzing ? 'Analyzing...' : (
              <>
                <Search size={18} />
                Analyze Business
              </>
            )}
          </button>
        </form>
      </div>

      {business && (
        <div className="grid grid-cols-3 gap-6 mb-8">
          {/* Business Profile */}
          <div className="card col-span-2">
            <div className="flex justify-between items-start border-b border-gray-100 pb-4 mb-4">
              <div>
                <h2 className="text-xl mb-1">{business.name}</h2>
                <div className="text-primary font-medium text-sm">{business.category}</div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-warning font-semibold">
                  <Star fill="currentColor" size={16} />
                  {business.rating}
                </div>
                <div className="text-xs text-secondary mt-1">{business.reviewCount} reviews</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-2">
                <MapPin size={18} className="text-tertiary mt-0.5" />
                <span className="text-sm">{business.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={18} className="text-tertiary" />
                <span className="text-sm">{business.phone || 'Not available'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe size={18} className="text-tertiary" />
                {business.website ? (
                  <a 
                    href={`https://${business.website}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-sm font-semibold text-emerald-600 hover:underline flex items-center gap-1"
                    style={{ color: '#059669' }}
                  >
                    {business.website}
                    <ExternalLink size={14} />
                  </a>
                ) : (
                  <span className="text-sm text-danger font-medium">
                    No website detected
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-tertiary" />
                <span className="text-sm">{business.status}</span>
              </div>
            </div>
          </div>

          {/* Opportunity Score */}
          {audit ? (
            <div className="card flex flex-col justify-center items-center text-center">
              <h3 className="text-sm text-secondary uppercase tracking-wider mb-2">Website Opportunity</h3>
              <div className="text-5xl font-bold text-primary mb-2">
                {audit.opportunityScore}<span className="text-2xl text-tertiary font-normal">/100</span>
              </div>
              <p className="text-xs text-secondary mb-4">AI Opportunity Estimate</p>
              
              <div className="w-full bg-bg-surface-hover h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-primary h-full rounded-full transition-all duration-1000"
                  style={{ width: `${audit.opportunityScore}%` }}
                ></div>
              </div>
            </div>
          ) : (
            <div className="card flex flex-col justify-center items-center text-center text-tertiary">
              <div className="animate-pulse flex flex-col items-center">
                <Search size={32} className="mb-2" />
                <p>Auditing presence...</p>
              </div>
            </div>
          )}
        </div>
      )}

      {audit && (
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="card">
            <h3 className="mb-4 text-lg border-b pb-2">Why this score?</h3>
            <ul className="flex flex-col gap-3">
              {audit.reasons.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <ChevronRight size={16} className="text-primary mt-0.5 flex-shrink-0" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="card bg-primary-light border-primary-light">
            <h3 className="mb-4 text-lg border-b border-blue-200 pb-2">Recommended Features</h3>
            <ul className="grid grid-cols-2 gap-3">
              {audit.recommendations.map((r, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 size={16} className="text-primary flex-shrink-0" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {audit && !pitch && (
        <div className="flex justify-center mb-8">
          <button 
            className="btn btn-primary" 
            style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}
            onClick={handleGeneratePitch}
            disabled={isPitching}
          >
            {isPitching ? 'Generating AI Pitch...' : 'Generate Personalized Pitch'}
          </button>
        </div>
      )}

      {pitch && (
        <div className="card mb-8 shadow-md border-primary" style={{ borderWidth: '2px' }}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="flex items-center gap-2">
              <MessageSquare size={20} className="text-primary" />
              Message Ready
            </h3>
            <div className="flex gap-2">
              <span className="badge badge-neutral">Tone: Friendly</span>
              <span className="badge badge-neutral">Length: Short</span>
            </div>
          </div>
          
          <div className="bg-bg-color p-4 rounded-md mb-4 border border-border">
            <textarea 
              className="w-full bg-transparent border-none focus:outline-none resize-none text-primary-dark"
              rows={6}
              value={pitch}
              onChange={(e) => setPitch(e.target.value)}
              style={{ lineHeight: '1.6' }}
            />
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <button className="btn btn-secondary">
                <Copy size={16} /> Copy
              </button>
              <button 
                className="btn btn-secondary"
                onClick={handleSave}
                disabled={isSaving || saved}
              >
                {saved ? <CheckCircle2 size={16} className="text-success" /> : <Save size={16} />}
                {saved ? 'Saved' : 'Save Prospect'}
              </button>
            </div>
            
            <button className="btn btn-primary">
              Approve & Send via WhatsApp
              <ExternalLink size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analyze;
