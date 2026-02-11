"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { FiCamera, FiRefreshCw, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { parseQRCodeUrl, isValidReservationQRCode } from '@/lib/utils/qrcode';

export default function QRScannerPage() {
  const router = useRouter();
  const scannerRef = useRef<any>(null);
  const [scanning, setScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manualUrl, setManualUrl] = useState('');
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const isNavigatingRef = useRef(false);

  const handleQRCodeDetected = useCallback((decodedText: string) => {
    // Prevent duplicate processing
    if (isNavigatingRef.current) return;

    // Check if it's a valid check-in URL
    const reservationId = parseQRCodeUrl(decodedText);

    if (reservationId) {
      isNavigatingRef.current = true;
      setLastScannedCode(decodedText);
      toast.success('QR code scanned successfully!');

      // Stop scanner before navigating
      if (scannerRef.current) {
        try {
          scannerRef.current.pause(true);
        } catch {
          // Scanner may already be stopped
        }
      }

      router.push(`/staff/check-in/${reservationId}`);
      return;
    }

    // If the scanned text is not a URL but looks like a reservation ID (alphanumeric string)
    if (decodedText && decodedText.length > 5 && !decodedText.includes(' ')) {
      isNavigatingRef.current = true;
      setLastScannedCode(decodedText);
      toast.success('QR code scanned successfully!');

      if (scannerRef.current) {
        try {
          scannerRef.current.pause(true);
        } catch {
          // Scanner may already be stopped
        }
      }

      router.push(`/staff/check-in/${decodedText}`);
      return;
    }

    // Invalid QR code
    if (decodedText !== lastScannedCode) {
      setLastScannedCode(decodedText);
      toast.error('Invalid QR code. Please scan a valid reservation QR code.');
    }
  }, [router, lastScannedCode]);

  const startScanner = useCallback(async () => {
    try {
      setError(null);
      setHasPermission(null);

      // Dynamic import — html5-qrcode uses browser APIs
      const { Html5Qrcode } = await import('html5-qrcode');

      // Clean up existing scanner instance
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
          scannerRef.current.clear();
        } catch {
          // Ignore cleanup errors
        }
      }

      const scanner = new Html5Qrcode('qr-reader', {
        verbose: false,
      });
      scannerRef.current = scanner;

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        disableFlip: false,
      };

      await scanner.start(
        { facingMode: 'environment' },
        config,
        (decodedText: string) => {
          handleQRCodeDetected(decodedText);
        },
        () => {
          // Scan error — ignore, this fires on every frame without a QR code
        }
      );

      setHasPermission(true);
      setScanning(true);
    } catch (err: any) {
      console.error('Error starting QR scanner:', err);

      if (err?.message?.includes('NotAllowedError') || err?.name === 'NotAllowedError') {
        setError(
          'Camera permission denied. Please allow camera access in your browser settings and reload the page.'
        );
      } else if (err?.message?.includes('NotFoundError') || err?.name === 'NotFoundError') {
        setError(
          'No camera found on this device. Please use the manual entry option below.'
        );
      } else if (err?.message?.includes('NotReadableError') || err?.name === 'NotReadableError') {
        setError(
          'Camera is already in use by another app. Please close other apps using the camera and try again.'
        );
      } else {
        setError(
          `Unable to start camera: ${err?.message || 'Unknown error'}. You can use manual entry below.`
        );
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
      } catch {
        // Ignore stop errors
      }
      scannerRef.current = null;
    }
    setScanning(false);
  }, []);

  useEffect(() => {
    startScanner();

    return () => {
      // Cleanup on unmount
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshScanner = async () => {
    isNavigatingRef.current = false;
    setLastScannedCode(null);
    await stopScanner();
    // Small delay to allow DOM to reset
    setTimeout(() => {
      startScanner();
    }, 500);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualUrl.trim()) {
      toast.error('Please enter a URL or reservation ID');
      return;
    }

    // Try parsing as URL first
    const reservationId = parseQRCodeUrl(manualUrl.trim());
    if (reservationId) {
      router.push(`/staff/check-in/${reservationId}`);
      return;
    }

    // If not a URL, treat as direct reservation ID
    if (manualUrl.trim().length > 0) {
      router.push(`/staff/check-in/${manualUrl.trim()}`);
    } else {
      toast.error('Invalid URL or reservation ID');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-cyan-400 mb-2">
            QR Code Scanner
          </h1>
          <p className="text-gray-400">Scan customer reservation QR codes for check-in</p>
        </div>

        {/* Scanner Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Camera View */}
          <div className="bg-zinc-900 rounded-lg border border-cyan-900/30 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-cyan-400 flex items-center gap-2">
                <FiCamera className="w-5 h-5" />
                Camera Scanner
              </h2>
              {scanning && (
                <button
                  onClick={refreshScanner}
                  className="p-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors"
                  title="Refresh Camera"
                >
                  <FiRefreshCw className="w-4 h-4" />
                </button>
              )}
            </div>

            {hasPermission === null && (
              <div className="text-center py-8">
                <div className="w-12 h-12 border-t-2 border-b-2 border-cyan-500 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400">Starting camera...</p>
              </div>
            )}

            {hasPermission === false && (
              <div className="text-center py-8">
                <FiAlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <p className="text-red-400 mb-4 text-sm">{error}</p>
                <button
                  onClick={refreshScanner}
                  className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* html5-qrcode renders the camera feed into this div */}
            <div
              id="qr-reader"
              className={`w-full rounded-lg overflow-hidden ${hasPermission === true ? '' : 'hidden'}`}
              style={{ minHeight: scanning ? '300px' : '0' }}
            />

            {scanning && (
              <div className="mt-3 flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-400 text-sm">Scanning — point camera at QR code</span>
              </div>
            )}

            <div className="mt-4">
              <p className="text-sm text-gray-400 text-center">
                Position the QR code within the scanning area
              </p>
            </div>
          </div>

          {/* Manual Entry */}
          <div className="bg-zinc-900 rounded-lg border border-cyan-900/30 p-6">
            <h2 className="text-xl font-bold text-cyan-400 mb-4">
              Manual Entry
            </h2>

            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label htmlFor="manualUrl" className="block text-gray-400 text-sm mb-2">
                  Enter QR Code URL or Reservation ID
                </label>
                <input
                  type="text"
                  id="manualUrl"
                  value={manualUrl}
                  onChange={(e) => setManualUrl(e.target.value)}
                  placeholder="https://... or reservation ID"
                  className="w-full px-4 py-3 bg-zinc-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-lg transition-colors"
              >
                Check In
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-700">
              <h3 className="text-lg font-semibold text-gray-300 mb-3">How to Use</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-start gap-2">
                  <FiCheckCircle className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                  <span>Ask customer to show their reservation QR code</span>
                </li>
                <li className="flex items-start gap-2">
                  <FiCheckCircle className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                  <span>Point your camera at the QR code</span>
                </li>
                <li className="flex items-start gap-2">
                  <FiCheckCircle className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                  <span>Or manually enter the reservation ID</span>
                </li>
                <li className="flex items-start gap-2">
                  <FiCheckCircle className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                  <span>Review details and complete check-in</span>
                </li>
              </ul>
            </div>

            {/* Troubleshooting */}
            <div className="mt-6 pt-6 border-t border-gray-700">
              <h3 className="text-lg font-semibold text-gray-300 mb-3">Camera Not Working?</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 shrink-0">iPhone:</span>
                  <span>Settings &gt; Safari &gt; Camera &gt; Allow</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 shrink-0">Android:</span>
                  <span>Tap lock icon in address bar &gt; Permissions &gt; Camera &gt; Allow</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/staff')}
            className="px-6 py-3 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600 transition-colors"
          >
            Back to Staff Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
