'use client';

import { useEffect, useState } from 'react';
import { SHOP_CATEGORIES, normalizeShopCategories } from '@/data/shopCategories';

// CMS "Shop" tab: the Shop menu's categories and their types, each linked to a Shopify collection.
// Saved as JSON in site_text "shop_categories"; the website reads it straight away.

let nextRowId = 1;
// Rows get a temporary id so the editor can keep track of them while they move around (not saved).
const withIds = tree => tree.map(category => ({
  ...category,
  _id: nextRowId++,
  children: category.children?.map(child => ({ ...child, _id: nextRowId++ })),
}));

const cleanForSave = tree => normalizeShopCategories(tree.map(category => ({
  ...category,
  children: category.paintings ? undefined : category.children,
})));

function move(list, index, by) {
  const target = index + by;
  if (target < 0 || target >= list.length) return list;
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export default function ShopCategoriesEditor({ token }) {
  const [tree, setTree] = useState(null);
  const [collections, setCollections] = useState([]);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch('/api/site-text', { cache: 'no-store' }).then(res => res.json()).catch(() => ({})),
      fetch('/api/shopify-collections', { cache: 'no-store' }).then(res => res.json()).catch(() => []),
    ]).then(([text, list]) => {
      if (cancelled) return;
      let saved = null;
      try { saved = text?.shop_categories ? normalizeShopCategories(JSON.parse(text.shop_categories)) : null; } catch {}
      setTree(withIds(saved || SHOP_CATEGORIES));
      setCollections(Array.isArray(list) ? list : []);
      if (!Array.isArray(list) || list.length === 0) setMessage('Could not load the Shopify collections. Refresh to try again.');
    });
    return () => { cancelled = true; };
  }, []);

  function change(update) {
    setTree(current => update(current));
    setMessage('Changes not saved yet. Click Save Shop when finished.');
  }
  const updateCategory = (index, patch) => change(current => current.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  const updateType = (index, typeIndex, patch) => change(current => current.map((c, i) => (i === index
    ? { ...c, children: c.children.map((t, j) => (j === typeIndex ? { ...t, ...patch } : t)) }
    : c)));

  // which Shopify collection a row uses (matched by handle or title)
  const linkedHandle = node => collections.find(c =>
    (node.match || []).includes(c.handle.toLowerCase()) || (node.match || []).includes(String(c.title).toLowerCase()))?.handle || '';

  async function save() {
    const cleaned = cleanForSave(tree);
    if (!cleaned) { setMessage('Add at least one category with a name.'); return; }
    setSaving(true);
    setMessage('Saving…');
    const response = await fetch('/api/site-text', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ key: 'shop_categories', value: JSON.stringify(cleaned) }),
    }).catch(() => null);
    if (response?.ok) {
      setTree(withIds(cleaned));
      setMessage('✓ Shop saved and published!');
    } else {
      const error = await response?.json().catch(() => ({}));
      setMessage(`Error: ${error?.error || 'Could not save. Check your connection and try again.'}`);
    }
    setSaving(false);
  }

  function resetToStart() {
    if (!window.confirm('Put the Shop categories back to how they started? (Nothing changes on the website until you save.)')) return;
    change(() => withIds(SHOP_CATEGORIES));
  }

  if (!tree) return <p className="py-16 text-center text-sm text-neutral-400">Loading the Shop…</p>;

  const input = 'w-full border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800 focus:border-neutral-600 focus:outline-none';
  const smallBtn = 'h-9 min-w-9 border border-neutral-200 bg-white px-2 text-sm text-neutral-600 hover:border-neutral-600 disabled:opacity-25';
  const collectionPicker = (node, onPick, optional = false) => {
    const handle = linkedHandle(node);
    return (
      <div>
        <select value={handle} onChange={event => onPick(event.target.value ? [event.target.value] : [])} className={input}
          aria-label={`Shopify collection for ${node.title || 'this row'}`}>
          <option value="">— No collection —</option>
          {collections.map(c => (
            <option key={c.handle} value={c.handle}>{c.title}{c.count != null ? ` (${c.count})` : ''}</option>
          ))}
        </select>
        {!handle && !optional && (node.match || []).length > 0 && (
          <p className="mt-1 text-[11px] text-amber-700">Not in Shopify yet. It links by itself once a collection named “{node.match.find(name => name.includes(' ')) || node.match[0]}” exists.</p>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-7">
      <div>
        <p className="mb-2 text-xs uppercase tracking-[0.25em] text-neutral-400">Shop Menu</p>
        <h2 className="text-4xl font-light" style={{ fontFamily: 'var(--font-cormorant)' }}>Shop Categories</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-neutral-500">
          These are the categories in the website’s Shop menu, top to bottom. Give each one a name and choose the Shopify collection
          whose products it shows. A category can have types (like Bookmarks → Painted, Embroidered, Marker). A category or type with
          nothing for sale shows “Coming soon”.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {tree.map((category, index) => (
          <section key={category._id} className="border border-neutral-200 bg-white p-4 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
              <div className="flex gap-2 sm:pt-6">
                <button className={smallBtn} disabled={index === 0} onClick={() => change(current => move(current, index, -1))} aria-label={`Move ${category.title} up`}>↑</button>
                <button className={smallBtn} disabled={index === tree.length - 1} onClick={() => change(current => move(current, index, 1))} aria-label={`Move ${category.title} down`}>↓</button>
              </div>
              <label className="flex-1">
                <span className="mb-1 block text-[10px] uppercase tracking-[0.18em] text-neutral-400">Category name</span>
                <input value={category.title} onChange={event => updateCategory(index, { title: event.target.value })} className={input} maxLength={60} />
                {category.slug && <span className="mt-1 block text-[11px] text-neutral-400">Page: /shop/{category.slug}</span>}
              </label>
              <label className="flex-1">
                <span className="mb-1 block text-[10px] uppercase tracking-[0.18em] text-neutral-400">
                  {category.children?.length ? 'Its own collection (optional)' : 'Shopify collection'}
                </span>
                {collectionPicker(category, match => updateCategory(index, { match }), Boolean(category.children?.length))}
              </label>
              {!category.paintings && (
                <div className="sm:pt-6">
                  <button className={`${smallBtn} w-full px-3 text-xs uppercase tracking-[0.12em] text-red-600 hover:border-red-600`}
                    onClick={() => window.confirm(`Remove “${category.title}” from the Shop menu?`) && change(current => current.filter((_, i) => i !== index))}>
                    Remove
                  </button>
                </div>
              )}
            </div>

            {category.paintings ? (
              <p className="mt-3 text-xs text-neutral-500">
                This collection also fills the <strong>Paintings</strong> page. Those paintings are kept off the Portfolio page.
                Arrange them in Layout → Paintings.
              </p>
            ) : (
              <div className="mt-4 border-l-2 border-[#4ea87c]/30 pl-3 sm:ml-[5.5rem] sm:pl-5">
                <p className="mb-2 text-[10px] uppercase tracking-[0.18em] text-neutral-400">Types {category.children?.length ? `(${category.children.length})` : '(none)'}</p>
                <div className="flex flex-col gap-3">
                  {(category.children || []).map((type, typeIndex) => (
                    <div key={type._id} className="flex flex-col gap-2 border border-neutral-100 bg-neutral-50/60 p-3 sm:flex-row sm:items-start">
                      <div className="flex gap-2 sm:pt-5">
                        <button className={smallBtn} disabled={typeIndex === 0}
                          onClick={() => updateCategory(index, { children: move(category.children, typeIndex, -1) })} aria-label={`Move ${type.title} up`}>↑</button>
                        <button className={smallBtn} disabled={typeIndex === category.children.length - 1}
                          onClick={() => updateCategory(index, { children: move(category.children, typeIndex, 1) })} aria-label={`Move ${type.title} down`}>↓</button>
                      </div>
                      <label className="flex-1">
                        <span className="mb-1 block text-[10px] uppercase tracking-[0.18em] text-neutral-400">Type name</span>
                        <input value={type.title} onChange={event => updateType(index, typeIndex, { title: event.target.value })} className={input} maxLength={60} />
                      </label>
                      <label className="sm:w-40">
                        <span className="mb-1 block text-[10px] uppercase tracking-[0.18em] text-neutral-400">Short name</span>
                        <input value={type.short || ''} placeholder={type.title} onChange={event => updateType(index, typeIndex, { short: event.target.value })} className={input} maxLength={40} />
                      </label>
                      <label className="flex-1">
                        <span className="mb-1 block text-[10px] uppercase tracking-[0.18em] text-neutral-400">Shopify collection</span>
                        {collectionPicker(type, match => updateType(index, typeIndex, { match }))}
                      </label>
                      <div className="sm:pt-5">
                        <button className={`${smallBtn} w-full text-red-600 hover:border-red-600`} aria-label={`Remove ${type.title}`}
                          onClick={() => updateCategory(index, { children: category.children.filter((_, j) => j !== typeIndex) })}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="mt-3 border border-dashed border-neutral-300 px-4 py-2 text-[11px] uppercase tracking-[0.14em] text-neutral-500 hover:border-neutral-600 hover:text-neutral-800"
                  onClick={() => updateCategory(index, { children: [...(category.children || []), { _id: nextRowId++, slug: '', title: '', match: [] }] })}>
                  + Add type
                </button>
              </div>
            )}
          </section>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <button className="border border-dashed border-neutral-400 px-5 py-3 text-xs uppercase tracking-[0.16em] text-neutral-600 hover:border-neutral-800 hover:text-neutral-900"
          onClick={() => change(current => [...current, { _id: nextRowId++, slug: '', title: '', match: [] }])}>
          + Add category
        </button>
        <button className="px-5 py-3 text-xs uppercase tracking-[0.16em] text-neutral-400 hover:text-neutral-700" onClick={resetToStart}>
          Reset to the starting categories
        </button>
      </div>

      <div className="sticky bottom-3 flex flex-col items-center justify-between gap-3 border border-neutral-200 bg-white/95 p-4 shadow-lg backdrop-blur sm:flex-row">
        <p className={`text-xs ${message.startsWith('✓') ? 'text-green-700' : message.startsWith('Error') ? 'text-red-600' : 'text-neutral-500'}`}>
          {message || 'Changes are published only after you save. Rows without a name are left out.'}
        </p>
        <button onClick={save} disabled={saving} className="w-full bg-neutral-900 px-7 py-3 text-xs uppercase tracking-[0.18em] text-white disabled:opacity-40 sm:w-auto">
          {saving ? 'Saving…' : 'Save Shop'}
        </button>
      </div>
    </div>
  );
}
