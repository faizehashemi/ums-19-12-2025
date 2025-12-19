import React, { useEffect, useMemo, useState } from "react";
import Title from "../../components/Title";
import { assets } from "../../assets/assets";
import { supabase } from "../../lib/supabaseClient";

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");

  const totals = useMemo(() => {
    const totalBookings = reservations.length;

    // If you later add price fields (or link to rooms), compute revenue here.
    // Example: reservations.reduce((sum, r) => sum + (r.total_amount || 0), 0)
    const totalRevenue = 0;

    return { totalBookings, totalRevenue };
  }, [reservations]);

  const fetchReservations = async () => {
    setLoading(true);
    setErrorMsg("");

    try {
      const { data, error } = await supabase
        .from("trip_reservations")
        .select(
          "id, created_at, status, trip_type, pax, guest_name, guest_phone, guest_email"
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      setReservations(data || []);
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
        {/* Total Bookings */}
        <div className="bg-primary/3 border border-primary/10 rounded flex p-4 pr-8">
          <img
            src={assets.totalBookingIcon}
            alt=""
            className="max-sm:hidden h-10"
          />
          <div className="flex flex-col sm:ml-4 font-medium">
            <p className="text-blue-500 text-lg">Total Bookings</p>
            <p className="text-neutral-400 text-base">
              {loading ? "..." : totals.totalBookings}
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
              {loading ? "..." : `$ ${totals.totalRevenue}`}
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
                  status === "confirmed"
                    ? "bg-green-200 text-green-700"
                    : status === "cancelled"
                    ? "bg-red-200 text-red-700"
                    : status === "reviewing"
                    ? "bg-blue-200 text-blue-700"
                    : "bg-amber-200 text-amber-700";

                const created = r.created_at
                  ? new Date(r.created_at).toLocaleString()
                  : "-";

                return (
                  <tr key={r.id}>
                    <td className="py-3 px-4 text-gray-700 border-t border-gray-300">
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {r.guest_name || "—"}
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
