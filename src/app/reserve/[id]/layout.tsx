// app/reserve/[id]/layout.tsx
import { ReactNode } from 'react';

export default function ReservationLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <main className="flex-1 bg-black pt-16 md:pt-20">
      {children}
    </main>
  );
}