"use client";

import React from 'react';
import Link from 'next/link';
import { FiX } from 'react-icons/fi';
import SectionHeader from './SectionHeader';
import { Button } from '@/components/ui/button';

interface FAQFestivalSectionProps {
  title?: string;
  className?: string;
  id?: string;
}

export default function FAQFestivalSection({
  title = "VENUE RULES",
  className = "",
  id = "faq"
}: FAQFestivalSectionProps) {
  return (
    <section id={id} className={`py-12 ${className} bg-canvas relative overflow-hidden`}>
      <div className="container mx-auto px-4 relative z-10">
        <SectionHeader title={title} />

        {/* Three stacked centred headings — a 24px line, a 30px line and a
            20px line — competed for the same job, then thirteen all-caps
            sentences were set as equal-height centred cards, which left a
            ragged last row and made a plain list hard to scan. One statement,
            one permitted-items note, and the prohibited items as a real list
            with a consistent marker. */}
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 rounded-lg border border-fg/20 bg-surface/40 p-5 text-center sm:p-6">
            <p className="font-heading text-lg tracking-wide text-fg sm:text-xl">
              All persons, bags and personal items are subject to search
            </p>
            <p className="mt-2 text-sm text-fg-muted">
              Clear bags of any size are permitted.
            </p>
          </div>

          <h3 className="mb-4 font-heading text-xl tracking-wide text-fg sm:text-2xl">
            Prohibited items
          </h3>

          <ul className="mb-10 grid grid-cols-1 gap-x-8 gap-y-1 sm:grid-cols-2">
            {[
              'Purses or bags larger than 8" × 6" × 2"',
              'Weapons, or anything usable to cause bodily harm',
              'Controlled substances',
              'Marijuana products',
              'Eye drops and nasal spray',
              'Vitamins and supplements',
              'Over-the-counter medications',
              'Outside food, drink or liquor (including water)',
              'Cameras and GoPros',
              'Selfie sticks',
              'Colognes and perfumes',
              'Chewing tobacco',
              'Whistles',
            ].map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 border-b border-line-subtle py-3 text-fg-dim last:border-b-0"
              >
                <FiX aria-hidden="true" className="mt-1 shrink-0 text-danger-bright" size={15} />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div className="flex flex-col items-center gap-4 pb-8 text-center">
            <p className="text-fg-dim">
              Questions about what you can bring? Ask us before you head out.
            </p>
            <Button asChild variant="outline" size="lg">
              <Link href="#contact">Contact us</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
} 