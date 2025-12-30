import React from "react";

export default function StepAccommodation({ accommodation, setAccommodation }) {
  return (
    <div className="animate-fadeIn">
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
        Accommodation Selection
      </h2>

      <div>
        <label className="block text-gray-700 font-semibold mb-4">Room Type *</label>
        <div className="flex gap-8">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              value="Sharing"
              checked={accommodation === "Sharing"}
              onChange={(e) => setAccommodation(e.target.value)}
              className="w-5 h-5"
            />
            <span className="text-lg">Sharing</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              value="Private"
              checked={accommodation === "Private"}
              onChange={(e) => setAccommodation(e.target.value)}
              className="w-5 h-5"
            />
            <span className="text-lg">Private</span>
          </label>
        </div>
      </div>
    </div>
  );
}
