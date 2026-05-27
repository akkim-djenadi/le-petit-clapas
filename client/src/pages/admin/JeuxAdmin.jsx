import { useState, useEffect } from 'react';
import { getGames, createGame } from '../../api/admin';
import client from '../../api/client';

export default function JeuxAdmin() {
  const [games, setGames] = useState([]);
  const [offers, setOffers] = useState([]);
  const [form, setForm] = useState({ title: '', type: 'quiz', ticket_offer_id: '', question: '', options: ['', '', '', ''], answer: 0, riddle: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getGames().then(setGames);
    client.get('/ticket-offers/all').then(r => setOffers(r.data)).catch(() => {});
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault(); setLoading(true);
    const content = form.type === 'quiz'
      ? { question: form.question, options: form.options.filter(Boolean), answer: parseInt(form.answer) }
      : { riddle: form.riddle };
    try {
      await createGame({
        title: form.title, type: form.type, content,
        ticket_offer_id: form.ticket_offer_id || undefined,
        starts_at: new Date().toISOString(),
        ends_at: new Date(Date.now() + 2 * 3600000).toISOString(),
      });
      getGames().then(setGames);
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="font-serif text-3xl text-navy mb-6">Jeux Flash</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h2 className="font-semibold text-lg mb-3">Historique</h2>
          <div className="space-y-3">
            {games.map(g => (
              <div key={g.id} className="card p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-semibold text-navy">{g.title}</p>
                  <span className={`badge text-xs ${g.status === 'active' ? 'bg-green-100 text-green-700' : g.status === 'ended' ? 'bg-gray-100 text-gray-500' : 'bg-yellow-100 text-yellow-700'}`}>{g.status}</span>
                </div>
                <p className="text-xs text-gray-500">Lot : {g.ticketOffer?.advantage || '—'}</p>
                {g.winner && <p className="text-xs text-green-600 mt-1">Gagnant : {g.winner.name}</p>}
              </div>
            ))}
          </div>
        </div>
        <div>
          <h2 className="font-semibold text-lg mb-3">Nouveau jeu</h2>
          <form onSubmit={handleCreate} className="card p-5 space-y-3">
            <input type="text" placeholder="Titre du jeu" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required
              className="w-full border border-cream-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy" />
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              className="w-full border border-cream-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy bg-white">
              <option value="quiz">Quiz</option>
              <option value="enigme">Énigme</option>
              <option value="flappy">Flappy (goéland)</option>
            </select>
            <select value={form.ticket_offer_id} onChange={e => setForm(f => ({ ...f, ticket_offer_id: e.target.value }))}
              className="w-full border border-cream-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy bg-white">
              <option value="">Lot aléatoire</option>
              {offers.map(o => <option key={o.id} value={o.id}>{o.title} ({o.quantity_remaining} restants)</option>)}
            </select>
            {form.type === 'quiz' && (
              <>
                <input type="text" placeholder="Question" value={form.question} onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
                  className="w-full border border-cream-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy" />
                {form.options.map((opt, i) => (
                  <div key={i} className="flex gap-2">
                    <input type="radio" name="answer" value={i} checked={form.answer === i} onChange={() => setForm(f => ({ ...f, answer: i }))} />
                    <input type="text" placeholder={`Option ${['A','B','C','D'][i]}`} value={opt}
                      onChange={e => { const opts = [...form.options]; opts[i] = e.target.value; setForm(f => ({ ...f, options: opts })); }}
                      className="flex-1 border border-cream-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy" />
                  </div>
                ))}
              </>
            )}
            {form.type === 'enigme' && (
              <textarea placeholder="Texte de l'énigme (réponse unique attendue)" value={form.riddle}
                onChange={e => setForm(f => ({ ...f, riddle: e.target.value }))} rows={3}
                className="w-full border border-cream-dark rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-navy" />
            )}
            <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Lancement…' : 'Lancer le jeu'}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
