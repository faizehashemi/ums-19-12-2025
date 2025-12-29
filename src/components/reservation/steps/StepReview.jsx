import { useState } from 'react';
import { Calendar, Users, Home, DollarSign } from 'lucide-react';

const StepReview = ({
  travelDetails,
  members,
  memberData,
  accommodation,
  fees,
  onEdit,
  onSubmit,
  submitting
}) => {
  const [termsAccepted, setTermsAccepted] = useState(false);

  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'N/A';
    return new Date(dateTime).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6">
        <p className="text-amber-800 font-medium">
          Please review all information carefully before submitting your reservation.
        </p>
      </div>

      {/* Travel Details Section */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-amber-600" />
            Travel Details
          </h3>
          <button
            type="button"
            onClick={() => onEdit(1)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Edit
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Country:</span>
            <span className="ml-2 text-gray-600">{travelDetails.country || 'N/A'}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Travel Mode:</span>
            <span className="ml-2 text-gray-600">{travelDetails.travelMode || 'N/A'}</span>
          </div>
          {travelDetails.travelMode === 'By Air' && (
            <>
              <div>
                <span className="font-medium text-gray-700">Airline:</span>
                <span className="ml-2 text-gray-600">{travelDetails.airline || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Flight No:</span>
                <span className="ml-2 text-gray-600">{travelDetails.flightNo || 'N/A'}</span>
              </div>
            </>
          )}
          {travelDetails.travelMode === 'By Road' && (
            <div>
              <span className="font-medium text-gray-700">Road Mode:</span>
              <span className="ml-2 text-gray-600">{travelDetails.roadMode || 'N/A'}</span>
            </div>
          )}
          <div>
            <span className="font-medium text-gray-700">Arrival:</span>
            <span className="ml-2 text-gray-600">{formatDateTime(travelDetails.arrivalDateTime)}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Departure:</span>
            <span className="ml-2 text-gray-600">{formatDateTime(travelDetails.departureDateTime)}</span>
          </div>
        </div>
      </div>

      {/* Members Section */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-amber-600" />
            Members ({members.length})
          </h3>
          <button
            type="button"
            onClick={() => onEdit(2)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Edit
          </button>
        </div>
        <div className="space-y-4">
          {members.map((member, index) => {
            const data = memberData[member.id] || {};
            return (
              <div key={member.id} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-2">Member {index + 1}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Name:</span>
                    <span className="ml-2 text-gray-600">{data.name || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">ITS No:</span>
                    <span className="ml-2 text-gray-600">{data.itsNo || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Email:</span>
                    <span className="ml-2 text-gray-600">{data.email || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Phone:</span>
                    <span className="ml-2 text-gray-600">{data.phone || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Visa Type:</span>
                    <span className="ml-2 text-gray-600">{data.visaType || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Passport:</span>
                    <span className="ml-2 text-gray-600">{data.passportNumber || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Age:</span>
                    <span className="ml-2 text-gray-600">{data.age || 'N/A'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Accommodation Section */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Home className="h-5 w-5 text-amber-600" />
            Accommodation
          </h3>
          <button
            type="button"
            onClick={() => onEdit(4)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Edit
          </button>
        </div>
        <div className="text-sm">
          <span className="font-medium text-gray-700">Type:</span>
          <span className="ml-2 text-gray-600">{accommodation || 'N/A'}</span>
        </div>
      </div>

      {/* Fees Section */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-amber-600" />
            Fee Summary
          </h3>
          <button
            type="button"
            onClick={() => onEdit(5)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Edit
          </button>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between border-b border-gray-200 pb-2">
            <span className="text-gray-700">Base Fee:</span>
            <span className="font-medium text-gray-800">SAR {fees.baseFee}</span>
          </div>
          <div className="flex justify-between border-b border-gray-200 pb-2">
            <span className="text-gray-700">Accommodation Fee ({accommodation}):</span>
            <span className="font-medium text-gray-800">SAR {fees.accommodationFee}</span>
          </div>
          <div className="flex justify-between border-b border-gray-200 pb-2">
            <span className="text-gray-700">Per Person Fee:</span>
            <span className="font-medium text-gray-800">SAR {fees.perPersonFee}</span>
          </div>
          <div className="flex justify-between border-b border-gray-200 pb-2">
            <span className="text-gray-700">Number of Members:</span>
            <span className="font-medium text-gray-800">{fees.numMembers}</span>
          </div>
          <div className="flex justify-between pt-2">
            <span className="text-lg font-semibold text-gray-900">Total Fee:</span>
            <span className="text-lg font-bold text-amber-600">SAR {fees.total}</span>
          </div>
        </div>
      </div>

      {/* Terms and Conditions */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="mt-1 h-4 w-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
          />
          <span className="text-sm text-gray-700">
            I confirm that all the information provided is accurate and I agree to the terms and conditions of QuickStay reservations.
          </span>
        </label>
      </div>

      {/* Submit Button */}
      <div className="flex justify-center pt-4">
        <button
          type="button"
          onClick={onSubmit}
          disabled={!termsAccepted || submitting}
          className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold text-lg transition-colors"
        >
          {submitting ? 'Submitting...' : 'Confirm & Submit Reservation'}
        </button>
      </div>
    </div>
  );
};

export default StepReview;
