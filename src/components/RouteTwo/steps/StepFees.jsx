import React from "react";

export default function StepFees({ fees, accommodation }) {
  return (
    <div className="animate-fadeIn">
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
        Lawazim (Fees Breakdown)
      </h2>

      <div className="space-y-4">
        {/* Member-wise Breakdown */}
        <div className="border-b-2 border-gray-300 pb-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Member-wise Accommodation Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg text-sm">
              <thead className="bg-purple-100">
                <tr>
                  <th className="px-3 py-2 text-left">Member</th>
                  <th className="px-3 py-2 text-left">Age Category</th>
                  <th className="px-3 py-2 text-right">Makkah (SAR)</th>
                  <th className="px-3 py-2 text-right">Madina (SAR)</th>
                  <th className="px-3 py-2 text-right">Total (SAR)</th>
                </tr>
              </thead>
              <tbody>
                {fees.memberBreakdown?.map((member, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="px-3 py-2">{member.name}</td>
                    <td className="px-3 py-2">{member.ageCategory}</td>
                    <td className="px-3 py-2 text-right">
                      {member.makkahRate} × {member.makkahDays} = {member.makkahFee.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {member.madinaRate} × {member.madinaDays} = {member.madinaFee.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold">{member.totalFee.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Accommodation Summary */}
        <div className="border-b-2 border-gray-300 pb-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Accommodation Lawazim Summary</h3>
          <Row
            label={`Makkah (${fees.makkahRoomType} Room - ${fees.makkahDays} days)`}
            value={`SAR ${fees.makkahTotal?.toFixed(2) || '0.00'}`}
          />
          <Row
            label={`Madina (Sharing Room - ${fees.madinaDays} days)`}
            value={`SAR ${fees.madinaTotal?.toFixed(2) || '0.00'}`}
          />
          <Row
            label="Total Accommodation Fees"
            value={`SAR ${fees.totalAccommodationFees?.toFixed(2) || '0.00'}`}
            highlight
          />
          <p className="text-xs text-gray-500 mt-2 italic">
            Note: Lawazim accepted in Saudi Riyals only
          </p>
        </div>

        {/* Transport Fee Section */}
        <div className="border-b-2 border-gray-300 pb-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Transport Lawazim</h3>
          <Row
            label={`Transport Fee (per person) - Route 2`}
            value={fees.transportFeePerPerson > 0 ? `SAR ${fees.transportFeePerPerson}` : 'N/A'}
          />
          <Row
            label="Number of Members"
            value={`${fees.numMembers}`}
          />
          <Row
            label="Total Transport Fee"
            value={fees.totalTransportFee > 0 ? `SAR ${fees.totalTransportFee?.toFixed(2)}` : 'N/A'}
            highlight
          />
          <p className="text-xs text-gray-500 mt-2 italic">
            Route 2: Jeddah Airport → Makkah → Atraf Makkah → Madina → Atraf Madina → Madina Airport
          </p>
          <div className="mt-2 text-xs text-gray-600">
            <p className="font-semibold mb-1">Transport Pricing (per person):</p>
            <ul className="list-disc list-inside space-y-0.5 ml-2">
              <li>2-4 passengers: SR 300</li>
              <li>5-8 passengers: SR 250</li>
              <li>9-24 passengers: SR 200</li>
              <li>25-39 passengers: SR 150</li>
              <li>40-49 passengers: SR 100</li>
            </ul>
          </div>
          {fees.transportFeePerPerson === 0 && (
            <p className="text-xs text-amber-600 mt-2">
              ⚠️ Transport pricing available for groups of 2-49 passengers only.
            </p>
          )}
        </div>

        {/* Tax Section */}
        <div className="border-b-2 border-gray-300 pb-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Government Taxes</h3>
          <Row
            label="Municipal Tax (2.5% on Accommodation)"
            value={`SAR ${fees.municipalTax?.toFixed(2) || '0.00'}`}
          />
          <Row
            label="Subtotal (before VAT)"
            value={`SAR ${fees.subtotalBeforeVAT?.toFixed(2) || '0.00'}`}
          />
          <Row
            label="VAT (15% on Accommodation, Municipal Tax & Transport)"
            value={`SAR ${fees.vat?.toFixed(2) || '0.00'}`}
          />
          <p className="text-xs text-gray-500 mt-2 italic">
            VAT (15%) and Municipal Tax (2.5%) applicable as per Saudi regulations
          </p>
        </div>

        <div className="flex justify-between py-4 text-xl font-bold text-purple-600 border-t-2 border-purple-200 mt-4">
          <span>Total Amount (including all taxes)</span>
          <span>SAR {fees.total?.toFixed(2) || '0.00'}</span>
        </div>

        <p className="text-sm text-gray-500 text-center">
          Click <b>Next</b> to review your reservation details.
        </p>
      </div>
    </div>
  );
}

function Row({ label, value, highlight = false }) {
  return (
    <div className={`flex justify-between py-3 border-b border-gray-300 ${highlight ? 'bg-purple-50' : ''}`}>
      <span className={`${highlight ? 'font-semibold text-gray-800' : 'text-gray-700'}`}>{label}</span>
      <span className={`${highlight ? 'font-bold text-purple-600' : 'font-semibold'}`}>{value}</span>
    </div>
  );
}
