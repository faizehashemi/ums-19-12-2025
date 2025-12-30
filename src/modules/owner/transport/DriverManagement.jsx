/* SQL: CREATE TABLE IF NOT EXISTS public.transport_drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  license_number TEXT UNIQUE NOT NULL,
  license_expiry DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'On Leave')),
  base_location TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
*/

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const DriverManagement = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    license_number: '',
    license_expiry: '',
    status: 'Active',
    base_location: '',
    notes: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('transport_drivers')
      .select('*')
      .order('created_at', { ascending: false });

    if (err) {
      setError(err.message);
    } else {
      setDrivers(data || []);
    }
    setLoading(false);
  };

  const openDrawer = (driver = null) => {
    if (driver) {
      setEditing(driver);
      setForm({
        name: driver.name,
        phone: driver.phone,
        license_number: driver.license_number,
        license_expiry: driver.license_expiry,
        status: driver.status,
        base_location: driver.base_location || '',
        notes: driver.notes || ''
      });
    } else {
      setEditing(null);
      setForm({
        name: '',
        phone: '',
        license_number: '',
        license_expiry: '',
        status: 'Active',
        base_location: '',
        notes: ''
      });
    }
    setFormErrors({});
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditing(null);
    setFormErrors({});
  };

  const validate = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = 'Name is required';
    if (!form.phone.trim()) errors.phone = 'Phone is required';
    if (!form.license_number.trim()) errors.license_number = 'License number is required';
    if (!form.license_expiry) errors.license_expiry = 'License expiry is required';
    return errors;
  };

  const handleSave = async () => {
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      license_number: form.license_number.trim(),
      license_expiry: form.license_expiry,
      status: form.status,
      base_location: form.base_location.trim() || null,
      notes: form.notes.trim() || null
    };

    if (editing) {
      const { error: err } = await supabase
        .from('transport_drivers')
        .update(payload)
        .eq('id', editing.id);

      if (err) {
        if (err.code === '23505') {
          if (err.message.includes('phone')) {
            setFormErrors({ phone: 'Phone already exists' });
          } else if (err.message.includes('license_number')) {
            setFormErrors({ license_number: 'License number already exists' });
          } else {
            setToast({ type: 'error', message: err.message });
          }
        } else {
          setToast({ type: 'error', message: err.message });
        }
        return;
      }
      setToast({ type: 'success', message: 'Driver updated' });
    } else {
      const { error: err } = await supabase
        .from('transport_drivers')
        .insert([payload]);

      if (err) {
        if (err.code === '23505') {
          if (err.message.includes('phone')) {
            setFormErrors({ phone: 'Phone already exists' });
          } else if (err.message.includes('license_number')) {
            setFormErrors({ license_number: 'License number already exists' });
          } else {
            setToast({ type: 'error', message: err.message });
          }
        } else {
          setToast({ type: 'error', message: err.message });
        }
        return;
      }
      setToast({ type: 'success', message: 'Driver created' });
    }

    closeDrawer();
    loadDrivers();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this driver?')) return;
    const { error: err } = await supabase
      .from('transport_drivers')
      .delete()
      .eq('id', id);

    if (err) {
      setToast({ type: 'error', message: err.message });
    } else {
      setToast({ type: 'success', message: 'Driver deleted' });
      loadDrivers();
    }
  };

  const getDaysUntilExpiry = (expiryDate) => {
    if (!expiryDate) return null;
    const diff = new Date(expiryDate) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const isExpired = (expiryDate) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 pb-24">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Driver Management</h1>
        <button
          onClick={() => openDrawer()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Add Driver
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {drivers.length === 0 && !error && (
        <div className="text-center py-12 text-gray-500">
          No drivers found. Add your first driver.
        </div>
      )}

      <div className="space-y-3">
        {drivers.map((driver) => {
          const daysLeft = getDaysUntilExpiry(driver.license_expiry);
          const expired = isExpired(driver.license_expiry);
          return (
            <div key={driver.id} className="bg-white border rounded-lg p-4 shadow-sm">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-semibold text-lg">{driver.name}</div>
                  <div className="text-sm text-gray-600">{driver.phone}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    driver.status === 'Active' ? 'bg-green-100 text-green-700' :
                    driver.status === 'On Leave' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {driver.status}
                  </span>
                  {expired && (
                    <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">
                      Expired Docs
                    </span>
                  )}
                </div>
              </div>

              <div className="text-sm space-y-1 mb-3">
                <div className="text-gray-600">
                  License: <span className="font-medium">{driver.license_number}</span>
                </div>
                <div className={`${expired ? 'text-red-600 font-medium' : daysLeft < 30 ? 'text-orange-600 font-medium' : 'text-gray-600'}`}>
                  Expiry: {driver.license_expiry}
                  {daysLeft !== null && (
                    <span className="ml-2">
                      ({expired ? 'EXPIRED' : `${daysLeft}d left`})
                    </span>
                  )}
                </div>
                {driver.base_location && (
                  <div className="text-gray-600">
                    Location: {driver.base_location}
                  </div>
                )}
                {driver.notes && (
                  <div className="text-gray-600">
                    Notes: {driver.notes}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => openDrawer(driver)}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(driver.id)}
                  className="px-3 py-1 text-sm bg-red-100 text-red-700 hover:bg-red-200 rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center sm:justify-center">
          <div className="bg-white w-full sm:w-96 sm:rounded-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {editing ? 'Edit Driver' : 'Add Driver'}
              </h2>
              <button onClick={closeDrawer} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
                {formErrors.name && <div className="text-red-600 text-sm mt-1">{formErrors.name}</div>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Phone *</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
                {formErrors.phone && <div className="text-red-600 text-sm mt-1">{formErrors.phone}</div>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">License Number *</label>
                <input
                  type="text"
                  value={form.license_number}
                  onChange={(e) => setForm({ ...form, license_number: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
                {formErrors.license_number && <div className="text-red-600 text-sm mt-1">{formErrors.license_number}</div>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">License Expiry *</label>
                <input
                  type="date"
                  value={form.license_expiry}
                  onChange={(e) => setForm({ ...form, license_expiry: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
                {formErrors.license_expiry && <div className="text-red-600 text-sm mt-1">{formErrors.license_expiry}</div>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Status *</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="On Leave">On Leave</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Base Location</label>
                <input
                  type="text"
                  value={form.base_location}
                  onChange={(e) => setForm({ ...form, base_location: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  rows="3"
                ></textarea>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t p-4 flex gap-2">
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save
              </button>
              <button
                onClick={closeDrawer}
                className="flex-1 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg ${
          toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        } text-white`}>
          {toast.message}
          <button
            onClick={() => setToast(null)}
            className="ml-4 text-white hover:text-gray-200"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

export default DriverManagement;
