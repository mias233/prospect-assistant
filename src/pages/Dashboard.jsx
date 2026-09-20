import { useState, useEffect } from 'react';
import { getProspects } from '../services/api';
import { ArrowRight, TrendingUp, Users, Target, PhoneOutgoing, Star, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const [stats, setStats] = useState({
    total: 0,
    analyzed: 0,
    highOpp: 0,
    contacted: 0,
    interested: 0,
    clientsWon: 0
  });
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getProspects();
        
        setStats({
          total: data.length + 120, // Pad with dummy data for looks
          analyzed: data.length + 100,
          highOpp: data.filter(p => p.opportunityScore >= 80).length + 60,
          contacted: data.filter(p => p.status === 'Contacted').length + 40,
          interested: data.filter(p => p.status === 'Interested').length + 10,
          clientsWon: 4
        });
        
        setRecent(data.slice(0, 5));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-secondary">Loading dashboard...</div>;
  }

  return (
    <div>
      <div className="page-header flex justify-between items-end">
        <div>
          <h1>Dashboard</h1>
          <p className="text-secondary mt-1">Overview of your prospecting pipeline.</p>
        </div>
        <Link to="/analyze" className="btn btn-primary">
          <Search size={16} /> Analyze New Business
        </Link>
      </div>
      
      {/* Top Stats */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="card flex items-center justify-between">
          <div>
            <div className="text-secondary text-sm font-medium">Total Prospects</div>
            <div className="text-primary mt-1" style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>{stats.total}</div>
          </div>
          <div className="bg-primary-light text-primary p-3 rounded-full">
            <Users size={24} />
          </div>
        </div>
        <div className="card flex items-center justify-between">
          <div>
            <div className="text-secondary text-sm font-medium">High Opportunity</div>
            <div className="text-warning mt-1" style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>{stats.highOpp}</div>
          </div>
          <div className="bg-warning-bg text-warning-text p-3 rounded-full">
            <Target size={24} />
          </div>
        </div>
        <div className="card flex items-center justify-between">
          <div>
            <div className="text-secondary text-sm font-medium">Contacted</div>
            <div className="text-success mt-1" style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>{stats.contacted}</div>
          </div>
          <div className="bg-success-bg text-success-text p-3 rounded-full">
            <PhoneOutgoing size={24} />
          </div>
        </div>
        <div className="card flex items-center justify-between">
          <div>
            <div className="text-secondary text-sm font-medium">Clients Won</div>
            <div className="text-primary mt-1" style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>{stats.clientsWon}</div>
          </div>
          <div className="bg-primary-light text-primary p-3 rounded-full">
            <Star size={24} />
          </div>
        </div>
      </div>

      {/* Pipeline Visualization */}
      <div className="card mb-8">
        <h3 className="mb-6 flex items-center gap-2">
          <TrendingUp size={20} className="text-primary" />
          Conversion Pipeline
        </h3>
        
        <div className="flex items-center justify-between px-8 text-center">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-bg-surface-hover flex items-center justify-center font-bold text-xl text-secondary mb-2">{stats.analyzed}</div>
            <span className="text-sm font-medium">Analyzed</span>
          </div>
          <ArrowRight className="text-border" />
          
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-primary-light flex items-center justify-center font-bold text-xl text-primary mb-2">{stats.contacted}</div>
            <span className="text-sm font-medium">Contacted</span>
          </div>
          <ArrowRight className="text-border" />
          
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-warning-bg flex items-center justify-center font-bold text-xl text-warning-text mb-2">{stats.interested}</div>
            <span className="text-sm font-medium">Interested</span>
          </div>
          <ArrowRight className="text-border" />
          
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-success-bg flex items-center justify-center font-bold text-xl text-success-text mb-2">{stats.clientsWon}</div>
            <span className="text-sm font-medium">Won</span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-8">
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3>Recent Prospects</h3>
            <Link to="/prospects" className="text-sm text-primary hover:underline">View All</Link>
          </div>
          <div className="flex flex-col gap-3">
            {recent.length === 0 ? (
              <p className="text-secondary text-sm">No prospects found.</p>
            ) : (
              recent.map(p => (
                <div key={p.id} className="flex justify-between items-center p-3 hover:bg-bg-surface-hover rounded-md border border-transparent hover:border-border transition">
                  <div>
                    <div className="font-medium text-primary">{p.businessName}</div>
                    <div className="text-xs text-secondary">{p.category} • {p.location}</div>
                  </div>
                  <span className={`badge ${p.opportunityScore > 80 ? 'badge-success' : 'badge-warning'}`}>
                    {p.opportunityScore} Opp
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="card bg-primary-light border-primary-light relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="mb-2 text-primary text-xl">Find Your Next Client</h3>
            <p className="text-secondary text-sm mb-6 max-w-[80%]">
              Discover local businesses with missing or outdated websites and generate a highly personalized pitch in seconds.
            </p>
            <Link to="/analyze" className="btn btn-primary shadow-md">
              Start Prospecting
            </Link>
          </div>
          <Target size={120} className="absolute -bottom-10 -right-10 text-primary opacity-10 transform rotate-12" />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

