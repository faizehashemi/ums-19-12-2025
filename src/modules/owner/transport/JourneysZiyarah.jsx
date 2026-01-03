import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

const safeJson = (value) => {
  if (!value) return null;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const JourneysZiyarah = () => {
  const [runs, setRuns] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    reservation_id: '',
    planned_start: '',
    driver_id: '',
    vehicle_id: '',
    passenger_count: '',
    itinerary: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    const [runRes, driverRes, vehicleRes, resRes] = await Promise.all([
      supabase.from('transport_runs').select('*').eq('journey_type', 'ziyarah').order('planned_start', { ascending: false }),
      supabase.from('transport_drivers').select('*').order('name'),
      supabase.from('transport_vehicles').select('*').order('plate'),
      supabase.from('reservations').select('*').eq('status', 'approved').order('created_at', { ascending: false })
    ]);

    if (runRes.error || driverRes.error || vehicleRes.error || resRes.error) {
      setError((runRes.error || driverRes.error || vehicleRes.error || resRes.error).message);
    } else {
      setRuns(runRes.data || []);
      setDrivers(driverRes.data || []);
      setVehicles(vehicleRes.data || []);
      setReservations(resRes.data || []);
    }

    setLoading(false);
  };

  const openDrawer = (run = null) => {
    if (run) {
      setEditing(run);
      const itineraryObj = safeJson(run.notes);
      const itineraryStr = itineraryObj && itineraryObj.itinerary ? itineraryObj.itinerary.join('\n') : '';
      setForm({
        reservation_id: run.reservation_id || '',
        planned_start: run.planned_start ? run.planned_start.substring(0, 16) : '',
        driver_id: run.driver_id || '',
        vehicle_id: run.vehicle_id || '',
        passenger_count: run.passenger_count ? run.passenger_count.toString() : '',
        itinerary: itineraryStr
      });
    } else {
      setEditing(null);
      setForm({
        reservation_id: '',
        planned_start: '',
        driver_id: '',
        vehicle_id: '',
        passenger_count: '',
        itinerary: ''
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
    if (!form.planned_start) errors.planned_start = 'Planned start required';
    if (!form.driver_id) errors.driver_id = 'Driver required';
    if (!form.vehicle_id) errors.vehicle_id = 'Vehicle required';
    return errors;
  };

  const handleSave = async () => {
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const vehicle = vehicles.find(v => v.id === form.vehicle_id);
    const passengerCount = parseInt(form.passenger_count) || 0;

    if (vehicle && passengerCount > vehicle.capacity) {
      if (!confirm(`Passenger count (${passengerCount}) exceeds vehicle capacity (${vehicle.capacity}). Continue?`)) {
        return;
      }
    }

    const itineraryArray = form.itinerary.trim() ? form.itinerary.split('\n').map(s => s.trim()).filter(Boolean) : [];
    const notesObj = { itinerary: itineraryArray };

    const payload = {
      reservation_id: form.reservation_id || null,
      journey_type: 'ziyarah',
      planned_start: form.planned_start,
      planned_end: null,
      driver_id: form.driver_id,
      vehicle_id: form.vehicle_id,
      passenger_count: passengerCount,
      status: editing ? editing.status : 'Planned',
      notes: JSON.stringify(notesObj)
    };

    if (editing) {
      const { error: err } = await supabase
        .from('transport_runs')
        .update(payload)
        .eq('id', editing.id);

      if (err) {
        setToast({ type: 'error', message: err.message });
        return;
      }
      setToast({ type: 'success', message: 'Journey updated' });
    } else {
      const { error: err } = await supabase
        .from('transport_runs')
        .insert([payload]);

      if (err) {
        setToast({ type: 'error', message: err.message });
        return;
      }
      setToast({ type: 'success', message: 'Journey created' });
    }

    closeDrawer();
    loadData();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this journey?')) return;
    const { error: err } = await supabase
      .from('transport_runs')
      .delete()
      .eq('id', id);

    if (err) {
      setToast({ type: 'error', message: err.message });
    } else {
      setToast({ type: 'success', message: 'Journey deleted' });
      loadData();
    }
  };

  const updateStatus = async (id, status) => {
    const updates = { status };
    if (status === 'In Progress') {
      updates.actual_start = new Date().toISOString();
    } else if (status === 'Completed') {
      updates.actual_end = new Date().toISOString();
    }

    const { error: err } = await supabase
      .from('transport_runs')
      .update(updates)
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
    if (!res) return null;

    const members = safeJson(res.members);
    let name = 'Reservation';
    if (members && Array.isArray(members) && members.length > 0) {
      name = members[0].name || members[0].firstName || 'Reservation';
    }

    let passengers = parseInt(res.num_members) || 1;
    if (!passengers && members && Array.isArray(members)) {
      passengers = members.length || 1;
    }

    return { name, passengers };
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
        <h1 className="text-2xl font-bold">Ziyarah Journeys</h1>
        <button
          onClick={() => openDrawer()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Journey
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {runs.length === 0 && !error && (
        <div className="text-center py-12 text-gray-500">
          No journeys scheduled.
        </div>
      )}

      <div className="space-y-3">
        {runs.map(run => {
          const driver = drivers.find(d => d.id === run.driver_id);
          const vehicle = vehicles.find(v => v.id === run.vehicle_id);
          const resInfo = run.reservation_id ? getReservationInfo(run.reservation_id) : null;
          const notesObj = safeJson(run.notes);
          const itinerary = notesObj && notesObj.itinerary ? notesObj.itinerary : [];

          return (
            <div key={run.id} className="bg-white border rounded-lg p-4 shadow-sm">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-semibold">
                    {run.planned_start && new Date(run.planned_start).toLocaleString()}
                  </div>
                  {resInfo && (
                    <div className="text-sm text-gray-600">{resInfo.name} • {resInfo.passengers} pax</div>
                  )}
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  run.status === 'Planned' ? 'bg-blue-100 text-blue-700' :
                  run.status === 'In Progress' ? 'bg-yellow-100 text-yellow-700' :
                  run.status === 'Completed' ? 'bg-green-100 text-green-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {run.status}
                </span>
              </div>

              <div className="text-sm space-y-1 mb-2 text-gray-600">
                <div>Driver: {driver ? driver.name : 'Missing/Invalid data'}</div>
                <div>Vehicle: {vehicle ? `${vehicle.plate} (${vehicle.type})` : 'Missing/Invalid data'}</div>
                <div>Passengers: {run.passenger_count || 0}</div>
                {itinerary.length > 0 && (
                  <div>
                    <div className="font-medium mt-2">Itinerary:</div>
                    <ul className="list-disc list-inside text-xs">
                      {itinerary.map((stop, idx) => (
                        <li key={idx}>{stop}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {run.actual_start && <div className="text-xs">Started: {new Date(run.actual_start).toLocaleString()}</div>}
                {run.actual_end && <div className="text-xs">Ended: {new Date(run.actual_end).toLocaleString()}</div>}
              </div>

              <div className="flex gap-2">
                {run.status === 'Planned' && (
                  <button
                    onClick={() => updateStatus(run.id, 'In Progress')}
                    className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded"
                  >
                    Start
                  </button>
                )}
                {run.status === 'In Progress' && (
                  <button
                    onClick={() => updateStatus(run.id, 'Completed')}
                    className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded"
                  >
                    Complete
                  </button>
                )}
                <button
                  onClick={() => openDrawer(run)}
                  className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(run.id)}
                  className="px-2 py-1 text-xs bg-red-100 text-red-700 hover:bg-red-200 rounded"
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
                {editing ? 'Edit Journey' : 'Add Journey'}
              </h2>
              <button onClick={closeDrawer} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>

            <div className="p-4 space-y-4">
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
                        {info ? `${info.name} • ${info.passengers} pax` : r.id}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Planned Start *</label>
                <input
                  type="datetime-local"
                  value={form.planned_start}
                  onChange={(e) => setForm({ ...form, planned_start: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
                {formErrors.planned_start && <div className="text-red-600 text-sm mt-1">{formErrors.planned_start}</div>}
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
                    <option key={d.id} value={d.id}>{d.name}</option>
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
                    <option key={v.id} value={v.id}>{v.plate} - {v.type}</option>
                  ))}
                </select>
                {formErrors.vehicle_id && <div className="text-red-600 text-sm mt-1">{formErrors.vehicle_id}</div>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Passenger Count</label>
                <input
                  type="number"
                  value={form.passenger_count}
                  onChange={(e) => setForm({ ...form, passenger_count: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Itinerary (one stop per line)</label>
                <textarea
                  value={form.itinerary}
                  onChange={(e) => setForm({ ...form, itinerary: e.target.value })}
                  placeholder="Cave of Hira&#10;Jabal al-Nour&#10;Mount Arafat"
                  className="w-full border rounded px-3 py-2"
                  rows="5"
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

export default JourneysZiyarah;
