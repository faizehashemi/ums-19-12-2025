import React, { useState, useRef } from "react";
import Modal from "../../ui/Modal";
import { Pencil, Trash2, Upload, Download } from "lucide-react";
import * as XLSX from "xlsx";

export default function StepMembers({
  members,
  memberData,
  visaTypes,
  addMember,
  removeMember,
  updateMemberData,
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [formData, setFormData] = useState({});
  const fileInputRef = useRef(null);

  const openAddModal = () => {
    setEditingMember(null);
    setFormData({});
    setIsModalOpen(true);
  };

  const openEditModal = (member) => {
    setEditingMember(member);
    setFormData(memberData[member.id] || {});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingMember(null);
    setFormData({});
  };

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    let memberId = editingMember?.id;

    if (!editingMember) {
      // Adding new member - get the ID that will be created
      const newMemberId = Date.now();
      addMember(newMemberId);
      memberId = newMemberId;
    }

    // Update all form data fields
    Object.entries(formData).forEach(([field, value]) => {
      updateMemberData(memberId, field, value);
    });

    closeModal();
  };

  const downloadSampleExcel = () => {
    const sampleData = [
      {
        "ITS No.": "12345678",
        "Name": "John Doe",
        "Phone": "+1234567890",
        "Email": "john@example.com",
        "Visa Type": "Umrah",
        "Passport Name": "JOHN DOE",
        "Passport Number": "AB1234567",
        "Date of Birth": "1990-01-15",
      },
      {
        "ITS No.": "87654321",
        "Name": "Jane Smith",
        "Phone": "+0987654321",
        "Email": "jane@example.com",
        "Visa Type": "Tourist",
        "Passport Name": "JANE SMITH",
        "Passport Number": "CD9876543",
        "Date of Birth": "1985-05-20",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Members");
    XLSX.writeFile(wb, "sample_members.xlsx");
  };

  const handleImportExcel = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) {
          alert("No data found in Excel file");
          return;
        }

        // Import each row as a member
        data.forEach((row) => {
          const newMemberId = Date.now() + Math.random();
          addMember(newMemberId);

          // Map Excel columns to member data fields
          const memberInfo = {
            itsNo: row["ITS No."] || row["ITS No"] || "",
            name: row["Name"] || "",
            phone: row["Phone"] || "",
            email: row["Email"] || "",
            visaType: row["Visa Type"] || row["VisaType"] || "",
            passportName: row["Passport Name"] || row["PassportName"] || "",
            passportNumber: row["Passport Number"] || row["PassportNumber"] || "",
            dateOfBirth: row["Date of Birth"] || row["DateOfBirth"] || "",
          };

          // Update member data
          Object.entries(memberInfo).forEach(([field, value]) => {
            if (value) {
              updateMemberData(newMemberId, field, value);
            }
          });
        });

        alert(`Successfully imported ${data.length} members`);
      } catch (error) {
        console.error("Error importing Excel:", error);
        alert("Error importing Excel file. Please check the format.");
      }
    };

    reader.readAsBinaryString(file);
    // Reset file input
    e.target.value = "";
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="animate-fadeIn">
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
        Add Members
      </h2>

      <div className="flex flex-wrap gap-3 mb-6">
        <button
          type="button"
          onClick={openAddModal}
          className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all flex items-center gap-2"
        >
          + Add Member
        </button>

        <button
          type="button"
          onClick={downloadSampleExcel}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Download Sample Excel
        </button>

        <button
          type="button"
          onClick={triggerFileInput}
          className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-all flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          Import from Excel
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleImportExcel}
          className="hidden"
        />
      </div>

      {members.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300 rounded-lg">
            <thead className="bg-purple-600 text-white">
              <tr>
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">ITS No.</th>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Phone</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Visa Type</th>
                <th className="px-4 py-3 text-left">Passport Name</th>
                <th className="px-4 py-3 text-left">Passport Number</th>
                <th className="px-4 py-3 text-left">Date of Birth</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member, idx) => (
                <tr key={member.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">{idx + 1}</td>
                  <td className="px-4 py-3">{memberData[member.id]?.itsNo || "-"}</td>
                  <td className="px-4 py-3">{memberData[member.id]?.name || "-"}</td>
                  <td className="px-4 py-3">{memberData[member.id]?.phone || "-"}</td>
                  <td className="px-4 py-3">{memberData[member.id]?.email || "-"}</td>
                  <td className="px-4 py-3">{memberData[member.id]?.visaType || "-"}</td>
                  <td className="px-4 py-3">{memberData[member.id]?.passportName || "-"}</td>
                  <td className="px-4 py-3">{memberData[member.id]?.passportNumber || "-"}</td>
                  <td className="px-4 py-3">{memberData[member.id]?.dateOfBirth || "-"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(member)}
                        className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-all"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      {members.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMember(member.id)}
                          className="p-2 bg-red-500 text-white rounded hover:bg-red-600 transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingMember ? "Edit Member" : "Add Member"}
        size="lg"
      >
        <Modal.Content>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="ITS No. *">
              <input
                type="text"
                value={formData.itsNo || ""}
                onChange={(e) => handleFormChange("itsNo", e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:outline-none"
              />
            </Field>

            <Field label="Name *">
              <input
                type="text"
                value={formData.name || ""}
                onChange={(e) => handleFormChange("name", e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:outline-none"
              />
            </Field>

            <Field label="Phone *">
              <input
                type="tel"
                value={formData.phone || ""}
                onChange={(e) => handleFormChange("phone", e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:outline-none"
              />
            </Field>

            <Field label="Email *">
              <input
                type="email"
                value={formData.email || ""}
                onChange={(e) => handleFormChange("email", e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:outline-none"
              />
            </Field>

            <Field label="Visa Type *">
              <select
                value={formData.visaType || ""}
                onChange={(e) => handleFormChange("visaType", e.target.value)}
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
                value={formData.passportName || ""}
                onChange={(e) => handleFormChange("passportName", e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:outline-none"
              />
            </Field>

            <Field label="Passport Number *">
              <input
                type="text"
                value={formData.passportNumber || ""}
                onChange={(e) => handleFormChange("passportNumber", e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:outline-none"
              />
            </Field>

            <Field label="Date of Birth *">
              <input
                type="date"
                value={formData.dateOfBirth || ""}
                onChange={(e) => handleFormChange("dateOfBirth", e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:outline-none"
              />
            </Field>
          </div>
        </Modal.Content>

        <Modal.Footer>
          <button
            type="button"
            onClick={closeModal}
            className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all"
          >
            {editingMember ? "Update" : "Add"} Member
          </button>
        </Modal.Footer>
      </Modal>
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
