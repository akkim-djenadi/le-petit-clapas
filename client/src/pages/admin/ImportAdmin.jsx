import { useState, useRef } from 'react';
import { Upload, Eye, Play, CheckCircle } from 'lucide-react';
import { previewCSV, executeCSV } from '../../api/admin';

const STEPS = ['Upload', 'Mappage', 'Prévisualisation', 'Import'];

export default function ImportAdmin() {
  const [step, setStep] = useState(0);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [mapping, setMapping] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

  const FIELD_LABELS = { name: 'Nom', address: 'Adresse', lat: 'Latitude', lng: 'Longitude', category: 'Catégorie', subcategory: 'Sous-catégorie', phone: 'Téléphone', website: 'Site web', email: 'Email', description: 'Description', image: 'Image (nom fichier)' };

  const handleFile = async (f) => {
    setFile(f); setLoading(true);
    const fd = new FormData(); fd.append('file', f);
    try {
      const data = await previewCSV(fd);
      setPreview(data);
      setMapping(data.mapping);
      setStep(1);
    } finally { setLoading(false); }
  };

  const handleExecute = async () => {
    setLoading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('mapping', JSON.stringify(mapping));
    try {
      const data = await executeCSV(fd);
      setResult(data); setStep(3);
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="font-serif text-3xl text-navy mb-6">Import CSV des commerces</h1>

      {/* Stepper */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i <= step ? 'bg-navy text-white' : 'bg-cream-dark text-gray-400'}`}>{i + 1}</div>
            <span className={`text-sm hidden sm:block ${i === step ? 'text-navy font-semibold' : 'text-gray-400'}`}>{s}</span>
            {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 ${i < step ? 'bg-navy' : 'bg-cream-dark'} mx-2`} />}
          </div>
        ))}
      </div>

      {/* Étape 0 : Upload */}
      {step === 0 && (
        <div className="card p-8 text-center border-2 border-dashed border-cream-dark hover:border-navy transition-colors cursor-pointer" onClick={() => fileRef.current.click()}>
          <Upload size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="font-semibold text-navy mb-2">Déposez votre fichier CSV</p>
          <p className="text-sm text-gray-400">Colonnes acceptées : nom, adresse, latitude, longitude, catégorie, image…</p>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={e => e.target.files[0] && handleFile(e.target.files[0])} />
          {loading && <p className="mt-4 text-navy animate-pulse">Analyse en cours…</p>}
        </div>
      )}

      {/* Étape 1 : Mappage */}
      {step === 1 && preview && (
        <div className="card p-6">
          <h2 className="font-semibold text-lg text-navy mb-4">Mapper les colonnes CSV</h2>
          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            {Object.entries(FIELD_LABELS).map(([field, label]) => (
              <div key={field}>
                <label className="text-sm font-medium text-gray-600 mb-1 block">{label}</label>
                <select value={mapping[field] || ''} onChange={e => setMapping(m => ({ ...m, [field]: e.target.value }))}
                  className="w-full border border-cream-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy bg-white">
                  <option value="">— Non mappé —</option>
                  {preview.headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            ))}
          </div>
          <button onClick={() => setStep(2)} className="btn-primary flex items-center gap-2"><Eye size={16} />Prévisualiser</button>
        </div>
      )}

      {/* Étape 2 : Prévisualisation */}
      {step === 2 && preview && (
        <div className="card p-6">
          <h2 className="font-semibold text-lg text-navy mb-2">Prévisualisation ({preview.total} lignes)</h2>
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-cream-dark">{Object.values(mapping).filter(Boolean).map(h => <th key={h} className="text-left py-2 pr-4 text-gray-500 font-medium">{h}</th>)}</tr></thead>
              <tbody>
                {preview.preview.map(({ row, errors }, i) => (
                  <tr key={i} className={`border-b border-cream-dark ${errors.length ? 'bg-red-50' : ''}`}>
                    {Object.values(mapping).filter(Boolean).map(h => <td key={h} className="py-2 pr-4 truncate max-w-32">{row[h] || '—'}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="btn-secondary">Modifier le mappage</button>
            <button onClick={handleExecute} disabled={loading} className="btn-primary flex items-center gap-2">
              <Play size={16} />{loading ? 'Import en cours…' : "Lancer l'import"}
            </button>
          </div>
        </div>
      )}

      {/* Étape 3 : Résultat */}
      {step === 3 && result && (
        <div className="card p-6 text-center">
          <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
          <h2 className="font-serif text-2xl text-navy mb-4">Import terminé</h2>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 rounded-xl p-4"><p className="text-2xl font-bold text-green-600">{result.created}</p><p className="text-sm text-gray-500">Créés</p></div>
            <div className="bg-yellow-50 rounded-xl p-4"><p className="text-2xl font-bold text-yellow-600">{result.skipped}</p><p className="text-sm text-gray-500">Ignorés</p></div>
            <div className="bg-red-50 rounded-xl p-4"><p className="text-2xl font-bold text-red-600">{result.errors.length}</p><p className="text-sm text-gray-500">Erreurs</p></div>
          </div>
          <button onClick={() => { setStep(0); setFile(null); setPreview(null); setResult(null); }} className="btn-primary">
            Nouvel import
          </button>
        </div>
      )}
    </div>
  );
}
