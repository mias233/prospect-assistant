import { useState } from 'react';
import { Search, MapPin, Phone, Globe, Star, CheckCircle2, ChevronRight, Copy, MessageSquare, Save, ExternalLink, AlertCircle, ShieldCheck, Camera, RefreshCw } from 'lucide-react';
import { analyzeBusiness, generateAudit, generatePitch, saveProspect, analyzePhoneNumber, extractValidPhone, getWhatsAppAppUrl, getWhatsAppUrl, sendDirectWhatsApp } from '../services/api';

const InstagramIcon = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);

const FacebookIcon = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);

const Analyze = () => {
  const [url, setUrl] = useState('');
  
  // Stages & States
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [business, setBusiness] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  
  const [audit, setAudit] = useState(null);
  
  const [isPitching, setIsPitching] = useState(false);
  const [pitch, setPitch] = useState('');
  const [selectedTone, setSelectedTone] = useState('Conversational');
  
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [targetPhone, setTargetPhone] = useState('');
  const [copied, setCopied] = useState(false);

  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [sendSuccessMessage, setSendSuccessMessage] = useState('');

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!url) return;
    
    setIsAnalyzing(true);
    setErrorMessage('');
    setBusiness(null);
    setAudit(null);
    setPitch('');
    setSaved(false);
    setTargetPhone('');
    setSendSuccessMessage('');
    
    try {
      const bData = await analyzeBusiness(url);
      setBusiness(bData);
      setSelectedPhoto(bData.imageUrl || null);
      if (bData.phone) {
        setTargetPhone(bData.phone);
      } else {
        const inline = extractValidPhone(url);
        if (inline) {
          setTargetPhone(inline);
        }
      }
      
      const aData = await generateAudit(bData);
      setAudit(aData);

      // Auto-generate neat, high-converting conversational pitch
      setIsPitching(true);
      try {
        const pData = await generatePitch(bData, aData, selectedTone);
        setPitch(pData);
      } catch (pErr) {
        console.error("Pitch generation error:", pErr);
      } finally {
        setIsPitching(false);
      }

      // Record automatically in prospect history
      await saveProspect({
        id: bData.id,
        businessName: bData.name,
        category: bData.category,
        location: bData.address.split(',')[1]?.trim() || bData.address,
        address: bData.address,
        phone: bData.phone,
        website: bData.website ? bData.website : 'No website',
        opportunityScore: aData.opportunityScore,
        imageUrl: bData.imageUrl || null,
        photos: bData.photos || [],
        status: 'Analyzed',
        verifications: bData.verifications
      });
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || "Failed to analyze. Please ensure it's a valid Google Maps link.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGeneratePitch = async (toneToUse = selectedTone) => {
    if (!business) return;
    setIsPitching(true);
    try {
      const pData = await generatePitch(business, audit, toneToUse);
      setPitch(pData);
      setSelectedTone(toneToUse);
    } catch (err) {
      console.error(err);
    } finally {
      setIsPitching(false);
    }
  };

  const handleCopyPitch = () => {
    if (!pitch) return;
    navigator.clipboard.writeText(pitch);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWhatsApp = async (method = 'app') => {
    if (!pitch) return;
    const phoneToUse = targetPhone || (business && business.phone ? business.phone : '');
    const phoneAnalysis = analyzePhoneNumber(phoneToUse);

    if (!phoneAnalysis.isValid) {
      setSendSuccessMessage(`⚠️ Cannot open WhatsApp: ${phoneAnalysis.warning || 'Invalid phone number'}. Please enter a 10-digit mobile number in the WhatsApp Target field.`);
      return;
    }

    setIsSendingWhatsApp(true);
    setSendSuccessMessage('');

    try {
      // 1. Copy pitch to clipboard automatically as guaranteed backup
      if (navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(pitch);
          setCopied(true);
          setTimeout(() => setCopied(false), 2500);
        } catch (e) {
          console.warn("Clipboard write failed:", e);
        }
      }

      // 2. Save / update prospect with analyzed phone
      if (business) {
        await saveProspect({
          id: business.id,
          businessName: business.name,
          category: business.category,
          location: business.address.split(',')[1]?.trim() || business.address,
          address: business.address,
          phone: phoneAnalysis.formatted,
          website: business.website ? business.website : 'No website',
          opportunityScore: audit ? audit.opportunityScore : 91,
          imageUrl: business.imageUrl || null,
          photos: business.photos || [],
          status: 'WhatsApp Opened',
          pitch: pitch,
          verifications: business.verifications
        });
        setSaved(true);
      }

      // 3. Dispatch to WhatsApp App or Web
      if (method === 'app') {
        const appUrl = getWhatsAppAppUrl(phoneAnalysis.cleanDigits, pitch);
        
        // Trigger backend OS launch via Start-Process
        sendDirectWhatsApp(phoneAnalysis.cleanDigits, pitch, 'app').catch(() => {});
        
        // Also trigger browser URL protocol handler
        window.location.href = appUrl;

        setSendSuccessMessage(`🚀 Opening WhatsApp Desktop App for ${phoneAnalysis.formatted}! Chat loaded with your pitch pre-filled.`);
      } else {
        const webUrl = getWhatsAppUrl(phoneAnalysis.cleanDigits, pitch, true);
        window.open(webUrl, '_blank');
        setSendSuccessMessage(`🌐 Opening WhatsApp Web for ${phoneAnalysis.formatted}!`);
      }
    } catch (err) {
      console.error('WhatsApp send error:', err);
      const fallbackUrl = getWhatsAppUrl(phoneToUse, pitch, true);
      window.open(fallbackUrl, '_blank');
      setSendSuccessMessage(`Opening WhatsApp...`);
    } finally {
      setIsSendingWhatsApp(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveProspect({
        id: business.id,
        businessName: business.name,
        category: business.category,
        location: business.address.split(',')[1]?.trim() || business.address,
        address: business.address,
        phone: targetPhone || business.phone || null,
        website: business.website ? business.website : 'No website',
        opportunityScore: audit ? audit.opportunityScore : 91,
        imageUrl: business.imageUrl || null,
        photos: business.photos || [],
        status: 'Saved',
        pitch: pitch,
        verifications: business.verifications
      });
      setSaved(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const renderVerificationBadge = (status) => {
    if (status === 'Verified') {
      return <span className="badge badge-success flex items-center gap-1" title="Verified through Google Maps payload"><ShieldCheck size={12} /> Verified</span>;
    } else if (status === 'Unverified') {
      return <span className="badge badge-warning flex items-center gap-1" title="Unverified web search result"><AlertCircle size={12} /> Unverified</span>;
    }
    return <span className="badge badge-neutral text-xs">Not available</span>;
  };

  return (
    <div>
      <div className="page-header">
        <h1>Analyze a Business</h1>
        <p className="text-secondary mt-1">Paste a Google Maps link to instantly generate an authentic prospect profile and pitch.</p>
      </div>

      {errorMessage && (
        <div className="card mb-6 bg-danger-light border-danger text-danger flex items-center gap-3 p-4 rounded-md" style={{ borderColor: '#f43f5e', backgroundColor: '#fff1f2', color: '#be123c' }}>
          <AlertCircle size={20} className="flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="card mb-8">
        <form onSubmit={handleAnalyze} className="flex gap-4 items-end">
          <div className="input-group flex-1">
            <label className="label">Google Maps Place URL / Share Link</label>
            <input 
              type="text" 
              className="input" 
              placeholder="e.g. https://maps.app.goo.gl/... or https://maps.google.com/..." 
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isAnalyzing}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={isAnalyzing || !url.trim()} style={{ padding: '0.625rem 1.5rem' }}>
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
        <div className="business-overview-grid">
          {/* Left: Business Profile Card */}
          <div className="business-profile-card">
            {/* Photo Column */}
            <div className="business-photo-col">
              {selectedPhoto ? (
                <>
                  <div className="business-main-photo-wrap">
                    <img 
                      src={selectedPhoto} 
                      alt={`${business.name} Google Maps place`} 
                      className="business-main-photo"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    <div className="business-photo-badge">
                      <Camera size={12} style={{ color: '#34d399' }} />
                      Maps Photo
                    </div>
                    <a 
                      href={selectedPhoto} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="business-photo-link"
                      title="Open full resolution photo in new tab"
                    >
                      <ExternalLink size={11} />
                      Full View
                    </a>
                  </div>

                  {/* Clean, strictly dimensioned thumbnail chips */}
                  {business.photos && business.photos.length > 1 && (
                    <div className="business-thumbnails-strip">
                      <span className="business-thumb-label">
                        Photos:
                      </span>
                      {business.photos.map((pUrl, idx) => (
                        <button
                          type="button"
                          key={idx}
                          onClick={() => setSelectedPhoto(pUrl)}
                          className={`business-thumb-btn ${selectedPhoto === pUrl ? 'active' : ''}`}
                          title={`Switch to photo ${idx + 1}`}
                        >
                          <img 
                            src={pUrl} 
                            alt={`Photo ${idx + 1}`} 
                            className="business-thumb-img" 
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="business-main-photo-wrap" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', color: '#64748b' }}>
                  <Camera size={28} style={{ color: '#94a3b8', marginBottom: '6px' }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>No Storefront Photo</span>
                </div>
              )}
            </div>

            {/* Information Column */}
            <div className="business-info-col">
              <div>
                <div className="business-info-header">
                  <div>
                    <h2 className="business-name-title">
                      {business.name}
                      {renderVerificationBadge(business.verifications?.name)}
                    </h2>
                    <div className="business-category-tag">{business.category}</div>
                  </div>
                  <div className="business-rating-val">
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                        <Star fill="currentColor" size={16} />
                        {business.rating}
                      </div>
                      <div className="business-reviews-val">{business.reviewCount} reviews</div>
                    </div>
                  </div>
                </div>

                <div className="business-detail-grid">
                  {/* Address */}
                  <div className="business-detail-row-item full-span">
                    <MapPin size={16} className="business-detail-icon" />
                    <div className="business-detail-content">
                      <span className="business-detail-label">Location</span>
                      <span className="business-detail-value">{business.address}</span>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="business-detail-row-item">
                    <Phone size={16} className="business-detail-icon" />
                    <div className="business-detail-content">
                      <span className="business-detail-label">WhatsApp Target</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                        <input 
                          type="text" 
                          className="input" 
                          value={targetPhone}
                          onChange={(e) => setTargetPhone(e.target.value)}
                          placeholder="Phone number"
                          style={{ padding: '0.2rem 0.5rem', fontSize: '0.8125rem', fontFamily: 'monospace', width: '130px' }}
                        />
                        {renderVerificationBadge(business.verifications?.phone)}
                      </div>
                    </div>
                  </div>

                  {/* Website */}
                  <div className="business-detail-row-item">
                    <Globe size={16} className="business-detail-icon" />
                    <div className="business-detail-content">
                      <span className="business-detail-label">Website Status</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                        {business.website ? (
                          <a 
                            href={`https://${business.website}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            style={{ color: '#059669', fontWeight: 600, fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '3px' }}
                          >
                            {business.website}
                            <ExternalLink size={12} />
                          </a>
                        ) : (
                          <span style={{ color: '#ef4444', fontWeight: 600, fontSize: '0.8125rem' }}>
                            No website detected
                          </span>
                        )}
                        {renderVerificationBadge(business.verifications?.website)}
                      </div>
                    </div>
                  </div>

                  {/* Status & Social */}
                  <div className="business-detail-row-item">
                    <CheckCircle2 size={16} className="business-detail-icon" />
                    <div className="business-detail-content">
                      <span className="business-detail-label">Listing Status</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                        <span className="business-detail-value">{business.status}</span>
                        {business.instagram && (
                          <a href={business.instagram} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                            <InstagramIcon size={12} /> IG
                          </a>
                        )}
                        {business.facebook && (
                          <a href={business.facebook} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                            <FacebookIcon size={12} /> FB
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Opportunity Score Card */}
          {audit ? (
            <div className="opportunity-summary-card">
              <div>
                <div className="opportunity-card-header">
                  <span className="opportunity-card-title">Website Opportunity</span>
                  <span className="badge badge-success text-xs">High Potential</span>
                </div>

                <div className="opportunity-score-display">
                  <span className="opportunity-score-huge">{audit.opportunityScore}</span>
                  <span className="opportunity-score-sub">/ 100</span>
                </div>

                <div className="opportunity-progress-wrap">
                  <div 
                    className="opportunity-progress-fill"
                    style={{ width: `${audit.opportunityScore}%` }}
                  />
                </div>

                {/* Key Drivers */}
                <div className="opportunity-drivers-box">
                  <div className="opportunity-drivers-title">
                    Key Value Drivers
                  </div>
                  {audit.reasons.slice(0, 3).map((r, i) => (
                    <div key={i} className="opportunity-driver-item">
                      <ChevronRight size={14} className="opportunity-driver-icon" />
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              </div>

              {!pitch && (
                <button 
                  type="button"
                  className="btn btn-primary" 
                  onClick={() => handleGeneratePitch(selectedTone)}
                  disabled={isPitching}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {isPitching ? 'Generating AI Pitch...' : '⚡ Generate AI Pitch'}
                </button>
              )}
            </div>
          ) : (
            <div className="opportunity-summary-card" style={{ alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>
              <div className="animate-pulse flex flex-col items-center">
                <Search size={32} style={{ marginBottom: '8px' }} />
                <p style={{ fontSize: '0.875rem' }}>Auditing presence...</p>
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

      {pitch && (
        <div className="card mb-8 shadow-md border-primary" style={{ borderWidth: '2px' }}>
          <div className="flex justify-between items-center mb-4" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 className="flex items-center gap-2" style={{ fontSize: '1.125rem', fontWeight: '600', margin: 0 }}>
                <MessageSquare size={20} className="text-primary" />
                <span>Conversational WhatsApp Pitch</span>
              </h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
                Natural, human tone crafted to catch attention without sounding like cold spam
              </p>
            </div>
            
            {/* Interactive Tone Switcher */}
            <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
              <button 
                type="button"
                className={`tone-pill ${selectedTone === 'Conversational' ? 'active' : ''}`}
                onClick={() => handleGeneratePitch('Conversational')}
                disabled={isPitching}
                title="Warm, natural conversation — feels like a genuine chat from a local"
              >
                💬 Friendly & Natural
              </button>
              <button 
                type="button"
                className={`tone-pill ${selectedTone === 'Direct' ? 'active' : ''}`}
                onClick={() => handleGeneratePitch('Direct')}
                disabled={isPitching}
                title="Short attention-grabber — gets straight to the point in 15 seconds"
              >
                ⚡ Short & Catchy
              </button>
              <button 
                type="button"
                className={`tone-pill ${selectedTone === 'Value' ? 'active' : ''}`}
                onClick={() => handleGeneratePitch('Value')}
                disabled={isPitching}
                title="Value & Demo preview — includes concrete feature bullets"
              >
                🎯 Value & Demo
              </button>
            </div>
          </div>
          
          <div className="pitch-box mb-4">
            <textarea 
              className="pitch-textarea"
              rows={8}
              value={pitch}
              onChange={(e) => setPitch(e.target.value)}
              placeholder="Your pitch message..."
            />
            <div className="flex justify-between items-center text-xs text-tertiary pt-2 border-t" style={{ borderColor: 'var(--border)', marginTop: '0.5rem' }}>
              <span>Target: WhatsApp • {pitch.split(/\s+/).filter(Boolean).length} words • ~{Math.ceil(pitch.split(/\s+/).filter(Boolean).length / 3)}s read</span>
              <span className="text-primary font-medium">✨ 100% editable before sending</span>
            </div>
          </div>
          
          {/* Analyzed Recipient WhatsApp Bar */}
          {(() => {
            const currentPhone = targetPhone || (business && business.phone ? business.phone : '');
            const phoneAnalysis = analyzePhoneNumber(currentPhone);

            return (
              <>
                <div className="p-3 rounded-lg border mb-4 flex items-center justify-between" style={{ backgroundColor: 'var(--bg-surface)', borderColor: phoneAnalysis.isMobile ? '#86efac' : 'var(--border)', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div className="flex items-center gap-2">
                    <Phone size={16} className={phoneAnalysis.isMobile ? 'text-primary' : 'text-secondary'} />
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Target WhatsApp:
                    </span>
                    <input 
                      type="text" 
                      className="input font-mono"
                      style={{ padding: '0.2rem 0.6rem', fontSize: '0.875rem', fontWeight: 600, width: '160px', height: '32px' }}
                      value={targetPhone}
                      onChange={(e) => setTargetPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    {phoneAnalysis.isMobile ? (
                      <span className="badge badge-success flex items-center gap-1" style={{ fontSize: '0.78125rem' }}>
                        <ShieldCheck size={13} /> Verified Mobile ({phoneAnalysis.formatted})
                      </span>
                    ) : phoneAnalysis.isLandline ? (
                      <span className="badge badge-danger flex items-center gap-1" style={{ backgroundColor: '#fee2e2', color: '#991b1b', borderColor: '#fca5a5', fontSize: '0.78125rem' }}>
                        <AlertCircle size={13} /> Landline (Enter Mobile)
                      </span>
                    ) : phoneAnalysis.isValid ? (
                      <span className="badge badge-success flex items-center gap-1" style={{ fontSize: '0.78125rem' }}>
                        <CheckCircle2 size={13} /> {phoneAnalysis.formatted}
                      </span>
                    ) : (
                      <span className="badge badge-warning flex items-center gap-1" style={{ fontSize: '0.78125rem' }}>
                        <AlertCircle size={13} /> Missing / Incomplete Number
                      </span>
                    )}
                  </div>
                </div>

                {phoneAnalysis.warning && (
                  <div className="mb-4 p-3 rounded-md text-xs flex items-center gap-2" style={{ backgroundColor: '#fffbeb', borderColor: '#fcd34d', color: '#92400e', border: '1px solid #fcd34d' }}>
                    <AlertCircle size={16} className="flex-shrink-0 text-amber-600" />
                    <span>{phoneAnalysis.warning}</span>
                  </div>
                )}

                {sendSuccessMessage && (
                  <div className="mb-4 p-3 rounded-md text-sm font-semibold flex items-center gap-2" style={{ backgroundColor: '#dcfce7', borderColor: '#86efac', color: '#14532d', border: '1px solid #86efac' }}>
                    <CheckCircle2 size={18} className="text-emerald-600" />
                    <span>{sendSuccessMessage}</span>
                  </div>
                )}

                <div className="flex justify-between items-center" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div className="flex gap-2">
                    <button className="btn btn-secondary" onClick={handleCopyPitch}>
                      {copied ? <CheckCircle2 size={16} className="text-success" /> : <Copy size={16} />}
                      {copied ? 'Copied!' : 'Copy Pitch'}
                    </button>
                    <button 
                      className="btn btn-secondary"
                      onClick={() => handleGeneratePitch(selectedTone)}
                      disabled={isPitching}
                      title="Regenerate message"
                    >
                      <RefreshCw size={15} className={isPitching ? 'animate-spin' : ''} />
                      <span>Regenerate</span>
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
                  
                  <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                    <button 
                      type="button"
                      className="btn btn-secondary" 
                      onClick={() => handleSendWhatsApp('web')} 
                      disabled={isSendingWhatsApp || !phoneAnalysis.isValid}
                      title="Open in WhatsApp Web in a new browser tab"
                      style={{ fontSize: '0.8125rem' }}
                    >
                      <Globe size={15} />
                      <span>WhatsApp Web</span>
                    </button>

                    <button 
                      type="button"
                      className="btn btn-primary" 
                      onClick={() => handleSendWhatsApp('app')} 
                      disabled={isSendingWhatsApp || !phoneAnalysis.isValid}
                      style={{ backgroundColor: '#25D366', borderColor: '#25D366', minWidth: '220px', justifyContent: 'center', fontWeight: '600' }}
                      title="Launch your installed WhatsApp Desktop app with message pre-filled"
                    >
                      {isSendingWhatsApp ? (
                        <span>Launching WhatsApp...</span>
                      ) : (
                        <>
                          <MessageSquare size={16} />
                          <span>📱 Send via WhatsApp App</span>
                          <ExternalLink size={14} />
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Helpful Note */}
                <div className="mt-4 p-3 rounded-md text-xs flex items-center gap-2" style={{ backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', color: '#166534', border: '1px solid #bbf7d0' }}>
                  <ShieldCheck size={16} className="text-emerald-600 flex-shrink-0" />
                  <span>
                    Clicking <strong>Send via WhatsApp App</strong> opens your native WhatsApp Desktop app directly to <strong>{phoneAnalysis.formatted || 'the recipient'}</strong> with the pitch pre-typed in the message bar. The pitch is also copied to your clipboard!
                  </span>
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default Analyze;
