// ContactSection.tsx
"use client"

import React, { useState } from 'react';
import { FiMail, FiPhone, FiMapPin } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { useScrollParallax } from '@/lib/hooks/useScrollParallax';
import SectionHeader from './SectionHeader';

export default function ContactSection() {
  const { style: bgParallaxStyle, ref: bgParallaxRef } = useScrollParallax({
    speed: 0.8,
    direction: 'background',
    whenInView: true,
  });

  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast.error('Please fill out all fields.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to send message');
      }
      toast.success("Message sent! We'll get back to you soon.");
      setForm({ name: '', email: '', message: '' });
    } catch (err: any) {
      toast.error(err.message || 'Failed to send message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="contact"
      className="py-16 bg-black text-white relative overflow-hidden border-t border-white/20"
    >
      {/* Background effects — parallax depth */}
      <div className="absolute inset-0 noise opacity-5" />
      <div ref={bgParallaxRef} className="absolute inset-0 spotlight opacity-10" style={bgParallaxStyle} />

      <div className="container mx-auto px-4 relative z-10">
        <SectionHeader title="CONTACT US" subtitle="REACH OUT FOR RESERVATIONS OR INQUIRIES" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          <div className="space-y-6">
            <div className="border border-white/20 p-6 bg-black">
              <h3 className="text-2xl font-bold mb-6 text-white font-display">VENUE INFORMATION</h3>

              <div className="space-y-4">
                <div className="flex items-start">
                  <FiMapPin className="text-white mt-1 mr-3 flex-shrink-0" size={20} />
                  <div>
                    <h4 className="font-bold text-white/60">LOCATION</h4>
                    <p className="text-white">9740 DYER STREET</p>
                    <p className="text-white">EL PASO, TX 79924</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <FiPhone className="text-white mt-1 mr-3 flex-shrink-0" size={20} />
                  <div>
                    <h4 className="font-bold text-white/60">PHONE</h4>
                    <p className="text-white">+1 (915) 246-3945</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <FiMail className="text-white mt-1 mr-3 flex-shrink-0" size={20} />
                  <div>
                    <h4 className="font-bold text-white/60">EMAIL</h4>
                    <p className="text-white">INFO@1111EPTX.COM</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border border-white/20 p-6 bg-black">
            <h3 className="text-2xl font-bold mb-6 text-white font-display">SEND MESSAGE</h3>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <input
                  type="text"
                  placeholder="YOUR NAME"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  disabled={submitting}
                  className="w-full px-4 py-3 bg-transparent border border-white focus:border-white text-white placeholder-white outline-none disabled:opacity-50"
                />
              </div>

              <div>
                <input
                  type="email"
                  placeholder="YOUR EMAIL"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  disabled={submitting}
                  className="w-full px-4 py-3 bg-transparent border border-white focus:border-white text-white placeholder-white outline-none disabled:opacity-50"
                />
              </div>

              <div>
                <textarea
                  placeholder="YOUR MESSAGE"
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  disabled={submitting}
                  className="w-full px-4 py-3 bg-transparent border border-white focus:border-white text-white placeholder-white outline-none resize-none disabled:opacity-50"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-white text-black font-bold py-3 transition-colors hover:bg-white/90 disabled:opacity-50"
              >
                {submitting ? 'SENDING...' : 'SEND MESSAGE'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
