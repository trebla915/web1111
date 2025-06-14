"use client";

import React, { useState } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiClock, FiUser, FiCalendar, FiSearch } from 'react-icons/fi';

interface StaffMember {
  id: string;
  name: string;
  role: string;
  email: string;
}

interface Shift {
  id: string;
  staffId: string;
  staffName: string;
  date: string;
  startTime: string;
  endTime: string;
  role: string;
  notes?: string;
}

export default function StaffScheduleTab() {
  const [shifts, setShifts] = useState<Shift[]>([
    {
      id: '1',
      staffId: 'staff1',
      staffName: 'John Doe',
      date: '2024-01-15',
      startTime: '18:00',
      endTime: '02:00',
      role: 'Bartender',
      notes: 'Main bar'
    },
    {
      id: '2',
      staffId: 'staff2',
      staffName: 'Jane Smith',
      date: '2024-01-15',
      startTime: '19:00',
      endTime: '03:00',
      role: 'Security',
      notes: 'Front entrance'
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newShift, setNewShift] = useState({
    staffName: '',
    date: '',
    startTime: '',
    endTime: '',
    role: '',
    notes: ''
  });

  const handleAddShift = () => {
    if (newShift.staffName && newShift.date && newShift.startTime && newShift.endTime) {
      const shift: Shift = {
        id: Date.now().toString(),
        staffId: Date.now().toString(),
        staffName: newShift.staffName,
        date: newShift.date,
        startTime: newShift.startTime,
        endTime: newShift.endTime,
        role: newShift.role,
        notes: newShift.notes
      };
      setShifts([...shifts, shift]);
      setNewShift({ staffName: '', date: '', startTime: '', endTime: '', role: '', notes: '' });
      setShowAddForm(false);
    }
  };

  const handleDeleteShift = (id: string) => {
    setShifts(shifts.filter(shift => shift.id !== id));
  };

  const filteredShifts = shifts.filter(shift => {
    const matchesSearch = !searchTerm || 
      shift.staffName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shift.role.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDate = !selectedDate || shift.date === selectedDate;
    
    return matchesSearch && matchesDate;
  });

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold text-white">Staff Schedule</h2>
          <p className="text-sm text-gray-400 mt-1">Manage staff schedules and shifts</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg transition-colors text-sm font-medium hover:bg-gray-200"
        >
          <FiPlus />
          Add Shift
        </button>
      </div>

      {/* Add Shift Form */}
      {showAddForm && (
        <div className="bg-zinc-900/50 rounded-lg border border-gray-700/30 p-4 lg:p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FiPlus className="text-white" />
            Add New Shift
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">Staff Name *</label>
              <input
                type="text"
                value={newShift.staffName}
                onChange={(e) => setNewShift({...newShift, staffName: e.target.value})}
                className="w-full px-4 py-2 bg-black/50 border border-gray-700/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 text-white placeholder-gray-500 text-sm"
                placeholder="Enter staff name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">Role</label>
              <select
                value={newShift.role}
                onChange={(e) => setNewShift({...newShift, role: e.target.value})}
                className="w-full px-4 py-2 bg-black/50 border border-gray-700/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 text-white text-sm"
              >
                <option value="">Select role</option>
                <option value="Bartender">Bartender</option>
                <option value="Security">Security</option>
                <option value="Server">Server</option>
                <option value="Manager">Manager</option>
                <option value="DJ">DJ</option>
                <option value="Host">Host</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">Date *</label>
              <input
                type="date"
                value={newShift.date}
                onChange={(e) => setNewShift({...newShift, date: e.target.value})}
                className="w-full px-4 py-2 bg-black/50 border border-gray-700/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 text-white text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">Start Time *</label>
              <input
                type="time"
                value={newShift.startTime}
                onChange={(e) => setNewShift({...newShift, startTime: e.target.value})}
                className="w-full px-4 py-2 bg-black/50 border border-gray-700/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 text-white text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">End Time *</label>
              <input
                type="time"
                value={newShift.endTime}
                onChange={(e) => setNewShift({...newShift, endTime: e.target.value})}
                className="w-full px-4 py-2 bg-black/50 border border-gray-700/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 text-white text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">Notes</label>
              <input
                type="text"
                value={newShift.notes}
                onChange={(e) => setNewShift({...newShift, notes: e.target.value})}
                className="w-full px-4 py-2 bg-black/50 border border-gray-700/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 text-white placeholder-gray-500 text-sm"
                placeholder="Additional notes"
              />
            </div>
          </div>
          
          <div className="flex gap-2 mt-6">
            <button
              onClick={handleAddShift}
              className="px-4 py-2 bg-white text-black rounded-lg transition-colors text-sm font-medium hover:bg-gray-200"
            >
              Add Shift
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg transition-colors text-sm font-medium hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="bg-zinc-900/50 rounded-lg border border-gray-700/30 p-4">
        <div className="space-y-4 sm:space-y-0 sm:flex sm:items-center sm:gap-4">
          <div className="flex-1">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search staff or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-black/50 border border-gray-700/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 text-white placeholder-gray-500 text-sm"
              />
            </div>
          </div>
          
          <div className="sm:w-48">
            <div className="relative">
              <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-black/50 border border-gray-700/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 text-white text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Shifts List */}
      {filteredShifts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <FiClock size={64} className="mb-4 opacity-50" />
          <h3 className="text-xl font-semibold mb-2">No shifts found</h3>
          <p className="text-center text-sm">
            {searchTerm || selectedDate ? 
              'No shifts match your current filters.' : 
              'No shifts scheduled yet. Add a shift to get started.'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredShifts.map((shift) => (
            <div key={shift.id} className="bg-zinc-900/50 rounded-lg border border-gray-700/30 p-4 hover:bg-zinc-800/30 transition-colors">
              <div className="space-y-3">
                {/* Staff Info */}
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <FiUser className="text-gray-400 shrink-0" size={16} />
                      <span className="font-medium text-white truncate">{shift.staffName}</span>
                      {shift.role && (
                        <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded-full text-xs">
                          {shift.role}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteShift(shift.id)}
                    className="p-2 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors shrink-0"
                    title="Delete shift"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>

                {/* Shift Details */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                  <div>
                    <span className="text-gray-400 block">Date</span>
                    <span className="text-white font-medium">{formatDate(shift.date)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Start Time</span>
                    <span className="text-white font-medium">{formatTime(shift.startTime)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">End Time</span>
                    <span className="text-white font-medium">{formatTime(shift.endTime)}</span>
                  </div>
                </div>

                {/* Notes */}
                {shift.notes && (
                  <div className="bg-zinc-800/50 p-3 rounded-lg">
                    <span className="text-gray-400 text-sm block mb-1">Notes:</span>
                    <span className="text-white text-sm">{shift.notes}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 