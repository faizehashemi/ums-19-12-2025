import React, { useEffect, useMemo, useState } from "react";
import Title from "../../components/Title";
import { assets } from "../../assets/assets";
import { supabase } from "../../lib/supabase";

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");

  const isInMakkah = (travelDetails) => {
    if (!travelDetails) return false;
    
    try {
      const now = new Date();
      
      const arrival = travelDetails.arrivalDateTime ? new Date(travelDetails.arrivalDateTime) : null;
      const departure = travelDetails.departureDateTime ? new Date(travelDetails.departureDateTime) : null;
      
      // These are date strings (YYYY-MM-DD), so adding time might be needed for precise comparison, 
      // or we just compare dates. `new Date("YYYY-MM-DD")` is usually UTC midnight.
      // To be safe for "current day", checking ranges is key.
      const toMadina = travelDetails.travelMadinaDate ? new Date(travelDetails.travelMadinaDate) : null;
      const fromMadina = travelDetails.makkahMadinaDate ? new Date(travelDetails.makkahMadinaDate) : null;

      if (!arrival) return false;

      // Check Makkah stay duration
      
      // Case 1: Makkah First (Arrival -> Makkah -> Madina)
      // Presence in Makkah is from Arrival until travel to Madina.
      if (toMadina) {
        // Adjust toMadina to end of day? Or start of day?
        // Usually checkout is by noon.
        // Let's assume inclusive of the date until travel?
        return now >= arrival && now < toMadina;
      }

      // Case 2: Madina First (Arrival -> Madina -> Makkah)
      // Presence in Makkah is from travel FROM Madina TO Makkah, until Departure.
      if (fromMadina) {
        if (!departure) return now >= fromMadina; // If no departure, assume currently there if after start
        return now >= fromMadina && now <= departure;
      }

      // Case 3: Only Makkah (No inter-city travel dates)
      // Presence is entire trip (Arrival -> Departure)
      if (departure) {
        return now >= arrival && now <= departure;
      }
      
      return false;
    } catch (e) {
      console.error("Date parsing error", e);
      return false;
    }
  };

  const totals = useMemo(() => {
    // Check for "In Makkah" status
    const inMakkahCount = reservations.filter(r => {
      // Exclude cancelled/rejected?
      const status = (r.status || "").toLowerCase();
      if (['cancelled', 'rejected'].includes(status)) return false;
      return isInMakkah(r.travel_details);
    }).length;

    const totalRevenue = reservations.reduce((sum, r) => sum + (r.total_fee || 0), 0);

    return { inMakkahCount, totalRevenue };
  }, [reservations]);

  const fetchReservations = async () => {
    setLoading(true);
    setErrorMsg("");

    try {
      // Fetch from 'reservations' table instead of 'trip_reservations'
      const { data, error } = await supabase
        .from("reservations")
        .select(
          "id, created_at, status, accommodation, num_members, members, travel_details, total_fee"
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Transform data to match previous structure for the table if needed, 
      // or just accept the new structure.
      // We need to map extracted fields for the table display.
      const transformed = (data || []).map(r => {
        const members = Array.isArray(r.members) ? r.members : [];
        const mainGuest = members[0] || {};
        
        return {
          ...r,
          guest_name: mainGuest.name || "—",
          guest_phone: mainGuest.phone || mainGuest.mobile_no || "—",
          guest_email: mainGuest.email || "—",
          trip_type: r.accommodation, // 'Sharing' or 'Exclusive'
          pax: r.num_members
        };
      });

      setReservations(transformed);
    } catch (err) {
      console.error(err);
      setErrorMsg(err?.message || "Failed to load reservations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  return (
    <div>
      <Title
        align="left"
        font="outfit"
        title="Dashboard"
        subTitle="Monitor your room listings, track bookings and analyze revenue—all in one place. Stay updated with real-time insights to ensure smooth operations."
      />

      <div className="flex gap-4 my-8 flex-wrap">
        {/* In Makkah Count */}
        <div className="bg-primary/3 border border-primary/10 rounded flex p-4 pr-8">
          <img
            src={assets.totalBookingIcon}
            alt=""
            className="max-sm:hidden h-10"
          />
          <div className="flex flex-col sm:ml-4 font-medium">
            <p className="text-blue-500 text-lg">In Makkah</p>
            <p className="text-neutral-400 text-base">
              {loading ? "..." : totals.inMakkahCount}
            </p>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-primary/3 border border-primary/10 rounded flex p-4 pr-8">
          <img
            src={assets.totalRevenueIcon}
            alt=""
            className="max-sm:hidden h-10"
          />
          <div className="flex flex-col sm:ml-4 font-medium">
            <p className="text-blue-500 text-lg">Total Revenue</p>
            <p className="text-neutral-400 text-base">
              {loading ? "..." : `$ ${totals.totalRevenue.toLocaleString()}`}
            </p>
          </div>
        </div>

        {/* Refresh */}
        <button
          onClick={fetchReservations}
          className="ml-auto bg-black text-white px-4 py-2 rounded-md h-fit"
          disabled={loading}
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {/* Recent Bookings */}
      <h2 className="text-xl text-blue-950/70 font-medium mb-5">
        Recent Reservations
      </h2>

      {errorMsg && (
        <div className="max-w-3xl mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">
          {errorMsg}
        </div>
      )}

      <div className="w-full max-w-5xl text-left border border-gray-300 rounded-lg max-h-[26rem] overflow-y-scroll">
        <table className="w-full">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="py-3 px-4 text-gray-800 font-medium">Guest</th>
              <th className="py-3 px-4 text-gray-800 font-medium max-sm:hidden">
                Trip Type
              </th>
              <th className="py-3 px-4 text-gray-800 font-medium text-center">
                Pax
              </th>
              <th className="py-3 px-4 text-gray-800 font-medium text-center">
                Status
              </th>
              <th className="py-3 px-4 text-gray-800 font-medium text-center max-sm:hidden">
                Created
              </th>
            </tr>
          </thead>

          <tbody className="text-sm">
            {loading && (
              <tr>
                <td
                  colSpan={5}
                  className="py-6 px-4 text-center text-gray-500"
                >
                  Loading reservations...
                </td>
              </tr>
            )}

            {!loading && reservations.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="py-6 px-4 text-center text-gray-500"
                >
                  No reservations yet.
                </td>
              </tr>
            )}

            {!loading &&
              reservations.map((r) => {
                const status = (r.status || "new").toLowerCase();

                const badgeClass =
                  status === "confirmed" || status === "approved"
                    ? "bg-green-200 text-green-700"
                    : status === "cancelled" || status === "rejected"
                    ? "bg-red-200 text-red-700"
                    : status === "completed"
                    ? "bg-gray-200 text-gray-700"
                    : "bg-amber-200 text-amber-700";

                const created = r.created_at
                  ? new Date(r.created_at).toLocaleString()
                  : "-";

                return (
                  <tr key={r.id}>
                    <td className="py-3 px-4 text-gray-700 border-t border-gray-300">
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {r.guest_name}
                        </span>
                        <span className="text-xs text-gray-400">
                          {r.guest_phone || ""}
                          {r.guest_phone && r.guest_email ? " • " : ""}
                          {r.guest_email || ""}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-gray-700 border-t border-gray-300 max-sm:hidden">
                      {r.trip_type || "—"}
                    </td>

                    <td className="py-3 px-4 text-gray-700 border-t border-gray-300 text-center">
                      {r.pax ?? "—"}
                    </td>

                    <td className="py-3 px-4 border-t border-gray-300 text-center">
                      <span
                        className={`py-1 px-3 text-xs rounded-full inline-block ${badgeClass}`}
                      >
                        {status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-gray-700 border-t border-gray-300 text-center max-sm:hidden">
                      {created}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
