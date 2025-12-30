import React from "react";

export default function StepTravelDetails({
  travelDetails,
  setTravelDetails,
  countries,
  airlines,
}) {
  const setField = (key) => (e) =>
    setTravelDetails({ ...travelDetails, [key]: e.target.value });

  return (
    <div className="animate-fadeIn">
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
        Travel Details
      </h2>

      {/* ✅ Responsive grid: 2 / 4 / 6 columns */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-5">
        {/* Country */}
        <div className="col-span-2 md:col-span-2 lg:col-span-2">
          <label className="block text-gray-700 font-semibold mb-2">Country *</label>
          <select
            value={travelDetails.country}
            onChange={setField("country")}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:outline-none"
          >
            <option value="">Select Country</option>
            {countries.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Travel Mode */}
        <div className="col-span-2 md:col-span-2 lg:col-span-2">
          <label className="block text-gray-700 font-semibold mb-2">
            Travel Mode *
          </label>
          <div className="flex flex-wrap gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="By Air"
                checked={travelDetails.travelMode === "By Air"}
                onChange={setField("travelMode")}
                className="w-5 h-5"
              />
              <span>By Air</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="By Road"
                checked={travelDetails.travelMode === "By Road"}
                onChange={setField("travelMode")}
                className="w-5 h-5"
              />
              <span>By Road</span>
            </label>
          </div>
        </div>

        {/* Road Mode (conditional) */}
        {travelDetails.travelMode === "By Road" && (
          <div className="col-span-2 md:col-span-4 lg:col-span-2">
            <label className="block text-gray-700 font-semibold mb-2">
              Road Travel Mode *
            </label>
            <div className="flex flex-wrap gap-6 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="By Car"
                  checked={travelDetails.roadMode === "By Car"}
                  onChange={setField("roadMode")}
                  className="w-5 h-5"
                />
                <span>By Car</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="By Bus"
                  checked={travelDetails.roadMode === "By Bus"}
                  onChange={setField("roadMode")}
                  className="w-5 h-5"
                />
                <span>By Bus</span>
              </label>
            </div>
          </div>
        )}

        {/* Airline (conditional) */}
        {travelDetails.travelMode === "By Air" && (
          <div className="col-span-2 md:col-span-2 lg:col-span-2">
            <label className="block text-gray-700 font-semibold mb-2">
              Airline Name *
            </label>
            <select
              value={travelDetails.airline}
              onChange={setField("airline")}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:outline-none"
            >
              <option value="">Select Airline</option>
              {airlines.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
        )}

        {/* Flight No (conditional) */}
        {travelDetails.travelMode === "By Air" && (
          <div className="col-span-2 md:col-span-2 lg:col-span-2">
            <label className="block text-gray-700 font-semibold mb-2">
              Flight Number *
            </label>
            <input
              type="text"
              value={travelDetails.flightNo}
              onChange={setField("flightNo")}
              placeholder="e.g., SV123"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:outline-none"
            />
          </div>
        )}

        {/* Arrival DateTime */}
        <div className="col-span-2 md:col-span-2 lg:col-span-2">
          <label className="block text-gray-700 font-semibold mb-2">
            Arrival Date and Time *
          </label>
          <input
            type="datetime-local"
            value={travelDetails.arrivalDateTime}
            onChange={setField("arrivalDateTime")}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:outline-none"
          />
        </div>

        {/* Departure DateTime */}
        <div className="col-span-2 md:col-span-2 lg:col-span-2">
          <label className="block text-gray-700 font-semibold mb-2">
            Departure Date and Time *
          </label>
          <input
            type="datetime-local"
            value={travelDetails.departureDateTime}
            onChange={setField("departureDateTime")}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:outline-none"
          />
        </div>

        {/* Departure Airport (long) */}
        <div className="col-span-2 md:col-span-4 lg:col-span-3">
          <label className="block text-gray-700 font-semibold mb-2">
            Departure Airport *
          </label>
          <input
            type="text"
            value={travelDetails.departureAirport}
            onChange={setField("departureAirport")}
            placeholder="e.g., King Abdulaziz International Airport"
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:outline-none"
          />
        </div>

        {/* Departure Airline */}
        <div className="col-span-2 md:col-span-2 lg:col-span-2">
          <label className="block text-gray-700 font-semibold mb-2">
            Departure Airline *
          </label>
          <select
            value={travelDetails.departureAirline}
            onChange={setField("departureAirline")}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:outline-none"
          >
            <option value="">Select Airline</option>
            {airlines.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>

        {/* Departure Flight Number */}
        <div className="col-span-2 md:col-span-2 lg:col-span-1">
          <label className="block text-gray-700 font-semibold mb-2">
            Departure Flight No. *
          </label>
          <input
            type="text"
            value={travelDetails.departureFlightNo}
            onChange={setField("departureFlightNo")}
            placeholder="e.g., SV456"
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}
