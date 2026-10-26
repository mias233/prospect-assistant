import { useState, useEffect } from 'react';
import { getProspects, saveProspect } from '../services/api';
import { Search, ArrowUpDown, Plus, RefreshCw, X, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';

const Prospects = () => {
  const [prospects, setProspects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [sortOrder, setSortOrder] = useState('score-desc'); // 'score-desc', 'score-asc', 'name-asc'
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProspect, setNewProspect] = useState({
    businessName: '',
    category: 'Local Service',
    location: 'Chennai, Tamil Nadu',
    phone: '',
    website: 'No website',
    opportunityScore: 85
  });

  const loadProspects = async () => {
    try {
      const data = await getProspects();
      setProspects(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProspects();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!newProspect.businessName.trim()) return;

    await saveProspect({
      ...newProspect,
      id: 'p_' + Math.random().toString(36).substr(2, 9),
      status: 'Saved',
      lastContact: 'Just now'
    });

    setShowAddModal(false);
    setNewProspect({
      businessName: '',
      category: 'Local Service',
      location: 'Chennai, Tamil Nadu',
      phone: '',
      website: 'No website',
      opportunityScore: 85
    });
    await loadProspects();
  };

  const filteredProspects = prospects
    .filter(p => {
      const matchesSearch = 
        (p.businessName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.location || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.phone || '').includes(searchTerm);

      const matchesStatus = selectedStatus === 'All' || p.status === selectedStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortOrder === 'score-desc') return (b.opportunityScore || 0) - (a.opportunityScore || 0);
      if (sortOrder === 'score-asc') return (a.opportunityScore || 0) - (b.opportunityScore || 0);
      if (sortOrder === 'name-asc') return (a.businessName || '').localeCompare(b.businessName || '');
      return 0;
    });

  const statuses = ['All', 'Analyzed', 'Saved', 'WhatsApp Opened', 'Contacted', 'Interested'];

  return (
    <div>
      <div className="page-header flex justify-between items-center" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Prospect Database</h1>
          <p className="text-secondary mt-1">Manage, filter, and track all your analyzed businesses and outreach pipelines.</p>
        </div>
        <div className="flex gap-2">
          <button 
            type="button"
            className="btn btn-secondary"
            onClick={loadProspects}
            title="Refresh database"
          >
            <RefreshCw size={15} />
            Refresh
          </button>
          <button 
            type="button"
            className="btn btn-primary"
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={16} /> Add Prospect Manually
          </button>
        </div>
      </div>

      <div className="card">
        {/* Controls Bar */}
        <div className="flex justify-between items-center mb-6" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          {/* Search Input */}
          <div className="input-group" style={{ width: '320px', maxWidth: '100%' }}>
            <div className="relative flex items-center">
              <Search size={16} className="absolute left-3 text-tertiary" />
              <input 
                type="text" 
                className="input w-full" 
                style={{ paddingLeft: '2.5rem' }} 
                placeholder="Search business, category, or city..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button 
                  type="button"
                  onClick={() => setSearchTerm('')} 
                  className="absolute right-3 text-secondary hover:text-primary"
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Filter Status Pills & Sort Dropdown */}
          <div className="flex items-center gap-3" style={{ flexWrap: 'wrap' }}>
            <div className="flex gap-1" style={{ flexWrap: 'wrap' }}>
              {statuses.map(st => (
                <button
                  key={st}
                  type="button"
                  className={`tone-pill ${selectedStatus === st ? 'active' : ''}`}
                  onClick={() => setSelectedStatus(st)}
                  style={{ fontSize: '0.75rem', padding: '0.3rem 0.7rem' }}
                >
                  {st}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 border-l pl-3" style={{ borderColor: 'var(--border)' }}>
              <ArrowUpDown size={15} className="text-secondary" />
              <select 
                className="input" 
                style={{ padding: '0.3rem 0.6rem', fontSize: '0.8125rem' }}
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              >
                <option value="score-desc">Score: High to Low</option>
                <option value="score-asc">Score: Low to High</option>
                <option value="name-asc">Name: A to Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* Prospects Table */}
        <div className="table-container">
          {loading ? (
            <div className="py-8 text-center text-secondary">Loading prospects database...</div>
          ) : filteredProspects.length === 0 ? (
            <div className="py-12 text-center text-secondary">
              <p className="font-semibold text-base mb-1">No matching prospects found</p>
              <p className="text-sm text-tertiary mb-4">
                {searchTerm ? `No results matching "${searchTerm}". Try another keyword or clear filters.` : 'Analyze a business using Google Maps to build your pipeline.'}
              </p>
              {searchTerm ? (
                <button className="btn btn-secondary" onClick={() => { setSearchTerm(''); setSelectedStatus('All'); }}>
                  Clear Filters
                </button>
              ) : (
                <Link to="/analyze" className="btn btn-primary">
                  Analyze First Business
                </Link>
              )}
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Business Name</th>
                  <th>Category</th>
                  <th>Location</th>
                  <th>Contact</th>
                  <th>Website</th>
                  <th>Opportunity</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredProspects.map((p) => (
                  <tr key={p.id}>
                    <td className="font-medium text-primary">
                      <div className="flex items-center gap-2.5">
                        {p.imageUrl ? (
                          <img 
                            src={p.imageUrl} 
                            alt={p.businessName} 
                            className="w-8 h-8 rounded-md object-cover border border-slate-200 flex-shrink-0" 
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : null}
                        <div>
                          <div className="font-semibold text-sm">{p.businessName}</div>
                          <div className="text-xs text-secondary">{p.lastContact || 'Recently active'}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="text-xs font-medium px-2 py-1 rounded bg-slate-100 text-slate-700">
                        {p.category}
                      </span>
                    </td>
                    <td className="text-sm">{p.location}</td>
                    <td className="text-xs font-mono">{p.phone || '—'}</td>
                    <td>
                      <span className={p.website && p.website !== 'No website' ? 'text-success font-semibold text-xs' : 'text-danger font-semibold text-xs'}>
                        {p.website && p.website !== 'No website' ? p.website : 'No website'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${p.opportunityScore >= 85 ? 'badge-success' : p.opportunityScore >= 70 ? 'badge-warning' : 'badge-danger'}`}>
                        {p.opportunityScore}/100
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${p.status === 'WhatsApp Opened' || p.status === 'Contacted' ? 'badge-warning' : p.status === 'Interested' ? 'badge-success' : 'badge-neutral'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td>
                      <Link 
                        to={`/analyze`}
                        className="btn btn-secondary"
                        style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', gap: '4px' }}
                        title="Open in Analyze Studio"
                      >
                        <MessageSquare size={13} />
                        Pitch
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Manual Add Prospect Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card" style={{ width: '480px', maxWidth: '100%', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)' }}>
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <h3 className="font-bold text-lg">Add Prospect Manually</h3>
              <button 
                type="button" 
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="flex flex-col gap-4">
              <div className="input-group">
                <label className="label">Business Name *</label>
                <input 
                  type="text" 
                  className="input" 
                  placeholder="e.g. Apex Auto Studio"
                  required
                  value={newProspect.businessName}
                  onChange={(e) => setNewProspect({ ...newProspect, businessName: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="input-group">
                  <label className="label">Category</label>
                  <select 
                    className="input"
                    value={newProspect.category}
                    onChange={(e) => setNewProspect({ ...newProspect, category: e.target.value })}
                  >
                    <option value="Mobile Phone Repair & Service">Mobile Phone Repair & Service</option>
                    <option value="Car Detailing & Wrap Studio">Car Detailing & Wrap Studio</option>
                    <option value="Beauty Parlour & Salon">Beauty Parlour & Salon</option>
                    <option value="Dental Clinic">Dental Clinic</option>
                    <option value="Gym & Fitness Studio">Gym & Fitness Studio</option>
                    <option value="Cafe & Bakery">Cafe & Bakery</option>
                    <option value="Local Service">Local Service</option>
                  </select>
                </div>

                <div className="input-group">
                  <label className="label">Opportunity Score (0-100)</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="100" 
                    className="input" 
                    value={newProspect.opportunityScore}
                    onChange={(e) => setNewProspect({ ...newProspect, opportunityScore: parseInt(e.target.value, 10) || 80 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="input-group">
                  <label className="label">Location</label>
                  <input 
                    type="text" 
                    className="input" 
                    placeholder="e.g. Chennai, Tamil Nadu"
                    value={newProspect.location}
                    onChange={(e) => setNewProspect({ ...newProspect, location: e.target.value })}
                  />
                </div>

                <div className="input-group">
                  <label className="label">WhatsApp Mobile Phone</label>
                  <input 
                    type="text" 
                    className="input" 
                    placeholder="e.g. +91 98765 43210"
                    value={newProspect.phone}
                    onChange={(e) => setNewProspect({ ...newProspect, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t mt-2">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save to Pipeline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Prospects;
