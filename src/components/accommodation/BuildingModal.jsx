import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Building2, Trash2 } from 'lucide-react';

const BuildingModal = ({ isOpen, onClose, building = null, onSave, onDelete }) => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    totalFloors: 1,
    description: '',
    status: 'active'
  });
  const [errors, setErrors] = useState({});
  const [isDeleting, setIsDeleting] = useState(false);

  const isEditMode = !!building;

  useEffect(() => {
    if (building) {
      setFormData({
        name: building.name || '',
        address: building.address || '',
        totalFloors: building.total_floors || building.totalFloors || 1,
        description: building.description || '',
        status: building.status || 'active'
      });
    } else {
      setFormData({
        name: '',
        address: '',
        totalFloors: 1,
        description: '',
        status: 'active'
      });
    }
    setErrors({});
    setIsDeleting(false);
  }, [building, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'totalFloors' ? parseInt(value) || 1 : value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Building name is required';
    }

    if (formData.totalFloors < 1 || formData.totalFloors > 100) {
      newErrors.totalFloors = 'Total floors must be between 1 and 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const dataToSave = {
      ...formData,
      total_floors: formData.totalFloors
    };

    if (isEditMode) {
      dataToSave.id = building.id;
    }

    onSave(dataToSave);
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${building.name}"? This will also delete all rooms in this building.`)) {
      onDelete(building.id);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit Building' : 'Add New Building'}
      size="md"
    >
      <form onSubmit={handleSubmit}>
        <Modal.Content>
          <div className="space-y-4">
            {/* Building Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Building Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., Building A"
              />
              {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
            </div>

            {/* Address */}
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 123 Main Street"
              />
            </div>

            {/* Total Floors */}
            <div>
              <label htmlFor="totalFloors" className="block text-sm font-medium text-gray-700 mb-1">
                Total Floors <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="totalFloors"
                name="totalFloors"
                value={formData.totalFloors}
                onChange={handleChange}
                min="1"
                max="100"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.totalFloors ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.totalFloors && <p className="mt-1 text-sm text-red-500">{errors.totalFloors}</p>}
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
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Additional notes about this building..."
              />
            </div>
          </div>
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
            icon={<Building2 className="w-4 h-4" />}
          >
            {isEditMode ? 'Update Building' : 'Add Building'}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
};

export default BuildingModal;
