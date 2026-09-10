"use client";

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { useAgeConfirmationGuard } from '@/lib/compliance/useAgeConfirmationGuard';
import { useReservation } from '@/components/providers/ReservationProvider';
import { PaymentService } from '@/lib/services/payment';
import { BottleService } from '@/lib/services/bottles';
import { toast } from 'react-hot-toast';
import { FiPlus, FiMinus, FiShoppingCart, FiX, FiCheck, FiAlertCircle, FiAlertTriangle } from 'react-icons/fi';
import { Bottle } from '@/types/reservation';
import { Button } from "@/components/ui/button";
import { RouteLoading } from "@/components/ui/page-state";
import { Spinner } from "@/components/ui/spinner";
import { ReservationStepHeader } from "@/components/reservation/ReservationSteps";

/** Same Intl formatting the payment step uses, so a figure never changes shape
 *  between the two screens ("$1030.00" here, "$1,030.00" there). */
const money = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);

export default function ReservationDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { reservationDetails, updateReservationDetails, addBottle, removeBottle } = useReservation();
  
  const [loading, setLoading] = useState(true);
  const [guestCount, setGuestCount] = useState(1);
  const [showBottleSelection, setShowBottleSelection] = useState(false);
  const [availableBottles, setAvailableBottles] = useState<Bottle[]>([]);
  const [error, setError] = useState<string | null>(null);

  /**
   * Bottle loading is its own state.
   *
   * It used to share the page-wide `loading`, so opening the bottle menu blanked
   * the entire reservation — party size, cost breakdown and all — and replaced
   * it with the route-level spinner.
   */
  const [bottlesLoading, setBottlesLoading] = useState(false);
  const [bottlesError, setBottlesError] = useState<string | null>(null);
  /** Bumped to force a retry of the same event. */
  const [bottlesReloadKey, setBottlesReloadKey] = useState(0);

  const eventId = params.id as string;

  // Single 21+ gate: anyone who reaches this URL without having confirmed
  // through the Reserve popup is sent back to the event page to do so.
  const ageGate = useAgeConfirmationGuard(eventId, user?.uid, !authLoading);

  useEffect(() => {
    if (authLoading) {
      return; // Wait for auth state to be determined
    }

    if (!user) {
      toast.error('You need an account to reserve a table');
      router.push('/auth/login');
      return;
    }

    if (!reservationDetails) {
      router.push(`/reserve/${eventId}`);
      return;
    }

    setGuestCount(reservationDetails.guestCount);
    setLoading(false);
  }, [eventId, reservationDetails, router, user, authLoading]);

  /**
   * Bottles are fetched only once the menu is actually opened, by a signed-in
   * customer who has cleared the age gate.
   *
   * The previous version keyed off `showBottleSelection` but ran its guard
   * against a confirmation flag the Reserve popup never wrote, so it never
   * fetched at all; and because the inline gate lived in a child, confirming
   * there could not re-run this effect. Hence a menu that opened empty and only
   * sometimes filled in on a second try.
   */
  useEffect(() => {
    if (!showBottleSelection) return;
    if (!eventId || !user || ageGate !== 'allowed') return;

    // Guards against a stale response landing in a different event's menu, or
    // in a menu the customer has already closed.
    const controller = new AbortController();
    let active = true;

    const fetchBottles = async () => {
      setBottlesLoading(true);
      setBottlesError(null);
      try {
        const bottles = await BottleService.getByEvent(eventId, controller.signal);
        if (!active) return;
        setAvailableBottles(bottles);
      } catch (err) {
        if (!active || (err as Error)?.name === 'AbortError') return;
        console.error('Failed to fetch bottles:', err);
        setBottlesError("We couldn't load the bottle menu.");
      } finally {
        if (active) setBottlesLoading(false);
      }
    };

    fetchBottles();

    return () => {
      active = false;
      controller.abort();
    };
  }, [eventId, user, showBottleSelection, ageGate, bottlesReloadKey]);
  
  const handleUpdateGuestCount = (increment: boolean, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!reservationDetails) return;
    
    let newCount = increment ? guestCount + 1 : guestCount - 1;
    newCount = Math.max(1, Math.min(newCount, reservationDetails.capacity));
    
    setGuestCount(newCount);
    updateReservationDetails({ guestCount: newCount });
  };
  
  // Calculate bottle requirements and status
  const bottleRequirements = useMemo(() => {
    if (!reservationDetails) {
      return { required: 0, current: 0, isMet: false };
    }
    
    const required = reservationDetails.minimumBottles || 0;
    const current = reservationDetails.bottles?.length || 0;
    
    return {
      required,
      current,
      isMet: current >= required
    };
  }, [reservationDetails]);

  // Format cost breakdown with proper grat and fees
  const costBreakdown = useMemo(() => {
    if (!reservationDetails) return {
      tablePrice: 0,
      bottlesCost: 0,
      mixersCost: 0,
      gratAmount: 0,
      salesTax: 0,
      stripeFee: 0,
      subtotal: 0,
      total: 0
    };

    const tablePrice = reservationDetails.tablePrice || 0;
    const bottles = reservationDetails.bottles || [];
    const mixers = reservationDetails.mixers || [];
    
    // Calculate costs
    const bottlesCost = bottles.reduce((total, bottle) => total + (bottle.price || 0), 0);
    const mixersCost = mixers.reduce((total, mixer) => total + (mixer.price || 0), 0);
    
    // Calculate taxable subtotal (everything except gratuity and processing fee)
    const taxableSubtotal = tablePrice + bottlesCost + mixersCost;
    
    // Calculate sales tax (8.25%)
    const salesTax = taxableSubtotal * 0.0825;
    
    // Calculate gratuity (18% on bottles only)
    const gratAmount = bottlesCost * 0.18;
    
    // Calculate subtotal including tax and gratuity
    const subtotal = taxableSubtotal + salesTax + gratAmount;
    
    // Calculate Stripe fee (2.9% + $0.30)
    const stripeFee = (subtotal * 0.029) + 0.30;
    
    // Calculate final total
    const total = subtotal + stripeFee;

    return {
      tablePrice,
      bottlesCost,
      mixersCost,
      salesTax,
      gratAmount,
      stripeFee,
      subtotal,
      total
    };
  }, [reservationDetails]);

  const handleBottleSelect = (bottle: Bottle) => {
    if (!reservationDetails) return;
    
    addBottle(bottle);
    setShowBottleSelection(false);

    const newBottleCount = (reservationDetails.bottles?.length || 0) + 1;
    const remaining = Math.max(0, bottleRequirements.required - newBottleCount);

    if (remaining > 0) {
      toast.error(
        `Added ${bottle.name}. ${remaining} more bottle${remaining > 1 ? 's' : ''} required.`
      );
    } else {
      toast.success(`Added ${bottle.name}. Minimum bottle requirement met!`);
    }
  };
  
  const handleRemoveBottle = (bottleId: string) => {
    if (!reservationDetails) return;
    
    removeBottle(bottleId);
    
    const newBottleCount = (reservationDetails.bottles?.length || 0) - 1;
    const remaining = Math.max(0, bottleRequirements.required - newBottleCount);

    if (remaining > 0) {
      toast.error(
        `Bottle removed. ${remaining} more bottle${remaining > 1 ? 's' : ''} required to meet minimum.`
      );
    } else {
      toast.success('Bottle removed. Minimum requirement still met.');
    }
  };
  
  const handleContinueToContact = () => {
    if (!reservationDetails) {
      toast.error('Reservation details not found');
      return;
    }

    if (!bottleRequirements.isMet) {
      toast.error(
        `Table ${reservationDetails.tableNumber} requires a minimum of ${bottleRequirements.required} bottle${bottleRequirements.required > 1 ? 's' : ''}. Please add ${bottleRequirements.required - bottleRequirements.current} more.`
      );
      return;
    }
    
    router.push(`/reserve/${eventId}/contact`);
  };

  // Format date to a more readable format
  const formatDate = (dateStr: string): string => {
    try {
      if (!dateStr) return 'Date TBA';
      
      // Parse the ISO string directly
      const [datePart] = dateStr.split('T');
      const [year, month, day] = datePart.split('-').map(Number);
      
      // Create date object using the parsed components
      const date = new Date(year, month - 1, day);
      if (isNaN(date.getTime())) return 'Invalid date';
      
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  };
  
  /**
   * The bottle minimum is a gate on the Continue button, so it is stated as a
   * status with an icon rather than as a tinted sentence — colour alone was
   * carrying the difference between "you're clear" and "you're blocked".
   */
  const renderBottleRequirements = () => (
    <p
      className={`mt-1 flex items-center gap-1.5 text-sm ${
        bottleRequirements.isMet ? 'text-success-bright' : 'text-warning-bright'
      }`}
    >
      {bottleRequirements.isMet ? (
        <FiCheck aria-hidden="true" size={14} className="shrink-0" />
      ) : (
        <FiAlertCircle aria-hidden="true" size={14} className="shrink-0" />
      )}
      {bottleRequirements.isMet
        ? 'Bottle minimum met'
        : `Table ${reservationDetails?.tableNumber} needs at least ${bottleRequirements.required} bottle${
            bottleRequirements.required > 1 ? 's' : ''
          }`}
    </p>
  );

  if (authLoading) return <RouteLoading message="Checking your account…" />;

  if (loading || !reservationDetails) return <RouteLoading message="Loading your reservation…" />;
  
  return (
    <div className="flex min-h-dvh flex-col pt-24 pb-16 sm:pt-28">
      <div className="mx-auto w-full max-w-2xl px-4">
        <ReservationStepHeader
          step="details"
          eventName={reservationDetails.eventName}
          eventDate={formatDate(reservationDetails.eventDate)}
          title={`Table ${reservationDetails.tableNumber}`}
          description="Set your party size and add bottles. You'll see the full total before paying."
        />

        {/* Main Content */}
        <div className="overflow-hidden rounded-lg border border-line-accent/30 bg-surface">
          {/* Guest Count */}
          <div className="border-b border-line-subtle p-4 sm:p-6">
            <h2 className="font-heading text-lg tracking-wide text-fg">Party size</h2>
            <p className="mt-1 text-sm text-fg-muted">
              Table {reservationDetails.tableNumber} seats up to{' '}
              <span className="tabular">{reservationDetails.capacity}</span>.
            </p>
            <div className="mt-4 flex items-center gap-4">
              <Button
                onClick={(e) => handleUpdateGuestCount(false, e)}
                disabled={guestCount <= 1}
                variant="outline"
                size="icon"
                className="rounded-full"
                aria-label="Remove one guest"
              >
                <FiMinus aria-hidden="true" size={20} />
              </Button>
              {/* Announced as a live value: pressing +/- otherwise changes a
                  number a screen-reader user never hears. */}
              <span
                aria-live="polite"
                aria-atomic="true"
                className="tabular min-w-[3ch] text-center font-heading text-3xl tracking-wide text-fg"
              >
                {guestCount}
              </span>
              <Button
                onClick={(e) => handleUpdateGuestCount(true, e)}
                disabled={guestCount >= (reservationDetails.capacity ?? 99)}
                variant="outline"
                size="icon"
                className="rounded-full"
                aria-label="Add one guest"
              >
                <FiPlus aria-hidden="true" size={20} />
              </Button>
              <span className="text-sm text-fg-muted">
                {guestCount === 1 ? 'guest' : 'guests'}
              </span>
            </div>
          </div>

          {/* Bottles */}
          <div className="border-b border-line-subtle p-4 sm:p-6">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="font-heading text-lg tracking-wide text-fg">Bottles</h2>
                {renderBottleRequirements()}
              </div>
              <Button
                onClick={() => setShowBottleSelection(true)}
                variant="primary"
                size="md"
                className="w-full shrink-0 sm:w-auto"
              >
                <FiShoppingCart aria-hidden="true" size={18} />
                <span>Add bottles</span>
              </Button>
            </div>
            
            {/* The second, inline age prompt that used to wrap this panel is
                gone. The 21+ confirmation now happens once, in the Reserve
                popup on the event page, and `useAgeConfirmationGuard` sends
                anyone who skipped it back there. */}
            {showBottleSelection && (
              <div className="mb-4 rounded-lg bg-surface-raised p-4" data-testid="bottle-menu">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-heading text-base tracking-wide text-fg">Bottle menu</h3>
                    <p
                      className={`mt-1 text-sm ${
                        bottleRequirements.isMet ? 'text-success-bright' : 'text-warning-bright'
                      }`}
                    >
                      {bottleRequirements.isMet
                        ? 'Minimum met — add more if you like'
                        : `${bottleRequirements.required - bottleRequirements.current} more to go`}
                    </p>
                  </div>
                  <Button
                    onClick={() => setShowBottleSelection(false)}
                    variant="ghost"
                    size="icon"
                    aria-label="Close bottle menu"
                  >
                    <FiX aria-hidden="true" size={20} />
                  </Button>
                </div>

                {bottlesLoading ? (
                  <div
                    role="status"
                    aria-live="polite"
                    className="flex items-center justify-center gap-3 py-10 text-sm text-fg-muted"
                    data-testid="bottle-menu-loading"
                  >
                    <Spinner size="sm" label={null} />
                    Loading the bottle menu…
                  </div>
                ) : bottlesError ? (
                  <div
                    role="alert"
                    className="flex flex-col items-center gap-3 rounded-lg border border-danger-line/40 bg-danger-950/40 px-4 py-8 text-center"
                    data-testid="bottle-menu-error"
                  >
                    <FiAlertTriangle aria-hidden="true" size={22} className="text-danger-bright" />
                    <p className="text-sm text-danger-200">{bottlesError}</p>
                    <Button
                      variant="outline"
                      size="md"
                      onClick={() => setBottlesReloadKey((n) => n + 1)}
                    >
                      Retry
                    </Button>
                  </div>
                ) : availableBottles.length === 0 ? (
                  <p
                    className="rounded-lg border border-dashed border-line py-8 text-center text-sm text-fg-muted"
                    data-testid="bottle-menu-empty"
                  >
                    No bottles are listed for this event yet. Ask us at the door, or continue
                    without bottle service.
                  </p>
                ) : (
                  /* `unstyled` because these are left-aligned two-line tiles, not
                     the primitive's centred single-line button geometry — the
                     variant's fixed height was squashing the price onto the name. */
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {availableBottles.map((bottle) => (
                      <Button
                        unstyled
                        key={bottle.id}
                        onClick={() => handleBottleSelect(bottle)}
                        aria-label={`Add ${bottle.name}, ${money(bottle.price)}`}
                        className="flex w-full items-baseline justify-between gap-3 rounded-lg border border-line bg-surface-hover px-4 py-3 text-left hover:border-line-strong hover:bg-surface-lifted"
                      >
                        <span className="min-w-0 truncate font-medium text-fg">{bottle.name}</span>
                        <span className="tabular shrink-0 text-sm text-accent-bright">
                          {money(bottle.price)}
                        </span>
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {reservationDetails.bottles && reservationDetails.bottles.length > 0 ? (
              <ul className="space-y-2">
                {reservationDetails.bottles.map((bottle) => (
                  <li
                    key={bottle.id}
                    className="flex items-center justify-between gap-3 rounded-lg bg-surface-raised py-2 pl-4 pr-2"
                  >
                    <span className="min-w-0 truncate font-medium text-fg">{bottle.name}</span>
                    <span className="flex shrink-0 items-center gap-1">
                      <span className="tabular text-sm text-fg-dim">{money(bottle.price)}</span>
                      <Button
                        onClick={() => handleRemoveBottle(bottle.id)}
                        variant="ghost"
                        size="icon"
                        className="text-fg-muted hover:text-danger-bright"
                        aria-label={`Remove ${bottle.name}`}
                      >
                        <FiX aria-hidden="true" size={18} />
                      </Button>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-lg border border-dashed border-line py-6 text-center text-sm text-fg-muted">
                No bottles added yet.
              </p>
            )}
          </div>
          
          {/* Cost Breakdown
              Eight rows at identical weight, ending in a total distinguished
              only by `font-bold`, made the one figure the guest is agreeing to
              pay the hardest to find. Charges and fees are now separate groups,
              the fee percentages ride on their own rows instead of repeating as
              three asterisked paragraphs underneath, and the total is the
              largest thing in the panel. */}
          <div className="border-b border-line-subtle p-4 sm:p-6">
            <h2 className="mb-4 font-heading text-lg tracking-wide text-fg">What you'll pay</h2>

            <dl className="text-sm">
              <div className="space-y-2">
                <div className="flex justify-between gap-3">
                  <dt className="text-fg-dim">Table {reservationDetails.tableNumber}</dt>
                  <dd className="tabular text-fg">{money(costBreakdown.tablePrice)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-fg-dim">
                    Bottles
                    {reservationDetails.bottles?.length ? (
                      <span className="text-fg-muted"> ({reservationDetails.bottles.length})</span>
                    ) : null}
                  </dt>
                  <dd className="tabular text-fg">{money(costBreakdown.bottlesCost)}</dd>
                </div>
                {costBreakdown.mixersCost > 0 && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-fg-dim">Mixers</dt>
                    <dd className="tabular text-fg">{money(costBreakdown.mixersCost)}</dd>
                  </div>
                )}
              </div>

              {/* `costBreakdown.subtotal` is the post-tax, post-gratuity figure
                  the Stripe fee is calculated from — not the sum of the charges
                  listed above it. Printed under the word "Subtotal" directly
                  beneath those charges, it read as arithmetic that did not add
                  up ($500 + $1,030 shown, "$1,841.63" underneath). */}
              <div className="mt-3 flex justify-between gap-3 border-t border-line-subtle pt-3">
                <dt className="text-fg-dim">Subtotal</dt>
                <dd className="tabular text-fg">
                  {money(costBreakdown.tablePrice + costBreakdown.bottlesCost + costBreakdown.mixersCost)}
                </dd>
              </div>

              {/* Taxes and fees, grouped and quieter than the charges above. */}
              <div className="mt-3 space-y-2 border-t border-line-subtle pt-3">
                <div className="flex justify-between gap-3">
                  <dt className="text-fg-muted">
                    Sales tax <span className="tabular text-fg-subtle">8.25%</span>
                  </dt>
                  <dd className="tabular text-fg-dim">{money(costBreakdown.salesTax)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-fg-muted">
                    Gratuity <span className="tabular text-fg-subtle">18% on bottles</span>
                  </dt>
                  <dd className="tabular text-fg-dim">{money(costBreakdown.gratAmount)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-fg-muted">
                    Card processing <span className="tabular text-fg-subtle">2.9% + $0.30</span>
                  </dt>
                  <dd className="tabular text-fg-dim">{money(costBreakdown.stripeFee)}</dd>
                </div>
              </div>

              <div className="mt-4 flex items-baseline justify-between gap-3 border-t-2 border-line-strong pt-4">
                <dt className="font-heading text-lg tracking-wide text-fg">Total</dt>
                <dd className="tabular font-heading text-2xl tracking-wide text-fg sm:text-3xl">
                  {money(costBreakdown.total)}
                </dd>
              </div>
            </dl>

            {/* Each line is rounded to the cent on its own, so the column can
                read a penny either side of the total. The total is the figure
                that is charged; the note says so rather than leaving a guest to
                find the discrepancy by adding it up. */}
            <p className="mt-3 text-xs text-fg-subtle">
              Gratuity applies to bottles only. Sales tax applies to everything except gratuity
              and the card processing fee. Each line is rounded to the nearest cent, so the
              figures above can differ from the total by a penny — the total is what you pay.
            </p>
          </div>
          
          {/* Actions — the primitive already owns the disabled treatment, so
              the hand-rolled `bg-surface-lifted / cursor-not-allowed` pair that
              was here disagreed with every other disabled control on the site. */}
          <div className="p-4 sm:p-6">
            <Button
              variant="primary"
              size="lg"
              full
              onClick={handleContinueToContact}
              disabled={!bottleRequirements.isMet}
            >
              {bottleRequirements.isMet
                ? 'Continue to contact info'
                : `Add ${bottleRequirements.required - bottleRequirements.current} more bottle${
                    bottleRequirements.required - bottleRequirements.current > 1 ? 's' : ''
                  } to continue`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 