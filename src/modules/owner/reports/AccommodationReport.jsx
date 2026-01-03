import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { Bed, Building2, CalendarClock, Filter, Lightbulb, PieChart } from "lucide-react";

const statusOptions = ["all", "available", "occupied", "cleaning", "maintenance", "blocked"];

const AccommodationReport = () => {
  const [rooms, setRooms] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [statusFilter, setStatusFilter] = useState("all");
  const [buildingFilter, setBuildingFilter] = useState("all");
  const [minBeds, setMinBeds] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const today = new Date();
        const pastWindow = new Date();
        pastWindow.setDate(today.getDate() - 30);
        const futureWindow = new Date();
        futureWindow.setDate(today.getDate() + 30);

        const [
          { data: buildingData, error: buildingErr },
          { data: roomData, error: roomErr },
          { data: allocationData, error: allocErr },
        ] = await Promise.all([
          supabase.from("buildings").select("id, name").order("name"),
          supabase
            .from("rooms")
            .select("id, room_number, floor, bed_capacity, status, building_id")
            .order("room_number"),
          supabase
            .from("allocations")
            .select("room_id, start_timestamp, end_timestamp, status")
            .gte("end_timestamp", pastWindow.toISOString())
            .lte("start_timestamp", futureWindow.toISOString()),
        ]);

        if (buildingErr) throw buildingErr;
        if (roomErr) throw roomErr;
        if (allocErr) throw allocErr;

        setBuildings(buildingData || []);
        setRooms(roomData || []);
        setAllocations(allocationData || []);
      } catch (err) {
        console.error("Failed to load accommodation data", err);
        setError(err.message || "Unable to fetch accommodation data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const filtered = useMemo(() => {
    return rooms.filter((room) => {
      const matchesStatus = statusFilter === "all" || room.status === statusFilter;
      const matchesBuilding = buildingFilter === "all" || room.building_id === buildingFilter;
      const matchesBeds = minBeds ? (room.bed_capacity || 0) >= Number(minBeds) : true;
      return matchesStatus && matchesBuilding && matchesBeds;
    });
  }, [rooms, statusFilter, buildingFilter, minBeds]);

  const buildingMap = useMemo(() => {
    const map = {};
    buildings.forEach((b) => {
      map[b.id] = b.name || "Unnamed";
    });
    return map;
  }, [buildings]);

  const stats = useMemo(() => {
    const totalRooms = filtered.length;
    const totalCapacity = filtered.reduce((sum, r) => sum + (r.bed_capacity || 0), 0);
    const avgBeds = totalRooms ? (totalCapacity / totalRooms).toFixed(1) : 0;
    const statusCounts = filtered.reduce((acc, r) => {
      const key = r.status || "unknown";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const capacityByBuilding = filtered.reduce((acc, r) => {
      const key = buildingMap[r.building_id] || "Unknown";
      acc[key] = (acc[key] || 0) + (r.bed_capacity || 0);
      return acc;
    }, {});
    const roomsByBuilding = filtered.reduce((acc, r) => {
      const key = buildingMap[r.building_id] || "Unknown";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const now = new Date();
    const liveOccupiedBeds = allocations.reduce((sum, a) => {
      const start = a.start_timestamp ? new Date(a.start_timestamp) : null;
      const end = a.end_timestamp ? new Date(a.end_timestamp) : null;
      if (!start || !end) return sum;
      const isActive = start <= now && now <= end && ["reserved", "checked_in"].includes((a.status || "").toLowerCase());
      if (!isActive) return sum;
      const room = filtered.find((r) => r.id === a.room_id);
      return sum + (room?.bed_capacity || 0);
    }, 0);
    const occupancyRate = totalCapacity ? ((liveOccupiedBeds / totalCapacity) * 100).toFixed(1) : "0.0";

    const upcomingDays = 7;
    const arrivals = {};
    const departures = {};
    const today = new Date();
    for (let i = 0; i < upcomingDays; i += 1) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      arrivals[key] = 0;
      departures[key] = 0;
    }
    allocations.forEach((a) => {
      const start = a.start_timestamp ? new Date(a.start_timestamp) : null;
      const end = a.end_timestamp ? new Date(a.end_timestamp) : null;
      if (start) {
        const key = start.toISOString().slice(0, 10);
        if (arrivals[key] !== undefined) arrivals[key] += 1;
      }
      if (end) {
        const key = end.toISOString().slice(0, 10);
        if (departures[key] !== undefined) departures[key] += 1;
      }
    });

    const activeByBuilding = allocations.reduce((acc, a) => {
      const start = a.start_timestamp ? new Date(a.start_timestamp) : null;
      const end = a.end_timestamp ? new Date(a.end_timestamp) : null;
      if (!start || !end) return acc;
      if (start <= now && now <= end) {
        const room = filtered.find((r) => r.id === a.room_id);
        const buildingName = room ? buildingMap[room.building_id] || "Unknown" : "Unknown";
        acc[buildingName] = (acc[buildingName] || 0) + (room?.bed_capacity || 0);
      }
      return acc;
    }, {});

    return {
      totalRooms,
      totalCapacity,
      avgBeds,
      statusCounts,
      capacityByBuilding,
      roomsByBuilding,
      liveOccupiedBeds,
      occupancyRate,
      arrivals,
      departures,
      activeByBuilding,
    };
  }, [filtered, buildingMap, allocations]);

  const topList = (obj, limit = 5) =>
    Object.entries(obj || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Accommodation Report</h1>
        <div className="flex items-center gap-3 text-gray-600">
          <div className="h-10 w-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <div>Loading accommodation data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Accommodation Report</h1>
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Accommodation Overview</h1>
          <p className="text-gray-600">Filter by status, building, and capacity to view occupancy trends.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Filter className="w-4 h-4" />
          <span>{filtered.length} of {rooms.length} rooms</span>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Building</label>
            <select
              value={buildingFilter}
              onChange={(e) => setBuildingFilter(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="all">All</option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Min Beds</label>
            <input
              type="number"
              min="0"
              value={minBeds}
              onChange={(e) => setMinBeds(e.target.value)}
              placeholder="e.g. 2"
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Rooms" value={stats.totalRooms} icon={<Building2 className="w-4 h-4 text-amber-600" />} />
        <StatCard title="Total Beds" value={stats.totalCapacity} icon={<Bed className="w-4 h-4 text-amber-600" />} />
        <StatCard title="Avg Beds / Room" value={stats.avgBeds} />
        <StatCard title="Live Occupied Beds" value={stats.liveOccupiedBeds} />
        <StatCard title="Occupancy Rate" value={`${stats.occupancyRate}%`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <BreakdownCard title="Status Breakdown" data={stats.statusCounts} icon={<PieChart className="w-4 h-4 text-blue-600" />} />
        <BreakdownCard title="Beds by Building" data={Object.fromEntries(topList(stats.capacityByBuilding, 8))} />
        <BreakdownCard title="Rooms by Building" data={Object.fromEntries(topList(stats.roomsByBuilding, 8))} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BreakdownCard
          title="Active Beds by Building"
          data={Object.fromEntries(topList(stats.activeByBuilding, 8))}
          icon={<Building2 className="w-4 h-4 text-amber-600" />}
        />
        <TimelineCard arrivals={stats.arrivals} departures={stats.departures} />
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-5 h-5 text-amber-500" />
          <h3 className="font-semibold text-gray-800">Suggestions</h3>
        </div>
        <ul className="list-disc pl-5 text-sm text-gray-700 space-y-2">
          <li>Balance occupancy by shifting bookings toward buildings with lower bed utilization.</li>
          <li>Use status breakdown to prioritize cleaning/maintenance clearances before high-demand dates.</li>
          <li>Track live occupancy vs. capacity; flex inventory (block/unblock) based on 7-day arrivals/departures trend.</li>
          <li>Identify underused buildings (low active beds) for temporary closures or renovation windows.</li>
          <li>Pair large groups with higher-capacity rooms to reduce housekeeping load and turnover time.</li>
        </ul>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-4">
    <div className="flex items-center justify-between mb-2">
      <div className="text-sm text-gray-600">{title}</div>
      {icon}
    </div>
    <div className="text-2xl font-semibold text-gray-900">{value}</div>
  </div>
);

const BreakdownCard = ({ title, data, icon }) => {
  const entries = Object.entries(data || {});
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h3 className="font-semibold text-gray-800">{title}</h3>
      </div>
      {entries.length === 0 ? (
        <div className="text-sm text-gray-500">No data</div>
      ) : (
        <div className="space-y-2">
          {entries.map(([key, val]) => (
            <div key={key} className="flex items-center justify-between text-sm">
              <span className="text-gray-700">{key}</span>
              <span className="font-semibold">{val}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const TimelineCard = ({ arrivals = {}, departures = {} }) => {
  const days = Object.keys(arrivals);
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <CalendarClock className="w-4 h-4 text-indigo-600" />
        <h3 className="font-semibold text-gray-800">7-Day Arrivals vs. Departures</h3>
      </div>
      {days.length === 0 ? (
        <div className="text-sm text-gray-500">No upcoming stays in window</div>
      ) : (
        <div className="space-y-2 text-sm">
          {days.map((d) => (
            <div key={d} className="flex items-center justify-between">
              <span className="text-gray-700">{d}</span>
              <div className="flex items-center gap-3">
                <span className="text-green-700">Arrivals: {arrivals[d] || 0}</span>
                <span className="text-blue-700">Departures: {departures[d] || 0}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AccommodationReport;
