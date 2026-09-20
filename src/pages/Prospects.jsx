import { useState, useEffect } from 'react';
import { getProspects } from '../services/api';
import { Search, Filter, ArrowUpDown } from 'lucide-react';

const Prospects = () => {
  const [prospects, setProspects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProspects = async () => {
      try {
        const data = await getProspects();
        setProspects(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProspects();
  }, []);

  return (
    <div>
      <div className="page-header flex justify-between items-center">
        <div>
          <h1>Prospect Database</h1>
          <p className="text-secondary mt-1">Manage and track all your analyzed businesses.</p>
        </div>
        <button className="btn btn-primary">Add Prospect Manually</button>
      </div>

      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <div className="input-group" style={{ width: '300px' }}>
            <div className="relative flex items-center">
              <Search size={16} className="absolute left-3 text-tertiary" />
              <input type="text" className="input w-full" style={{ paddingLeft: '2.5rem' }} placeholder="Search prospects..." />
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-secondary"><Filter size={16} /> Filter</button>
            <button className="btn btn-secondary"><ArrowUpDown size={16} /> Sort</button>
          </div>
        </div>

        <div className="table-container">
          {loading ? (
            <div className="py-8 text-center text-secondary">Loading prospects...</div>
          ) : prospects.length === 0 ? (
            <div className="py-8 text-center text-secondary">No prospects found. Analyze a business to get started.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Business</th>
                  <th>Category</th>
                  <th>Location</th>
                  <th>Website</th>
                  <th>Opportunity</th>
                  <th>Status</th>
                  <th>Last Contact</th>
                </tr>
              </thead>
              <tbody>
                {prospects.map((p) => (
                  <tr key={p.id}>
                    <td className="font-medium text-primary">{p.businessName}</td>
                    <td>{p.category}</td>
                    <td>{p.location}</td>
                    <td>
                      <span className={p.website === 'Detected' ? 'text-success' : 'text-danger'}>
                        {p.website}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${p.opportunityScore > 80 ? 'badge-success' : p.opportunityScore > 50 ? 'badge-warning' : 'badge-danger'}`}>
                        {p.opportunityScore}/100
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${p.status === 'Contacted' ? 'badge-warning' : p.status === 'Interested' ? 'badge-success' : 'badge-neutral'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="text-secondary">{p.lastContact}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Prospects;
