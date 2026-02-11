"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { parseQRCodeUrl } from '@/lib/utils/qrcode';

export default function QRScannerPage() {
  const router = useRouter();
  const scannerRef = useRef<any>(null);
  const [scanning, setScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manualUrl, setManualUrl] = useState('');
  const [showManual, setShowManual] = useState(false);
  const isNavigatingRef = useRef(false);
  const lastScannedRef = useRef<string | null>(null);

  const handleQRCodeDetected = useCallback((decodedText: string) => {
    if (isNavigatingRef.current) return;

    const reservationId = parseQRCodeUrl(decodedText);

    if (reservationId) {
      isNavigatingRef.current = true;
      lastScannedRef.current = decodedText;
      toast.success('QR code scanned!');

      if (scannerRef.current) {
        try { scannerRef.current.pause(true); } catch { /* noop */ }
      }

      router.push(`/staff/check-in/${reservationId}`);
      return;
    }

    // Fallback: treat as raw reservation ID if it looks valid
    if (decodedText && decodedText.length > 5 && !decodedText.includes(' ')) {
      isNavigatingRef.current = true;
      lastScannedRef.current = decodedText;
      toast.success('QR code scanned!');

      if (scannerRef.current) {
        try { scannerRef.current.pause(true); } catch { /* noop */ }
      }

      router.push(`/staff/check-in/${decodedText}`);
      return;
    }

    if (decodedText !== lastScannedRef.current) {
      lastScannedRef.current = decodedText;
      toast.error('Invalid QR code');
    }
  }, [router]);

  const startScanner = useCallback(async () => {
    try {
      setError(null);
      setHasPermission(null);

      const { Html5Qrcode } = await import('html5-qrcode');

      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
          scannerRef.current.clear();
        } catch { /* noop */ }
      }

      const scanner = new Html5Qrcode('qr-reader', { verbose: false });
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          disableFlip: false,
        },
        (decodedText: string) => handleQRCodeDetected(decodedText),
        () => { /* scan miss — ignore */ }
      );

      setHasPermission(true);
      setScanning(true);
    } catch (err: any) {
      console.error('Scanner error:', err);

      if (err?.message?.includes('NotAllowedError') || err?.name === 'NotAllowedError') {
        setError('Camera permission denied. Allow camera access in your browser settings, then reload.');
      } else if (err?.message?.includes('NotFoundError') || err?.name === 'NotFoundError') {
        setError('No camera found. Use manual entry below.');
      } else if (err?.message?.includes('NotReadableError') || err?.name === 'NotReadableError') {
        setError('Camera in use by another app. Close it and try again.');
      } else {
        setError(`Camera error: ${err?.message || 'Unknown'}. Use manual entry below.`);
      }

      setHasPermission(false);
      setScanning(false);
    }
  }, [handleQRCodeDetected]);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch { /* noop */ }
      scannerRef.current = null;
    }
    setScanning(false);
  }, []);

  useEffect(() => {
    startScanner();
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshScanner = async () => {
    isNavigatingRef.current = false;
    lastScannedRef.current = null;
    await stopScanner();
    setTimeout(() => startScanner(), 500);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = manualUrl.trim();
    if (!val) { toast.error('Enter a reservation ID'); return; }

    const reservationId = parseQRCodeUrl(val);
    router.push(`/staff/check-in/${reservationId || val}`);
  };

  return (
    <div
      className="fixed inset-0 bg-black text-white flex flex-col"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <h1 className="text-lg font-bold text-cyan-400">Staff Check-In</h1>
        <div className="flex items-center gap-2">
          {scanning && (
            <button
              onClick={refreshScanner}
              className="p-2 rounded-lg bg-zinc-800 active:bg-zinc-700 transition-colors"
              aria-label="Refresh camera"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          )}
          <button
            onClick={() => setShowManual(!showManual)}
            className="p-2 rounded-lg bg-zinc-800 active:bg-zinc-700 transition-colors"
            aria-label="Manual entry"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Scanner area — fills remaining space */}
      <div className="flex-1 relative overflow-hidden">
        {/* Loading state */}
        {hasPermission === null && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
            <div className="w-10 h-10 border-t-2 border-cyan-500 rounded-full animate-spin mb-3"></div>
            <p className="text-gray-400 text-sm">Starting camera...</p>
          </div>
        )}

        {/* Error state */}
        {hasPermission === false && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-8 text-center">
            <svg className="w-16 h-16 text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <p className="text-red-400 text-sm mb-4">{error}</p>
            <button
              onClick={refreshScanner}
              className="px-5 py-2.5 bg-cyan-600 rounded-lg text-sm font-semibold active:bg-cyan-700 transition-colors"
            >
              Try Again
            </button>
            <div className="mt-6 text-xs text-gray-500 space-y-1">
              <p><span className="text-gray-400">iPhone:</span> Settings &gt; Safari &gt; Camera &gt; Allow</p>
              <p><span className="text-gray-400">Android:</span> Tap lock icon &gt; Permissions &gt; Camera</p>
            </div>
          </div>
        )}

        {/* Camera feed rendered by html5-qrcode */}
        <div
          id="qr-reader"
          className={`w-full h-full ${hasPermission === true ? '' : 'opacity-0 pointer-events-none'}`}
        />

        {/* Scanning overlay — corner brackets */}
        {scanning && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-64 h-64 relative">
              {/* Corners */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] border-cyan-400 rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] border-cyan-400 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] border-cyan-400 rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-cyan-400 rounded-br-lg" />
              {/* Scan line animation */}
              <div className="absolute left-2 right-2 h-0.5 bg-cyan-400/60 animate-scan-line" />
            </div>
          </div>
        )}

        {/* Status pill */}
        {scanning && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-green-400 text-xs font-medium">Scanning</span>
          </div>
        )}
      </div>

      {/* Bottom hint */}
      <div className="shrink-0 text-center py-3 px-4">
        <p className="text-gray-500 text-xs">Point camera at guest&apos;s QR code</p>
      </div>

      {/* Manual entry slide-up panel */}
      {showManual && (
        <div className="absolute inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowManual(false)}
          />
          {/* Panel */}
          <div
            className="relative bg-zinc-900 rounded-t-2xl border-t border-zinc-700/50 px-5 pt-4 pb-6"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.5rem)' }}
          >
            {/* Drag handle */}
            <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto mb-4" />

            <h2 className="text-lg font-bold text-white mb-3">Manual Entry</h2>

            <form onSubmit={handleManualSubmit} className="space-y-3">
              <input
                type="text"
                value={manualUrl}
                onChange={(e) => setManualUrl(e.target.value)}
                placeholder="Reservation ID or URL"
                autoFocus
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none text-base"
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowManual(false)}
                  className="flex-1 px-4 py-3 border border-zinc-700 text-gray-300 rounded-xl font-medium active:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-cyan-600 text-white rounded-xl font-bold active:bg-cyan-700 transition-colors"
                >
                  Check In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
