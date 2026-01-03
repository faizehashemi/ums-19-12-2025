import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { Calendar, Filter, Lightbulb, Plane, Users } from "lucide-react";

const statusOptions = [
  "all",
  "pending",
  "approved",
  "confirmed",
  "rejected",
  "cancelled",
  "completed",
];

const travelModes = ["all", "By Air", "By Road"];

const ReservationsReport = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [statusFilter, setStatusFilter] = useState("all");
  const [travelModeFilter, setTravelModeFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("");
  const [stayFrom, setStayFrom] = useState("");
  const [stayTo, setStayTo] = useState("");

  useEffect(() => {
    const loadReservations = async () => {
      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from("reservations")
          .select(
            "id, created_at, status, num_members, total_fee, accommodation, travel_details, members, member_breakdown, makkah_days, madina_days"
          )
          .order("created_at", { ascending: false });

        if (fetchError) throw fetchError;
        setReservations(data || []);
      } catch (err) {
        console.error("Failed to load reservations", err);
        setError(err.message || "Unable to fetch reservations");
      } finally {
        setLoading(false);
      }
    };

    loadReservations();
  }, []);

  const getStayWindow = (r) => {
    const travel = r.travel_details || {};
    const checkIn =
      travel.arrivalDateTime ||
      travel?.makkah?.checkin ||
      travel?.madina?.checkin ||
      travel.travelMadinaDate ||
      null;
    const checkOut =
      travel.departureDateTime ||
      travel?.makkah?.checkout ||
      travel?.madina?.checkout ||
      travel.makkahMadinaDate ||
      null;
    return {
      start: checkIn ? new Date(checkIn) : null,
      end: checkOut ? new Date(checkOut) : null,
    };
  };

  const filtered = useMemo(() => {
    return reservations.filter((r) => {
      const travel = r.travel_details || {};
      const { start, end } = getStayWindow(r);
      const matchesStatus =
        statusFilter === "all" || r.status?.toLowerCase() === statusFilter;
      const matchesTravelMode =
        travelModeFilter === "all" || travel.travelMode === travelModeFilter;
      const matchesCountry = countryFilter
        ? (travel.country || "").toLowerCase().includes(countryFilter.toLowerCase())
        : true;

      let matchesStay = true;
      if (stayFrom || stayTo) {
        if (!start && !end) {
          matchesStay = false;
        } else {
          const from = stayFrom ? new Date(stayFrom) : null;
          const to = stayTo ? new Date(stayTo) : null;
          if (to) to.setHours(23, 59, 59, 999);
          const stayStart = start || end;
          const stayEnd = end || start;
          if (from && stayEnd && stayEnd < from) matchesStay = false;
          if (to && stayStart && stayStart > to) matchesStay = false;
        }
      }

      return matchesStatus && matchesTravelMode && matchesCountry && matchesStay;
    });
  }, [reservations, statusFilter, travelModeFilter, countryFilter, stayFrom, stayTo]);

  const stats = useMemo(() => {
    const totalReservations = filtered.length;
    const totalMembers = filtered.reduce((sum, r) => {
      if (typeof r.num_members === "number") return sum + r.num_members;
      if (Array.isArray(r.members)) return sum + r.members.length;
      return sum;
    }, 0);

    const totalFees = filtered.reduce((sum, r) => sum + (r.total_fee || 0), 0);
    const avgGroup = totalReservations ? (totalMembers / totalReservations).toFixed(1) : 0;

    const totalNights = filtered.reduce((sum, r) => {
      if (typeof r.makkah_days === "number" || typeof r.madina_days === "number") {
        return sum + (r.makkah_days || 0) + (r.madina_days || 0);
      }
      const { start, end } = getStayWindow(r);
      if (start && end) {
        const diff = Math.max(0, (end - start) / (1000 * 60 * 60 * 24));
        return sum + Math.ceil(diff);
      }
      return sum;
    }, 0);
    const avgStay = totalReservations ? (totalNights / totalReservations).toFixed(1) : 0;
    const revPerMember = totalMembers ? (totalFees / totalMembers).toFixed(2) : "0.00";

    const byStatus = filtered.reduce((acc, r) => {
      const key = r.status || "unknown";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const byTravelMode = filtered.reduce((acc, r) => {
      const key = r.travel_details?.travelMode || "Unknown";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const arrivalAirports = filtered.reduce((acc, r) => {
      const key = r.travel_details?.arrivalAirport || "N/A";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const byCountry = filtered.reduce((acc, r) => {
      const key = r.travel_details?.country || "Unknown";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return {
      totalReservations,
      totalMembers,
      totalFees,
      avgGroup,
      totalNights,
      avgStay,
      revPerMember,
      byStatus,
      byTravelMode,
      arrivalAirports,
      byCountry,
    };
  }, [filtered]);

  const topList = (obj, limit = 5) =>
    Object.entries(obj || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Reservations Report</h1>
        <div className="flex items-center gap-3 text-gray-600">
          <div className="h-10 w-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <div>Loading reservations...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Reservations Report</h1>
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Reservations Overview</h1>
          <p className="text-gray-600">Filtered by stay dates, travel mode, country, and status.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Filter className="w-4 h-4" />
          <span>{filtered.length} of {reservations.length} reservations</span>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Travel Mode</label>
            <select
              value={travelModeFilter}
              onChange={(e) => setTravelModeFilter(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              {travelModes.map((m) => (
                <option key={m} value={m}>
                  {m === "all" ? "All" : m}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
            <input
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              placeholder="e.g. India"
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stay From (check-in)</label>
            <input
              type="date"
              value={stayFrom}
              onChange={(e) => setStayFrom(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stay To (checkout)</label>
            <input
              type="date"
              value={stayTo}
              onChange={(e) => setStayTo(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Reservations" value={stats.totalReservations} />
        <StatCard title="Total Members" value={stats.totalMembers} icon={<Users className="w-4 h-4 text-amber-600" />} />
        <StatCard
          title="Total Fees"
          value={`$${stats.totalFees.toFixed(2)}`}
          icon={<Calendar className="w-4 h-4 text-amber-600" />}
        />
        <StatCard title="Avg Group Size" value={stats.avgGroup} />
        <StatCard title="Avg Stay (days)" value={stats.avgStay} />
        <StatCard title="Revenue / Member" value={`$${stats.revPerMember}`} />
        <StatCard title="Total Nights" value={stats.totalNights} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <BreakdownCard title="Status Breakdown" data={stats.byStatus} />
        <BreakdownCard title="Travel Modes" data={stats.byTravelMode} icon={<Plane className="w-4 h-4 text-blue-600" />} />
        <BreakdownCard title="Arrival Airports" data={stats.arrivalAirports} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BreakdownCard title="Top Countries" data={Object.fromEntries(topList(stats.byCountry))} />
        <BreakdownCard title="Top Arrival Airports" data={Object.fromEntries(topList(stats.arrivalAirports))} />
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-5 h-5 text-amber-500" />
          <h3 className="font-semibold text-gray-800">Suggestions</h3>
        </div>
        <ul className="list-disc pl-5 text-sm text-gray-700 space-y-2">
          <li>Track conversion by status to spot bottlenecks; prioritize follow-ups on large groups stuck in pending/approved.</li>
          <li>Use travel mode and arrival airport split to allocate transport capacity (airport vs. road) for the filtered period.</li>
          <li>Top countries can guide localized communication/ads and staffing for language support.</li>
          <li>Revenue per member and average stay help benchmark pricing; consider upsell offers for stays shorter than the average.</li>
          <li>Compare total nights vs. room inventory to forecast occupancy and adjust rates or promotions accordingly.</li>
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

export default ReservationsReport;
