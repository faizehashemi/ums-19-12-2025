import React from "react";

export default function StepFees({ fees, accommodation }) {
  return (
    <div className="animate-fadeIn">
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
        Lawazim (Fees Breakdown)
      </h2>

      <div className="space-y-4">
        <Row label="Base Fee (per person)" value={`SAR ${fees.baseFee}`} />
        <Row
          label={`Accommodation (${accommodation})`}
          value={`SAR ${fees.accommodationFee}`}
        />
        <Row label="Number of Members" value={`${fees.numMembers}`} />
        <div className="flex justify-between py-4 text-xl font-bold text-purple-600">
          <span>Total Amount</span>
          <span>SAR {fees.total}</span>
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
