import React from "react";
import Select from "react-select";
import FlightSelector from "../../common/FlightSelector";
import countriesData from "../../../data/countries.json";

export default function StepTravelDetails({
  travelDetails,
  setTravelDetails,
  airlines,
}) {
  const setField = (key) => (e) =>
    setTravelDetails({ ...travelDetails, [key]: e.target.value });

  // Prepare country options for React Select
  const countryOptions = countriesData.countries.map((country) => ({
    value: country,
    label: country,
  }));

  // Convert 12-hour time format to 24-hour format for datetime-local input
  const convertTo24Hour = (time12h) => {
    if (!time12h) return "";

    const [time, period] = time12h.split(' ');
    let [hours, minutes] = time.split(':');

    hours = parseInt(hours);

    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }

    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  };

  // Update datetime field with only time, keeping existing date
  const updateTimeOnly = (currentDateTime, newTime) => {
    const time24h = convertTo24Hour(newTime);
    if (!time24h) return currentDateTime;

    if (currentDateTime) {
      // If there's already a date, keep it and update only time
      const [datePart] = currentDateTime.split('T');
      return `${datePart}T${time24h}`;
    } else {
      // If no date yet, return empty (user must select date first)
      return "";
    }
  };

  // Handle arrival flight selection
  const handleArrivalFlightSelect = (flight) => {
    if (flight) {
      setTravelDetails({
        ...travelDetails,
        airline: flight.airline,
        flightNo: flight.flightNumber,
        arrivalDateTime: updateTimeOnly(travelDetails.arrivalDateTime, flight.time),
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
        departureDateTime: updateTimeOnly(travelDetails.departureDateTime, flight.time),
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
          <Select
            value={countryOptions.find((option) => option.value === travelDetails.country)}
            onChange={(selectedOption) =>
              setTravelDetails({
                ...travelDetails,
                country: selectedOption ? selectedOption.value : "",
              })
            }
            options={countryOptions}
            placeholder="Search and select country..."
            isClearable
            isSearchable
            className="react-select-container"
            classNamePrefix="react-select"
            styles={{
              control: (base, state) => ({
                ...base,
                padding: "6px 8px",
                borderWidth: "2px",
                borderColor: state.isFocused ? "#9333ea" : "#d1d5db",
                borderRadius: "0.5rem",
                boxShadow: "none",
                "&:hover": {
                  borderColor: state.isFocused ? "#9333ea" : "#d1d5db",
                },
              }),
              option: (base, state) => ({
                ...base,
                backgroundColor: state.isSelected
                  ? "#9333ea"
                  : state.isFocused
                  ? "#f3e8ff"
                  : "white",
                color: state.isSelected ? "white" : "#374151",
                cursor: "pointer",
              }),
            }}
          />
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
          <>
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

            {/* Manual Entry Fallback */}
            <div className="col-span-full">
              <p className="text-sm text-gray-600 mb-2">Or enter manually:</p>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-5">
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
              </div>
            </div>
          </>
        )}

        {/* Arrival DateTime */}
        <div className="col-span-2 md:col-span-2 lg:col-span-2">
          <label className="block text-gray-700 font-semibold mb-2">
            Arrival Date and Time *
          </label>
          {travelDetails.travelMode === "By Air" && (
            <p className="text-xs text-gray-500 mb-1">
              Select date manually. Time will auto-fill when you select a flight above.
            </p>
          )}
          <input
            type="datetime-local"
            value={travelDetails.arrivalDateTime}
            onChange={setField("arrivalDateTime")}
            step="900"
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:outline-none"
          />
        </div>

        {/* Travel to Madina Date */}
        <div className="col-span-2 md:col-span-2 lg:col-span-2">
          <label className="block text-gray-700 font-semibold mb-2">
            Travel to Madina Date *
          </label>
          <input
            type="date"
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
          {travelDetails.travelMode === "By Air" && (
            <p className="text-xs text-gray-500 mb-1">
              Select date manually. Time will auto-fill when you select a flight below.
            </p>
          )}
          <input
            type="datetime-local"
            value={travelDetails.departureDateTime}
            onChange={setField("departureDateTime")}
            step="900"
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:outline-none"
          />
        </div>

        {/* Departure Airport and Flight Information - Only for By Air */}
        {travelDetails.travelMode === "By Air" && (
          <>
            {/* Departure Airport */}
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

            {/* Manual Entry Fallback for Departure */}
            <div className="col-span-full">
              <p className="text-sm text-gray-600 mb-2">Or enter manually:</p>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-5">
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
          </>
        )}
      </div>
    </div>
  );
}
