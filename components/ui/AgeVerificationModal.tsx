import React from 'react';
import { Button } from "@/components/ui/button";

interface AgeVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: () => void;
  onDeny: () => void;
}

export default function AgeVerificationModal({ isOpen, onClose, onVerify, onDeny }: AgeVerificationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-canvas/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-fg/10 rounded-lg max-w-md w-full p-6 shadow-xl">
        <h2 className="text-2xl font-bold text-fg mb-4 text-center">Age Verification Required</h2>
        
        <p className="text-fg-dim text-center mb-6">
          VIP tables are reserved for guests 21 years of age or older.
          Please confirm your age to proceed with the reservation.
        </p>

        <div className="flex flex-col gap-3">
          <Button
            onClick={onVerify}
            variant="primary" size="lg" full className="py-3 font-bold"
          >
            Yes, I am 21 or older
          </Button>
          
          <Button
            onClick={onDeny}
            variant="ghost" size="lg" full className="py-3 bg-danger-600/20 hover:bg-danger-600/30 text-danger-400 font-bold"
          >
            No, I am under 21
          </Button>
          
          <Button
            onClick={onClose}
            variant="ghost" size="md" full className="py-2 text-sm"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
} 