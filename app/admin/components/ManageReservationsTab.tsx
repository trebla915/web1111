"use client";

import React, { useState, useEffect } from 'react';
import {
  getGroupedByEvent,
  deleteReservation,
  cancelReservation,
  resendConfirmationEmail,
  updateReservationContact,
  getAvailableTablesForReservation,
  changeReservationTable,
  fixTableChangePriceDifference,
} from '@/lib/services/reservations';
import { getAllEvents } from '@/lib/services/events';
import { toast } from 'react-hot-toast';
import {
  FiChevronDown,
  FiChevronUp,
  FiUsers,
  FiUser,
  FiRefreshCw,
  FiCalendar,
  FiAlertTriangle,
  FiTrash2,
  FiSearch,
  FiFilter,
  FiX,
  FiDollarSign,
  FiMail,
  FiEdit2,
  FiExternalLink,
  FiCopy,
  FiPhone,
  FiMoreHorizontal,
} from 'react-icons/fi';
import { BiTable, BiWine } from 'react-icons/bi';
import { Event } from '@/types/event';
import { Reservation } from '@/types/reservation';
import { User } from '@/types/user';
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/field";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ReservationWithUser extends Reservation {
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  /** Free-text note captured at booking; rendered in the detail panel. */
  specialRequests?: string;
}

type ReservationsByEvent = {
  [eventTitle: string]: ReservationWithUser[];
};

interface CancelModalData {
  reservation: ReservationWithUser;
  isOpen: boolean;
}

interface EditContactModalData {
  reservation: ReservationWithUser;
  isOpen: boolean;
}

interface ChangeTableModalData {
  reservation: ReservationWithUser;
  isOpen: boolean;
}

export default function ManageReservationsTab() {
  const [reservationsByEvent, setReservationsByEvent] = useState<ReservationsByEvent>({});
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [cancelModal, setCancelModal] = useState<CancelModalData>({ reservation: {} as ReservationWithUser, isOpen: false });
  const [cancelForm, setCancelForm] = useState({
    reason: '',
    refundAmount: '',
    staffName: ''
  });
  const [isProcessingCancel, setIsProcessingCancel] = useState(false);

  const [editContactModal, setEditContactModal] = useState<EditContactModalData>({ reservation: {} as ReservationWithUser, isOpen: false });
  const [editContactForm, setEditContactForm] = useState({ userEmail: '', userName: '', userPhone: '' });
  const [isSavingContact, setIsSavingContact] = useState(false);

  const [changeTableModal, setChangeTableModal] = useState<ChangeTableModalData>({ reservation: {} as ReservationWithUser, isOpen: false });
  const [availableTables, setAvailableTables] = useState<Array<{ id: string; number: number; price: number; reserved: boolean }>>([]);
  const [selectedNewTableId, setSelectedNewTableId] = useState<string | null>(null);
  const [isLoadingTables, setIsLoadingTables] = useState(false);
  const [isChangingTable, setIsChangingTable] = useState(false);
  const [changeTableNeedsPayment, setChangeTableNeedsPayment] = useState<{ amountDue: number; paymentUrl: string } | null>(null);

  const [resendEmailLoadingId, setResendEmailLoadingId] = useState<string | null>(null);
  const [fixPriceLoadingId, setFixPriceLoadingId] = useState<string | null>(null);
  const [fixPriceNeedsPayment, setFixPriceNeedsPayment] = useState<{ reservationId: string; amountDue: number; paymentUrl: string } | null>(null);

  useEffect(() => {
    fetchReservationsData();
  }, []);

  const fetchReservationsData = async (): Promise<ReservationsByEvent | null> => {
    setLoading(true);
    try {
      const reservationsData = await getGroupedByEvent();
      if (!reservationsData || typeof reservationsData !== 'object' || Array.isArray(reservationsData)) {
        throw new Error('Invalid reservations data format');
      }

      const events = await getAllEvents();
      const eventTitleMap: { [key: string]: string } = {};
      events.forEach((event: Event) => {
        eventTitleMap[event.id] = event.title;
      });

      const reservationsByEventTitle: ReservationsByEvent = {};
      for (const [eventId, reservations] of Object.entries(reservationsData)) {
        if (!Array.isArray(reservations)) {
          console.warn(`Invalid reservations array for eventId: ${eventId}`);
          continue;
        }

        // Use event title from event list, or fallback to eventName from reservation, or eventId
        const eventTitle = eventTitleMap[eventId] || reservations[0]?.eventName || eventId;
        
        // Process reservations - user data is already embedded in reservation documents
        const processedReservations = reservations.map((reservation) => {
          return {
            ...reservation,
            tableNumber: reservation.tableNumber ?? 0,
            userName: reservation.userName || 'Unknown User',
            userEmail: reservation.userEmail || 'No email',
            userPhone: reservation.userPhone || 'No phone',
            userId: reservation.userId
          };
        });

        reservationsByEventTitle[eventTitle] = processedReservations;
      }

      setReservationsByEvent(reservationsByEventTitle);
      setError(null);
      return reservationsByEventTitle;
    } catch (err: any) {
      console.error('Error fetching reservations:', err.message || err);
      setError('Failed to load reservations. Please try again.');
      toast.error('Failed to load reservations');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReservation = async (reservationId: string, eventId: string) => {
    if (!confirm('Are you sure you want to delete this reservation?')) {
      return;
    }

    try {
      // Backend handles reservation delete, table release, and user sub-collection cleanup in a transaction
      await deleteReservation(eventId, reservationId);

      toast.success('Reservation deleted successfully');
      fetchReservationsData(); // Refresh the data
    } catch (error) {
      console.error('Error deleting reservation:', error);
      toast.error('Failed to delete reservation');
    }
  };

  const openCancelModal = (reservation: ReservationWithUser) => {
    setCancelModal({ reservation, isOpen: true });
    setCancelForm({
      reason: '',
      refundAmount: reservation.totalAmount?.toString() || '',
      staffName: ''
    });
  };

  const closeCancelModal = () => {
    setCancelModal({ reservation: {} as ReservationWithUser, isOpen: false });
    setCancelForm({ reason: '', refundAmount: '', staffName: '' });
  };

  const handleCancelReservation = async () => {
    if (!cancelForm.staffName.trim()) {
      toast.error('Please enter your staff name');
      return;
    }

    const refundAmount = parseFloat(cancelForm.refundAmount);
    if (isNaN(refundAmount) || refundAmount < 0) {
      toast.error('Please enter a valid refund amount');
      return;
    }

    if (refundAmount > (cancelModal.reservation.totalAmount || 0)) {
      toast.error('Refund amount cannot exceed the original payment amount');
      return;
    }

    setIsProcessingCancel(true);
    try {
      await cancelReservation(cancelModal.reservation.id, {
        reason: cancelForm.reason || 'Cancelled by admin',
        refundAmount: refundAmount,
        staffName: cancelForm.staffName.trim()
      });

      toast.success('Reservation cancelled and refund processed successfully');
      closeCancelModal();
      fetchReservationsData(); // Refresh the data
    } catch (error: any) {
      console.error('Error cancelling reservation:', error);
      toast.error(error.message || 'Failed to cancel reservation');
    } finally {
      setIsProcessingCancel(false);
    }
  };

  const handleResendConfirmation = async (reservation: ReservationWithUser) => {
    if (!reservation.userEmail || reservation.userEmail === 'No email') {
      toast.error('No email on this reservation. Edit contact first.');
      return;
    }
    setResendEmailLoadingId(reservation.id);
    try {
      const result = await resendConfirmationEmail(reservation.id, true);
      toast.success(result.alreadySent ? 'Confirmation email was already sent' : 'Confirmation email sent');
      if (!result.alreadySent) fetchReservationsData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to send email');
    } finally {
      setResendEmailLoadingId(null);
    }
  };

  const openEditContactModal = (reservation: ReservationWithUser) => {
    setEditContactModal({ reservation, isOpen: true });
    setEditContactForm({
      userEmail: reservation.userEmail || '',
      userName: reservation.userName || '',
      userPhone: reservation.userPhone || '',
    });
  };

  const closeEditContactModal = () => {
    setEditContactModal({ reservation: {} as ReservationWithUser, isOpen: false });
    setEditContactForm({ userEmail: '', userName: '', userPhone: '' });
  };

  const handleSaveContact = async () => {
    if (!editContactModal.reservation.id) return;
    if (!editContactForm.userEmail.trim()) {
      toast.error('Email is required');
      return;
    }
    setIsSavingContact(true);
    try {
      await updateReservationContact(editContactModal.reservation.id, {
        userEmail: editContactForm.userEmail.trim(),
        userName: editContactForm.userName.trim() || undefined,
        userPhone: editContactForm.userPhone.trim() || undefined,
      });
      toast.success('Contact updated');
      closeEditContactModal();
      fetchReservationsData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update');
    } finally {
      setIsSavingContact(false);
    }
  };

  const openChangeTableModal = async (reservation: ReservationWithUser) => {
    setChangeTableModal({ reservation, isOpen: true });
    setSelectedNewTableId(null);
    setAvailableTables([]);
    setIsLoadingTables(true);
    try {
      const data = await getAvailableTablesForReservation(reservation.id);
      const others = (data.tables || []).filter(
        (t: { id: string; reserved: boolean }) => !t.reserved || t.id === reservation.tableId
      );
      setAvailableTables(others);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load tables');
      setChangeTableModal({ reservation: {} as ReservationWithUser, isOpen: false });
    } finally {
      setIsLoadingTables(false);
    }
  };

  const closeChangeTableModal = () => {
    setChangeTableModal({ reservation: {} as ReservationWithUser, isOpen: false });
    setSelectedNewTableId(null);
    setAvailableTables([]);
    setChangeTableNeedsPayment(null);
  };

  const handleAdminChangeTable = async () => {
    const reservation = changeTableModal.reservation;
    if (!reservation.id || !selectedNewTableId) {
      toast.error('Select a table');
      return;
    }
    if (selectedNewTableId === reservation.tableId) {
      toast.error('Select a different table');
      return;
    }
    setIsChangingTable(true);
    setChangeTableNeedsPayment(null);
    try {
      const result = await changeReservationTable(reservation.id, selectedNewTableId, undefined, { deferPaymentIntent: true });
      if ('needsPayment' in result && result.needsPayment) {
        const paymentUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/reservation/${reservation.id}/change-table`;
        setChangeTableNeedsPayment({ amountDue: result.amountDue, paymentUrl });
        toast.success(`Email sent to customer with payment link. They pay ${formatCurrency(result.amountDue)} and the table changes.`);
      } else if ('success' in result && result.success) {
        toast.success(result.message || 'Table changed. Refund processed if applicable.');
        await fetchReservationsData();
        closeChangeTableModal();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to change table');
    } finally {
      setIsChangingTable(false);
    }
  };

  const copyConfirmationLink = (reservation: ReservationWithUser) => {
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/reservation/${reservation.id}/change-table`;
    navigator.clipboard.writeText(url).then(() => toast.success('Link copied to clipboard')).catch(() => toast.error('Could not copy'));
  };

  const needsTableChangeFix = (r: ReservationWithUser) => {
    const hasMoved = r.previousTableId && r.tableId && r.previousTableId !== r.tableId;
    const notFixed = (r.tableChangeAmount === 0 || r.tableChangeAmount == null) && !r.tableChangeRefundId && !r.tableChangeInvoiceId;
    return hasMoved && notFixed && r.status !== 'cancelled';
  };

  const handleFixTableChangePrice = async (reservation: ReservationWithUser) => {
    setFixPriceLoadingId(reservation.id);
    setFixPriceNeedsPayment(null);
    try {
      const result = await fixTableChangePriceDifference(reservation.id);
      if ('success' in result && result.success) {
        toast.success(result.message);
        fetchReservationsData();
      } else if ('needsPayment' in result && result.needsPayment) {
        const paymentUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/reservation/${reservation.id}/change-table`;
        setFixPriceNeedsPayment({ reservationId: reservation.id, amountDue: result.amountDue, paymentUrl });
        toast.success(result.message);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to fix price difference');
    } finally {
      setFixPriceLoadingId(null);
    }
  };

  const toggleEventExpand = (eventTitle: string) => {
    setExpandedEventId(expandedEventId === eventTitle ? null : eventTitle);
  };

  // Filter reservations based on search and status
  const filteredReservationsByEvent = Object.entries(reservationsByEvent).reduce((acc, [eventTitle, reservations]) => {
    const filteredReservations = reservations.filter(reservation => {
      const matchesSearch = !searchTerm || 
        reservation.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reservation.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reservation.userPhone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        eventTitle.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || reservation.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });

    if (filteredReservations.length > 0) {
      acc[eventTitle] = filteredReservations;
    }
    return acc;
  }, {} as ReservationsByEvent);

  const noReservations = Object.keys(filteredReservationsByEvent).length === 0;
  const totalReservations = Object.values(reservationsByEvent).reduce((total, reservations) => total + reservations.length, 0);
  /** How many survive the search + status filter, so the count under the title
      describes what is actually on screen rather than what exists. */
  const visibleReservations = Object.values(filteredReservationsByEvent).reduce(
    (total, reservations) => total + reservations.length,
    0
  );

  // Format currency
  const formatCurrency = (amount: number = 0) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Format date – handles ISO strings, Firestore timestamps, and legacy formats
  const formatDate = (dateInput?: string | { _seconds: number, _nanoseconds: number } | Record<string, unknown>) => {
    if (dateInput == null) return 'N/A';

    let date: Date | undefined;
    if (typeof dateInput === 'object') {
      if ('_seconds' in dateInput && typeof (dateInput as { _seconds: number })._seconds === 'number') {
        date = new Date((dateInput as { _seconds: number })._seconds * 1000);
      } else if ('toDate' in dateInput && typeof (dateInput as { toDate: () => Date }).toDate === 'function') {
        date = (dateInput as { toDate: () => Date }).toDate();
      } else {
        return 'N/A';
      }
    } else if (typeof dateInput === 'string') {
      const s = dateInput.trim();
      if (s === '' || s === 'Invalid Date') return 'N/A';
      date = new Date(s);
      if (isNaN(date.getTime())) {
        date = new Date(s.endsWith('Z') ? s : s + 'Z');
      }
    } else {
      return 'N/A';
    }

    if (!date || isNaN(date.getTime())) {
      return 'N/A';
    }

    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
      hour12: true
    }).format(date);
  };

  // Get status badge classes based on status
  const getStatusBadgeClasses = (status?: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-success-900/40 text-success-400 border-success-500/50';
      case 'pending':
        return 'bg-warning-900/40 text-warning-400 border-warning-500/50';
      case 'cancelled':
        return 'bg-danger-900/30 text-danger-400 border-danger-500/50';
      case 'completed':
      case 'checked-in':
        return 'bg-accent-900/30 text-accent-400 border-accent-500/50';
      default:
        return 'bg-surface-raised text-fg-dim border-line-strong';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header. The title carried `digital-glow-soft` — a white text-shadow
          halo — which on an admin heading reads as a rendering fault rather
          than as brand. The venue's glow belongs on the marketing surfaces. */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {/* The sticky admin bar above already names the open section, so a
              second "Reservations" in 24px directly under it was the same word
              twice. The count is what this line is actually for. */}
          <h2 className="sr-only">Reservations</h2>
          <p className="text-sm text-fg-muted">
            {visibleReservations === totalReservations ? (
              <>
                <span className="tabular">{totalReservations}</span> total
              </>
            ) : (
              <>
                <span className="tabular">{visibleReservations}</span> of{' '}
                <span className="tabular">{totalReservations}</span> shown
              </>
            )}
          </p>
        </div>
        <Button
          onClick={fetchReservationsData}
          disabled={loading}
          loading={loading}
          variant="outline"
          size="md"
        >
          {!loading && <FiRefreshCw aria-hidden="true" />}
          Refresh
        </Button>
      </div>

      {/* Search and filter. Both controls were placeholder-only, so neither had
          an accessible name; the labels are visible now, which also stops the
          filter reading as an unlabelled dropdown once a value is chosen. */}
      <div className="rounded-lg border border-line/30 bg-surface/50 p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Label htmlFor="reservation-search" className="mb-1.5">
              Search
            </Label>
            <Input
              id="reservation-search"
              type="search"
              leadingIcon={<FiSearch aria-hidden="true" size={16} />}
              placeholder="Name, email, phone or event"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="sm:w-52">
            <Label htmlFor="reservation-status" className="mb-1.5">
              Status
            </Label>
            <Select
              id="reservation-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="checked-in">Checked-in</option>
            </Select>
          </div>

          {(searchTerm || statusFilter !== 'all') && (
            <Button
              variant="ghost"
              size="md"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
              }}
            >
              Clear
            </Button>
          )}
        </div>
      </div>
      
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Spinner size="lg" className="text-fg mb-4" />
          <p className="text-fg">Loading reservations...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-12 text-danger-400">
          <FiAlertTriangle size={48} className="mb-4" />
          <p className="text-lg font-medium mb-4">{error}</p>
          <Button
            onClick={fetchReservationsData}
            variant="ghost" size="md" className="px-4 py-2 bg-danger-900/20 hover:bg-danger-900/40 border border-danger-500/40 flex items-center gap-2"
          >
            <FiRefreshCw className="animate-pulse" />
            <span>Try Again</span>
          </Button>
        </div>
      ) : noReservations ? (
        <div className="flex flex-col items-center justify-center py-16 text-fg-muted">
          <FiUsers size={64} className="mb-4 opacity-50" />
          <h3 className="text-xl font-semibold mb-2">No reservations found</h3>
          <p className="text-center text-sm">
            {searchTerm || statusFilter !== 'all' ? 
              'No reservations match your current filters. Try adjusting your search or filter criteria.' : 
              'There are no reservations to display.'
            }
          </p>
          {(searchTerm || statusFilter !== 'all') && (
            <Button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
              }}
              variant="primary" size="md" className="mt-4 px-4 py-2 bg-fg hover:bg-fg-dim text-sm"
            >
              Clear Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(filteredReservationsByEvent).map(([eventTitle, reservations]) => (
            <div key={eventTitle} className="bg-surface/50 rounded-lg border border-line/30 overflow-hidden">
              {/* Event header.
                  This was `<Button variant="ghost" size="md" full>` wrapping a
                  two-line block. `size="md"` is a fixed `h-11` and the variant
                  centres its content, so the title sat in the middle of the row
                  with the chevron jammed against it, and the meta line spilled
                  out below the row's own background. `unstyled` gives the
                  primitive's focus and disabled behaviour without its geometry. */}
              <Button
                unstyled
                onClick={() => toggleEventExpand(eventTitle)}
                aria-expanded={expandedEventId === eventTitle}
                className="flex w-full items-center justify-between gap-4 p-4 text-left hover:bg-surface-raised/50"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-heading text-base tracking-wide text-fg lg:text-lg">
                    {eventTitle}
                  </span>
                  <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-fg-muted">
                    <span className="flex items-center gap-1">
                      <FiUsers aria-hidden="true" size={14} />
                      <span className="tabular">{reservations.length}</span>
                      {reservations.length === 1 ? 'reservation' : 'reservations'}
                    </span>
                    <span className="flex items-center gap-1">
                      <FiCalendar aria-hidden="true" size={14} />
                      <span className="tabular">
                        {reservations[0]?.eventDate ? formatDate(reservations[0].eventDate).split(',')[0] : 'Date TBA'}
                      </span>
                    </span>
                  </span>
                </span>
                <span aria-hidden="true" className="shrink-0 text-fg-muted">
                  {expandedEventId === eventTitle ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
                </span>
              </Button>

              {/* Reservations List */}
              {expandedEventId === eventTitle && (
                <div className="border-t border-line/30">
                  <div className="divide-y divide-line/20">
                    {reservations.map((reservation) => (
                      <div key={reservation.id} className="p-4 hover:bg-surface-raised/30 transition-colors">
                        {/* Mobile Card Layout */}
                        <div className="space-y-4">
                          {/* Guest and actions.
                              Eight icon-only buttons sat in a row here, each a
                              different hue, each named only by a `title` that
                              appears on hover — so on a touch screen none of
                              them had a name at all, and the two destructive
                              ones (cancel-and-refund, delete) were adjacent and
                              both red.

                              Now: the one action an admin reaches for most
                              stays inline, and the rest move into a labelled
                              menu where each item reads as a sentence and
                              deleting sits below a separator. */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="mb-2 flex items-center gap-2">
                                <FiUser aria-hidden="true" className="shrink-0 text-fg-muted" size={16} />
                                <span className="truncate font-medium text-fg">{reservation.userName}</span>
                              </div>
                              {/* Emoji were standing in for icons in a file that
                                  imports an icon set on the line above. */}
                              <div className="space-y-1 text-sm">
                                <p className="flex items-center gap-2 text-fg-muted">
                                  <FiMail aria-hidden="true" className="shrink-0" size={13} />
                                  <span className="truncate">{reservation.userEmail}</span>
                                </p>
                                <p className="flex items-center gap-2 text-fg-muted">
                                  <FiPhone aria-hidden="true" className="shrink-0" size={13} />
                                  <span className="tabular truncate">{reservation.userPhone}</span>
                                </p>
                              </div>
                            </div>

                            <div className="flex shrink-0 items-center gap-2">
                              {needsTableChangeFix(reservation) && (
                                <Button
                                  onClick={() => handleFixTableChangePrice(reservation)}
                                  disabled={fixPriceLoadingId === reservation.id}
                                  loading={fixPriceLoadingId === reservation.id}
                                  variant="outline"
                                  size="sm"
                                  className="border-attention-600 text-attention-300 hover:bg-attention-900/20"
                                >
                                  {fixPriceLoadingId !== reservation.id && (
                                    <FiDollarSign aria-hidden="true" size={14} />
                                  )}
                                  Settle difference
                                </Button>
                              )}

                              {reservation.status !== 'cancelled' && reservation.status !== 'checked-in' && (
                                <Button
                                  onClick={() => openChangeTableModal(reservation)}
                                  variant="outline"
                                  size="sm"
                                  className="hidden sm:inline-flex"
                                >
                                  <BiTable aria-hidden="true" size={14} />
                                  Change table
                                </Button>
                              )}

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label={`More actions for ${reservation.userName}'s reservation`}
                                  >
                                    <FiMoreHorizontal aria-hidden="true" size={18} />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-60">
                                  {reservation.status !== 'cancelled' && reservation.status !== 'checked-in' && (
                                    <DropdownMenuItem
                                      className="sm:hidden"
                                      onClick={() => openChangeTableModal(reservation)}
                                    >
                                      <BiTable aria-hidden="true" className="mr-2" />
                                      Change table
                                    </DropdownMenuItem>
                                  )}
                                  {reservation.status !== 'cancelled' && (
                                    <DropdownMenuItem
                                      disabled={resendEmailLoadingId === reservation.id}
                                      onClick={() => handleResendConfirmation(reservation)}
                                    >
                                      <FiMail aria-hidden="true" className="mr-2" />
                                      {resendEmailLoadingId === reservation.id
                                        ? 'Sending…'
                                        : 'Resend confirmation email'}
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem onClick={() => openEditContactModal(reservation)}>
                                    <FiEdit2 aria-hidden="true" className="mr-2" />
                                    Edit contact details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => copyConfirmationLink(reservation)}>
                                    <FiCopy aria-hidden="true" className="mr-2" />
                                    Copy manage link
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                    <a
                                      href={`/reservation/${reservation.id}/change-table`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="cursor-pointer"
                                    >
                                      <FiExternalLink aria-hidden="true" className="mr-2" />
                                      Open guest view
                                    </a>
                                  </DropdownMenuItem>

                                  <DropdownMenuSeparator />

                                  {reservation.status !== 'cancelled' && (
                                    <DropdownMenuItem
                                      onClick={() => openCancelModal(reservation)}
                                      className="text-revoke-400 focus:bg-revoke-900/30 focus:text-revoke-400"
                                    >
                                      <FiX aria-hidden="true" className="mr-2" />
                                      Cancel &amp; refund…
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteReservation(reservation.id, reservation.eventId)}
                                    className="text-danger-bright focus:bg-danger-900/30 focus:text-danger-bright"
                                  >
                                    <FiTrash2 aria-hidden="true" className="mr-2" />
                                    Delete reservation
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>

                          {/* Reservation facts.
                              These were two separate grids — a four-column one
                              above a two-column one — so "Event date" started
                              under "Table" and nothing lined up between the
                              rows. One definition list, one column rhythm, and
                              money in tabular figures so totals down a list of
                              reservations align on the decimal. */}
                          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3 lg:grid-cols-6">
                            <div>
                              <dt className="text-fg-muted">Table</dt>
                              <dd className="mt-0.5 flex items-center gap-1 font-medium text-fg">
                                <BiTable aria-hidden="true" size={14} />
                                <span className="tabular">#{reservation.tableNumber}</span>
                              </dd>
                            </div>
                            <div>
                              <dt className="text-fg-muted">Status</dt>
                              <dd className="mt-0.5">
                                <span className={`inline-block rounded-full border px-2 py-0.5 text-xs ${getStatusBadgeClasses(reservation.status)}`}>
                                  {reservation.status || 'pending'}
                                </span>
                              </dd>
                            </div>
                            <div>
                              <dt className="text-fg-muted">Guests</dt>
                              <dd className="tabular mt-0.5 font-medium text-fg">{reservation.guestCount || 1}</dd>
                            </div>
                            <div>
                              <dt className="text-fg-muted">Total</dt>
                              <dd className="tabular mt-0.5 font-medium text-fg">
                                {formatCurrency(reservation.totalAmount)}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-fg-muted">Event date</dt>
                              <dd className="tabular mt-0.5 font-medium text-fg">
                                {reservation.eventDate && reservation.eventDate !== 'Invalid Date'
                                  ? formatDate(reservation.eventDate).split(',').slice(0, 2).join(',')
                                  : (reservation.eventId ? 'Unknown' : 'N/A')}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-fg-muted">Booked</dt>
                              <dd className="tabular mt-0.5 font-medium text-fg">
                                {formatDate(reservation.createdAt).split(',').slice(0, 2).join(',')}
                              </dd>
                            </div>
                          </dl>

                          {/* Bottles.
                              A full-width filled panel with its own heading for
                              what is usually two words. It reads as one line of
                              the record now, alongside the facts above it. */}
                          {reservation.bottles && reservation.bottles.length > 0 && (
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-sm">
                              <span className="flex items-center gap-1.5 text-fg-muted">
                                <BiWine aria-hidden="true" size={15} />
                                Bottles
                              </span>
                              {reservation.bottles.map((bottle, index) => (
                                <span
                                  key={index}
                                  className="rounded-full border border-line bg-surface-raised px-2 py-0.5 text-xs text-fg-dim"
                                >
                                  {bottle.name}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Special Requests */}
                          {reservation.specialRequests && (
                            <div className="bg-surface-raised/50 p-3 rounded-lg">
                              <span className="text-fg-muted text-sm block mb-1">Special Requests:</span>
                              <span className="text-fg text-sm">{reservation.specialRequests}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Edit contact modal */}
      {editContactModal.isOpen && editContactModal.reservation.id && (
        <div className="fixed inset-0 bg-canvas bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-lg border border-line w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-fg">Edit contact</h3>
                <Button onClick={closeEditContactModal} variant="ghost" size="md" className="text-fg-muted hover:text-fg">
                  <FiX size={20} />
                </Button>
              </div>
              <p className="text-sm text-fg-muted mb-4">
                Table #{editContactModal.reservation.tableNumber} · {editContactModal.reservation.userName}
              </p>
              <div className="space-y-4">
                <div>
                  <Label className="mb-2">Email *</Label>
                  <Input
                    type="email"
                    value={editContactForm.userEmail}
                    onChange={(e) => setEditContactForm((f) => ({ ...f, userEmail: e.target.value }))}
                    className="px-3 py-2 bg-surface-raised border border-line-strong placeholder-fg-muted focus:border-accent-500"
                    placeholder="guest@example.com"
                    disabled={isSavingContact}
                  />
                </div>
                <div>
                  <Label className="mb-2">Name</Label>
                  <Input
                    type="text"
                    value={editContactForm.userName}
                    onChange={(e) => setEditContactForm((f) => ({ ...f, userName: e.target.value }))}
                    className="px-3 py-2 bg-surface-raised border border-line-strong placeholder-fg-muted focus:border-accent-500"
                    placeholder="Guest name"
                    disabled={isSavingContact}
                  />
                </div>
                <div>
                  <Label className="mb-2">Phone</Label>
                  <Input
                    type="tel"
                    value={editContactForm.userPhone}
                    onChange={(e) => setEditContactForm((f) => ({ ...f, userPhone: e.target.value }))}
                    className="px-3 py-2 bg-surface-raised border border-line-strong placeholder-fg-muted focus:border-accent-500"
                    placeholder="Phone"
                    disabled={isSavingContact}
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button
                  onClick={closeEditContactModal}
                  disabled={isSavingContact}
                  variant="outline" size="md" className="flex-1 px-4 py-2 border border-line-strong text-fg-dim hover:bg-surface-raised"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveContact}
                  disabled={isSavingContact || !editContactForm.userEmail.trim()}
                  variant="accent" size="md" className="flex-1 px-4 py-2 bg-accent-600 hover:bg-accent-700"
                >
                  {isSavingContact ? 'Saving…' : 'Save'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fix price difference – customer must pay (modal when upgrade fix) */}
      {fixPriceNeedsPayment && (
        <div className="fixed inset-0 bg-canvas bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-lg border border-line w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-fg">Customer must pay price difference</h3>
                <Button onClick={() => setFixPriceNeedsPayment(null)} variant="ghost" size="md" className="text-fg-muted hover:text-fg">
                  <FiX size={20} />
                </Button>
              </div>
              <p className="text-2xl font-bold text-accent-400 mb-2">{formatCurrency(fixPriceNeedsPayment.amountDue)}</p>
              <p className="text-sm text-fg-muted mb-4">An email was sent with the payment link. They can also use the link below.</p>
              <a href={fixPriceNeedsPayment.paymentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full py-3 bg-accent-600 hover:bg-accent-700 text-fg rounded-lg font-medium mb-2">
                <FiExternalLink size={18} />
                Open payment page
              </a>
              <Button type="button" onClick={() => { navigator.clipboard.writeText(fixPriceNeedsPayment.paymentUrl); toast.success('Link copied'); }} variant="outline" size="md" full className="py-2 border border-line-strong text-fg-dim hover:bg-surface-raised flex items-center justify-center gap-2">
                <FiCopy size={16} />
                Copy link
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Change table modal – same charge/refund logic as customer */}
      {changeTableModal.isOpen && changeTableModal.reservation.id && (
        <div className="fixed inset-0 bg-canvas bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-lg border border-line w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-fg">Change table</h3>
                <Button onClick={closeChangeTableModal} variant="ghost" size="md" className="text-fg-muted hover:text-fg">
                  <FiX size={20} />
                </Button>
              </div>
              <p className="text-sm text-fg-muted mb-4">
                {changeTableModal.reservation.userName} · Current: Table #{changeTableModal.reservation.tableNumber}. Upgrade = charge difference; downgrade = refund difference.
              </p>

              {changeTableNeedsPayment ? (
                <div className="space-y-4">
                  <div className="p-4 bg-attention-900/20 border border-attention-700/50 rounded-lg">
                    <p className="text-attention-200 font-medium">Customer must pay price difference</p>
                    <p className="text-2xl font-bold text-fg mt-1">{formatCurrency(changeTableNeedsPayment.amountDue)}</p>
                    <p className="text-sm text-fg-muted mt-2">An email was sent to the customer with the payment link. Once they pay, the table will change automatically.</p>
                  </div>
                  <a
                    href={changeTableNeedsPayment.paymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 bg-accent-600 hover:bg-accent-700 text-fg rounded-lg font-medium"
                  >
                    <FiExternalLink size={18} />
                    Open payment page for customer
                  </a>
                  <Button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(changeTableNeedsPayment.paymentUrl);
                      toast.success('Link copied');
                    }}
                    variant="outline" size="md" full className="py-2 border border-line-strong text-fg-dim hover:bg-surface-raised flex items-center justify-center gap-2"
                  >
                    <FiCopy size={16} />
                    Copy link
                  </Button>
                  <Button
                    onClick={closeChangeTableModal}
                    variant="ghost" size="md" full className="py-2 text-fg-muted hover:text-fg"
                  >
                    Close
                  </Button>
                </div>
              ) : isLoadingTables ? (
                <div className="flex justify-center py-8">
                  <Spinner size="md" className="text-accent-500" />
                </div>
              ) : (
                <>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {availableTables.map((table) => {
                      const isCurrent = table.id === changeTableModal.reservation.tableId;
                      return (
                        <Button unstyled
                          key={table.id}
                          type="button"
                          onClick={() => !isCurrent && setSelectedNewTableId(table.id)}
                          disabled={isCurrent}
                          className={`w-full text-left px-3 py-2 rounded-lg border transition-colors ${
                            selectedNewTableId === table.id
                              ? 'border-accent-500 bg-accent-900/30'
                              : isCurrent
                                ? 'border-line bg-surface-raised/50 opacity-60 cursor-not-allowed'
                                : 'border-line hover:border-line-strong'
                          }`}
                        >
                          <span className="text-fg font-medium">Table #{table.number}</span>
                          <span className="text-fg-muted text-sm ml-2">
                            {formatCurrency(table.price)}
                            {isCurrent && ' (current)'}
                          </span>
                        </Button>
                      );
                    })}
                  </div>
                  <div className="flex gap-3 mt-6">
                    <Button
                      onClick={closeChangeTableModal}
                      disabled={isChangingTable}
                      variant="outline" size="md" className="flex-1 px-4 py-2 border border-line-strong text-fg-dim hover:bg-surface-raised"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAdminChangeTable}
                      disabled={isChangingTable || !selectedNewTableId || selectedNewTableId === changeTableModal.reservation.tableId}
                      variant="success" size="md" className="flex-1 px-4 py-2 bg-confirm-600 hover:bg-confirm-700"
                    >
                      {isChangingTable ? 'Changing…' : 'Change table'}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cancel & Refund Modal */}
      {cancelModal.isOpen && (
        <div className="fixed inset-0 bg-canvas bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-lg border border-line w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-fg">Cancel & Refund Reservation</h3>
                <Button
                  onClick={closeCancelModal}
                  variant="ghost" size="md" className="text-fg-muted hover:text-fg"
                >
                  <FiX size={20} />
                </Button>
              </div>

              <div className="mb-4 p-3 bg-surface-raised rounded-lg">
                <p className="text-sm text-fg-muted">Customer</p>
                <p className="text-fg font-medium">{cancelModal.reservation.userName}</p>
                <p className="text-sm text-fg-muted mt-1">
                  Table #{cancelModal.reservation.tableNumber} • {formatCurrency(cancelModal.reservation.totalAmount || 0)}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="mb-2">
                    Staff Name <span className="text-danger-400">*</span>
                  </Label>
                  <Input
                    type="text"
                    value={cancelForm.staffName}
                    onChange={(e) => setCancelForm({ ...cancelForm, staffName: e.target.value })}
                    placeholder="Enter your name"
                    className="px-3 py-2 bg-surface-raised border border-line-strong placeholder-fg-muted focus:border-accent-500"
                    disabled={isProcessingCancel}
                  />
                </div>

                <div>
                  <Label className="mb-2">
                    Refund Amount <span className="text-danger-400">*</span>
                  </Label>
                  <div className="relative">
                    <FiDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-fg-muted" size={16} />
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max={cancelModal.reservation.totalAmount || 0}
                      value={cancelForm.refundAmount}
                      onChange={(e) => setCancelForm({ ...cancelForm, refundAmount: e.target.value })}
                      placeholder="0.00"
                      className="pl-10 pr-3 py-2 bg-surface-raised border border-line-strong placeholder-fg-muted focus:border-accent-500"
                      disabled={isProcessingCancel}
                    />
                  </div>
                  <p className="text-xs text-fg-muted mt-1">
                    Maximum: {formatCurrency(cancelModal.reservation.totalAmount || 0)}
                  </p>
                </div>

                <div>
                  <Label className="mb-2">
                    Cancellation Reason (Optional)
                  </Label>
                  <Textarea
                    value={cancelForm.reason}
                    onChange={(e) => setCancelForm({ ...cancelForm, reason: e.target.value })}
                    placeholder="Reason for cancellation..."
                    rows={3}
                    className="px-3 py-2 bg-surface-raised border border-line-strong placeholder-fg-muted focus:border-accent-500 resize-none"
                    disabled={isProcessingCancel}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  onClick={closeCancelModal}
                  disabled={isProcessingCancel}
                  variant="outline" size="md" className="flex-1 px-4 py-2 border border-line-strong text-fg-dim hover:bg-surface-raised"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCancelReservation}
                  disabled={isProcessingCancel || !cancelForm.staffName.trim()}
                  variant="subtle" size="md" className="flex-1 px-4 py-2 bg-revoke-600 hover:bg-revoke-700 disabled:bg-surface-lifted flex items-center justify-center gap-2"
                >
                  {isProcessingCancel ? (
                    <>
                      <Spinner size="sm" className="text-fg" />
                      Processing...
                    </>
                  ) : (
                    'Cancel & Refund'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 