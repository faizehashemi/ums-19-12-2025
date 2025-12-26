import React from "react";

export default function ProgressBar({ progress }) {
  return (
    <div className="h-2 bg-gray-200 rounded-full mb-8 overflow-hidden">
      <div
        className="h-full bg-purple-600 transition-all duration-300"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
