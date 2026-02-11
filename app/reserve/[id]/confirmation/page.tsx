"use client";

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { FiCheckCircle, FiClock, FiAlertTriangle, FiDownload } from 'react-icons/fi';
import { BiQrScan } from 'react-icons/bi';
import { generateReservationQRCode } from '@/lib/utils/qrcode';

export default function ConfirmationPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  const [reservationStatus, setReservationStatus] = useState<'loading' | 'confirmed' | 'pending' | 'error'>('loading');
  const [reservationData, setReservationData] = useState<any>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [generatingQR, setGeneratingQR] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  
  const paymentId = searchParams.get('paymentId');
  const statusParam = searchParams.get('status');

  useEffect(() => {
    const checkReservationStatus = async () => {
      if (!paymentId) {
        setReservationStatus('error');
        return;
      }

      // If status is test mode, fetch reservation directly
      if (statusParam === 'test') {
        try {
          const response = await fetch(`/api/reservations/${paymentId.replace('test_', '')}`);
          if (response.ok) {
            const reservation = await response.json();
            setReservationData(reservation);
            setReservationStatus('confirmed');
            generateQRCodeForReservation(reservation);
            sendConfirmationEmail(reservation);
          } else {
            setReservationStatus('error');
          }
        } catch (error) {
          console.error('Error fetching test reservation:', error);
          setReservationStatus('error');
        }
        return;
      }

      // If status is already marked as pending, don't poll
      if (statusParam === 'pending') {
        setReservationStatus('pending');
        return;
      }

      try {
        const response = await fetch(`/api/payments/${paymentId}/status`);
        if (response.ok) {
          const paymentData = await response.json();
          
          if (paymentData.reservationCreated && paymentData.reservationId) {
            // Fetch reservation details
            try {
              const reservationResponse = await fetch(`/api/reservations/${paymentData.reservationId}`);
              if (reservationResponse.ok) {
                const reservation = await reservationResponse.json();
                setReservationData(reservation);
                setReservationStatus('confirmed');
                
                // Generate QR code for the reservation
                generateQRCodeForReservation(reservation);
                // Send confirmation email with QR code
                sendConfirmationEmail(reservation);
              } else {
                setReservationStatus('confirmed'); // Payment succeeded, even if we can't fetch details
              }
            } catch (error) {
              console.error('Error fetching reservation details:', error);
              setReservationStatus('confirmed'); // Payment succeeded, even if we can't fetch details
            }
          } else if (paymentData.status === 'succeeded') {
            // Payment succeeded but reservation not yet created - keep polling
            setTimeout(checkReservationStatus, 2000);
          } else {
            setReservationStatus('error');
          }
        } else {
          setReservationStatus('error');
        }
      } catch (error) {
        console.error('Error checking reservation status:', error);
        setReservationStatus('error');
      }
    };

    checkReservationStatus();
  }, [paymentId, statusParam]);

  const generateQRCodeForReservation = async (reservation: any) => {
    if (!reservation?.id || qrCodeUrl) return;
    
    setGeneratingQR(true);
    try {
      const qrDataUrl = await generateReservationQRCode(
        reservation.id,
        reservation.eventId,
        reservation.tableNumber
      );
      setQrCodeUrl(qrDataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    } finally {
      setGeneratingQR(false);
    }
  };

  // Send confirmation email with QR code (fire-and-forget, idempotent on server)
  const sendConfirmationEmail = async (reservation: any) => {
    if (!reservation?.id || emailSent) return;
    try {
      const res = await fetch(`/api/reservations/${reservation.id}/send-confirmation`, {
        method: 'POST',
      });
      if (res.ok) {
        setEmailSent(true);
      }
    } catch (err) {
      // Don't block the confirmation page if email fails
      console.error('Error sending confirmation email:', err);
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeUrl || !reservationData) return;
    
    const link = document.createElement('a');
    link.download = `reservation-qr-${reservationData.id}.png`;
    link.href = qrCodeUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusDisplay = () => {
    switch (reservationStatus) {
      case 'loading':
        return {
          icon: <FiClock className="w-16 h-16 text-cyan-500 animate-pulse" />,
          title: 'Processing Your Reservation',
          message: 'Please wait while we confirm your table booking...',
          bgColor: 'bg-cyan-900/20',
          borderColor: 'border-cyan-900/30'
        };
      
      case 'confirmed':
        return {
          icon: <FiCheckCircle className="w-16 h-16 text-green-500" />,
          title: 'Reservation Confirmed!',
          message: 'Your table has been successfully reserved.',
          bgColor: 'bg-green-900/20',
          borderColor: 'border-green-900/30'
        };
      
      case 'pending':
        return {
          icon: <FiAlertTriangle className="w-16 h-16 text-yellow-500" />,
          title: 'Reservation Processing',
          message: 'Your payment was successful! Your reservation is being processed and you will receive a confirmation shortly.',
          bgColor: 'bg-yellow-900/20',
          borderColor: 'border-yellow-900/30'
        };
      
      case 'error':
      default:
        return {
          icon: <FiAlertTriangle className="w-16 h-16 text-red-500" />,
          title: 'Processing Issue',
          message: 'There was an issue processing your reservation. Please contact support if your payment was charged.',
          bgColor: 'bg-red-900/20',
          borderColor: 'border-red-900/30'
        };
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <div className="min-h-screen pt-28 pb-12 flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl mx-auto px-4">
        <div className={`${statusDisplay.bgColor} ${statusDisplay.borderColor} border rounded-lg p-8 text-center`}>
          <div className="mb-6 flex justify-center">
            {statusDisplay.icon}
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-4">
            {statusDisplay.title}
          </h1>
          
          <p className="text-lg text-zinc-300 mb-4">
            {statusDisplay.message}
          </p>

          {emailSent && reservationStatus === 'confirmed' && (
            <p className="text-sm text-green-400 mb-6">
              A confirmation email with your QR code has been sent to your email.
            </p>
          )}

          {reservationData && (
            <div className="mb-8 text-left bg-zinc-800 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Reservation Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-zinc-400 block">Table Number</span>
                  <span className="text-white font-medium">#{reservationData.tableNumber}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block">Guests</span>
                  <span className="text-white font-medium">{reservationData.guestCount}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block">Total Amount</span>
                  <span className="text-white font-medium">${reservationData.totalAmount?.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block">Status</span>
                  <span className="text-green-400 font-medium">{reservationData.status}</span>
                </div>
              </div>
            </div>
          )}

          {/* QR Code Section */}
          {reservationStatus === 'confirmed' && (
            <div className="mb-8 bg-zinc-800 rounded-lg p-6">
              <div className="flex items-center justify-center gap-2 mb-4">
                <BiQrScan className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-semibold text-white">Check-in QR Code</h3>
              </div>
              
              {generatingQR ? (
                <div className="flex flex-col items-center py-8">
                  <div className="w-8 h-8 border-t-2 border-b-2 border-cyan-500 rounded-full animate-spin mb-3"></div>
                  <p className="text-zinc-400 text-sm">Generating your QR code...</p>
                </div>
              ) : qrCodeUrl ? (
                <div className="text-center">
                  <div className="inline-block p-4 bg-white rounded-lg mb-4">
                    <img 
                      src={qrCodeUrl} 
                      alt="Reservation QR Code" 
                      className="w-40 h-40 mx-auto"
                    />
                  </div>
                  <p className="text-zinc-300 text-sm mb-4">
                    Show this QR code to staff when you arrive for quick check-in
                  </p>
                  <button
                    onClick={downloadQRCode}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors text-sm"
                  >
                    <FiDownload className="w-4 h-4" />
                    Download QR Code
                  </button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-zinc-400 text-sm mb-3">Unable to generate QR code</p>
                  <button
                    onClick={() => reservationData && generateQRCodeForReservation(reservationData)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-600 text-white rounded-lg hover:bg-zinc-700 transition-colors text-sm"
                  >
                    <BiQrScan className="w-4 h-4" />
                    Try Again
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={() => window.location.href = '/dashboard/reservations'}
              className="w-full py-3 bg-cyan-600 text-white rounded-lg font-bold transition-all hover:bg-cyan-700"
            >
              View My Reservations
            </button>
            
            <button
              onClick={() => window.location.href = '/events'}
              className="w-full py-3 bg-zinc-700 text-white rounded-lg font-bold transition-all hover:bg-zinc-600"
            >
              Browse More Events
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}