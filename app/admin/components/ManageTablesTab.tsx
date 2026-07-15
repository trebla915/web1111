"use client";

import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { FiPlus, FiEdit2, FiTrash2, FiX, FiUsers, FiDollarSign, FiCheck, FiLock } from "react-icons/fi";
import { BiTable } from "react-icons/bi";
import { getEventTables, createEventTable, updateEventTable, deleteEventTable } from "@/lib/services/tables";
import { Table } from "@/types/reservation";
import EventPicker from "./EventPicker";

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
        <h2 className="text-2xl lg:text-3xl font-bold text-white">Manage Tables</h2>
        <div className="text-sm text-gray-400">Set table number, price, capacity, and placement per event</div>
      </div>

      {/* Event Selector */}
      <div className="bg-zinc-900/50 rounded-lg border border-cyan-900/30 p-4 lg:p-6">
        <EventPicker value={eventId} onChange={setEventId} label="Select event" />
      </div>

      {!eventId ? (
        <div className="text-center py-12 text-gray-400 bg-zinc-900/50 rounded-lg border border-cyan-900/30">
          <p>Select an event above to manage its tables.</p>
        </div>
      ) : (
        <>
          <div className="flex justify-end">
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 px-4 py-3 lg:py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              <FiPlus />
              Add Table
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-12 h-12 border-t-2 border-b-2 border-cyan-500 rounded-full animate-spin"></div>
            </div>
          ) : tables.length === 0 ? (
            <div className="text-center py-12 text-gray-400 bg-zinc-900/50 rounded-lg border border-cyan-900/30">
              <BiTable size={48} className="mx-auto mb-4 opacity-50" />
              <p>No tables yet for this event. Add one to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tables.map((table) => (
                <div
                  key={table.id}
                  className="bg-zinc-900/50 border border-cyan-900/30 rounded-lg p-4 hover:border-cyan-700/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <BiTable className="text-cyan-400" />
                        Table #{table.number}
                      </h3>
                      <span
                        className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs border ${
                          table.reserved
                            ? "bg-red-900/30 text-red-400 border-red-500/50"
                            : "bg-green-900/30 text-green-400 border-green-500/50"
                        }`}
                      >
                        {table.reserved ? "Reserved" : "Available"}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEditModal(table)}
                        className="p-2 text-gray-400 hover:bg-gray-700/30 rounded-lg transition-colors"
                        title="Edit table"
                      >
                        <FiEdit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(table)}
                        disabled={table.reserved || deletingId === table.id}
                        className={`p-2 rounded-lg transition-colors ${
                          confirmDeleteId === table.id
                            ? "text-white bg-red-600 hover:bg-red-700"
                            : "text-red-400 hover:bg-red-900/20"
                        } disabled:opacity-40 disabled:cursor-not-allowed`}
                        title={table.reserved ? "Cancel the reservation first to delete this table" : confirmDeleteId === table.id ? "Click again to confirm delete" : "Delete table"}
                      >
                        {table.reserved ? <FiLock size={16} /> : <FiTrash2 size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-400 block flex items-center gap-1"><FiDollarSign size={12} /> Price</span>
                      <span className="text-white font-medium">${table.price.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block flex items-center gap-1"><FiUsers size={12} /> Capacity</span>
                      <span className="text-white font-medium">{table.capacity}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Location</span>
                      <span className="text-white font-medium capitalize">{table.location}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Min. Bottles</span>
                      <span className="text-white font-medium">{table.minimumBottles ?? 1}</span>
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-cyan-900/50 rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-cyan-300">
                {editingTable ? "Edit Table" : "Add Table"}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-white">
                <FiX size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">Table Number *</label>
                  <input
                    type="number"
                    value={form.number}
                    onChange={(e) => setForm({ ...form, number: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-800 border border-cyan-900/50 rounded-lg text-white focus:border-cyan-500/70 focus:outline-none"
                    disabled={saving}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">Capacity *</label>
                  <input
                    type="number"
                    value={form.capacity}
                    onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-800 border border-cyan-900/50 rounded-lg text-white focus:border-cyan-500/70 focus:outline-none"
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">Price *</label>
                  <div className="relative">
                    <FiDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input
                      type="number"
                      step="0.01"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      className="w-full pl-8 pr-3 py-2 bg-zinc-800 border border-cyan-900/50 rounded-lg text-white focus:border-cyan-500/70 focus:outline-none"
                      disabled={saving}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">Min. Bottles</label>
                  <input
                    type="number"
                    value={form.minimumBottles}
                    onChange={(e) => setForm({ ...form, minimumBottles: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-800 border border-cyan-900/50 rounded-lg text-white focus:border-cyan-500/70 focus:outline-none"
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">Location</label>
                  <select
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value as Table["location"] })}
                    className="w-full px-3 py-2 bg-zinc-800 border border-cyan-900/50 rounded-lg text-white focus:border-cyan-500/70 focus:outline-none"
                    disabled={saving}
                  >
                    <option value="left">Left</option>
                    <option value="right">Right</option>
                    <option value="center">Center</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">Shape</label>
                  <select
                    value={form.shape}
                    onChange={(e) => setForm({ ...form, shape: e.target.value as NonNullable<Table["shape"]> })}
                    className="w-full px-3 py-2 bg-zinc-800 border border-cyan-900/50 rounded-lg text-white focus:border-cyan-500/70 focus:outline-none"
                    disabled={saving}
                  >
                    <option value="rectangle">Rectangle</option>
                    <option value="circle">Circle</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={closeModal}
                disabled={saving}
                className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-zinc-800 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white rounded-lg flex items-center justify-center gap-2"
              >
                {saving ? (
                  <div className="w-4 h-4 border-t-2 border-b-2 border-white rounded-full animate-spin" />
                ) : (
                  <FiCheck size={16} />
                )}
                {editingTable ? "Save Changes" : "Add Table"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
