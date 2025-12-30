/* SQL: CREATE TABLE IF NOT EXISTS public.transport_roster_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  shift TEXT NOT NULL CHECK (shift IN ('Morning', 'Afternoon', 'Evening', 'Night', 'Full Day')),
  driver_id UUID REFERENCES public.transport_drivers(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES public.transport_vehicles(id) ON DELETE SET NULL,
  reservation_id UUID REFERENCES public.reservations(id) ON DELETE SET NULL,
  journey_type TEXT CHECK (journey_type IN ('salawaat', 'ziyarah', 'istiqbal', 'madina')),
  status TEXT NOT NULL DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'In Progress', 'Completed', 'Cancelled')),
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

const safeJson = (value) => {
  if (!value) return null;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const Roster = () => {
  const [assignments, setAssignments] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState({
    date: '',
    shift: 'Full Day',
    driver_id: '',
    vehicle_id: '',
    reservation_id: '',
    journey_type: '',
    notes: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [toast, setToast] = useState(null);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    shift: '',
    journey_type: '',
    driver_id: '',
    vehicle_id: ''
  });
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    const [aRes, dRes, vRes, rRes] = await Promise.all([
      supabase.from('transport_roster_assignments').select('*').order('date', { ascending: false }),
      supabase.from('transport_drivers').select('*').order('name'),
      supabase.from('transport_vehicles').select('*').order('plate'),
      supabase.from('reservations').select('*').eq('status', 'approved').order('created_at', { ascending: false })
    ]);

    if (aRes.error || dRes.error || vRes.error || rRes.error) {
      setError((aRes.error || dRes.error || vRes.error || rRes.error).message);
    } else {
      setAssignments(aRes.data || []);
      setDrivers(dRes.data || []);
      setVehicles(vRes.data || []);
      setReservations(rRes.data || []);
    }

    setLoading(false);
  };

  const openDrawer = () => {
    setForm({
      date: '',
      shift: 'Full Day',
      driver_id: '',
      vehicle_id: '',
      reservation_id: '',
      journey_type: '',
      notes: ''
    });
    setFormErrors({});
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setFormErrors({});
  };

  const getDriverEligibility = (driverId, date, shift) => {
    const driver = drivers.find(d => d.id === driverId);
    if (!driver) return { eligible: false, reason: 'Driver not found' };
    if (driver.status !== 'Active') return { eligible: false, reason: `Driver status: ${driver.status}` };
    if (new Date(driver.license_expiry) < new Date()) return { eligible: false, reason: 'License expired' };

    const conflict = assignments.find(a =>
      a.driver_id === driverId &&
      a.date === date &&
      a.shift === shift &&
      a.status !== 'Cancelled'
    );
    if (conflict) return { eligible: false, reason: 'Driver already assigned this shift' };

    return { eligible: true };
  };

  const getVehicleEligibility = (vehicleId, date, shift) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return { eligible: false, reason: 'Vehicle not found' };
    if (vehicle.status !== 'Available') return { eligible: false, reason: `Vehicle status: ${vehicle.status}` };
    if (new Date(vehicle.insurance_expiry) < new Date()) return { eligible: false, reason: 'Insurance expired' };

    const conflict = assignments.find(a =>
      a.vehicle_id === vehicleId &&
      a.date === date &&
      a.shift === shift &&
      a.status !== 'Cancelled'
    );
    if (conflict) return { eligible: false, reason: 'Vehicle already assigned this shift' };

    return { eligible: true };
  };

  const validate = () => {
    const errors = {};
    if (!form.date) errors.date = 'Date is required';
    if (!form.shift) errors.shift = 'Shift is required';
    if (!form.driver_id) errors.driver_id = 'Driver is required';
    if (!form.vehicle_id) errors.vehicle_id = 'Vehicle is required';

    if (form.driver_id && form.date && form.shift) {
      const driverCheck = getDriverEligibility(form.driver_id, form.date, form.shift);
      if (!driverCheck.eligible) {
        errors.driver_id = driverCheck.reason;
      }
    }

    if (form.vehicle_id && form.date && form.shift) {
      const vehicleCheck = getVehicleEligibility(form.vehicle_id, form.date, form.shift);
      if (!vehicleCheck.eligible) {
        errors.vehicle_id = vehicleCheck.reason;
      }
    }

    return errors;
  };

  const handleSave = async () => {
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const payload = {
      date: form.date,
      shift: form.shift,
      driver_id: form.driver_id,
      vehicle_id: form.vehicle_id,
      reservation_id: form.reservation_id || null,
      journey_type: form.journey_type || null,
      status: 'Scheduled',
      notes: form.notes.trim() || null
    };

    const { error: err } = await supabase
      .from('transport_roster_assignments')
      .insert([payload]);

    if (err) {
      setToast({ type: 'error', message: err.message });
      return;
    }

    setToast({ type: 'success', message: 'Assignment created' });
    closeDrawer();
    loadData();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this assignment?')) return;
    const { error: err } = await supabase
      .from('transport_roster_assignments')
      .delete()
      .eq('id', id);

    if (err) {
      setToast({ type: 'error', message: err.message });
    } else {
      setToast({ type: 'success', message: 'Assignment deleted' });
      loadData();
    }
  };

  const updateStatus = async (id, status) => {
    const { error: err } = await supabase
      .from('transport_roster_assignments')
      .update({ status })
      .eq('id', id);

    if (err) {
      setToast({ type: 'error', message: err.message });
    } else {
      setToast({ type: 'success', message: `Status updated to ${status}` });
      loadData();
    }
  };

  const getReservationInfo = (resId) => {
    const res = reservations.find(r => r.id === resId);
    if (!res) return { name: 'Unknown', passengers: 1, datetime: null };

    const members = safeJson(res.members);
    const travelDetails = safeJson(res.travel_details);

    let name = 'Reservation';
    if (members && Array.isArray(members) && members.length > 0) {
      name = members[0].name || members[0].firstName || 'Reservation';
    }

    let passengers = parseInt(res.num_members) || 1;
    if (!passengers && members && Array.isArray(members)) {
      passengers = members.length || 1;
    }

    let datetime = null;
    if (travelDetails) {
      datetime = travelDetails.arrivalDateTime || travelDetails.departureDateTime ||
                 travelDetails.arrivalTime || travelDetails.departureTime || null;
    }
    if (!datetime) {
      datetime = res.created_at;
    }

    return { name, passengers, datetime };
  };

  const filteredAssignments = assignments.filter(a => {
    if (filters.dateFrom && a.date < filters.dateFrom) return false;
    if (filters.dateTo && a.date > filters.dateTo) return false;
    if (filters.shift && a.shift !== filters.shift) return false;
    if (filters.journey_type && a.journey_type !== filters.journey_type) return false;
    if (filters.driver_id && a.driver_id !== filters.driver_id) return false;
    if (filters.vehicle_id && a.vehicle_id !== filters.vehicle_id) return false;
    return true;
  });

  const groupedByDate = filteredAssignments.reduce((acc, a) => {
    if (!acc[a.date]) acc[a.date] = [];
    acc[a.date].push(a);
    return acc;
  }, {});

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
        <h1 className="text-2xl font-bold">Transport Roster</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Filters
          </button>
          <button
            onClick={openDrawer}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + Assign
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {filtersOpen && (
        <div className="mb-4 p-4 bg-gray-50 border rounded-lg space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Date From</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date To</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Shift</label>
              <select
                value={filters.shift}
                onChange={(e) => setFilters({ ...filters, shift: e.target.value })}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">All</option>
                <option value="Morning">Morning</option>
                <option value="Afternoon">Afternoon</option>
                <option value="Evening">Evening</option>
                <option value="Night">Night</option>
                <option value="Full Day">Full Day</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Journey Type</label>
              <select
                value={filters.journey_type}
                onChange={(e) => setFilters({ ...filters, journey_type: e.target.value })}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">All</option>
                <option value="salawaat">Salawaat</option>
                <option value="ziyarah">Ziyarah</option>
                <option value="istiqbal">Istiqbal</option>
                <option value="madina">Madina</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Driver</label>
              <select
                value={filters.driver_id}
                onChange={(e) => setFilters({ ...filters, driver_id: e.target.value })}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">All</option>
                {drivers.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Vehicle</label>
              <select
                value={filters.vehicle_id}
                onChange={(e) => setFilters({ ...filters, vehicle_id: e.target.value })}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">All</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.plate}</option>
                ))}
              </select>
            </div>
          </div>
          <button
            onClick={() => setFilters({ dateFrom: '', dateTo: '', shift: '', journey_type: '', driver_id: '', vehicle_id: '' })}
            className="text-sm text-blue-600 hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}

      {Object.keys(groupedByDate).length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No assignments found.
        </div>
      )}

      <div className="space-y-4">
        {Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a)).map(date => (
          <div key={date} className="bg-white border rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-3">{date}</h2>
            <div className="space-y-2">
              {groupedByDate[date].map(a => {
                const driver = drivers.find(d => d.id === a.driver_id);
                const vehicle = vehicles.find(v => v.id === a.vehicle_id);
                const resInfo = a.reservation_id ? getReservationInfo(a.reservation_id) : null;

                return (
                  <div key={a.id} className="bg-gray-50 p-3 rounded text-sm">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-medium">{a.shift}</div>
                        {a.journey_type && (
                          <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-700">
                            {a.journey_type}
                          </span>
                        )}
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        a.status === 'Scheduled' ? 'bg-blue-100 text-blue-700' :
                        a.status === 'In Progress' ? 'bg-yellow-100 text-yellow-700' :
                        a.status === 'Completed' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {a.status}
                      </span>
                    </div>

                    <div className="space-y-1 text-gray-600 mb-2">
                      <div>Driver: {driver ? driver.name : 'Missing/Invalid data'}</div>
                      <div>Vehicle: {vehicle ? `${vehicle.plate} (${vehicle.type})` : 'Missing/Invalid data'}</div>
                      {resInfo && (
                        <>
                          <div>Reservation: {resInfo.name} • {resInfo.passengers} pax</div>
                          {resInfo.datetime && (
                            <div className="text-xs">Time: {new Date(resInfo.datetime).toLocaleString()}</div>
                          )}
                        </>
                      )}
                      {a.notes && <div className="text-xs">Notes: {a.notes}</div>}
                    </div>

                    <div className="flex gap-2">
                      {a.status === 'Scheduled' && (
                        <button
                          onClick={() => updateStatus(a.id, 'In Progress')}
                          className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded"
                        >
                          Start
                        </button>
                      )}
                      {a.status === 'In Progress' && (
                        <button
                          onClick={() => updateStatus(a.id, 'Completed')}
                          className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded"
                        >
                          Complete
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(a.id)}
                        className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center sm:justify-center">
          <div className="bg-white w-full sm:w-96 sm:rounded-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Create Assignment</h2>
              <button onClick={closeDrawer} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Date *</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
                {formErrors.date && <div className="text-red-600 text-sm mt-1">{formErrors.date}</div>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Shift *</label>
                <select
                  value={form.shift}
                  onChange={(e) => setForm({ ...form, shift: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="Morning">Morning</option>
                  <option value="Afternoon">Afternoon</option>
                  <option value="Evening">Evening</option>
                  <option value="Night">Night</option>
                  <option value="Full Day">Full Day</option>
                </select>
                {formErrors.shift && <div className="text-red-600 text-sm mt-1">{formErrors.shift}</div>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Driver *</label>
                <select
                  value={form.driver_id}
                  onChange={(e) => setForm({ ...form, driver_id: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">Select driver</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.status})</option>
                  ))}
                </select>
                {formErrors.driver_id && <div className="text-red-600 text-sm mt-1">{formErrors.driver_id}</div>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Vehicle *</label>
                <select
                  value={form.vehicle_id}
                  onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">Select vehicle</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.plate} - {v.type} ({v.status})</option>
                  ))}
                </select>
                {formErrors.vehicle_id && <div className="text-red-600 text-sm mt-1">{formErrors.vehicle_id}</div>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Reservation (optional)</label>
                <select
                  value={form.reservation_id}
                  onChange={(e) => setForm({ ...form, reservation_id: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">None</option>
                  {reservations.map(r => {
                    const info = getReservationInfo(r.id);
                    return (
                      <option key={r.id} value={r.id}>
                        {info.name} • {info.passengers} pax
                        {info.datetime && ` • ${new Date(info.datetime).toLocaleDateString()}`}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Journey Type</label>
                <select
                  value={form.journey_type}
                  onChange={(e) => setForm({ ...form, journey_type: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">Select if applicable</option>
                  <option value="salawaat">Salawaat</option>
                  <option value="ziyarah">Ziyarah</option>
                  <option value="istiqbal">Istiqbal</option>
                  <option value="madina">Madina</option>
                </select>
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

export default Roster;
