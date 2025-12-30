import React, { useState, useEffect } from 'react';
import { getFlights, searchFlightByNumber } from '../../data/flightData';

export default function FlightSelector({
  airport,
  type, // 'arrival' or 'departure'
  onFlightSelect,
  value = null,
}) {
  const [searchMode, setSearchMode] = useState('browse'); // 'browse' or 'search'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedFlight, setSelectedFlight] = useState(value);

  // Get available flights based on airport and type
  const availableFlights = airport ? getFlights(airport, type) : [];

  // Handle flight number search
  const handleSearch = () => {
    if (searchQuery.trim()) {
      const results = searchFlightByNumber(searchQuery);
      console.log('Search results:', results); // Debug log
      // Filter by type if specified
      const filtered = type
        ? results.filter(f => f.type === type)
        : results;
      console.log('Filtered results:', filtered); // Debug log
      setSearchResults(filtered);
    } else {
      setSearchResults([]);
    }
  };

  // Auto-search when query changes (with debounce)
  useEffect(() => {
    if (searchMode === 'search' && searchQuery.trim()) {
      const timeoutId = setTimeout(() => {
        handleSearch();
      }, 300);
      return () => clearTimeout(timeoutId);
    } else if (searchQuery === '') {
      setSearchResults([]);
    }
  }, [searchQuery, searchMode]);

  // Handle flight selection
  const handleFlightSelect = (flight) => {
    const flightData = {
      airline: flight.airline,
      flightNumber: flight.flight_number,
      time: flight.time,
      airport: flight.airport || airport,
      type: flight.type || type,
    };
    setSelectedFlight(flightData);
    onFlightSelect(flightData);
  };

  // Clear selection
  const handleClear = () => {
    setSelectedFlight(null);
    setSearchQuery('');
    setSearchResults([]);
    onFlightSelect(null);
  };

  useEffect(() => {
    if (value) {
      setSelectedFlight(value);
    }
  }, [value]);

  return (
    <div className="border-2 border-gray-300 rounded-lg p-4">
      {/* Mode Selection Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setSearchMode('browse')}
          className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors ${
            searchMode === 'browse'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Browse Flights
        </button>
        <button
          type="button"
          onClick={() => setSearchMode('search')}
          className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors ${
            searchMode === 'search'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Search by Flight Number
        </button>
      </div>

      {/* Selected Flight Display */}
      {selectedFlight && (
        <div className="mb-4 p-3 bg-green-50 border-2 border-green-500 rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-green-700 font-semibold mb-1">Selected Flight</p>
              <p className="font-bold text-gray-800">{selectedFlight.airline}</p>
              <p className="text-gray-700">
                Flight: <span className="font-semibold">{selectedFlight.flightNumber}</span>
              </p>
              <p className="text-gray-700">
                Time: <span className="font-semibold">{selectedFlight.time}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={handleClear}
              className="text-red-600 hover:text-red-800 font-semibold text-sm"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Browse Mode */}
      {searchMode === 'browse' && (
        <div>
          {!airport ? (
            <p className="text-gray-500 text-center py-4">
              Please select an airport first
            </p>
          ) : availableFlights.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No flights available
            </p>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <div className="space-y-2">
                {availableFlights.map((flight, index) => (
                  <div
                    key={index}
                    className="p-3 border border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 cursor-pointer transition-all"
                    onClick={() => handleFlightSelect(flight)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-800">{flight.airline}</p>
                        <p className="text-sm text-gray-600">Flight {flight.flight_number}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-purple-600">{flight.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search Mode */}
      {searchMode === 'search' && (
        <div>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Enter flight number (e.g., SV123, EK801)"
              className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleSearch}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold"
            >
              Search
            </button>
          </div>

          {!searchQuery ? (
            <p className="text-gray-500 text-center py-4 text-sm">
              Enter a flight number to search (e.g., SV123, EK801, QR1182)
            </p>
          ) : searchResults.length > 0 ? (
            <div className="max-h-96 overflow-y-auto">
              <p className="text-sm text-gray-600 mb-2">
                Found {searchResults.length} result(s) for "{searchQuery}"
              </p>
              <div className="space-y-2">
                {searchResults.map((flight, index) => (
                  <div
                    key={index}
                    className="p-3 border border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 cursor-pointer transition-all"
                    onClick={() => handleFlightSelect(flight)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-800">{flight.airline}</p>
                        <p className="text-sm text-gray-600">Flight {flight.flight_number}</p>
                        <p className="text-xs text-gray-500">
                          {flight.airport} - {flight.type}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-purple-600">{flight.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">
              No {type || ''} flights found for "{searchQuery}"
            </p>
          )}
        </div>
      )}
    </div>
  );
}
