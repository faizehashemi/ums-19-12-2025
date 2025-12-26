import React from "react";

export default function StepMembers({
  members,
  memberData,
  visaTypes,
  addMember,
  removeMember,
  updateMemberData,
}) {
  return (
    <div className="animate-fadeIn">
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
        Add Members
      </h2>

      <button
        type="button"
        onClick={addMember}
        className="mb-6 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all"
      >
        + Add Member
      </button>

      <div className="space-y-6">
        {members.map((member, idx) => (
          <div
            key={member.id}
            className="border-2 border-gray-300 rounded-lg p-6 relative"
          >
            {members.length > 1 && (
              <button
                type="button"
                onClick={() => removeMember(member.id)}
                className="absolute top-3 right-3 px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
              >
                Remove
              </button>
            )}

            <h3 className="text-xl font-semibold text-purple-600 mb-4">
              Member {idx + 1}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="ITS No. *">
                <input
                  type="text"
                  value={memberData[member.id]?.itsNo || ""}
                  onChange={(e) => updateMemberData(member.id, "itsNo", e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:outline-none"
                />
              </Field>

              <Field label="Name *">
                <input
                  type="text"
                  value={memberData[member.id]?.name || ""}
                  onChange={(e) => updateMemberData(member.id, "name", e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:outline-none"
                />
              </Field>

              <Field label="Phone *">
                <input
                  type="tel"
                  value={memberData[member.id]?.phone || ""}
                  onChange={(e) => updateMemberData(member.id, "phone", e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:outline-none"
                />
              </Field>

              <Field label="Email *">
                <input
                  type="email"
                  value={memberData[member.id]?.email || ""}
                  onChange={(e) => updateMemberData(member.id, "email", e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:outline-none"
                />
              </Field>

              <Field label="Visa Type *">
                <select
                  value={memberData[member.id]?.visaType || ""}
                  onChange={(e) => updateMemberData(member.id, "visaType", e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:outline-none"
                >
                  <option value="">Select Visa Type</option>
                  {visaTypes.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </Field>

              <Field label="Passport Name *">
                <input
                  type="text"
                  value={memberData[member.id]?.passportName || ""}
                  onChange={(e) =>
                    updateMemberData(member.id, "passportName", e.target.value)
                  }
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:outline-none"
                />
              </Field>

              <Field label="Passport Number *">
                <input
                  type="text"
                  value={memberData[member.id]?.passportNumber || ""}
                  onChange={(e) =>
                    updateMemberData(member.id, "passportNumber", e.target.value)
                  }
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:outline-none"
                />
              </Field>

              <Field label="Age *">
                <input
                  type="number"
                  value={memberData[member.id]?.age || ""}
                  onChange={(e) => updateMemberData(member.id, "age", e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:outline-none"
                />
              </Field>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-gray-700 font-semibold mb-2">{label}</label>
      {children}
    </div>
  );
}
