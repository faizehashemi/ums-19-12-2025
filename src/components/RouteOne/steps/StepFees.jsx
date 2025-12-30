import React from "react";

export default function StepFees({ fees, accommodation }) {
  return (
    <div className="animate-fadeIn">
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
        Lawazim (Fees Breakdown)
      </h2>

      <div className="space-y-4">
        {/* Accommodation Lawazim Section */}
        <div className="border-b-2 border-gray-300 pb-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Accommodation Lawazim</h3>
          <Row label="Base Fee (per person)" value={`SAR ${fees.baseFee}`} />
          <Row
            label={`Accommodation (${accommodation})`}
            value={`SAR ${fees.accommodationFee}`}
          />
          <Row label="Per Person Fee" value={`SAR ${fees.perPersonFee}`} />
          <Row label="Number of Members" value={`${fees.numMembers}`} />
          <Row
            label="Total Accommodation Fee"
            value={`SAR ${(fees.perPersonFee * fees.numMembers).toFixed(2)}`}
          />
        </div>

        {/* Transport Fee Section */}
        <div className="border-b-2 border-gray-300 pb-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Transport Lawazim</h3>
          <Row
            label={`Transport Fee (per person) - Route 1`}
            value={fees.transportFeePerPerson > 0 ? `SAR ${fees.transportFeePerPerson}` : 'N/A'}
          />
          <Row
            label="Total Transport Fee"
            value={fees.totalTransportFee > 0 ? `SAR ${fees.totalTransportFee}` : 'N/A'}
          />
          <p className="text-xs text-gray-500 mt-2 italic">
            Route 1: Jeddah Airport → Makkah → Atraf Makkah → Madina → Atraf Madina → Makkah → Jeddah Airport
          </p>
          {fees.transportFeePerPerson === 0 && (
            <p className="text-xs text-amber-600 mt-2">
              ⚠️ Transport pricing available for groups of 2-49 passengers only.
            </p>
          )}
        </div>

        {/* Tax Section */}
        <div className="border-b-2 border-gray-300 pb-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Tax Breakdown</h3>
          <Row label="Subtotal (before VAT)" value={`SAR ${fees.subtotal?.toFixed(2) || '0.00'}`} />
          <Row label="VAT (15%)" value={`SAR ${fees.vat?.toFixed(2) || '0.00'}`} />
        </div>

        <div className="flex justify-between py-4 text-xl font-bold text-purple-600 border-t-2 border-purple-200 mt-4">
          <span>Total Amount (including VAT)</span>
          <span>SAR {fees.total?.toFixed(2) || '0.00'}</span>
        </div>

        <p className="text-sm text-gray-500">
          Click <b>Finish</b> to submit your reservation.
        </p>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between py-3 border-b border-gray-300">
      <span className="text-gray-700">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
