import React from "react";
import FlightSelector from "../../common/FlightSelector";

export default function StepTravelDetails({
  travelDetails,
  setTravelDetails,
  countries,
  airlines,
}) {
  const setField = (key) => (e) =>
    setTravelDetails({ ...travelDetails, [key]: e.target.value });

  // Handle arrival flight selection
  const handleArrivalFlightSelect = (flight) => {
    if (flight) {
      setTravelDetails({
        ...travelDetails,
        airline: flight.airline,
        flightNo: flight.flightNumber,
        arrivalDateTime: "", // User will set this separately
      });
    } else {
      setTravelDetails({
        ...travelDetails,
        airline: "",
        flightNo: "",
      });
    }
  };

  // Handle departure flight selection
  const handleDepartureFlightSelect = (flight) => {
    if (flight) {
      setTravelDetails({
        ...travelDetails,
        departureAirline: flight.airline,
        departureFlightNo: flight.flightNumber,
        departureDateTime: "", // User will set this separately
      });
    } else {
      setTravelDetails({
        ...travelDetails,
        departureAirline: "",
        departureFlightNo: "",
      });
    }
  };

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

        {/* Arrival Flight Selector (conditional) */}
        {travelDetails.travelMode === "By Air" && (
          <div className="col-span-full">
            <label className="block text-gray-700 font-semibold mb-2">
              Arrival Flight Information *
            </label>
            <FlightSelector
              airport="Jeddah Airport"
              type="arrival"
              onFlightSelect={handleArrivalFlightSelect}
              value={
                travelDetails.airline && travelDetails.flightNo
                  ? {
                      airline: travelDetails.airline,
                      flightNumber: travelDetails.flightNo,
                    }
                  : null
              }
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

        {/* Travel to Madina Date */}
        <div className="col-span-2 md:col-span-2 lg:col-span-2">
          <label className="block text-gray-700 font-semibold mb-2">
            Travel to Madina Date *
          </label>
          <input
            type="datetime-local"
            value={travelDetails.travelMadinaDate}
            onChange={setField("travelMadinaDate")}
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
          <select
            value={travelDetails.departureAirport}
            onChange={setField("departureAirport")}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:outline-none"
          >
            <option value="">Select Airport</option>
            <option value="Jeddah Airport">Jeddah Airport</option>
            <option value="Madina Airport">Madina Airport</option>
          </select>
        </div>

        {/* Departure Flight Selector */}
        <div className="col-span-full">
          <label className="block text-gray-700 font-semibold mb-2">
            Departure Flight Information *
          </label>
          <FlightSelector
            airport={travelDetails.departureAirport}
            type="departure"
            onFlightSelect={handleDepartureFlightSelect}
            value={
              travelDetails.departureAirline && travelDetails.departureFlightNo
                ? {
                    airline: travelDetails.departureAirline,
                    flightNumber: travelDetails.departureFlightNo,
                  }
                : null
            }
          />
        </div>
      </div>
    </div>
  );
}
