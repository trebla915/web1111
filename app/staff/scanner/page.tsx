"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { FiCamera, FiRefreshCw, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { parseQRCodeUrl, isValidReservationQRCode } from '@/lib/utils/qrcode';

export default function QRScannerPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scanning, setScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manualUrl, setManualUrl] = useState('');

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera if available
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setHasPermission(true);
        setScanning(true);
        startScanning();
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Unable to access camera. Please ensure camera permissions are granted.');
      setHasPermission(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setScanning(false);
  };

  const startScanning = () => {
    if (!scanning) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    if (!canvas || !video) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const scanFrame = () => {
      if (!scanning || !video.videoWidth) {
        if (scanning) {
          requestAnimationFrame(scanFrame);
        }
        return;
      }

      try {
        // Draw video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Get image data
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        
        // Here you would typically use a QR code scanning library like jsQR
        // For now, we'll rely on manual input
        
      } catch (err) {
        console.error('Error during scanning:', err);
      }

      if (scanning) {
        requestAnimationFrame(scanFrame);
      }
    };

    requestAnimationFrame(scanFrame);
  };

  const handleQRCodeDetected = (url: string) => {
    if (!isValidReservationQRCode(url)) {
      toast.error('Invalid QR code. Please scan a valid reservation QR code.');
      return;
    }

    const reservationId = parseQRCodeUrl(url);
    if (reservationId) {
      stopCamera();
      router.push(`/staff/check-in/${reservationId}`);
    } else {
      toast.error('Could not parse reservation ID from QR code');
    }
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

  const refreshCamera = () => {
    stopCamera();
    setTimeout(() => {
      startCamera();
    }, 1000);
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
            <h2 className="text-xl font-bold text-cyan-400 mb-4 flex items-center gap-2">
              <FiCamera className="w-5 h-5" />
              Camera Scanner
            </h2>

            {hasPermission === null && (
              <div className="text-center py-8">
                <div className="w-12 h-12 border-t-2 border-b-2 border-cyan-500 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400">Requesting camera access...</p>
              </div>
            )}

            {hasPermission === false && (
              <div className="text-center py-8">
                <FiAlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <p className="text-red-400 mb-4">{error}</p>
                <button
                  onClick={startCamera}
                  className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}

            {hasPermission && (
              <div className="relative">
                <video
                  ref={videoRef}
                  className="w-full rounded-lg bg-black"
                  autoPlay
                  playsInline
                  muted
                />
                <canvas
                  ref={canvasRef}
                  className="hidden"
                />
                
                {/* Scanning Overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-48 border-2 border-cyan-400 rounded-lg relative">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-cyan-400"></div>
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-cyan-400"></div>
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-cyan-400"></div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-cyan-400"></div>
                  </div>
                </div>

                {/* Status Indicator */}
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/50 px-3 py-2 rounded-lg">
                  {scanning ? (
                    <>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-green-400 text-sm">Scanning...</span>
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-red-400 text-sm">Camera Off</span>
                    </>
                  )}
                </div>

                {/* Refresh Button */}
                <button
                  onClick={refreshCamera}
                  className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-lg hover:bg-black/70 transition-colors"
                  title="Refresh Camera"
                >
                  <FiRefreshCw className="w-4 h-4" />
                </button>
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
                  <span>Position QR code within the camera frame</span>
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