'use client';

import { useState } from 'react';

export default function CommissionForm({ whatsapp }) {
  const [form, setForm] = useState({ name: '', email: '', idea: '' });

  function update(event) {
    setForm(current => ({ ...current, [event.target.name]: event.target.value }));
  }

  function submit(event) {
    event.preventDefault();
    const number = String(whatsapp || '').replace(/\D/g, '');
    const message = [
      'Hello! I would like to commission an artwork.',
      `Name: ${form.name}`,
      `Email: ${form.email}`,
      `Idea: ${form.idea}`,
    ].join('\n');
    window.open(`https://wa.me/${number}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  }

  const fieldClass = 'w-full rounded-sm border border-[#4ea87c]/35 bg-white/65 px-4 py-3.5 text-sm text-[#1f3a2f] outline-none transition focus:border-[#2d7d6b] focus:ring-2 focus:ring-[#4ea87c]/15';

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <label className="flex flex-col gap-2 text-sm text-[#1f3a2f]">
        Name
        <input required name="name" value={form.name} onChange={update} placeholder="Your full name" className={fieldClass} />
      </label>
      <label className="flex flex-col gap-2 text-sm text-[#1f3a2f]">
        Email
        <input required type="email" name="email" value={form.email} onChange={update} placeholder="your.email@example.com" className={fieldClass} />
      </label>
      <label className="flex flex-col gap-2 text-sm text-[#1f3a2f]">
        Tell me about your idea
        <textarea required name="idea" value={form.idea} onChange={update} rows={5} placeholder="Share your vision, preferred size, timeline, colors, and any references." className={`${fieldClass} resize-y`} />
      </label>
      <button type="submit" className="glass-btn glass-btn--lg glass-btn--wood mt-1 self-center">
        Send Inquiry on WhatsApp
      </button>
    </form>
  );
}
