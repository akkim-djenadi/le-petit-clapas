import { useState, useEffect } from 'react';
import { getMyProfile } from '../../api/merchant';
import client from '../../api/client';

export default function ProAvis() {
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    getMyProfile().then(p => {
      if (p?.commerce_id) {
        client.get(`/reviews/commerce/${p.commerce_id}`).then(r => setReviews(r.data));
      }
    });
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="font-serif text-3xl text-navy mb-6">Avis clients</h1>
      {reviews.length === 0 ? <p className="text-gray-400">Aucun avis approuvé.</p> : (
        <div className="space-y-3">
          {reviews.map(r => (
            <div key={r.id} className="card p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-sm">{r.user?.name}</span>
                <span className="text-sand">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                <span className="text-xs text-gray-400 ml-auto">{new Date(r.created_at).toLocaleDateString('fr-FR')}</span>
              </div>
              <p className="text-sm text-gray-600">{r.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
