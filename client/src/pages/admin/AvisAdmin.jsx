import { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { moderateReview } from '../../api/admin';
import client from '../../api/client';

export default function AvisAdmin() {
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    client.get('/admin/reviews?status=pending').then(r => setReviews(r.data)).catch(() => {});
  }, []);

  const moderate = async (id, status) => {
    await moderateReview(id, status);
    setReviews(rs => rs.filter(r => r.id !== id));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="font-serif text-3xl text-navy mb-6">Modération des avis</h1>
      {reviews.length === 0
        ? <p className="text-gray-400">Aucun avis en attente.</p>
        : <div className="space-y-4">
            {reviews.map(r => (
              <div key={r.id} className="card p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-navy">{r.user?.name} — {'★'.repeat(r.rating)}</p>
                    <p className="text-sm text-gray-500 mt-1">{r.Commerce?.name || `Commerce #${r.commerce_id}`}</p>
                    <p className="mt-2 text-gray-700">{r.comment}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(r.created_at).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button onClick={() => moderate(r.id, 'approved')} className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100"><Check size={18} /></button>
                    <button onClick={() => moderate(r.id, 'rejected')} className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"><X size={18} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
      }
    </div>
  );
}
