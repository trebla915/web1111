'use client';

import { useState } from 'react';

type SeedResult = {
  eventId: string;
  tableId: string;
  reservationId: string;
  confirmationUrl: string;
  checkInUrl: string;
  staffScannerUrl: string;
  message: string;
};

export default function TestReservationPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SeedResult | null>(null);

  const createTestReservation = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/dev/seed-test-reservation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: 'Test Customer',
          customerEmail: 'test@example.com',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      setResult(data);
    } catch (e: any) {
      setError(e.message || 'Failed to create test reservation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-cyan-400 mb-2">Test reservation flow</h1>
      <p className="text-gray-400 text-sm mb-6">
        Creates a test event, table, and confirmed reservation so you can test QR code and
        staff check-in without Stripe.
      </p>

      <button
        onClick={createTestReservation}
        disabled={loading}
        className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
      >
        {loading ? 'Creating…' : 'Create test reservation'}
      </button>

      {error && (
        <div className="mt-6 p-4 bg-red-900/30 border border-red-500/50 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-8 space-y-6">
          <p className="text-green-400 text-sm">{result.message}</p>

          <div className="bg-zinc-900 rounded-lg border border-zinc-700 p-4 space-y-3">
            <p className="text-gray-400 text-xs uppercase tracking-wide">IDs</p>
            <p className="text-sm font-mono text-gray-300 break-all">
              Reservation: <span className="text-white">{result.reservationId}</span>
            </p>
            <p className="text-sm font-mono text-gray-300 break-all">
              Event: <span className="text-white">{result.eventId}</span>
            </p>
          </div>

          <div className="bg-zinc-900 rounded-lg border border-zinc-700 p-4 space-y-3">
            <p className="text-gray-400 text-xs uppercase tracking-wide">Links</p>
            <div className="space-y-2">
              <div>
                <p className="text-cyan-400 text-xs mb-1">1. Confirmation page (QR code)</p>
                <a
                  href={result.confirmationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-white underline break-all hover:text-cyan-300"
                >
                  {result.confirmationUrl}
                </a>
              </div>
              <div>
                <p className="text-cyan-400 text-xs mb-1">2. Staff check-in (this reservation)</p>
                <a
                  href={result.checkInUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-white underline break-all hover:text-cyan-300"
                >
                  {result.checkInUrl}
                </a>
              </div>
              <div>
                <p className="text-cyan-400 text-xs mb-1">3. Staff scanner (scan any QR)</p>
                <a
                  href={result.staffScannerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-white underline break-all hover:text-cyan-300"
                >
                  {result.staffScannerUrl}
                </a>
              </div>
            </div>
          </div>

          <div className="text-gray-500 text-sm space-y-1">
            <p><strong className="text-gray-400">How to test:</strong></p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Open the <strong>Confirmation page</strong> link — you’ll see the reservation and QR code.</li>
              <li>On your phone, open the <strong>Staff scanner</strong> and scan the QR from the confirmation page (or use manual entry with the reservation ID).</li>
              <li>Complete check-in on the staff check-in page (enter your name and tap Check In).</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
