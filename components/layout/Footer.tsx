"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/field";
import { SocialLinks } from "@/components/layout/SocialLinks";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to subscribe');
      }
      toast.success("You're on the list!");
      setEmail("");
    } catch (err: any) {
      toast.error(err.message || 'Failed to subscribe. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer className="safe-area-bottom relative w-full overflow-hidden border-t border-fg/30 bg-canvas py-12 text-fg">
      {/* Background effects */}
      <div aria-hidden="true" className="noise pointer-events-none absolute inset-0 opacity-5" />
      <div aria-hidden="true" className="spotlight opacity-10" />

      <div className="relative z-10 mx-auto max-w-6xl px-6">
        {/* Three columns whose contents started at three different heights — a
            128px logo, a heading, another heading — so nothing lined up across
            them. The newsletter now leads the row as the footer's actual job,
            with identity and links flanking it and every column's first line on
            the same baseline. */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[auto_1fr_auto] md:gap-12">
          {/* Left: identity */}
          <div className="flex flex-col items-center gap-3 md:items-start">
            <div className="relative h-20 w-20">
              <Image
                src="/1111logo.png"
                alt=""
                fill
                className="object-contain"
                sizes="80px"
              />
            </div>
            <p className="font-display text-sm font-light tracking-widest text-fg">
              Music is Timeless
            </p>
          </div>

          {/* Center: newsletter */}
          <div className="flex flex-col items-center text-center md:items-start md:text-left">
            <h2 className="font-heading text-lg tracking-wider text-fg">Join our list</h2>
            <p className="mt-2 max-w-sm text-sm text-fg-dim">
              Event announcements and VIP table offers. No more than a couple of emails a month.
            </p>
            <form className="mt-4 w-full max-w-sm" onSubmit={handleSubscribe}>
              {/* The input had no label at all — a placeholder is not a name, and
                  it vanishes the moment someone starts typing. */}
              <Label htmlFor="newsletter-email" className="sr-only">
                Email address
              </Label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  id="newsletter-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                />
                <Button type="submit" disabled={submitting} loading={submitting} variant="primary" size="md">
                  {submitting ? 'Joining' : 'Join'}
                </Button>
              </div>
            </form>
          </div>

          {/* Right: social + links */}
          <div className="flex flex-col items-center gap-3 md:items-end">
            <h2 className="font-heading text-lg tracking-wider text-fg">Follow us</h2>
            <SocialLinks />
            <nav aria-label="Footer" className="mt-1">
              {/* Was a 20px-tall text link. It gets a real target now. */}
              <Link
                href="/privacy"
                className="inline-flex min-h-[44px] items-center text-sm tracking-wider text-fg-dim transition-colors hover:text-fg"
              >
                Privacy policy
              </Link>
            </nav>
          </div>
        </div>

        <div className="mt-10 border-t border-line-subtle pt-6 text-center text-xs tracking-wide text-fg-subtle md:text-left">
          © {new Date().getFullYear()} 11:11 EPTX. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
