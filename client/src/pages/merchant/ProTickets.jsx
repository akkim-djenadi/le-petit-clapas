import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { getMyOffers, createOffer, updateOffer } from '../../api/merchant';

export default function ProTickets() {
  const [offers, setOffers] = useState([]);
  const [form, setForm] = useState({ title: '', advantage: '', quantity_total: '', valid_until: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { getMyOffers().then(setOffers); }, []);

  const handleCreate = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const offer = await createOffer({ ...form, quantity_total: parseInt(form.quantity_total) });
      setOffers(os => [offer, ...os]);
      setForm({ title: '', advantage: '', quantity_total: '', valid_until: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la création');
    } finally { setLoading(false); }
  };

  const toggle = async (offer) => {
    const updated = await updateOffer(offer.id, { is_active: !offer.is_active });
    setOffers(os => os.map(o => o.id === offer.id ? { ...o, ...updated } : o));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="font-serif text-3xl text-navy mb-6">Mes tickets d'avantages</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h2 className="font-semibold mb-3">Offres existantes</h2>
          {offers.length === 0 ? <p className="text-gray-400 text-sm">Aucune offre créée.</p> : (
            <div className="space-y-3">
              {offers.map(o => (
                <div key={o.id} className="card p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-navy">{o.title}</p>
                      <p className="text-sm text-terracotta mt-0.5">{o.advantage}</p>
                      <p className="text-xs text-gray-400 mt-1">{o.quantity_remaining}/{o.quantity_total} restants</p>
                      {o.valid_until && <p className="text-xs text-gray-400">Jusqu'au {new Date(o.valid_until).toLocaleDateString('fr-FR')}</p>}
                    </div>
                    <button onClick={() => toggle(o)} className={`badge ${o.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {o.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="font-semibold mb-3">Créer une offre</h2>
          <form onSubmit={handleCreate} className="card p-5 space-y-3">
            {error && <p className="text-terracotta text-sm bg-terracotta/10 rounded p-2">{error}</p>}
            <input type="text" placeholder="Titre (ex: Café offert)" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required
              className="w-full border border-cream-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy" />
            <textarea placeholder="Avantage détaillé (libre : réduction, produit offert, etc.)" value={form.advantage}
              onChange={e => setForm(f => ({ ...f, advantage: e.target.value }))} required rows={2}
              className="w-full border border-cream-dark rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-navy" />
            <input type="number" min="1" placeholder="Quantité (tickets à utiliser de votre solde)" value={form.quantity_total}
              onChange={e => setForm(f => ({ ...f, quantity_total: e.target.value }))} required
              className="w-full border border-cream-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy" />
            <input type="date" value={form.valid_until} onChange={e => setForm(f => ({ ...f, valid_until: e.target.value }))}
              className="w-full border border-cream-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy" />
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              <Plus size={16} />{loading ? 'Création…' : "Créer l'offre"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
