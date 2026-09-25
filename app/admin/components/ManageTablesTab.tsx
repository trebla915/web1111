"use client";

import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { FiPlus, FiEdit2, FiTrash2, FiX, FiUsers, FiDollarSign, FiCheck, FiLock } from "react-icons/fi";
import { BiTable } from "react-icons/bi";
import { getEventTables, createEventTable, updateEventTable, deleteEventTable } from "@/lib/services/tables";
import { Table } from "@/types/reservation";
import EventPicker from "./EventPicker";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Label } from "@/components/ui/field";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

interface ManageTablesTabProps {
  initialEventId?: string;
}

type TableFormState = {
  number: string;
  capacity: string;
  price: string;
  minimumBottles: string;
  location: Table["location"];
  shape: NonNullable<Table["shape"]>;
};

const emptyForm: TableFormState = {
  number: "",
  capacity: "",
  price: "",
  minimumBottles: "1",
  location: "left",
  shape: "rectangle",
};

export default function ManageTablesTab({ initialEventId }: ManageTablesTabProps) {
  const [eventId, setEventId] = useState(initialEventId || "");
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [form, setForm] = useState<TableFormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) {
      setTables([]);
      return;
    }
    loadTables(eventId);
  }, [eventId]);

  const loadTables = async (id: string) => {
    setLoading(true);
    try {
      const fetched = await getEventTables(id);
      setTables(fetched.sort((a, b) => a.number - b.number));
    } catch (error) {
      console.error("Error loading tables:", error);
      toast.error("Failed to load tables for this event.");
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingTable(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const openEditModal = (table: Table) => {
    setEditingTable(table);
    setForm({
      number: table.number.toString(),
      capacity: table.capacity.toString(),
      price: table.price.toString(),
      minimumBottles: (table.minimumBottles ?? 1).toString(),
      location: table.location,
      shape: table.shape || "rectangle",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTable(null);
  };

  const handleSave = async () => {
    const number = parseInt(form.number, 10);
    const capacity = parseInt(form.capacity, 10);
    const price = parseFloat(form.price);
    const minimumBottles = parseInt(form.minimumBottles, 10);

    if (isNaN(number) || number <= 0) {
      toast.error("Table number must be a positive number.");
      return;
    }
    if (isNaN(capacity) || capacity <= 0) {
      toast.error("Capacity must be a positive number.");
      return;
    }
    if (isNaN(price) || price < 0) {
      toast.error("Price must be a valid number.");
      return;
    }
    if (isNaN(minimumBottles) || minimumBottles < 0) {
      toast.error("Minimum bottles must be a valid number.");
      return;
    }

    setSaving(true);
    try {
      if (editingTable) {
        await updateEventTable(eventId, editingTable.id, {
          number,
          capacity,
          price,
          minimumBottles,
          location: form.location,
          shape: form.shape,
        });
        toast.success("Table updated");
      } else {
        await createEventTable(eventId, {
          number,
          capacity,
          price,
          minimumBottles,
          location: form.location,
          shape: form.shape,
        });
        toast.success("Table created");
      }
      closeModal();
      await loadTables(eventId);
    } catch (error: any) {
      console.error("Error saving table:", error);
      toast.error(error.message || "Failed to save table");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (table: Table) => {
    if (confirmDeleteId !== table.id) {
      setConfirmDeleteId(table.id);
      return;
    }

    setDeletingId(table.id);
    try {
      await deleteEventTable(eventId, table.id);
      toast.success("Table deleted");
      setConfirmDeleteId(null);
      await loadTables(eventId);
    } catch (error: any) {
      console.error("Error deleting table:", error);
      toast.error(error.message || "Failed to delete table");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Mobile Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl lg:text-3xl font-bold text-fg">Manage Tables</h2>
        <div className="text-sm text-fg-muted">Set table number, price, capacity, and placement per event</div>
      </div>

      {/* Event Selector */}
      <Card padding="lg" className="bg-surface/50">
        <EventPicker value={eventId} onChange={setEventId} label="Select event" />
      </Card>

      {!eventId ? (
        <EmptyState
          title="No event selected"
          description="Choose an event above to manage its tables."
        />
      ) : (
        <>
          <div className="flex justify-end">
            <Button
              onClick={openAddModal}
              variant="accent" size="md"
            >
              <FiPlus />
              Add Table
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Spinner size="lg" className="text-accent-500" />
            </div>
          ) : tables.length === 0 ? (
            <EmptyState
              icon={<BiTable size={48} />}
              title="No tables yet"
              description="Add the first table for this event to get started."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tables.map((table) => (
                <div
                  key={table.id}
                  className="bg-surface/50 border border-accent-900/30 rounded-lg p-4 hover:border-accent-700/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-fg flex items-center gap-2">
                        <BiTable className="text-accent-400" />
                        Table #{table.number}
                      </h3>
                      <span
                        className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs border ${
                          table.reserved
                            ? "bg-danger-900/30 text-danger-400 border-danger-500/50"
                            : "bg-success-900/30 text-success-400 border-success-500/50"
                        }`}
                      >
                        {table.reserved ? "Reserved" : "Available"}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        onClick={() => openEditModal(table)}
                        variant="ghost" size="icon" aria-label="Edit table"
                        title="Edit table"
                      >
                        <FiEdit2 size={16} />
                      </Button>
                      <Button
                        onClick={() => handleDelete(table)}
                        disabled={table.reserved || deletingId === table.id}
                        variant={confirmDeleteId === table.id ? "danger" : "ghost-danger"}
                        size="icon"
                        aria-label={confirmDeleteId === table.id ? "Confirm delete table" : "Delete table"}
                        title={table.reserved ? "Cancel the reservation first to delete this table" : confirmDeleteId === table.id ? "Click again to confirm delete" : "Delete table"}
                      >
                        {table.reserved ? <FiLock size={16} /> : <FiTrash2 size={16} />}
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-fg-muted block flex items-center gap-1"><FiDollarSign size={12} /> Price</span>
                      <span className="text-fg font-medium">${table.price.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-fg-muted block flex items-center gap-1"><FiUsers size={12} /> Capacity</span>
                      <span className="text-fg font-medium">{table.capacity}</span>
                    </div>
                    <div>
                      <span className="text-fg-muted block">Location</span>
                      <span className="text-fg font-medium capitalize">{table.location}</span>
                    </div>
                    <div>
                      <span className="text-fg-muted block">Min. Bottles</span>
                      <span className="text-fg font-medium">{table.minimumBottles ?? 1}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-canvas/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-accent-900/50 rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-accent-300">
                {editingTable ? "Edit Table" : "Add Table"}
              </h3>
              <Button onClick={closeModal} variant="ghost" size="icon" aria-label="Close">
                <FiX size={20} />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="mb-2">Table Number *</Label>
                  <Input
                    type="number"
                    value={form.number}
                    onChange={(e) => setForm({ ...form, number: e.target.value })}
                    className="px-3 py-2 bg-surface-raised border border-accent-900/50 focus:border-accent-500/70"
                    disabled={saving}
                  />
                </div>
                <div>
                  <Label className="mb-2">Capacity *</Label>
                  <Input
                    type="number"
                    value={form.capacity}
                    onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                    className="px-3 py-2 bg-surface-raised border border-accent-900/50 focus:border-accent-500/70"
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="mb-2">Price *</Label>
                  <div className="relative">
                    <FiDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted" size={14} />
                    <Input
                      type="number"
                      step="0.01"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      className="pl-8 pr-3 py-2 bg-surface-raised border border-accent-900/50 focus:border-accent-500/70"
                      disabled={saving}
                    />
                  </div>
                </div>
                <div>
                  <Label className="mb-2">Min. Bottles</Label>
                  <Input
                    type="number"
                    value={form.minimumBottles}
                    onChange={(e) => setForm({ ...form, minimumBottles: e.target.value })}
                    className="px-3 py-2 bg-surface-raised border border-accent-900/50 focus:border-accent-500/70"
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="mb-2">Location</Label>
                  <Select
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value as Table["location"] })}
                    className="px-3 py-2 bg-surface-raised border border-accent-900/50 focus:border-accent-500/70"
                    disabled={saving}
                  >
                    <option value="left">Left</option>
                    <option value="right">Right</option>
                    <option value="center">Center</option>
                  </Select>
                </div>
                <div>
                  <Label className="mb-2">Shape</Label>
                  <Select
                    value={form.shape}
                    onChange={(e) => setForm({ ...form, shape: e.target.value as NonNullable<Table["shape"]> })}
                    className="px-3 py-2 bg-surface-raised border border-accent-900/50 focus:border-accent-500/70"
                    disabled={saving}
                  >
                    <option value="rectangle">Rectangle</option>
                    <option value="circle">Circle</option>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={closeModal}
                disabled={saving}
                variant="outline" size="md" className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                variant="accent" size="md" className="flex-1"
              >
                {saving ? (
                  <Spinner size="sm" className="text-fg" />
                ) : (
                  <FiCheck size={16} />
                )}
                {editingTable ? "Save Changes" : "Add Table"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
