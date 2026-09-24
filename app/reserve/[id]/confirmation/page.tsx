"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { FiCheckCircle, FiClock, FiAlertTriangle, FiDownload } from 'react-icons/fi';
import { BiQrScan } from 'react-icons/bi';
import { generateReservationQRCode } from '@/lib/utils/qrcode';
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";

export default function ConfirmationPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  const [reservationStatus, setReservationStatus] = useState<'loading' | 'confirmed' | 'pending' | 'error'>('loading');
  const [reservationData, setReservationData] = useState<any>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [generatingQR, setGeneratingQR] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  
  // Accept both ?paymentId= (our own redirect) and ?payment_intent= (Stripe redirect)
  const paymentId = searchParams.get('paymentId') || searchParams.get('payment_intent');
  const checkoutSessionId = searchParams.get('checkout_session_id');
  const statusParam = searchParams.get('status');

  useEffect(() => {
    let cancelled = false;
    let pollCount = 0;
    const MAX_POLLS = 15; // 30 seconds max at 2s intervals

    const checkReservationStatus = async () => {
      if (cancelled) return;

      if (!paymentId && !checkoutSessionId) {
        setReservationStatus('error');
        return;
      }

      if (checkoutSessionId) {
        try {
          const response = await fetch('/api/voice-agent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'checkout-status', sessionId: checkoutSessionId }),
          });
          if (!response.ok) throw new Error('Could not check checkout status.');
          const result = await response.json();
          if (cancelled) return;
          if (result.paid && result.processed && result.reservation) {
            setReservationData(result.reservation);
            setReservationStatus('confirmed');
            generateQRCodeForReservation(result.reservation);
          } else if (result.paid && pollCount < MAX_POLLS) {
            pollCount++;
            setTimeout(checkReservationStatus, 2000);
          } else if (result.paid) {
            setReservationStatus('pending');
          } else {
            setReservationStatus('pending');
          }
        } catch (error) {
          if (!cancelled) setReservationStatus('error');
        }
        return;
      }

      if (!paymentId) {
        setReservationStatus('error');
        return;
      }

      // If status is test mode, fetch reservation directly
      if (statusParam === 'test') {
        try {
          const response = await fetch(`/api/reservations/${paymentId.replace('test_', '')}`);
          if (!cancelled && response.ok) {
            const reservation = await response.json();
            setReservationData(reservation);
            setReservationStatus('confirmed');
            generateQRCodeForReservation(reservation);
            sendConfirmationEmail(reservation);
          } else if (!cancelled) {
            setReservationStatus('error');
          }
        } catch (error) {
          console.error('Error fetching test reservation:', error);
          if (!cancelled) setReservationStatus('error');
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
        if (cancelled) return;

        if (response.ok) {
          const paymentData = await response.json();

          if (paymentData.reservationCreated && paymentData.reservationId) {
            try {
              const reservationResponse = await fetch(`/api/reservations/${paymentData.reservationId}`);
              if (!cancelled && reservationResponse.ok) {
                const reservation = await reservationResponse.json();
                setReservationData(reservation);
                setReservationStatus('confirmed');
                generateQRCodeForReservation(reservation);
                sendConfirmationEmail(reservation);
              } else if (!cancelled) {
                setReservationStatus('confirmed');
              }
            } catch (error) {
              console.error('Error fetching reservation details:', error);
              if (!cancelled) setReservationStatus('confirmed');
            }
          } else if (paymentData.status === 'succeeded' && pollCount < MAX_POLLS) {
            // Payment succeeded but reservation not yet written — keep polling with cap
            pollCount++;
            setTimeout(checkReservationStatus, 2000);
          } else if (paymentData.status === 'succeeded') {
            // Webhook took too long — show pending rather than error
            setReservationStatus('pending');
          } else {
            setReservationStatus('error');
          }
        } else {
          setReservationStatus('error');
        }
      } catch (error) {
        console.error('Error checking reservation status:', error);
        if (!cancelled) setReservationStatus('error');
      }
    };

    checkReservationStatus();
    return () => { cancelled = true; };
  }, [paymentId, checkoutSessionId, statusParam]);

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
    if (!user) return;
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
          icon: <FiClock className="w-16 h-16 text-fg animate-pulse" />,
          title: 'Processing Your Reservation',
          message: 'Please wait while we confirm your table booking...',
          bgColor: 'bg-fg/5',
          borderColor: 'border-fg/20'
        };
      
      case 'confirmed':
        return {
          icon: <FiCheckCircle className="w-16 h-16 text-success-500" />,
          title: 'Reservation Confirmed!',
          message: 'Your table has been successfully reserved.',
          bgColor: 'bg-success-900/20',
          borderColor: 'border-success-900/30'
        };
      
      case 'pending':
        return {
          icon: <FiAlertTriangle className="w-16 h-16 text-warning-500" />,
          title: 'Reservation Processing',
          message: 'Your payment was successful! Your reservation is being processed and you will receive a confirmation shortly.',
          bgColor: 'bg-warning-900/20',
          borderColor: 'border-warning-900/30'
        };
      
      case 'error':
      default:
        return {
          icon: <FiAlertTriangle className="w-16 h-16 text-danger-500" />,
          title: 'Processing Issue',
          message: 'There was an issue processing your reservation. Please contact support if your payment was charged.',
          bgColor: 'bg-danger-900/20',
          borderColor: 'border-danger-900/30'
        };
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <div className="min-h-screen pt-24 sm:pt-28 pb-12 flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl mx-auto px-4">
        <div className={`${statusDisplay.bgColor} ${statusDisplay.borderColor} border rounded-lg p-5 sm:p-8 text-center`}>
          <div className="mb-6 flex justify-center">
            {statusDisplay.icon}
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-fg mb-4">
            {statusDisplay.title}
          </h1>

          <p className="text-base sm:text-lg text-fg-dim mb-4">
            {statusDisplay.message}
          </p>

          {emailSent && reservationStatus === 'confirmed' && (
            <p className="text-sm text-success-400 mb-6">
              A confirmation email with your QR code has been sent to your email.
            </p>
          )}

          {reservationData && (
            <dl className="mb-8 grid grid-cols-2 gap-4 rounded-lg bg-surface-raised p-4 text-left text-sm sm:grid-cols-4 sm:p-6">
              <div>
                <dt className="text-fg-muted">Table</dt>
                <dd className="tabular mt-0.5 font-medium text-fg">#{reservationData.tableNumber}</dd>
              </div>
              <div>
                <dt className="text-fg-muted">Guests</dt>
                <dd className="tabular mt-0.5 font-medium text-fg">{reservationData.guestCount}</dd>
              </div>
              <div>
                <dt className="text-fg-muted">Paid</dt>
                <dd className="tabular mt-0.5 font-medium text-fg">
                  ${reservationData.totalAmount?.toFixed(2)}
                </dd>
              </div>
              <div>
                <dt className="text-fg-muted">Status</dt>
                <dd className="mt-0.5 font-medium capitalize text-success-bright">
                  {reservationData.status}
                </dd>
              </div>
            </dl>
          )}

          {/* QR Code Section */}
          {reservationStatus === 'confirmed' && (
            <div className="mb-8 bg-surface-raised rounded-lg p-4 sm:p-6">
              <div className="flex items-center justify-center gap-2 mb-4">
                <BiQrScan className="w-5 h-5 text-fg" />
                <h3 className="text-lg font-semibold text-fg">Check-in QR Code</h3>
              </div>
              
              {generatingQR ? (
                <div className="flex flex-col items-center py-8">
                  <Spinner size="md" className="text-fg mb-3" />
                  <p className="text-fg-muted text-sm">Generating your QR code...</p>
                </div>
              ) : qrCodeUrl ? (
                <div className="text-center">
                  <div className="inline-block p-4 bg-fg rounded-lg mb-4">
                    {/* QR code is generated client-side as a data: URL, which
                        next/image cannot optimise. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qrCodeUrl} 
                      alt="Reservation QR Code" 
                      className="w-40 h-40 mx-auto"
                    />
                  </div>
                  <p className="text-fg-dim text-sm mb-4">
                    Show this QR code to staff when you arrive for quick check-in
                  </p>
                  <Button
                    onClick={downloadQRCode}
                    variant="primary" size="md" className="items-center gap-2 px-4 py-2 bg-fg hover:bg-fg/90 text-sm"
                  >
                    <FiDownload className="w-4 h-4" />
                    Download QR Code
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-fg-muted text-sm mb-3">Unable to generate QR code</p>
                  <Button
                    onClick={() => reservationData && generateQRCodeForReservation(reservationData)}
                    variant="subtle" size="md" className="items-center gap-2 px-4 py-2 bg-surface-lifted hover:bg-surface-hover text-sm"
                  >
                    <BiQrScan className="w-4 h-4" />
                    Try Again
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Three full-width buttons of near-equal weight, one of them a bare
              `<a>` wearing button styling. One primary action, the rest as
              secondary — and the link is a real Button so it inherits the same
              focus ring as everything else. */}
          <div className="space-y-3">
            <Button asChild variant="primary" size="lg" full>
              <Link href="/dashboard/reservations">View my reservations</Link>
            </Button>

            <div className="flex flex-col gap-3 sm:flex-row">
              {reservationData?.id && (
                <Button asChild variant="outline" size="md" full>
                  <Link href={`/reservation/${reservationData.id}/change-table`}>Change table</Link>
                </Button>
              )}
              <Button asChild variant="ghost" size="md" full>
                <Link href="/events">Browse more events</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
