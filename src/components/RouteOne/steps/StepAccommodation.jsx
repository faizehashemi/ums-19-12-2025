import React from "react";
import roomImg1 from "../../../assets/roomImg1.png";
import roomImg2 from "../../../assets/roomImg2.png";

export default function StepAccommodation({
  accommodation,
  setAccommodation,
  westernToilet,
  setWesternToilet
}) {
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

          {/* Private Room Card */}
          <div
            onClick={() => setAccommodation("Private")}
            className={`cursor-pointer rounded-lg overflow-hidden border-4 transition-all ${
              accommodation === "Private"
                ? "border-purple-600 shadow-lg"
                : "border-gray-200 hover:border-purple-300"
            }`}
          >
            <div className="relative">
              <img
                src={roomImg2}
                alt="Private Room"
                className="w-full h-64 object-cover"
              />
              <div
                className={`absolute top-4 right-4 w-8 h-8 rounded-full border-4 flex items-center justify-center ${
                  accommodation === "Private"
                    ? "bg-purple-600 border-white"
                    : "bg-white border-gray-300"
                }`}
              >
                {accommodation === "Private" && (
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
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Private Room</h3>
              <p className="text-gray-600">
                Exclusive private room for complete privacy
              </p>
            </div>
          </div>
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
