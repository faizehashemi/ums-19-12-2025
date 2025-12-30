/* SQL: CREATE TABLE IF NOT EXISTS public.transport_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plate TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL,
  capacity INTEGER NOT NULL,
  insurance_expiry DATE NOT NULL,
  registration_expiry DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'In Use', 'Under Maintenance', 'Blocked')),
  base_location TEXT,
  odometer INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.transport_maintenance_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.transport_vehicles(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
  description TEXT NOT NULL,
  reported_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Resolved', 'Closed')),
  assigned_to TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
*/

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const VehicleMaintenance = () => {
  const [vehicles, setVehicles] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerType, setDrawerType] = useState('vehicle');
  const [editing, setEditing] = useState(null);
  const [vehicleForm, setVehicleForm] = useState({
    plate: '',
    type: '',
    capacity: '',
    insurance_expiry: '',
    registration_expiry: '',
    status: 'Available',
    base_location: '',
    odometer: ''
  });
  const [ticketForm, setTicketForm] = useState({
    vehicle_id: '',
    category: '',
    severity: 'Medium',
    description: '',
    assigned_to: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [toast, setToast] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    const [vRes, tRes] = await Promise.all([
      supabase.from('transport_vehicles').select('*').order('created_at', { ascending: false }),
      supabase.from('transport_maintenance_tickets').select('*').order('reported_at', { ascending: false })
    ]);

    if (vRes.error) {
      setError(vRes.error.message);
    } else {
      setVehicles(vRes.data || []);
    }

    if (tRes.error && !error) {
      setError(tRes.error.message);
    } else {
      setTickets(tRes.data || []);
    }

    setLoading(false);
  };

  const openVehicleDrawer = (vehicle = null) => {
    setDrawerType('vehicle');
    if (vehicle) {
      setEditing(vehicle);
      setVehicleForm({
        plate: vehicle.plate,
        type: vehicle.type,
        capacity: vehicle.capacity.toString(),
        insurance_expiry: vehicle.insurance_expiry,
        registration_expiry: vehicle.registration_expiry,
        status: vehicle.status,
        base_location: vehicle.base_location || '',
        odometer: vehicle.odometer ? vehicle.odometer.toString() : '0'
      });
    } else {
      setEditing(null);
      setVehicleForm({
        plate: '',
        type: '',
        capacity: '',
        insurance_expiry: '',
        registration_expiry: '',
        status: 'Available',
        base_location: '',
        odometer: '0'
      });
    }
    setFormErrors({});
    setDrawerOpen(true);
  };

  const openTicketDrawer = (vehicleId = null) => {
    setDrawerType('ticket');
    setEditing(null);
    setTicketForm({
      vehicle_id: vehicleId || '',
      category: '',
      severity: 'Medium',
      description: '',
      assigned_to: ''
    });
    setFormErrors({});
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditing(null);
    setFormErrors({});
  };

  const validateVehicle = () => {
    const errors = {};
    if (!vehicleForm.plate.trim()) errors.plate = 'Plate is required';
    if (!vehicleForm.type.trim()) errors.type = 'Type is required';
    if (!vehicleForm.capacity || parseInt(vehicleForm.capacity) < 1) errors.capacity = 'Valid capacity required';
    if (!vehicleForm.insurance_expiry) errors.insurance_expiry = 'Insurance expiry required';
    if (!vehicleForm.registration_expiry) errors.registration_expiry = 'Registration expiry required';

    if (vehicleForm.status === 'Available' && new Date(vehicleForm.insurance_expiry) < new Date()) {
      errors.insurance_expiry = 'Cannot set Available with expired insurance';
      errors._general = 'Vehicle must be Blocked if insurance expired';
    }

    return errors;
  };

  const validateTicket = () => {
    const errors = {};
    if (!ticketForm.vehicle_id) errors.vehicle_id = 'Vehicle is required';
    if (!ticketForm.category.trim()) errors.category = 'Category is required';
    if (!ticketForm.description.trim()) errors.description = 'Description is required';
    return errors;
  };

  const handleSaveVehicle = async () => {
    const errors = validateVehicle();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const payload = {
      plate: vehicleForm.plate.trim(),
      type: vehicleForm.type.trim(),
      capacity: parseInt(vehicleForm.capacity),
      insurance_expiry: vehicleForm.insurance_expiry,
      registration_expiry: vehicleForm.registration_expiry,
      status: vehicleForm.status,
      base_location: vehicleForm.base_location.trim() || null,
      odometer: vehicleForm.odometer ? parseInt(vehicleForm.odometer) : 0
    };

    if (editing) {
      const { error: err } = await supabase
        .from('transport_vehicles')
        .update(payload)
        .eq('id', editing.id);

      if (err) {
        if (err.code === '23505') {
          setFormErrors({ plate: 'Plate already exists' });
        } else {
          setToast({ type: 'error', message: err.message });
        }
        return;
      }
      setToast({ type: 'success', message: 'Vehicle updated' });
    } else {
      const { error: err } = await supabase
        .from('transport_vehicles')
        .insert([payload]);

      if (err) {
        if (err.code === '23505') {
          setFormErrors({ plate: 'Plate already exists' });
        } else {
          setToast({ type: 'error', message: err.message });
        }
        return;
      }
      setToast({ type: 'success', message: 'Vehicle created' });
    }

    closeDrawer();
    loadData();
  };

  const handleSaveTicket = async () => {
    const errors = validateTicket();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const payload = {
      vehicle_id: ticketForm.vehicle_id,
      category: ticketForm.category.trim(),
      severity: ticketForm.severity,
      description: ticketForm.description.trim(),
      status: 'Open',
      assigned_to: ticketForm.assigned_to.trim() || null
    };

    const { error: err } = await supabase
      .from('transport_maintenance_tickets')
      .insert([payload]);

    if (err) {
      setToast({ type: 'error', message: err.message });
      return;
    }

    if (ticketForm.severity === 'Critical') {
      const { error: vErr } = await supabase
        .from('transport_vehicles')
        .update({ status: 'Under Maintenance' })
        .eq('id', ticketForm.vehicle_id);

      if (vErr) {
        setToast({ type: 'error', message: `Ticket created but failed to update vehicle: ${vErr.message}` });
      } else {
        setToast({ type: 'success', message: 'Critical ticket created, vehicle set to Under Maintenance' });
      }
    } else {
      setToast({ type: 'success', message: 'Ticket created' });
    }

    closeDrawer();
    loadData();
  };

  const handleDeleteVehicle = async (id) => {
    if (!confirm('Delete this vehicle?')) return;
    const { error: err } = await supabase
      .from('transport_vehicles')
      .delete()
      .eq('id', id);

    if (err) {
      setToast({ type: 'error', message: err.message });
    } else {
      setToast({ type: 'success', message: 'Vehicle deleted' });
      loadData();
    }
  };

  const updateTicketStatus = async (id, status) => {
    const { error: err } = await supabase
      .from('transport_maintenance_tickets')
      .update({ status })
      .eq('id', id);

    if (err) {
      setToast({ type: 'error', message: err.message });
    } else {
      setToast({ type: 'success', message: `Ticket ${status}` });
      loadData();
    }
  };

  const isExpired = (date) => {
    if (!date) return false;
    return new Date(date) < new Date();
  };

  const getDaysUntil = (date) => {
    if (!date) return null;
    const diff = new Date(date) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 pb-24">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Vehicle Maintenance</h1>
        <button
          onClick={() => openVehicleDrawer()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Add Vehicle
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {vehicles.length === 0 && !error && (
        <div className="text-center py-12 text-gray-500">
          No vehicles found. Add your first vehicle.
        </div>
      )}

      <div className="space-y-4">
        {vehicles.map((vehicle) => {
          const insuranceExpired = isExpired(vehicle.insurance_expiry);
          const registrationExpired = isExpired(vehicle.registration_expiry);
          const insuranceDays = getDaysUntil(vehicle.insurance_expiry);
          const registrationDays = getDaysUntil(vehicle.registration_expiry);
          const vehicleTickets = tickets.filter(t => t.vehicle_id === vehicle.id && t.status !== 'Closed');

          return (
            <div key={vehicle.id} className="bg-white border rounded-lg p-4 shadow-sm">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-semibold text-lg">{vehicle.plate}</div>
                  <div className="text-sm text-gray-600">{vehicle.type} • {vehicle.capacity} seats</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    vehicle.status === 'Available' ? 'bg-green-100 text-green-700' :
                    vehicle.status === 'In Use' ? 'bg-blue-100 text-blue-700' :
                    vehicle.status === 'Under Maintenance' ? 'bg-orange-100 text-orange-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {vehicle.status}
                  </span>
                  {(insuranceExpired || registrationExpired) && (
                    <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">
                      Expired Docs
                    </span>
                  )}
                  {vehicleTickets.length > 0 && (
                    <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">
                      {vehicleTickets.length} open ticket{vehicleTickets.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>

              <div className="text-sm space-y-1 mb-3">
                <div className={`${insuranceExpired ? 'text-red-600 font-medium' : insuranceDays < 30 ? 'text-orange-600' : 'text-gray-600'}`}>
                  Insurance: {vehicle.insurance_expiry}
                  {insuranceDays !== null && (
                    <span className="ml-2">
                      ({insuranceExpired ? 'EXPIRED' : `${insuranceDays}d left`})
                    </span>
                  )}
                </div>
                <div className={`${registrationExpired ? 'text-red-600 font-medium' : registrationDays < 30 ? 'text-orange-600' : 'text-gray-600'}`}>
                  Registration: {vehicle.registration_expiry}
                  {registrationDays !== null && (
                    <span className="ml-2">
                      ({registrationExpired ? 'EXPIRED' : `${registrationDays}d left`})
                    </span>
                  )}
                </div>
                {vehicle.base_location && (
                  <div className="text-gray-600">Location: {vehicle.base_location}</div>
                )}
                <div className="text-gray-600">Odometer: {vehicle.odometer || 0} km</div>
              </div>

              {(insuranceExpired || registrationExpired) && (
                <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                  ⚠️ Compliance warning: Vehicle cannot be set to Available with expired documents
                </div>
              )}

              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => openVehicleDrawer(vehicle)}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => openTicketDrawer(vehicle.id)}
                  className="px-3 py-1 text-sm bg-orange-100 text-orange-700 hover:bg-orange-200 rounded"
                >
                  + Ticket
                </button>
                <button
                  onClick={() => setSelectedVehicle(selectedVehicle === vehicle.id ? null : vehicle.id)}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 rounded"
                >
                  {selectedVehicle === vehicle.id ? 'Hide' : 'Show'} Tickets
                </button>
                <button
                  onClick={() => handleDeleteVehicle(vehicle.id)}
                  className="px-3 py-1 text-sm bg-red-100 text-red-700 hover:bg-red-200 rounded"
                >
                  Delete
                </button>
              </div>

              {selectedVehicle === vehicle.id && (
                <div className="mt-3 border-t pt-3 space-y-2">
                  {vehicleTickets.length === 0 && (
                    <div className="text-sm text-gray-500">No open tickets</div>
                  )}
                  {vehicleTickets.map((ticket) => (
                    <div key={ticket.id} className="bg-gray-50 p-3 rounded text-sm">
                      <div className="flex items-start justify-between mb-1">
                        <div className="font-medium">{ticket.category}</div>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          ticket.severity === 'Critical' ? 'bg-red-100 text-red-700' :
                          ticket.severity === 'High' ? 'bg-orange-100 text-orange-700' :
                          ticket.severity === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {ticket.severity}
                        </span>
                      </div>
                      <div className="text-gray-600 mb-2">{ticket.description}</div>
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                          {ticket.status} • {new Date(ticket.reported_at).toLocaleString()}
                        </div>
                        <div className="flex gap-1">
                          {ticket.status === 'Open' && (
                            <button
                              onClick={() => updateTicketStatus(ticket.id, 'In Progress')}
                              className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded"
                            >
                              Start
                            </button>
                          )}
                          {ticket.status === 'In Progress' && (
                            <button
                              onClick={() => updateTicketStatus(ticket.id, 'Resolved')}
                              className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded"
                            >
                              Resolve
                            </button>
                          )}
                          {ticket.status === 'Resolved' && (
                            <button
                              onClick={() => updateTicketStatus(ticket.id, 'Closed')}
                              className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded"
                            >
                              Close
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center sm:justify-center">
          <div className="bg-white w-full sm:w-96 sm:rounded-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {drawerType === 'vehicle' ? (editing ? 'Edit Vehicle' : 'Add Vehicle') : 'New Ticket'}
              </h2>
              <button onClick={closeDrawer} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>

            <div className="p-4 space-y-4">
              {formErrors._general && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                  {formErrors._general}
                </div>
              )}

              {drawerType === 'vehicle' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Plate *</label>
                    <input
                      type="text"
                      value={vehicleForm.plate}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, plate: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                    />
                    {formErrors.plate && <div className="text-red-600 text-sm mt-1">{formErrors.plate}</div>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Type *</label>
                    <input
                      type="text"
                      value={vehicleForm.type}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, type: e.target.value })}
                      placeholder="e.g. Bus, Van, Sedan"
                      className="w-full border rounded px-3 py-2"
                    />
                    {formErrors.type && <div className="text-red-600 text-sm mt-1">{formErrors.type}</div>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Capacity *</label>
                    <input
                      type="number"
                      value={vehicleForm.capacity}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, capacity: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                    />
                    {formErrors.capacity && <div className="text-red-600 text-sm mt-1">{formErrors.capacity}</div>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Insurance Expiry *</label>
                    <input
                      type="date"
                      value={vehicleForm.insurance_expiry}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, insurance_expiry: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                    />
                    {formErrors.insurance_expiry && <div className="text-red-600 text-sm mt-1">{formErrors.insurance_expiry}</div>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Registration Expiry *</label>
                    <input
                      type="date"
                      value={vehicleForm.registration_expiry}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, registration_expiry: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                    />
                    {formErrors.registration_expiry && <div className="text-red-600 text-sm mt-1">{formErrors.registration_expiry}</div>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Status *</label>
                    <select
                      value={vehicleForm.status}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, status: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                    >
                      <option value="Available">Available</option>
                      <option value="In Use">In Use</option>
                      <option value="Under Maintenance">Under Maintenance</option>
                      <option value="Blocked">Blocked</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Base Location</label>
                    <input
                      type="text"
                      value={vehicleForm.base_location}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, base_location: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Odometer (km)</label>
                    <input
                      type="number"
                      value={vehicleForm.odometer}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, odometer: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Vehicle *</label>
                    <select
                      value={ticketForm.vehicle_id}
                      onChange={(e) => setTicketForm({ ...ticketForm, vehicle_id: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                    >
                      <option value="">Select vehicle</option>
                      {vehicles.map(v => (
                        <option key={v.id} value={v.id}>{v.plate} - {v.type}</option>
                      ))}
                    </select>
                    {formErrors.vehicle_id && <div className="text-red-600 text-sm mt-1">{formErrors.vehicle_id}</div>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Category *</label>
                    <input
                      type="text"
                      value={ticketForm.category}
                      onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                      placeholder="e.g. Engine, Brakes, Tires"
                      className="w-full border rounded px-3 py-2"
                    />
                    {formErrors.category && <div className="text-red-600 text-sm mt-1">{formErrors.category}</div>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Severity *</label>
                    <select
                      value={ticketForm.severity}
                      onChange={(e) => setTicketForm({ ...ticketForm, severity: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                    {ticketForm.severity === 'Critical' && (
                      <div className="text-orange-600 text-sm mt-1">⚠️ Vehicle will be set to Under Maintenance</div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Description *</label>
                    <textarea
                      value={ticketForm.description}
                      onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                      rows="3"
                    ></textarea>
                    {formErrors.description && <div className="text-red-600 text-sm mt-1">{formErrors.description}</div>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Assigned To</label>
                    <input
                      type="text"
                      value={ticketForm.assigned_to}
                      onChange={(e) => setTicketForm({ ...ticketForm, assigned_to: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="sticky bottom-0 bg-white border-t p-4 flex gap-2">
              <button
                onClick={drawerType === 'vehicle' ? handleSaveVehicle : handleSaveTicket}
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
        } text-white z-50`}>
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

export default VehicleMaintenance;
