// ContactSection.tsx
"use client"

import React, { useState } from 'react';
import { FiMail, FiPhone, FiMapPin } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { useScrollParallax } from '@/lib/hooks/useScrollParallax';
import SectionHeader from './SectionHeader';
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/field";

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
      className="py-16 bg-canvas text-fg relative overflow-hidden border-t border-fg/20"
    >
      {/* Background effects — parallax depth */}
      <div aria-hidden="true" className="noise pointer-events-none absolute inset-0 opacity-5" />
      <div ref={bgParallaxRef} className="absolute inset-0 spotlight opacity-10" style={bgParallaxStyle} />

      <div className="container mx-auto px-4 relative z-10">
        <SectionHeader title="CONTACT US" subtitle="REACH OUT FOR RESERVATIONS OR INQUIRIES" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          <div className="flex flex-col">
            {/* `space-y-6` on a single child did nothing; the wrapper now lets
                the card fill the row so the two columns end level. */}
            <div className="flex-1 rounded-lg border border-fg/20 bg-canvas p-6">
              <h3 className="mb-5 font-heading text-2xl tracking-wide text-fg">Venue information</h3>

              <div className="space-y-4">
                <div className="flex items-start">
                  <FiMapPin className="text-fg mt-1 mr-3 flex-shrink-0" size={20} />
                  <div>
                    <h4 className="text-xs font-medium uppercase tracking-wider text-fg-muted">Location</h4>
                    <p className="mt-0.5 text-fg">9740 Dyer Street</p>
                    <p className="text-fg">El Paso, TX 79924</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <FiPhone className="text-fg mt-1 mr-3 flex-shrink-0" size={20} />
                  <div>
                    <h4 className="text-xs font-medium uppercase tracking-wider text-fg-muted">Phone</h4>
                    <p className="tabular mt-0.5 text-fg">+1 (915) 246-3945</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <FiMail className="text-fg mt-1 mr-3 flex-shrink-0" size={20} />
                  <div>
                    <h4 className="text-xs font-medium uppercase tracking-wider text-fg-muted">Email</h4>
                    <p className="mt-0.5 break-all text-fg">INFO@1111EPTX.COM</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Three placeholder-only fields, all overriding the input primitive
              with `placeholder-fg` — pure white, the same colour as a typed
              value — so a filled field and an empty one looked identical, and
              none of the three had an accessible name. Real labels, the
              system's own input, and the placeholder back to its token. */}
          <div className="rounded-lg border border-fg/20 bg-canvas p-6">
            <h3 className="mb-5 font-heading text-2xl tracking-wide text-fg">Send a message</h3>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <Label htmlFor="contact-name" className="mb-1.5">Name</Label>
                <Input
                  id="contact-name"
                  type="text"
                  autoComplete="name"
                  placeholder="Alex Navarro"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  disabled={submitting}
                />
              </div>

              <div>
                <Label htmlFor="contact-email" className="mb-1.5">Email</Label>
                <Input
                  id="contact-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  disabled={submitting}
                />
              </div>

              <div>
                <Label htmlFor="contact-message" className="mb-1.5">Message</Label>
                <Textarea
                  id="contact-message"
                  placeholder="Table for six on the 17th — what's available?"
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  disabled={submitting}
                />
              </div>

              <Button type="submit" disabled={submitting} loading={submitting} variant="primary" size="lg" full>
                {submitting ? 'Sending' : 'Send message'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
