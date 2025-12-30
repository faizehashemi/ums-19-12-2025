import Modal from './Modal';
import Button from './Button';
import { AlertCircle } from 'lucide-react';

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary',
  loading = false
}) => {
  const handleConfirm = async () => {
    await onConfirm();
    if (!loading) onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <Modal.Content>
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-full ${
            variant === 'danger' ? 'bg-red-100' : 'bg-blue-100'
          }`}>
            <AlertCircle className={`w-6 h-6 ${
              variant === 'danger' ? 'text-red-600' : 'text-blue-600'
            }`} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
            <p className="text-sm text-gray-600">{message}</p>
          </div>
        </div>
      </Modal.Content>

      <Modal.Footer>
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          {cancelText}
        </Button>
        <Button variant={variant} onClick={handleConfirm} disabled={loading}>
          {loading ? 'Processing...' : confirmText}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ConfirmDialog;
