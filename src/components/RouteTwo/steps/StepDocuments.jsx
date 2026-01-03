import React, { useState } from "react";
import { Upload, Users, FileCheck } from "lucide-react";

export default function StepDocuments({
  members,
  memberData,
  documents,
  setDocuments,
}) {
  const [uploadMode, setUploadMode] = useState("member-wise"); // 'bulk' or 'member-wise'
  const [bulkFiles, setBulkFiles] = useState({ visa: null, passport: null });

  const handleBulkUpload = (type, file) => {
    setBulkFiles((prev) => ({ ...prev, [type]: file }));

    // Assign the same file to all members
    const newDocuments = { ...documents };
    members.forEach((member) => {
      newDocuments[member.id] = {
        ...newDocuments[member.id],
        [type]: file,
      };
    });
    setDocuments(newDocuments);
  };

  const handleMemberFileUpload = (memberId, docType, file) => {
    setDocuments({
      ...documents,
      [memberId]: {
        ...documents[memberId],
        [docType]: file,
      },
    });
  };

  const getFileName = (file) => {
    return file?.name || null;
  };

  return (
    <div className="animate-fadeIn">
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
        Upload Documents
      </h2>

      {/* Toggle Upload Mode */}
      <div className="flex justify-center gap-4 mb-8">
        <button
          type="button"
          onClick={() => setUploadMode("bulk")}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
            uploadMode === "bulk"
              ? "bg-purple-600 text-white shadow-lg"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          <Upload className="w-5 h-5" />
          Bulk Upload
        </button>
        <button
          type="button"
          onClick={() => setUploadMode("member-wise")}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
            uploadMode === "member-wise"
              ? "bg-purple-600 text-white shadow-lg"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          <Users className="w-5 h-5" />
          Member-wise Upload
        </button>
      </div>

      {/* Bulk Upload Mode */}
      {uploadMode === "bulk" && (
        <div className="space-y-6">
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
            <p className="text-sm text-blue-700">
              <strong>Note:</strong> Upload a single file containing all visa copies for the entire group,
              and a single file containing all passport copies for the entire group. The same file will be
              assigned to all members.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border-2 border-dashed border-purple-300 rounded-lg p-6 bg-purple-50 hover:bg-purple-100 transition-all">
              <label className="block mb-3">
                <span className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-purple-600" />
                  All Visa Copies (Single File)
                </span>
                <span className="text-xs text-gray-600 mt-1 block">
                  Combined document for all group members
                </span>
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => handleBulkUpload("visa", e.target.files?.[0])}
                className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700 cursor-pointer"
              />
              {bulkFiles.visa && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700 flex items-center gap-2">
                    <FileCheck className="w-4 h-4" />
                    <span className="font-medium">{bulkFiles.visa.name}</span>
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    {(bulkFiles.visa.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              )}
            </div>

            <div className="border-2 border-dashed border-purple-300 rounded-lg p-6 bg-purple-50 hover:bg-purple-100 transition-all">
              <label className="block mb-3">
                <span className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-purple-600" />
                  All Passport Copies (Single File)
                </span>
                <span className="text-xs text-gray-600 mt-1 block">
                  Combined document for all group members
                </span>
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => handleBulkUpload("passport", e.target.files?.[0])}
                className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700 cursor-pointer"
              />
              {bulkFiles.passport && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700 flex items-center gap-2">
                    <FileCheck className="w-4 h-4" />
                    <span className="font-medium">{bulkFiles.passport.name}</span>
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    {(bulkFiles.passport.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Preview Summary for Bulk Upload */}
          {(bulkFiles.visa || bulkFiles.passport) && (
            <div className="mt-6 p-6 bg-gray-50 border border-gray-300 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-purple-600" />
                Upload Summary
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Visa Document:</p>
                  {bulkFiles.visa ? (
                    <div className="bg-white p-3 rounded border border-green-300">
                      <p className="text-sm text-green-700 font-medium">{bulkFiles.visa.name}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        Applied to all {members.length} member(s)
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No file uploaded</p>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Passport Document:</p>
                  {bulkFiles.passport ? (
                    <div className="bg-white p-3 rounded border border-green-300">
                      <p className="text-sm text-green-700 font-medium">{bulkFiles.passport.name}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        Applied to all {members.length} member(s)
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No file uploaded</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Member-wise Upload Mode */}
      {uploadMode === "member-wise" && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-purple-600 text-white">
                <th className="border border-gray-300 px-4 py-3 text-left">#</th>
                <th className="border border-gray-300 px-4 py-3 text-left">Member Name</th>
                <th className="border border-gray-300 px-4 py-3 text-left">Visa Copy</th>
                <th className="border border-gray-300 px-4 py-3 text-left">Passport Copy</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member, idx) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-3">{idx + 1}</td>
                  <td className="border border-gray-300 px-4 py-3 font-medium">
                    {memberData[member.id]?.name || "N/A"}
                  </td>
                  <td className="border border-gray-300 px-4 py-3">
                    <div className="space-y-2">
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) =>
                          handleMemberFileUpload(member.id, "visa", e.target.files?.[0])
                        }
                        className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700"
                      />
                      {documents[member.id]?.visa && (
                        <p className="text-xs text-green-600 flex items-center gap-1">
                          <FileCheck className="w-3 h-3" />
                          {getFileName(documents[member.id].visa)}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="border border-gray-300 px-4 py-3">
                    <div className="space-y-2">
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) =>
                          handleMemberFileUpload(member.id, "passport", e.target.files?.[0])
                        }
                        className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700"
                      />
                      {documents[member.id]?.passport && (
                        <p className="text-xs text-green-600 flex items-center gap-1">
                          <FileCheck className="w-3 h-3" />
                          {getFileName(documents[member.id].passport)}
                        </p>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
