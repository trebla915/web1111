import LoginForm from './LoginForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface LoginModalProps {
  onClose: () => void;
  className?: string;
}

export default function LoginModal({ onClose, className = "" }: LoginModalProps) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={`bg-gray-900 text-white border-white/10 ${className}`}>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold tracking-tight text-white">Login</DialogTitle>
        </DialogHeader>
        <LoginForm onSuccess={onClose} />
      </DialogContent>
    </Dialog>
  );
}
