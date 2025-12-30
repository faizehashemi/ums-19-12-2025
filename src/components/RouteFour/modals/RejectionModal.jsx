import { useState } from 'react';

const RejectionModal = ({ reservation, isOpen, onClose, onConfirm, loading }) => {
  const [reason, setReason] = useState('');

  if (!isOpen || !reservation) return null;

  const primaryMember = reservation.members?.[0] || {};

  const handleConfirm = () => {
    if (reason.trim()) {
      onConfirm(reservation, reason);
    }
  };

  const handleClose = () => {
    setReason('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Reject Reservation</h2>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">
              You are about to reject this reservation. The guest will be notified with the reason provided below.
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-gray-900">Reservation Summary</h3>
            <p className="text-sm text-gray-700">
              <span className="font-medium">Guest:</span> {primaryMember.name || 'N/A'}
            </p>
            <p className="text-sm text-gray-700">
              <span className="font-medium">Members:</span> {reservation.num_members || 0}
            </p>
            <p className="text-sm text-gray-700">
              <span className="font-medium">Accommodation:</span> {reservation.accommodation || 'N/A'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Rejection <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              placeholder="Please provide a reason for rejecting this reservation..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
            {reason.trim().length === 0 && (
              <p className="text-sm text-gray-500 mt-1">Reason is required to reject a reservation.</p>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
          <button
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || !reason.trim()}
            className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Rejecting...' : 'Confirm Rejection'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RejectionModal;
