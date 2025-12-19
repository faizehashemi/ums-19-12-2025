import React, { useMemo, useState } from "react";
import { assets } from "../assets/assets";
import { supabase } from "../lib/supabaseClient";

const TRIPS = [
  "Single Umra (Makkah -> Madina)",
  "Single Umra (Madina -> Makkah)",
  "2 Umra Package (Makkah -> Madina -> Makkah)",
  "Makkah Only",
  "Madina Only",
];


const INITIAL_FORM = {
  guestName: "",
  guestPhone: "",
  guestEmail: "",
  airline: "",
  flightNumber: "",
  arrivalTime: "",
  departureDate: "",
  pax: 1,
  atraaf: false,
  privateSuiteRooms: false,
  makkahToMadinaDate: "",
  madinaToMakkahDate: "",
};

const Hero = () => {
const [tripType, setTripType] = useState("");
const [form, setForm] = useState(INITIAL_FORM);
const [submitting, setSubmitting] = useState(false);


  const needsM2M = useMemo(
    () =>
      tripType === "Single Umra (Makkah -> Madina)" ||
      tripType === "2 Umra Package (Makkah -> Madina -> Makkah)",
    [tripType]
  );

  const needsM2K = useMemo(
    () =>
      tripType === "Single Umra (Madina -> Makkah)" ||
      tripType === "2 Umra Package (Makkah -> Madina -> Makkah)",
    [tripType]
  );

  const showPrivateSuite = useMemo(
    () =>
      tripType === "Single Umra (Makkah -> Madina)" ||
      tripType === "Single Umra (Madina -> Makkah)" ||
      tripType === "2 Umra Package (Makkah -> Madina -> Makkah)",
    [tripType]
  );

  const update = (key) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  // 🛑 prevent double submit
  if (submitting) return;

  try {
    setSubmitting(true); // 🔒 lock UI immediately

    const payload = {
      trip_type: tripType,

      guest_name: form.guestName.trim(),
      guest_phone: form.guestPhone.trim(),
      guest_email: form.guestEmail.trim() || null,

      airline: form.airline.trim(),
      flight_number: form.flightNumber.trim(),
      arrival_time: form.arrivalTime,
      departure_date: form.departureDate,
      pax: Number(form.pax),

      atraaf: !!form.atraaf,
      private_suite_rooms: !!form.privateSuiteRooms,

      makkah_to_madina_date: form.makkahToMadinaDate || null,
      madina_to_makkah_date: form.madinaToMakkahDate || null,
      status: "new",
    };

    const { data, error } = await supabase
      .from("trip_reservations")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;

    alert("Reservation created ✅");

    // ✅ reset form
    setForm(INITIAL_FORM);
    setTripType("");
  } catch (err) {
    console.error(err);
    alert(err.message || "Failed to create reservation");
  } finally {
    setSubmitting(false); // 🔓 ALWAYS unlock (success or error)
  }
};



  return (
    <div className='flex flex-col items-start justify-center px-6 md:px-16 lg:px-24 xl:px-32 text-white bg-[url("/src/assets/heroImage.png")] bg-no-repeat bg-cover bg-center h-screen'>
      <p className='bg-[#49B9FF]/50 px-3.5 py-1 rounded-full mt-20 mx-auto w-fit'>Makkah & Madinah Rubaat Reservation at your fingertips</p>

      <form
  className="
    bg-white text-gray-600 rounded-lg px-6 py-5 mt-8 mx-auto w-full max-w-6xl
    grid grid-cols-12 gap-x-6 gap-y-4 items-end
  "
  onSubmit={handleSubmit}
>

  {/* Trip Selection */}
  <div className="col-span-12 md:col-span-5">
    <label className="text-xs font-medium text-gray-500">Trip Selection</label>
    <select
      id="tripType"
      value={tripType}
      onChange={(e) => setTripType(e.target.value)}
      required
      className="mt-1 w-full rounded border border-gray-200 px-3 py-2 text-sm outline-none bg-white"
    >
      <option value="" disabled>Select trip type</option>
      {TRIPS.map((t) => (
        <option key={t} value={t}>{t}</option>
      ))}
    </select>
  </div>
      {/* Guest Details */}
<div className="col-span-12 md:col-span-3">
  <label className="text-xs font-medium text-gray-500">Full name</label>
  <input
    value={form.guestName}
    onChange={update("guestName")}
    className="mt-1 w-full rounded border border-gray-200 px-3 py-2 text-sm outline-none"
    placeholder="Your name"
    required
  />
</div>

<div className="col-span-12 md:col-span-2">
  <label className="text-xs font-medium text-gray-500">Phone</label>
  <input
    value={form.guestPhone}
    onChange={update("guestPhone")}
    className="mt-1 w-full rounded border border-gray-200 px-3 py-2 text-sm outline-none"
    placeholder="+966..."
    required
  />
</div>

<div className="col-span-12 md:col-span-2">
  <label className="text-xs font-medium text-gray-500">Email (optional)</label>
  <input
    type="email"
    value={form.guestEmail}
    onChange={update("guestEmail")}
    className="mt-1 w-full rounded border border-gray-200 px-3 py-2 text-sm outline-none"
    placeholder="you@email.com"
  />
</div>

  {tripType && (
    <>
      {/* Airline */}
      <div className="col-span-12 md:col-span-3">
        <label className="text-xs font-medium text-gray-500">Airline</label>
        <input
          value={form.airline}
          onChange={update("airline")}
          className="mt-1 w-full rounded border border-gray-200 px-3 py-2 text-sm outline-none"
          placeholder="e.g. Saudia"
          required
        />
      </div>

      {/* Flight number */}
      <div className="col-span-12 md:col-span-2">
        <label className="text-xs font-medium text-gray-500">Flight number</label>
        <input
          value={form.flightNumber}
          onChange={update("flightNumber")}
          className="mt-1 w-full rounded border border-gray-200 px-3 py-2 text-sm outline-none"
          placeholder="SV123"
          required
        />
      </div>

      {/* Arrival time */}
      <div className="col-span-12 md:col-span-2">
        <label className="text-xs font-medium text-gray-500">Arrival time</label>
        <input
          type="time"
          value={form.arrivalTime}
          onChange={update("arrivalTime")}
          className="mt-1 w-full rounded border border-gray-200 px-3 py-2 text-sm outline-none"
          required
        />
      </div>

      {/* Departure date */}
      <div className="col-span-12 md:col-span-3">
        <label className="text-xs font-medium text-gray-500">Departure date</label>
        <input
          type="date"
          value={form.departureDate}
          onChange={update("departureDate")}
          className="mt-1 w-full rounded border border-gray-200 px-3 py-2 text-sm outline-none"
          required
        />
      </div>

      {/* Pax */}
      <div className="col-span-12 md:col-span-2">
        <label className="text-xs font-medium text-gray-500">Number of pax</label>
        <input
          type="number"
          min={1}
          max={60}
          value={form.pax}
          onChange={update("pax")}
          className="mt-1 w-full rounded border border-gray-200 px-3 py-2 text-sm outline-none"
          required
        />
      </div>

      {/* Options */}
      <div className="col-span-12 md:col-span-3">
        <label className="text-xs font-medium text-gray-500">Options</label>
        <div className="mt-2 flex flex-col gap-2 text-sm">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={form.atraaf} onChange={update("atraaf")} />
            Atraaf
          </label>

          {showPrivateSuite && (
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.privateSuiteRooms}
                onChange={update("privateSuiteRooms")}
              />
              Private suite rooms
            </label>
          )}
        </div>
      </div>

      {/* Makkah → Madina */}
      {needsM2M && (
        <div className="col-span-12 md:col-span-4">
          <label className="text-xs font-medium text-gray-500">
            Makkah → Madina date
          </label>
          <input
            type="date"
            value={form.makkahToMadinaDate}
            onChange={update("makkahToMadinaDate")}
            className="mt-1 w-full rounded border border-gray-200 px-3 py-2 text-sm outline-none"
            required
          />
        </div>
      )}

      {/* Madina → Makkah */}
      {needsM2K && (
        <div className="col-span-12 md:col-span-4">
          <label className="text-xs font-medium text-gray-500">
            Madina → Makkah date
          </label>
          <input
            type="date"
            value={form.madinaToMakkahDate}
            onChange={update("madinaToMakkahDate")}
            className="mt-1 w-full rounded border border-gray-200 px-3 py-2 text-sm outline-none"
            required
          />
        </div>
      )}

      {/* Submit */}
      <div className="col-span-12 md:col-span-4 flex md:justify-end">
        <button
  type="submit"
  disabled={submitting}
  className="w-full md:w-auto rounded-md bg-black px-6 py-3 text-white
             disabled:opacity-50 disabled:cursor-not-allowed"
>
  {submitting ? "Submitting..." : "Make Reservation"}
</button>

      </div>
    </>
  )}
</form>

    </div>
  );
};

export default Hero;
