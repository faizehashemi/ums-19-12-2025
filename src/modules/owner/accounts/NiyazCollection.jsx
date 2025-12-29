import { useState } from 'react';
import { supabase } from '../../../lib/supabase';

const NiyazCollection = () => {
  const [itsNo, setItsNo] = useState('');
  const [memberData, setMemberData] = useState(null);
  const [fbType, setFbType] = useState('F&B 1');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [printSlip, setPrintSlip] = useState(false);
  const [sendEmail, setSendEmail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const validateItsNo = (value) => {
    const digitOnly = value.replace(/\D/g, '');
    if (digitOnly.length <= 8) {
      setItsNo(digitOnly);
      setError('');
    }
  };

  const fetchMemberData = async () => {
    if (itsNo.length !== 8) {
      setError('ITS No. must be exactly 8 digits');
      return;
    }

    setLoading(true);
    setError('');
    setMemberData(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('reservations')
        .select('members')
        .not('members', 'is', null);

      if (fetchError) throw fetchError;

      // Search through all reservations for matching ITS number
      let foundMember = null;
      for (const reservation of data) {
        if (reservation.members && Array.isArray(reservation.members)) {
          const member = reservation.members.find(
            (m) => m.itsNo === itsNo || m.its_no === itsNo || m.ItsNo === itsNo
          );
          if (member) {
            foundMember = member;
            break;
          }
        }
      }

      if (foundMember) {
        setMemberData({
          name: foundMember.name || foundMember.Name || 'N/A',
          email: foundMember.email || foundMember.Email || 'N/A'
        });
      } else {
        setError('No member found with this ITS No.');
      }
    } catch (err) {
      setError('Error fetching member data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!memberData) {
      setError('Please fetch member data first');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (!printSlip && !sendEmail) {
      setError('Please select at least one option: Print Slip or Send Email');
      return;
    }

    // Show alert dialog
    const message = `The receipt was generated for ${memberData.name} of ${amount} paid by ${paymentMethod}`;
    setAlertMessage(message);
    setShowAlert(true);

    // Here you would implement actual print/email functionality
    if (printSlip) {
      console.log('Printing slip for:', memberData);
      // Implement print logic
    }
    if (sendEmail) {
      console.log('Sending email to:', memberData.email);
      // Implement email logic
    }

    // Clear form
    setTimeout(() => {
      setItsNo('');
      setMemberData(null);
      setFbType('F&B 1');
      setAmount('');
      setPaymentMethod('cash');
      setPrintSlip(false);
      setSendEmail(false);
      setError('');
    }, 3000);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">F&B Collection</h1>

      <div className="bg-white shadow-md rounded-lg p-6 space-y-6">
        {/* ITS No. Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ITS No.:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={itsNo}
              onChange={(e) => validateItsNo(e.target.value)}
              placeholder="Enter 8 digits"
              maxLength={8}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={fetchMemberData}
              disabled={itsNo.length !== 8 || loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Fetching...' : 'Fetch Data'}
            </button>
          </div>
          {itsNo.length > 0 && itsNo.length < 8 && (
            <p className="text-sm text-gray-500 mt-1">
              {8 - itsNo.length} digits remaining
            </p>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {/* Member Data Display */}
        {memberData && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="font-semibold text-green-800">Member Found:</p>
            <p className="text-gray-700">Name: {memberData.name}</p>
            <p className="text-gray-700">Email: {memberData.email}</p>
          </div>
        )}

        {/* F&B Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            F&B Type:
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                value="F&B 1"
                checked={fbType === 'F&B 1'}
                onChange={(e) => setFbType(e.target.value)}
                className="mr-2 h-4 w-4 text-blue-600"
              />
              <span className="text-gray-700">F&B 1</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="F&B 2"
                checked={fbType === 'F&B 2'}
                onChange={(e) => setFbType(e.target.value)}
                className="mr-2 h-4 w-4 text-blue-600"
              />
              <span className="text-gray-700">F&B 2</span>
            </label>
          </div>
        </div>

        {/* Amount Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount:
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            min="0"
            step="0.01"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Payment Method */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Method:
          </label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="cash">Cash</option>
            <option value="card">Card</option>
          </select>
        </div>

        {/* Checkboxes */}
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={printSlip}
              onChange={(e) => setPrintSlip(e.target.checked)}
              className="mr-2 h-4 w-4 text-blue-600 rounded"
            />
            <span className="text-gray-700">Print Slip</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
              className="mr-2 h-4 w-4 text-blue-600 rounded"
            />
            <span className="text-gray-700">Send Email</span>
          </label>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={!memberData || !amount}
          className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
        >
          Save
        </button>
      </div>

      {/* Alert Dialog */}
      {showAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">
              Success
            </h3>
            <p className="text-gray-700 mb-6">{alertMessage}</p>
            <button
              onClick={() => setShowAlert(false)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NiyazCollection;
