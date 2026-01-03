import { useEffect } from "react";
import roomImg1 from "../../../assets/roomImg1.png";
import roomImg2 from "../../../assets/roomImg2.png";

export default function StepAccommodation({
  accommodation,
  setAccommodation,
  westernToilet,
  setWesternToilet,
  makkahDays,
  setMakkahDays,
  madinaDays,
  setMadinaDays,
  travelDetails
}) {
  // Auto-calculate days in Makkah and Madina based on travel details
  useEffect(() => {
    if (travelDetails.arrivalDateTime && travelDetails.travelMadinaDate && travelDetails.departureDateTime) {
      // Calculate days in Makkah: from arrival to travel to Madina date
      const arrivalDate = new Date(travelDetails.arrivalDateTime);
      const madinaDate = new Date(travelDetails.travelMadinaDate);
      const departureDate = new Date(travelDetails.departureDateTime);

      // Calculate difference in milliseconds and convert to days
      const makkahDiff = madinaDate - arrivalDate;
      const makkahDaysCalc = Math.ceil(makkahDiff / (1000 * 60 * 60 * 24));

      // Calculate days in Madina: from travel to Madina date to departure date
      const madinaDiff = departureDate - madinaDate;
      const madinaDaysCalc = Math.ceil(madinaDiff / (1000 * 60 * 60 * 24));

      // Only update if values are positive
      if (makkahDaysCalc > 0) {
        setMakkahDays(makkahDaysCalc.toString());
      }
      if (madinaDaysCalc > 0) {
        setMadinaDays(madinaDaysCalc.toString());
      }
    }
  }, [travelDetails.arrivalDateTime, travelDetails.travelMadinaDate, travelDetails.departureDateTime, setMakkahDays, setMadinaDays]);

  return (
    <div className="animate-fadeIn">
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
        Accommodation Selection
      </h2>

      <div className="mb-8">
        <label className="block text-gray-700 font-semibold mb-6 text-xl">
          Room Type *
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sharing Room Card */}
          <div
            onClick={() => setAccommodation("Sharing")}
            className={`cursor-pointer rounded-lg overflow-hidden border-4 transition-all ${
              accommodation === "Sharing"
                ? "border-purple-600 shadow-lg"
                : "border-gray-200 hover:border-purple-300"
            }`}
          >
            <div className="relative">
              <img
                src={roomImg1}
                alt="Sharing Room"
                className="w-full h-64 object-cover"
              />
              <div
                className={`absolute top-4 right-4 w-8 h-8 rounded-full border-4 flex items-center justify-center ${
                  accommodation === "Sharing"
                    ? "bg-purple-600 border-white"
                    : "bg-white border-gray-300"
                }`}
              >
                {accommodation === "Sharing" && (
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M5 13l4 4L19 7"></path>
                  </svg>
                )}
              </div>
            </div>
            <div className="p-6 bg-white">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Sharing Room</h3>
              <p className="text-gray-600">
                Comfortable shared accommodation with multiple beds
              </p>
            </div>
          </div>

          {/* Exclusive Room Card */}
          <div
            onClick={() => setAccommodation("Exclusive")}
            className={`cursor-pointer rounded-lg overflow-hidden border-4 transition-all ${
              accommodation === "Exclusive"
                ? "border-purple-600 shadow-lg"
                : "border-gray-200 hover:border-purple-300"
            }`}
          >
            <div className="relative">
              <img
                src={roomImg2}
                alt="Exclusive Room"
                className="w-full h-64 object-cover"
              />
              <div
                className={`absolute top-4 right-4 w-8 h-8 rounded-full border-4 flex items-center justify-center ${
                  accommodation === "Exclusive"
                    ? "bg-purple-600 border-white"
                    : "bg-white border-gray-300"
                }`}
              >
                {accommodation === "Exclusive" && (
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M5 13l4 4L19 7"></path>
                  </svg>
                )}
              </div>
            </div>
            <div className="p-6 bg-white">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Exclusive Room</h3>
              <p className="text-gray-600">
                Exclusive private room for complete privacy
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Makkah Accommodation Details */}
      <div className="mt-8 p-6 bg-blue-50 rounded-lg border-2 border-blue-200">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Makkah Accommodation</h3>
        <div className="bg-white p-6 rounded-lg border-2 border-blue-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Number of Days in Makkah</p>
              <p className="text-4xl font-bold text-blue-600">
                {makkahDays || '0'} {makkahDays === '1' ? 'Day' : 'Days'}
              </p>
            </div>
            <div className="text-blue-500">
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Auto-calculated based on arrival date and travel to Madina date
          </p>
        </div>
      </div>

      {/* Madina Accommodation Details */}
      <div className="mt-6 p-6 bg-green-50 rounded-lg border-2 border-green-200">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Madina Accommodation</h3>
        <div className="bg-white p-6 rounded-lg border-2 border-green-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Number of Days in Madina</p>
              <p className="text-4xl font-bold text-green-600">
                {madinaDays || '0'} {madinaDays === '1' ? 'Day' : 'Days'}
              </p>
            </div>
            <div className="text-green-500">
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Auto-calculated based on travel to Madina date and departure date
          </p>
          <p className="text-sm text-gray-600 italic mt-2">
            Note: Only Sharing Room is available in Madina
          </p>
        </div>
      </div>

      {/* Western Toilet Checkbox */}
      <div className="mt-8 p-6 bg-gray-50 rounded-lg border-2 border-gray-200">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={westernToilet}
            onChange={(e) => setWesternToilet(e.target.checked)}
            className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
          />
          <span className="text-lg font-semibold text-gray-700">
            Western Toilet Seat Required in Room
          </span>
        </label>
      </div>
    </div>
  );
}
