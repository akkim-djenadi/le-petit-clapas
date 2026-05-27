import { useState, useEffect } from 'react';
import { Plus, Trash2, ChevronDown } from 'lucide-react';
import { getCategories, createCategory, createSubcategory, deleteCategory } from '../../api/categories';

export default function CategoriesAdmin() {
  const [cats, setCats] = useState([]);
  const [newCat, setNewCat] = useState('');
  const [newSub, setNewSub] = useState({});
  const [expanded, setExpanded] = useState({});

  useEffect(() => { getCategories().then(setCats); }, []);

  const addCat = async (e) => {
    e.preventDefault();
    await createCategory({ name: newCat });
    setNewCat('');
    getCategories().then(setCats);
  };

  const addSub = async (catId) => {
    if (!newSub[catId]) return;
    await createSubcategory(catId, { name: newSub[catId] });
    setNewSub(s => ({ ...s, [catId]: '' }));
    getCategories().then(setCats);
  };

  const delCat = async (id) => {
    if (!confirm('Supprimer cette catégorie ?')) return;
    await deleteCategory(id);
    setCats(cs => cs.filter(c => c.id !== id));
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="font-serif text-3xl text-navy mb-6">Catégories & Sous-catégories</h1>
      <form onSubmit={addCat} className="flex gap-3 mb-6">
        <input value={newCat} onChange={e => setNewCat(e.target.value)} placeholder="Nouvelle catégorie" required
          className="flex-1 border border-cream-dark rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-navy" />
        <button type="submit" className="btn-primary flex items-center gap-2"><Plus size={16} />Ajouter</button>
      </form>
      <div className="space-y-3">
        {cats.map(cat => (
          <div key={cat.id} className="card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 cursor-pointer" onClick={() => setExpanded(e => ({ ...e, [cat.id]: !e[cat.id] }))}>
              <span className="font-semibold text-navy">{cat.name} <span className="text-gray-400 text-sm font-normal">({cat.subcategories?.length || 0} sous-cats)</span></span>
              <div className="flex items-center gap-2">
                <button onClick={(e) => { e.stopPropagation(); delCat(cat.id); }} className="p-1 text-gray-400 hover:text-terracotta"><Trash2 size={16} /></button>
                <ChevronDown size={16} className={`text-gray-400 transition-transform ${expanded[cat.id] ? 'rotate-180' : ''}`} />
              </div>
            </div>
            {expanded[cat.id] && (
              <div className="border-t border-cream-dark px-4 pb-3 pt-2">
                {cat.subcategories?.map(s => (
                  <div key={s.id} className="flex items-center justify-between py-1 text-sm">
                    <span className="text-gray-600">· {s.name}</span>
                  </div>
                ))}
                <div className="flex gap-2 mt-2">
                  <input value={newSub[cat.id] || ''} onChange={e => setNewSub(s => ({ ...s, [cat.id]: e.target.value }))}
                    placeholder="Nouvelle sous-catégorie…"
                    className="flex-1 border border-cream-dark rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy" />
                  <button onClick={() => addSub(cat.id)} className="btn-primary text-sm py-1.5 px-3 flex items-center gap-1"><Plus size={14} />Ajouter</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
