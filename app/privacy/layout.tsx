import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy policy for 11:11 EPTX. How we collect, use, and protect your information when you use our website and services.',
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
