import { HiXMark } from 'react-icons/hi2';
import LoginForm from './LoginForm';
import { useEffect } from 'react';

interface LoginModalProps {
  onClose: () => void;
  className?: string;
}

export default function LoginModal({ onClose, className = "" }: LoginModalProps) {
  // Prevent scrolling of the background when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  // Close modal when Escape key is pressed
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [onClose]);

  return (
    <>
      {/* Dark overlay backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal container - centered absolutely */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md mx-auto p-4">
        {/* Modal content */}
        <div 
          className="bg-gray-900 p-8 rounded-lg w-full text-white border border-white/10 shadow-2xl animate-fadeIn"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold tracking-tight">Login</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors rounded-full p-1 hover:bg-white/10"
              aria-label="Close"
            >
              <HiXMark className="h-6 w-6" />
            </button>
          </div>
          <LoginForm onSuccess={onClose} />
        </div>
      </div>
    </>
  );
}