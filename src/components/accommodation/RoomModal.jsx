import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { DoorClosedLocked, Trash2, HelpCircle } from 'lucide-react';

const RoomModal = ({ isOpen, onClose, room = null, buildings = [], onSave, onDelete }) => {
  const [mode, setMode] = useState('single'); // 'single' or 'bulk'
  const [formData, setFormData] = useState({
    buildingId: '',
    roomNumber: '',
    floor: 1,
    bedCapacity: 1,
    status: 'available',
    roomType: '',
    notes: ''
  });
  const [bulkData, setBulkData] = useState({
    buildingId: '',
    floor: 1,
    roomsText: '',
    status: 'available',
    roomType: ''
  });
  const [errors, setErrors] = useState({});
  const [bulkPreview, setBulkPreview] = useState([]);
  const [showHelp, setShowHelp] = useState(false);

  const isEditMode = !!room;

  useEffect(() => {
    if (room) {
      setMode('single');
      setFormData({
        buildingId: room.building_id || room.buildingId || '',
        roomNumber: room.room_number || room.number || '',
        floor: room.floor || 1,
        bedCapacity: room.bed_capacity || room.totalBeds || 1,
        status: room.status || 'available',
        roomType: room.room_type || room.roomType || '',
        notes: room.notes || ''
      });
    } else {
      setFormData({
        buildingId: buildings[0]?.id || '',
        roomNumber: '',
        floor: 1,
        bedCapacity: 1,
        status: 'available',
        roomType: '',
        notes: ''
      });
      setBulkData({
        buildingId: buildings[0]?.id || '',
        floor: 1,
        roomsText: '',
        status: 'available',
        roomType: ''
      });
    }
    setErrors({});
    setBulkPreview([]);
  }, [room, isOpen, buildings]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['floor', 'bedCapacity'].includes(name) ? parseInt(value) || 1 : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleBulkChange = (e) => {
    const { name, value } = e.target;
    setBulkData(prev => ({
      ...prev,
      [name]: name === 'floor' ? parseInt(value) || 1 : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    // Auto-generate preview when rooms text changes
    if (name === 'roomsText') {
      generateBulkPreview(value, bulkData.floor, parseInt(value) || 1);
    }
  };

  const generateBulkPreview = (roomsText, floor) => {
    if (!roomsText.trim()) {
      setBulkPreview([]);
      return;
    }

    try {
      const parts = roomsText.split('-').map(p => p.trim()).filter(p => p);
      const preview = [];

      parts.forEach(part => {
        // Check if it has capacity in brackets: "101(4)" or "101-103(4)"
        const match = part.match(/^(.+?)\((\d+)\)$/);

        if (match) {
          const roomSpec = match[1];
          const capacity = parseInt(match[2]);

          // Check if it's a range: "101-103"
          const rangeMatch = roomSpec.match(/^(\d+)-(\d+)$/);
          if (rangeMatch) {
            const start = parseInt(rangeMatch[1]);
            const end = parseInt(rangeMatch[2]);

            for (let i = start; i <= end; i++) {
              preview.push({
                roomNumber: i.toString(),
                bedCapacity: capacity
              });
            }
          } else {
            // Single room with capacity
            preview.push({
              roomNumber: roomSpec,
              bedCapacity: capacity
            });
          }
        } else {
          // Check if it's a range without capacity: "101-103"
          const rangeMatch = part.match(/^(\d+)-(\d+)$/);
          if (rangeMatch) {
            const start = parseInt(rangeMatch[1]);
            const end = parseInt(rangeMatch[2]);

            for (let i = start; i <= end; i++) {
              preview.push({
                roomNumber: i.toString(),
                bedCapacity: 1 // default capacity
              });
            }
          } else {
            // Single room without capacity
            preview.push({
              roomNumber: part,
              bedCapacity: 1 // default capacity
            });
          }
        }
      });

      setBulkPreview(preview);
    } catch (error) {
      console.error('Error parsing bulk rooms:', error);
      setBulkPreview([]);
    }
  };

  const validate = () => {
    const newErrors = {};

    if (mode === 'single') {
      if (!formData.buildingId) {
        newErrors.buildingId = 'Building is required';
      }
      if (!formData.roomNumber.trim()) {
        newErrors.roomNumber = 'Room number is required';
      }
      if (formData.floor < 1) {
        newErrors.floor = 'Floor must be at least 1';
      }
      if (formData.bedCapacity < 1) {
        newErrors.bedCapacity = 'Bed capacity must be at least 1';
      }
    } else {
      if (!bulkData.buildingId) {
        newErrors.buildingId = 'Building is required';
      }
      if (!bulkData.roomsText.trim()) {
        newErrors.roomsText = 'Room numbers are required';
      }
      if (bulkPreview.length === 0) {
        newErrors.roomsText = 'Invalid format. Please check the help guide.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    if (mode === 'single') {
      const dataToSave = {
        building_id: formData.buildingId,
        room_number: formData.roomNumber,
        floor: formData.floor,
        bed_capacity: formData.bedCapacity,
        status: formData.status,
        room_type: formData.roomType || null,
        notes: formData.notes || null
      };

      if (isEditMode) {
        dataToSave.id = room.id;
      }

      onSave([dataToSave]); // Send as array for consistency
    } else {
      // Bulk creation
      const roomsToCreate = bulkPreview.map(preview => ({
        building_id: bulkData.buildingId,
        room_number: preview.roomNumber,
        floor: bulkData.floor,
        bed_capacity: preview.bedCapacity,
        status: bulkData.status,
        room_type: bulkData.roomType || null,
        notes: null
      }));

      onSave(roomsToCreate);
    }

    onClose();
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete room ${room.room_number || room.number}?`)) {
      onDelete(room.id);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit Room' : 'Add New Room(s)'}
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        <Modal.Content>
          {/* Mode Toggle (only in add mode) */}
          {!isEditMode && (
            <div className="mb-6 flex gap-2 p-1 bg-gray-100 rounded-lg">
              <button
                type="button"
                onClick={() => setMode('single')}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  mode === 'single'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Single Room
              </button>
              <button
                type="button"
                onClick={() => setMode('bulk')}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  mode === 'bulk'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Bulk Create
              </button>
            </div>
          )}

          {mode === 'single' ? (
            /* SINGLE ROOM FORM */
            <div className="space-y-4">
              {/* Building */}
              <div>
                <label htmlFor="buildingId" className="block text-sm font-medium text-gray-700 mb-1">
                  Building <span className="text-red-500">*</span>
                </label>
                <select
                  id="buildingId"
                  name="buildingId"
                  value={formData.buildingId}
                  onChange={handleChange}
                  disabled={isEditMode}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.buildingId ? 'border-red-500' : 'border-gray-300'
                  } ${isEditMode ? 'bg-gray-100' : ''}`}
                >
                  <option value="">Select a building</option>
                  {buildings.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
                {errors.buildingId && <p className="mt-1 text-sm text-red-500">{errors.buildingId}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Room Number */}
                <div>
                  <label htmlFor="roomNumber" className="block text-sm font-medium text-gray-700 mb-1">
                    Room Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="roomNumber"
                    name="roomNumber"
                    value={formData.roomNumber}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.roomNumber ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="e.g., 101"
                  />
                  {errors.roomNumber && <p className="mt-1 text-sm text-red-500">{errors.roomNumber}</p>}
                </div>

                {/* Floor */}
                <div>
                  <label htmlFor="floor" className="block text-sm font-medium text-gray-700 mb-1">
                    Floor <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="floor"
                    name="floor"
                    value={formData.floor}
                    onChange={handleChange}
                    min="1"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.floor ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.floor && <p className="mt-1 text-sm text-red-500">{errors.floor}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Bed Capacity */}
                <div>
                  <label htmlFor="bedCapacity" className="block text-sm font-medium text-gray-700 mb-1">
                    Bed Capacity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="bedCapacity"
                    name="bedCapacity"
                    value={formData.bedCapacity}
                    onChange={handleChange}
                    min="1"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.bedCapacity ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.bedCapacity && <p className="mt-1 text-sm text-red-500">{errors.bedCapacity}</p>}
                </div>

                {/* Status */}
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="available">Available</option>
                    <option value="occupied">Occupied</option>
                    <option value="cleaning">Needs Cleaning</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>
              </div>

              {/* Room Type */}
              <div>
                <label htmlFor="roomType" className="block text-sm font-medium text-gray-700 mb-1">
                  Room Type
                </label>
                <input
                  type="text"
                  id="roomType"
                  name="roomType"
                  value={formData.roomType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Standard, Deluxe, Dormitory"
                />
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Additional notes..."
                />
              </div>
            </div>
          ) : (
            /* BULK CREATION FORM */
            <div className="space-y-4">
              {/* Building */}
              <div>
                <label htmlFor="bulkBuildingId" className="block text-sm font-medium text-gray-700 mb-1">
                  Building <span className="text-red-500">*</span>
                </label>
                <select
                  id="bulkBuildingId"
                  name="buildingId"
                  value={bulkData.buildingId}
                  onChange={handleBulkChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.buildingId ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select a building</option>
                  {buildings.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
                {errors.buildingId && <p className="mt-1 text-sm text-red-500">{errors.buildingId}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Floor */}
                <div>
                  <label htmlFor="bulkFloor" className="block text-sm font-medium text-gray-700 mb-1">
                    Floor <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="bulkFloor"
                    name="floor"
                    value={bulkData.floor}
                    onChange={handleBulkChange}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Status */}
                <div>
                  <label htmlFor="bulkStatus" className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    id="bulkStatus"
                    name="status"
                    value={bulkData.status}
                    onChange={handleBulkChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="available">Available</option>
                    <option value="blocked">Blocked</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
              </div>

              {/* Room Type */}
              <div>
                <label htmlFor="bulkRoomType" className="block text-sm font-medium text-gray-700 mb-1">
                  Room Type
                </label>
                <input
                  type="text"
                  id="bulkRoomType"
                  name="roomType"
                  value={bulkData.roomType}
                  onChange={handleBulkChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Standard, Deluxe"
                />
              </div>

              {/* Rooms Text Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="roomsText" className="block text-sm font-medium text-gray-700">
                    Room Numbers <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowHelp(!showHelp)}
                    className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                  >
                    <HelpCircle className="w-4 h-4" />
                    Help
                  </button>
                </div>
                <textarea
                  id="roomsText"
                  name="roomsText"
                  value={bulkData.roomsText}
                  onChange={handleBulkChange}
                  rows="4"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm ${
                    errors.roomsText ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="101(4)-102(4)-103(2)-104(6)"
                />
                {errors.roomsText && <p className="mt-1 text-sm text-red-500">{errors.roomsText}</p>}

                {showHelp && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                    <p className="font-semibold text-blue-900 mb-2">Format Examples:</p>
                    <ul className="space-y-1 text-blue-800">
                      <li><code className="bg-white px-1 rounded">101(4)-102(4)-103(2)</code> - Rooms 101, 102, 103 with 4, 4, 2 beds</li>
                      <li><code className="bg-white px-1 rounded">101-105(4)</code> - Rooms 101 to 105, all with 4 beds</li>
                      <li><code className="bg-white px-1 rounded">201(6)-205-210(2)</code> - Room 201 (6 beds), rooms 205 to 210 (2 beds each)</li>
                      <li><code className="bg-white px-1 rounded">A1-A5(1)</code> - Rooms A1 to A5, 1 bed each</li>
                    </ul>
                    <p className="mt-2 text-xs text-blue-700">
                      Use dashes (-) to separate rooms or ranges. Add capacity in brackets (n). Default capacity is 1 if not specified.
                    </p>
                  </div>
                )}
              </div>

              {/* Preview */}
              {bulkPreview.length > 0 && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    Preview ({bulkPreview.length} room{bulkPreview.length !== 1 ? 's' : ''})
                  </h4>
                  <div className="max-h-40 overflow-y-auto">
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                      {bulkPreview.map((preview, idx) => (
                        <div
                          key={idx}
                          className="px-2 py-1 bg-white border border-gray-300 rounded text-center text-xs"
                        >
                          <div className="font-semibold text-gray-900">{preview.roomNumber}</div>
                          <div className="text-gray-600">{preview.bedCapacity} bed{preview.bedCapacity !== 1 ? 's' : ''}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal.Content>

        <Modal.Footer>
          {isEditMode && (
            <Button
              type="button"
              variant="danger"
              icon={<Trash2 className="w-4 h-4" />}
              onClick={handleDelete}
              className="mr-auto"
            >
              Delete
            </Button>
          )}
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            icon={<DoorClosedLocked className="w-4 h-4" />}
          >
            {isEditMode
              ? 'Update Room'
              : mode === 'bulk'
              ? `Create ${bulkPreview.length} Room${bulkPreview.length !== 1 ? 's' : ''}`
              : 'Add Room'}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
};

export default RoomModal;
