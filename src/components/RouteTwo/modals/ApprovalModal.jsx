const ApprovalModal = ({ reservation, isOpen, onClose, onConfirm, loading }) => {
  if (!isOpen || !reservation) return null;

  const primaryMember = reservation.members?.[0] || {};
  const formatDate = (dateTime) => {
    if (!dateTime) return 'N/A';
    return new Date(dateTime).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Approve Reservation</h2>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800">
              You are about to approve this reservation. The guest will be notified via email.
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-gray-900 mb-3">Reservation Details</h3>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Guest Name:</span>
                <p className="text-gray-900">{primaryMember.name || 'N/A'}</p>
              </div>

              <div>
                <span className="font-medium text-gray-700">Email:</span>
                <p className="text-gray-900">{primaryMember.email || 'N/A'}</p>
              </div>

              <div>
                <span className="font-medium text-gray-700">Arrival Date:</span>
                <p className="text-gray-900">{formatDate(reservation.travel_details?.arrivalDateTime)}</p>
              </div>

              <div>
                <span className="font-medium text-gray-700">Departure Date:</span>
                <p className="text-gray-900">{formatDate(reservation.travel_details?.departureDateTime)}</p>
              </div>

              <div>
                <span className="font-medium text-gray-700">Accommodation:</span>
                <p className="text-gray-900">{reservation.accommodation || 'N/A'}</p>
              </div>

              <div>
                <span className="font-medium text-gray-700">Number of Members:</span>
                <p className="text-gray-900">{reservation.num_members || 0}</p>
              </div>

              <div className="col-span-2">
                <span className="font-medium text-gray-700">Total Fee:</span>
                <p className="text-lg font-bold text-amber-600">SAR {reservation.total_fee || 0}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reservation)}
            disabled={loading}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 font-medium"
          >
            {loading ? 'Approving...' : 'Confirm Approval'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApprovalModal;
