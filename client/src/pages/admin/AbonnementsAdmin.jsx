import { useState, useEffect } from 'react';
import { getMerchants, creditMerchant } from '../../api/admin';

export default function AbonnementsAdmin() {
  const [merchants, setMerchants] = useState([]);
  const [form, setForm] = useState({ merchant_id: '', amount: '', note: '', price_paid: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => { getMerchants().then(setMerchants); }, []);

  const handleCredit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      await creditMerchant({ ...form, amount: parseInt(form.amount), price_paid: parseFloat(form.price_paid) || null });
      getMerchants().then(setMerchants);
      setForm({ merchant_id: '', amount: '', note: '', price_paid: '' });
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="font-serif text-3xl text-navy mb-6">Abonnements marchands</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h2 className="font-semibold text-lg mb-3">Soldes actuels</h2>
          <div className="space-y-3">
            {merchants.map(m => (
              <div key={m.id} className={`card p-4 flex items-center justify-between ${m.tickets_balance < 5 ? 'border-l-4 border-terracotta' : ''}`}>
                <div>
                  <p className="font-semibold">{m.User?.name}</p>
                  <p className="text-sm text-gray-500">{m.commerce?.name}</p>
                </div>
                <div className="text-right">
                  <p className={`text-xl font-bold ${m.tickets_balance < 5 ? 'text-terracotta' : 'text-navy'}`}>{m.tickets_balance}</p>
                  <p className="text-xs text-gray-400">tickets restants</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h2 className="font-semibold text-lg mb-3">Créditer un marchand</h2>
          <form onSubmit={handleCredit} className="card p-5 space-y-4">
            <select value={form.merchant_id} onChange={e => setForm(f => ({ ...f, merchant_id: e.target.value }))} required
              className="w-full border border-cream-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy bg-white">
              <option value="">Choisir un marchand</option>
              {merchants.map(m => <option key={m.id} value={m.user_id}>{m.User?.name} — {m.commerce?.name}</option>)}
            </select>
            <input type="number" min="1" placeholder="Nombre de tickets" value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required
              className="w-full border border-cream-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy" />
            <input type="text" placeholder="Note (ex: Pack Pro 50 tickets)" value={form.note}
              onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
              className="w-full border border-cream-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy" />
            <input type="number" step="0.01" placeholder="Prix payé (€, optionnel)" value={form.price_paid}
              onChange={e => setForm(f => ({ ...f, price_paid: e.target.value }))}
              className="w-full border border-cream-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy" />
            <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'En cours…' : 'Créditer'}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
