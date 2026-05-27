import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { getCommerces, deleteCommerce, updateCommerce } from '../../api/commerces';

export default function CommercesAdmin() {
  const [data, setData] = useState({ data: [], total: 0 });
  const [search, setSearch] = useState('');

  useEffect(() => { getCommerces({ search, limit: 50 }).then(setData); }, [search]);

  const toggleStatus = async (c) => {
    await updateCommerce(c.id, { status: c.status === 'active' ? 'inactive' : 'active' });
    getCommerces({ search, limit: 50 }).then(setData);
  };

  const remove = async (id) => {
    if (!confirm('Supprimer ce commerce ?')) return;
    await deleteCommerce(id);
    setData(d => ({ ...d, data: d.data.filter(c => c.id !== id) }));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-3xl text-navy">Commerces ({data.total})</h1>
        <Link to="/admin/import" className="btn-primary flex items-center gap-2"><Plus size={16} />Importer CSV</Link>
      </div>
      <input type="search" placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)}
        className="w-full border border-cream-dark rounded-lg px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-navy" />
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-cream border-b border-cream-dark">
            <tr>{['Nom', 'Catégorie', 'Statut', 'Sponsorisé', 'Actions'].map(h => <th key={h} className="text-left px-4 py-3 font-semibold text-navy">{h}</th>)}</tr>
          </thead>
          <tbody>
            {data.data.map(c => (
              <tr key={c.id} className="border-b border-cream-dark hover:bg-cream/50">
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3 text-gray-500">{c.category?.name || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`badge ${c.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{c.status}</span>
                </td>
                <td className="px-4 py-3">{c.is_sponsored ? '⭐' : '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => toggleStatus(c)} title="Toggle statut" className="p-1 text-gray-400 hover:text-navy">
                      {c.status === 'active' ? <ToggleRight size={18} className="text-green-500" /> : <ToggleLeft size={18} />}
                    </button>
                    <Link to={`/commerce/${c.slug}`} target="_blank" className="p-1 text-gray-400 hover:text-navy"><Edit size={18} /></Link>
                    <button onClick={() => remove(c.id)} className="p-1 text-gray-400 hover:text-terracotta"><Trash2 size={18} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
