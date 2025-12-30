import React from "react";

export default function StepDocuments({
  members,
  memberData,
  documents,
  setDocuments,
}) {
  return (
    <div className="animate-fadeIn">
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
        Upload Documents
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-3 text-left">Name</th>
              <th className="border border-gray-300 px-4 py-3 text-left">Visa Copy</th>
              <th className="border border-gray-300 px-4 py-3 text-left">
                Passport Copy
              </th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.id}>
                <td className="border border-gray-300 px-4 py-3">
                  {memberData[member.id]?.name || "N/A"}
                </td>
                <td className="border border-gray-300 px-4 py-3">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) =>
                      setDocuments({
                        ...documents,
                        [member.id]: {
                          ...documents[member.id],
                          visa: e.target.files?.[0],
                        },
                      })
                    }
                    className="w-full text-sm"
                  />
                </td>
                <td className="border border-gray-300 px-4 py-3">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) =>
                      setDocuments({
                        ...documents,
                        [member.id]: {
                          ...documents[member.id],
                          passport: e.target.files?.[0],
                        },
                      })
                    }
                    className="w-full text-sm"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
