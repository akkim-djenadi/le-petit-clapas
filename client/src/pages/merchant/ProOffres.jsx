import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import client from '../../api/client';
import { getMyProfile } from '../../api/merchant';

export default function ProOffres() {
  const [offers, setOffers] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', valid_from: '', valid_until: '' });
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    getMyProfile().then(p => {
      setProfile(p);
      if (p?.commerce_id) {
        client.get(`/offers/commerce/${p.commerce_id}`).then(r => setOffers(r.data));
      }
    });
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    const { data } = await client.post('/offers', { ...form, commerce_id: profile.commerce_id });
    setOffers(os => [data, ...os]);
    setForm({ title: '', description: '', valid_from: '', valid_until: '' });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="font-serif text-3xl text-navy mb-6">Offres spéciales</h1>
      <form onSubmit={handleCreate} className="card p-5 space-y-3 mb-6">
        <input type="text" placeholder="Titre de l'offre" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required
          className="w-full border border-cream-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy" />
        <textarea placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
          className="w-full border border-cream-dark rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-navy" />
        <div className="grid grid-cols-2 gap-3">
          <input type="date" value={form.valid_from} onChange={e => setForm(f => ({ ...f, valid_from: e.target.value }))}
            className="border border-cream-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy" />
          <input type="date" value={form.valid_until} onChange={e => setForm(f => ({ ...f, valid_until: e.target.value }))}
            className="border border-cream-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy" />
        </div>
        <button type="submit" className="btn-primary flex items-center gap-2"><Plus size={16} />Ajouter l'offre</button>
      </form>
      <div className="space-y-3">
        {offers.map(o => (
          <div key={o.id} className="card p-4 flex items-start justify-between">
            <div><p className="font-semibold text-navy">{o.title}</p><p className="text-sm text-gray-500 mt-1">{o.description}</p></div>
          </div>
        ))}
      </div>
    </div>
  );
}
