import React from 'react';

interface AgeVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: () => void;
  onDeny: () => void;
}

export default function AgeVerificationModal({ isOpen, onClose, onVerify, onDeny }: AgeVerificationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-white/10 rounded-lg max-w-md w-full p-6 shadow-xl">
        <h2 className="text-2xl font-bold text-white mb-4 text-center">Age Verification Required</h2>
        
        <p className="text-gray-300 text-center mb-6">
          VIP tables are reserved for guests 21 years of age or older.
          Please confirm your age to proceed with the reservation.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={onVerify}
            className="w-full py-3 bg-white hover:bg-white/90 text-black font-bold rounded-md transition-colors"
          >
            Yes, I am 21 or older
          </button>
          
          <button
            onClick={onDeny}
            className="w-full py-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 font-bold rounded-md transition-colors"
          >
            No, I am under 21
          </button>
          
          <button
            onClick={onClose}
            className="w-full py-2 text-gray-400 hover:text-white transition-colors text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
} 