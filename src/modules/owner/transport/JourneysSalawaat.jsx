/* SQL: CREATE TABLE IF NOT EXISTS public.transport_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  journey_type TEXT NOT NULL CHECK (journey_type IN ('salawaat', 'ziyarah', 'istiqbal', 'madina')),
  direction TEXT,
  stops_json TEXT,
  frequency_minutes INTEGER,
  service_start_time TIME,
  service_end_time TIME,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.transport_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID REFERENCES public.reservations(id) ON DELETE SET NULL,
  route_id UUID REFERENCES public.transport_routes(id) ON DELETE SET NULL,
  journey_type TEXT CHECK (journey_type IN ('salawaat', 'ziyarah', 'istiqbal', 'madina')),
  planned_start TIMESTAMPTZ,
  planned_end TIMESTAMPTZ,
  driver_id UUID REFERENCES public.transport_drivers(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES public.transport_vehicles(id) ON DELETE SET NULL,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  passenger_count INTEGER DEFAULT 0,
  delay_reason TEXT,
  status TEXT NOT NULL DEFAULT 'Planned' CHECK (status IN ('Planned', 'In Progress', 'Completed', 'Cancelled', 'Delayed')),
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

const JourneysSalawaat = () => {
  const [routes, setRoutes] = useState([]);
  const [runs, setRuns] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerType, setDrawerType] = useState('route');
  const [editing, setEditing] = useState(null);
  const [routeForm, setRouteForm] = useState({
    name: '',
    direction: '',
    stops: '',
    frequency_minutes: '',
    service_start_time: '',
    service_end_time: '',
    active: true
  });
  const [runForm, setRunForm] = useState({
    route_id: '',
    planned_start: '',
    driver_id: '',
    vehicle_id: '',
    passenger_count: ''
  });
  const [generateForm, setGenerateForm] = useState({
    route_id: '',
    date: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    const [routeRes, runRes, driverRes, vehicleRes, resRes] = await Promise.all([
      supabase.from('transport_routes').select('*').eq('journey_type', 'salawaat').order('created_at', { ascending: false }),
      supabase.from('transport_runs').select('*').eq('journey_type', 'salawaat').order('planned_start', { ascending: false }),
      supabase.from('transport_drivers').select('*').order('name'),
      supabase.from('transport_vehicles').select('*').order('plate'),
      supabase.from('reservations').select('*').eq('status', 'approved').order('created_at', { ascending: false })
    ]);

    if (routeRes.error || runRes.error || driverRes.error || vehicleRes.error || resRes.error) {
      setError((routeRes.error || runRes.error || driverRes.error || vehicleRes.error || resRes.error).message);
    } else {
      setRoutes(routeRes.data || []);
      setRuns(runRes.data || []);
      setDrivers(driverRes.data || []);
      setVehicles(vehicleRes.data || []);
      setReservations(resRes.data || []);
    }

    setLoading(false);
  };

  const openRouteDrawer = (route = null) => {
    setDrawerType('route');
    if (route) {
      setEditing(route);
      const stops = safeJson(route.stops_json);
      setRouteForm({
        name: route.name,
        direction: route.direction || '',
        stops: stops ? stops.join(', ') : '',
        frequency_minutes: route.frequency_minutes ? route.frequency_minutes.toString() : '',
        service_start_time: route.service_start_time || '',
        service_end_time: route.service_end_time || '',
        active: route.active
      });
    } else {
      setEditing(null);
      setRouteForm({
        name: '',
        direction: '',
        stops: '',
        frequency_minutes: '30',
        service_start_time: '',
        service_end_time: '',
        active: true
      });
    }
    setFormErrors({});
    setDrawerOpen(true);
  };

  const openRunDrawer = () => {
    setDrawerType('run');
    setEditing(null);
    setRunForm({
      route_id: '',
      planned_start: '',
      driver_id: '',
      vehicle_id: '',
      passenger_count: ''
    });
    setFormErrors({});
    setDrawerOpen(true);
  };

  const openGenerateDrawer = () => {
    setDrawerType('generate');
    setGenerateForm({
      route_id: '',
      date: ''
    });
    setFormErrors({});
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditing(null);
    setFormErrors({});
  };

  const validateRoute = () => {
    const errors = {};
    if (!routeForm.name.trim()) errors.name = 'Name is required';
    if (!routeForm.frequency_minutes || parseInt(routeForm.frequency_minutes) < 1) errors.frequency_minutes = 'Valid frequency required';
    if (!routeForm.service_start_time) errors.service_start_time = 'Start time required';
    if (!routeForm.service_end_time) errors.service_end_time = 'End time required';
    return errors;
  };

  const validateRun = () => {
    const errors = {};
    if (!runForm.planned_start) errors.planned_start = 'Planned start required';
    if (!runForm.driver_id) errors.driver_id = 'Driver required';
    if (!runForm.vehicle_id) errors.vehicle_id = 'Vehicle required';
    return errors;
  };

  const validateGenerate = () => {
    const errors = {};
    if (!generateForm.route_id) errors.route_id = 'Route required';
    if (!generateForm.date) errors.date = 'Date required';
    return errors;
  };

  const handleSaveRoute = async () => {
    const errors = validateRoute();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const stopsArray = routeForm.stops.trim() ? routeForm.stops.split(',').map(s => s.trim()).filter(Boolean) : [];

    const payload = {
      name: routeForm.name.trim(),
      journey_type: 'salawaat',
      direction: routeForm.direction.trim() || null,
      stops_json: JSON.stringify(stopsArray),
      frequency_minutes: parseInt(routeForm.frequency_minutes),
      service_start_time: routeForm.service_start_time,
      service_end_time: routeForm.service_end_time,
      active: routeForm.active
    };

    if (editing) {
      const { error: err } = await supabase
        .from('transport_routes')
        .update(payload)
        .eq('id', editing.id);

      if (err) {
        setToast({ type: 'error', message: err.message });
        return;
      }
      setToast({ type: 'success', message: 'Route updated' });
    } else {
      const { error: err } = await supabase
        .from('transport_routes')
        .insert([payload]);

      if (err) {
        setToast({ type: 'error', message: err.message });
        return;
      }
      setToast({ type: 'success', message: 'Route created' });
    }

    closeDrawer();
    loadData();
  };

  const handleSaveRun = async () => {
    const errors = validateRun();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const vehicle = vehicles.find(v => v.id === runForm.vehicle_id);
    const passengerCount = parseInt(runForm.passenger_count) || 0;

    if (vehicle && passengerCount > vehicle.capacity) {
      if (!confirm(`Passenger count (${passengerCount}) exceeds vehicle capacity (${vehicle.capacity}). Continue?`)) {
        return;
      }
    }

    const payload = {
      route_id: runForm.route_id || null,
      journey_type: 'salawaat',
      planned_start: runForm.planned_start,
      planned_end: null,
      driver_id: runForm.driver_id,
      vehicle_id: runForm.vehicle_id,
      passenger_count: passengerCount,
      status: 'Planned',
      notes: null
    };

    const { error: err } = await supabase
      .from('transport_runs')
      .insert([payload]);

    if (err) {
      setToast({ type: 'error', message: err.message });
      return;
    }

    setToast({ type: 'success', message: 'Run created' });
    closeDrawer();
    loadData();
  };

  const handleGenerate = async () => {
    const errors = validateGenerate();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const route = routes.find(r => r.id === generateForm.route_id);
    if (!route) {
      setToast({ type: 'error', message: 'Route not found' });
      return;
    }

    const startParts = route.service_start_time.split(':');
    const endParts = route.service_end_time.split(':');
    const startMinutes = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
    const endMinutes = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);

    const runs = [];
    for (let m = startMinutes; m <= endMinutes; m += route.frequency_minutes) {
      const h = Math.floor(m / 60);
      const min = m % 60;
      const timeStr = `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}:00`;
      const plannedStart = `${generateForm.date}T${timeStr}`;
      runs.push({
        route_id: route.id,
        journey_type: 'salawaat',
        planned_start: plannedStart,
        planned_end: null,
        driver_id: null,
        vehicle_id: null,
        passenger_count: 0,
        status: 'Planned',
        notes: null
      });
    }

    if (runs.length === 0) {
      setToast({ type: 'error', message: 'No runs generated. Check route times.' });
      return;
    }

    const { error: err } = await supabase
      .from('transport_runs')
      .insert(runs);

    if (err) {
      setToast({ type: 'error', message: err.message });
      return;
    }

    setToast({ type: 'success', message: `${runs.length} runs generated` });
    closeDrawer();
    loadData();
  };

  const handleDeleteRoute = async (id) => {
    if (!confirm('Delete this route?')) return;
    const { error: err } = await supabase
      .from('transport_routes')
      .delete()
      .eq('id', id);

    if (err) {
      setToast({ type: 'error', message: err.message });
    } else {
      setToast({ type: 'success', message: 'Route deleted' });
      loadData();
    }
  };

  const handleStartRun = async (run) => {
    const now = new Date().toISOString();
    const plannedStart = new Date(run.planned_start);
    const actualStart = new Date(now);
    const delayMinutes = Math.floor((actualStart - plannedStart) / (1000 * 60));

    let delayReason = null;
    let status = 'In Progress';

    if (delayMinutes > 5) {
      delayReason = prompt('Run is delayed by more than 5 minutes. Please provide a reason:');
      if (!delayReason) return;
      status = 'Delayed';
    }

    const { error: err } = await supabase
      .from('transport_runs')
      .update({
        actual_start: now,
        status,
        delay_reason: delayReason
      })
      .eq('id', run.id);

    if (err) {
      setToast({ type: 'error', message: err.message });
    } else {
      setToast({ type: 'success', message: 'Run started' });
      loadData();
    }
  };

  const handleCompleteRun = async (id) => {
    const { error: err } = await supabase
      .from('transport_runs')
      .update({
        actual_end: new Date().toISOString(),
        status: 'Completed'
      })
      .eq('id', id);

    if (err) {
      setToast({ type: 'error', message: err.message });
    } else {
      setToast({ type: 'success', message: 'Run completed' });
      loadData();
    }
  };

  const handleDeleteRun = async (id) => {
    if (!confirm('Delete this run?')) return;
    const { error: err } = await supabase
      .from('transport_runs')
      .delete()
      .eq('id', id);

    if (err) {
      setToast({ type: 'error', message: err.message });
    } else {
      setToast({ type: 'success', message: 'Run deleted' });
      loadData();
    }
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
        <h1 className="text-2xl font-bold">Salawaat Journeys</h1>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={openRouteDrawer}
            className="px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            + Route
          </button>
          <button
            onClick={openGenerateDrawer}
            className="px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Generate Runs
          </button>
          <button
            onClick={openRunDrawer}
            className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + Manual Run
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Routes</h2>
        {routes.length === 0 && (
          <div className="text-sm text-gray-500">No routes defined. Create your first route.</div>
        )}
        <div className="space-y-2">
          {routes.map(route => {
            const stops = safeJson(route.stops_json);
            return (
              <div key={route.id} className="bg-white border rounded-lg p-3 text-sm">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-medium">{route.name}</div>
                    {route.direction && <div className="text-xs text-gray-600">{route.direction}</div>}
                  </div>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${route.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {route.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="text-gray-600 text-xs mb-2">
                  {stops && stops.length > 0 && (
                    <div>Stops: {stops.join(' → ')}</div>
                  )}
                  <div>Service: {route.service_start_time} - {route.service_end_time} • Every {route.frequency_minutes} min</div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openRouteDrawer(route)}
                    className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteRoute(route.id)}
                    className="px-2 py-1 text-xs bg-red-100 text-red-700 hover:bg-red-200 rounded"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Runs</h2>
        {runs.length === 0 && (
          <div className="text-sm text-gray-500">No runs scheduled.</div>
        )}
        <div className="space-y-2">
          {runs.map(run => {
            const route = routes.find(r => r.id === run.route_id);
            const driver = drivers.find(d => d.id === run.driver_id);
            const vehicle = vehicles.find(v => v.id === run.vehicle_id);
            return (
              <div key={run.id} className="bg-white border rounded-lg p-3 text-sm">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-medium">
                      {route ? route.name : 'No route'} {run.planned_start && `• ${new Date(run.planned_start).toLocaleString()}`}
                    </div>
                    {run.delay_reason && (
                      <div className="text-xs text-orange-600 mt-1">Delay: {run.delay_reason}</div>
                    )}
                  </div>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    run.status === 'Planned' ? 'bg-blue-100 text-blue-700' :
                    run.status === 'In Progress' ? 'bg-yellow-100 text-yellow-700' :
                    run.status === 'Delayed' ? 'bg-orange-100 text-orange-700' :
                    run.status === 'Completed' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {run.status}
                  </span>
                </div>
                <div className="text-gray-600 text-xs mb-2 space-y-1">
                  <div>Driver: {driver ? driver.name : 'Missing/Invalid data'}</div>
                  <div>Vehicle: {vehicle ? `${vehicle.plate} (${vehicle.type})` : 'Missing/Invalid data'}</div>
                  <div>Passengers: {run.passenger_count || 0}</div>
                  {run.actual_start && <div>Started: {new Date(run.actual_start).toLocaleString()}</div>}
                  {run.actual_end && <div>Ended: {new Date(run.actual_end).toLocaleString()}</div>}
                </div>
                <div className="flex gap-2">
                  {run.status === 'Planned' && (
                    <button
                      onClick={() => handleStartRun(run)}
                      className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded"
                    >
                      Start
                    </button>
                  )}
                  {(run.status === 'In Progress' || run.status === 'Delayed') && (
                    <button
                      onClick={() => handleCompleteRun(run.id)}
                      className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded"
                    >
                      Complete
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteRun(run.id)}
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

      {drawerOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center sm:justify-center">
          <div className="bg-white w-full sm:w-96 sm:rounded-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {drawerType === 'route' ? (editing ? 'Edit Route' : 'Add Route') :
                 drawerType === 'generate' ? 'Generate Runs' : 'Add Manual Run'}
              </h2>
              <button onClick={closeDrawer} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>

            <div className="p-4 space-y-4">
              {drawerType === 'route' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Name *</label>
                    <input
                      type="text"
                      value={routeForm.name}
                      onChange={(e) => setRouteForm({ ...routeForm, name: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                    />
                    {formErrors.name && <div className="text-red-600 text-sm mt-1">{formErrors.name}</div>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Direction</label>
                    <input
                      type="text"
                      value={routeForm.direction}
                      onChange={(e) => setRouteForm({ ...routeForm, direction: e.target.value })}
                      placeholder="e.g. To Haram, From Haram"
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Stops (comma-separated)</label>
                    <input
                      type="text"
                      value={routeForm.stops}
                      onChange={(e) => setRouteForm({ ...routeForm, stops: e.target.value })}
                      placeholder="Hotel, Gate 1, Gate 2, Haram"
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Frequency (minutes) *</label>
                    <input
                      type="number"
                      value={routeForm.frequency_minutes}
                      onChange={(e) => setRouteForm({ ...routeForm, frequency_minutes: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                    />
                    {formErrors.frequency_minutes && <div className="text-red-600 text-sm mt-1">{formErrors.frequency_minutes}</div>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Service Start Time *</label>
                    <input
                      type="time"
                      value={routeForm.service_start_time}
                      onChange={(e) => setRouteForm({ ...routeForm, service_start_time: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                    />
                    {formErrors.service_start_time && <div className="text-red-600 text-sm mt-1">{formErrors.service_start_time}</div>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Service End Time *</label>
                    <input
                      type="time"
                      value={routeForm.service_end_time}
                      onChange={(e) => setRouteForm({ ...routeForm, service_end_time: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                    />
                    {formErrors.service_end_time && <div className="text-red-600 text-sm mt-1">{formErrors.service_end_time}</div>}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={routeForm.active}
                      onChange={(e) => setRouteForm({ ...routeForm, active: e.target.checked })}
                      id="active"
                    />
                    <label htmlFor="active" className="text-sm font-medium">Active</label>
                  </div>
                </>
              )}

              {drawerType === 'run' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Route (optional)</label>
                    <select
                      value={runForm.route_id}
                      onChange={(e) => setRunForm({ ...runForm, route_id: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                    >
                      <option value="">None</option>
                      {routes.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Planned Start *</label>
                    <input
                      type="datetime-local"
                      value={runForm.planned_start}
                      onChange={(e) => setRunForm({ ...runForm, planned_start: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                    />
                    {formErrors.planned_start && <div className="text-red-600 text-sm mt-1">{formErrors.planned_start}</div>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Driver *</label>
                    <select
                      value={runForm.driver_id}
                      onChange={(e) => setRunForm({ ...runForm, driver_id: e.target.value })}
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
                      value={runForm.vehicle_id}
                      onChange={(e) => setRunForm({ ...runForm, vehicle_id: e.target.value })}
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
                      value={runForm.passenger_count}
                      onChange={(e) => setRunForm({ ...runForm, passenger_count: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                </>
              )}

              {drawerType === 'generate' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Route *</label>
                    <select
                      value={generateForm.route_id}
                      onChange={(e) => setGenerateForm({ ...generateForm, route_id: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                    >
                      <option value="">Select route</option>
                      {routes.filter(r => r.active).map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                    {formErrors.route_id && <div className="text-red-600 text-sm mt-1">{formErrors.route_id}</div>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Date *</label>
                    <input
                      type="date"
                      value={generateForm.date}
                      onChange={(e) => setGenerateForm({ ...generateForm, date: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                    />
                    {formErrors.date && <div className="text-red-600 text-sm mt-1">{formErrors.date}</div>}
                  </div>
                  <div className="text-sm text-gray-600">
                    This will generate multiple runs based on the route's service window and frequency. Drivers/vehicles can be assigned later.
                  </div>
                </>
              )}
            </div>

            <div className="sticky bottom-0 bg-white border-t p-4 flex gap-2">
              <button
                onClick={drawerType === 'route' ? handleSaveRoute : drawerType === 'run' ? handleSaveRun : handleGenerate}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {drawerType === 'generate' ? 'Generate' : 'Save'}
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

export default JourneysSalawaat;
