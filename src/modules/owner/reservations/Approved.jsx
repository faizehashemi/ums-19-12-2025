import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../../lib/supabase";
import { ChevronDown, ChevronUp, Users, Plane, Home } from "lucide-react";

const Approved = () => {
  const [reservations, setReservations] = useState([]);
  const [bulkImports, setBulkImports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedCards, setExpandedCards] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredReservations, setFilteredReservations] = useState([]);
  const [filteredBulkImports, setFilteredBulkImports] = useState([]);
  const [fromDate, setFromDate] = useState(new Date().toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeFilter, setActiveFilter] = useState(null);

  useEffect(() => {
    fetchApprovedReservations();
    fetchBulkImports();
  }, []);

  useEffect(() => {
    filterReservations();
  }, [searchTerm, reservations, bulkImports, fromDate, toDate, activeFilter]);

  const fetchApprovedReservations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('status', 'approved')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      setReservations(data || []);
    } catch (err) {
      console.error('Error fetching approved reservations:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchBulkImports = async () => {
    try {
      const { data: bulkImport, error } = await supabase
        .from('bulkImport')
        .select('*');

      if (error) throw error;

      setBulkImports(bulkImport || []);
    } catch (err) {
      console.error('Error fetching bulk imports:', err);
    }
  };

  const parseDate = (dateString) => {
    if (!dateString) return null;

    // Try parsing DD-MM-YYYY format (for bulk imports)
    if (typeof dateString === 'string' && dateString.includes('-')) {
      const parts = dateString.split('-');
      if (parts.length === 3 && parts[0].length <= 2) {
        // DD-MM-YYYY format
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
        const year = parseInt(parts[2], 10);
        return new Date(year, month, day);
      }
    }

    // Try standard date parsing (for regular reservations)
    return new Date(dateString);
  };

  const isDateInRange = useCallback((dateString) => {
    if (!dateString) return true;

    // Parse the date - handle different formats
    let date = parseDate(dateString);

    // Check if date is valid
    if (!date || isNaN(date.getTime())) {
      return true; // Include invalid dates by default
    }

    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;

    // Set time to start of day for comparison
    if (from) from.setHours(0, 0, 0, 0);
    if (to) to.setHours(23, 59, 59, 999);
    date.setHours(0, 0, 0, 0);

    if (from && date < from) return false;
    if (to && date > to) return false;

    return true;
  }, [fromDate, toDate]);

  const getFilteredDateField = useCallback((item) => {
    if (!activeFilter) return item.Arrival_Date;

    const firstArrival = item.First_Arrival;

    switch (activeFilter) {
      case 'makkah-arrivals':
        return firstArrival === 'Makkah' ? item.Arrival_Date : null;
      case 'second-umrah':
        return firstArrival === 'Makkah' ? item.Madina_To_Makkah_Date : null;
      case 'madina-arrivals':
        return firstArrival === 'Madina' ? item.Arrival_Date : null;
      case 'makkah-to-madina':
        return item.Madina_Date;
      case 'madina-to-makkah':
        return item.Madina_To_Makkah_Date;
      case 'departure-makkah':
        return firstArrival === 'Makkah' ? item.Departure_Date : null;
      case 'departure-madina':
        return firstArrival === 'Madina' ? item.Departure_Date : null;
      default:
        return item.Arrival_Date;
    }
  }, [activeFilter]);

  const filterReservations = useCallback(() => {
    // Filter regular reservations
    let filtered = reservations;

    // Apply date filter
    filtered = filtered.filter(reservation => {
      const travelDetails = reservation.travel_details || {};
      return isDateInRange(travelDetails.arrivalDateTime);
    });

    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(reservation => {
        const members = reservation.members || [];
        const primaryMember = members[0] || {};

        return (
          primaryMember.name?.toLowerCase().includes(term) ||
          primaryMember.itsNo?.toLowerCase().includes(term) ||
          primaryMember.email?.toLowerCase().includes(term) ||
          reservation.id?.toLowerCase().includes(term) ||
          reservation.accommodation?.toLowerCase().includes(term)
        );
      });
    }

    setFilteredReservations(filtered);

    // Filter bulk imports
    let filteredBulk = bulkImports;

    // Apply activeFilter logic for bulk imports
    if (activeFilter) {
      filteredBulk = filteredBulk.filter(item => {
        const dateField = getFilteredDateField(item);
        return dateField !== null;
      });
    }

    // Apply date filter
    filteredBulk = filteredBulk.filter(item => {
      const dateField = getFilteredDateField(item);
      return isDateInRange(dateField);
    });

    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filteredBulk = filteredBulk.filter(item =>
        item.Tour_Operator?.toLowerCase().includes(term) ||
        item.Country?.toLowerCase().includes(term) ||
        item.SH_Ref?.toString().includes(term) ||
        item.Group_Type?.toLowerCase().includes(term) ||
        item.Status?.toLowerCase().includes(term)
      );
    }

    setFilteredBulkImports(filteredBulk);
  }, [reservations, bulkImports, searchTerm, activeFilter, getFilteredDateField, isDateInRange]);

  const toggleCard = (id) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Approved Reservations</h1>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Approved Reservations</h1>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p className="font-medium">Error loading approved reservations</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Approved Reservations</h1>
        <div className="text-sm text-gray-600">
          Total: {filteredReservations.length + filteredBulkImports.length} records
        </div>
      </div>

      {/* Date Filters */}
      <div className="mb-4 bg-white border border-gray-200 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              From Date
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              To Date
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>
        </div>
        {(fromDate || toDate) && (
          <div className="mt-3 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing arrivals {fromDate && `from ${new Date(fromDate).toLocaleDateString()}`} {fromDate && toDate && 'to'} {toDate && `${new Date(toDate).toLocaleDateString()}`}
            </div>
            <button
              onClick={() => {
                const today = new Date().toISOString().split('T')[0];
                setFromDate(today);
                setToDate(today);
              }}
              className="text-sm text-amber-600 hover:text-amber-700 font-medium"
            >
              Reset to Today
            </button>
          </div>
        )}
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name, ITS number, email, or confirmation ID..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
        />
      </div>

      {filteredReservations.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600">
            {searchTerm ? 'No reservations match your search.' : 'No approved reservations yet.'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Guest Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ITS Number
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Accommodation
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Members
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Arrival
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Departure
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Country
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Fee
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReservations.map((reservation) => {
                  const isExpanded = expandedCards.has(reservation.id);
                  const travelDetails = reservation.travel_details || {};
                  const members = reservation.members || [];
                  const primaryMember = members[0] || {};

                  return (
                    <>
                      <tr key={reservation.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {primaryMember.name || 'N/A'}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            {primaryMember.itsNo || 'N/A'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-600">
                            <div>{primaryMember.email || 'N/A'}</div>
                            <div className="text-xs text-gray-500">{primaryMember.phone || 'N/A'}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded">
                            {reservation.accommodation}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            {reservation.num_members}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            {formatDate(travelDetails.arrivalDateTime)}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            {formatDate(travelDetails.departureDateTime)}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            {travelDetails.country || 'N/A'}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            SAR {reservation.total_fee?.toFixed(2) || '0.00'}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                            Approved
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <button
                            onClick={() => toggleCard(reservation.id)}
                            className="text-amber-600 hover:text-amber-800 font-medium text-sm flex items-center gap-1"
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="w-4 h-4" />
                                Less
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-4 h-4" />
                                More
                              </>
                            )}
                          </button>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr>
                          <td colSpan="11" className="px-4 py-4 bg-gray-50">
                            <div className="space-y-6">
                              {/* Confirmation ID */}
                              <div className="bg-white rounded-lg p-4">
                                <span className="text-sm text-gray-600">Confirmation ID:</span>
                                <p className="font-mono text-sm font-medium text-gray-800">{reservation.id}</p>
                              </div>

                              {/* Travel Details */}
                              <div>
                                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                  <Plane className="w-4 h-4" />
                                  Travel Details
                                </h4>
                                <div className="bg-white rounded-lg p-4 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                  <div>
                                    <span className="text-gray-500 block">Country</span>
                                    <span className="font-medium">{travelDetails.country || 'N/A'}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500 block">Travel Mode</span>
                                    <span className="font-medium">{travelDetails.travelMode || 'N/A'}</span>
                                  </div>
                                  {travelDetails.travelMode === 'By Air' && (
                                    <>
                                      <div>
                                        <span className="text-gray-500 block">Airline</span>
                                        <span className="font-medium">{travelDetails.airline || 'N/A'}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-500 block">Flight Number</span>
                                        <span className="font-medium">{travelDetails.flightNo || 'N/A'}</span>
                                      </div>
                                    </>
                                  )}
                                  <div>
                                    <span className="text-gray-500 block">Arrival</span>
                                    <span className="font-medium">{formatDate(travelDetails.arrivalDateTime)}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500 block">Departure</span>
                                    <span className="font-medium">{formatDate(travelDetails.departureDateTime)}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Members */}
                              <div>
                                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                  <Users className="w-4 h-4" />
                                  Members ({members.length})
                                </h4>
                                <div className="space-y-3">
                                  {members.map((member, index) => (
                                    <div key={index} className="bg-white rounded-lg p-4">
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                        <div>
                                          <span className="text-gray-500 block">Name</span>
                                          <span className="font-medium">{member.name || 'N/A'}</span>
                                        </div>
                                        <div>
                                          <span className="text-gray-500 block">ITS Number</span>
                                          <span className="font-medium">{member.itsNo || 'N/A'}</span>
                                        </div>
                                        <div>
                                          <span className="text-gray-500 block">Email</span>
                                          <span className="font-medium text-xs">{member.email || 'N/A'}</span>
                                        </div>
                                        <div>
                                          <span className="text-gray-500 block">Phone</span>
                                          <span className="font-medium">{member.phone || 'N/A'}</span>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Fees */}
                              <div>
                                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                  <Home className="w-4 h-4" />
                                  Accommodation & Fees
                                </h4>
                                <div className="bg-white rounded-lg p-4">
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                                    <div>
                                      <span className="text-gray-500 block">Accommodation</span>
                                      <span className="font-medium">{reservation.accommodation}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-500 block">Base Fee</span>
                                      <span className="font-medium">SAR {reservation.base_fee?.toFixed(2) || '0.00'}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-500 block">Accommodation Fee</span>
                                      <span className="font-medium">SAR {reservation.accommodation_fee?.toFixed(2) || '0.00'}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-500 block">Per Person</span>
                                      <span className="font-medium">SAR {reservation.per_person_fee?.toFixed(2) || '0.00'}</span>
                                    </div>
                                  </div>
                                  <div className="border-t pt-3">
                                    <div className="flex justify-between items-center">
                                      <span className="text-gray-700 font-semibold">Total Fee</span>
                                      <span className="text-xl font-bold text-amber-600">
                                        SAR {reservation.total_fee?.toFixed(2) || '0.00'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bulk Imports Section */}
      {bulkImports.length > 0 && (
        <>
          <div className="mt-12 mb-6">
            <h2 className="text-2xl font-bold">Bulk Import Reservations</h2>
            <div className="text-sm text-gray-600 mt-1">
              {filteredBulkImports.length} {filteredBulkImports.length === 1 ? 'import' : 'imports'}
            </div>
          </div>

          {/* Filter Toggles */}
          <div className="mb-6 bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Filter by Journey Type</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveFilter(activeFilter === 'makkah-arrivals' ? null : 'makkah-arrivals')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeFilter === 'makkah-arrivals'
                    ? 'bg-amber-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Makkah Arrivals
              </button>
              <button
                onClick={() => setActiveFilter(activeFilter === 'second-umrah' ? null : 'second-umrah')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeFilter === 'second-umrah'
                    ? 'bg-amber-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Second Umrah
              </button>
              <button
                onClick={() => setActiveFilter(activeFilter === 'madina-arrivals' ? null : 'madina-arrivals')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeFilter === 'madina-arrivals'
                    ? 'bg-amber-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Madina Arrivals
              </button>
              <button
                onClick={() => setActiveFilter(activeFilter === 'makkah-to-madina' ? null : 'makkah-to-madina')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeFilter === 'makkah-to-madina'
                    ? 'bg-amber-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Makkah to Madina
              </button>
              <button
                onClick={() => setActiveFilter(activeFilter === 'madina-to-makkah' ? null : 'madina-to-makkah')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeFilter === 'madina-to-makkah'
                    ? 'bg-amber-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Madina to Makkah
              </button>
              <button
                onClick={() => setActiveFilter(activeFilter === 'departure-makkah' ? null : 'departure-makkah')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeFilter === 'departure-makkah'
                    ? 'bg-amber-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Departure from Makkah
              </button>
              <button
                onClick={() => setActiveFilter(activeFilter === 'departure-madina' ? null : 'departure-madina')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeFilter === 'departure-madina'
                    ? 'bg-amber-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Departure From Madina
              </button>
            </div>
            {activeFilter && (
              <div className="mt-3 text-sm text-gray-600">
                Active filter: <span className="font-medium text-amber-600">
                  {activeFilter === 'makkah-arrivals' && 'Makkah Arrivals'}
                  {activeFilter === 'second-umrah' && 'Second Umrah'}
                  {activeFilter === 'madina-arrivals' && 'Madina Arrivals'}
                  {activeFilter === 'makkah-to-madina' && 'Makkah to Madina'}
                  {activeFilter === 'madina-to-makkah' && 'Madina to Makkah'}
                  {activeFilter === 'departure-makkah' && 'Departure from Makkah'}
                  {activeFilter === 'departure-madina' && 'Departure From Madina'}
                </span>
              </div>
            )}
          </div>

          {filteredBulkImports.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
              <p className="text-gray-600">
                No bulk imports match the selected filter.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tour Operator
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Group Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Country
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Guests
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Arrival Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Departure Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SH Ref
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredBulkImports.map((item) => {
                    const isExpanded = expandedCards.has(`bulk-${item.SR_NO}`);
                    const totalGuests = (item.G || 0) + (item.L || 0) + (parseInt(item.CH) || 0) + (parseInt(item.INF) || 0);

                    return (
                      <>
                        <tr key={`bulk-${item.SR_NO}`} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {item.Tour_Operator || 'N/A'}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                              {item.Group_Type || 'Group'}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-600">
                              {item.Country || 'N/A'}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-600">
                              {item.Tot || totalGuests}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-600">
                              {item.Arrival_Date || 'N/A'}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-600">
                              {item.Departure_Date || 'N/A'}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-600">
                              {item.SH_Ref || 'N/A'}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded ${
                              item.Status?.toLowerCase() === 'confirmed'
                                ? 'bg-green-100 text-green-800'
                                : item.Status?.toLowerCase() === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {item.Status || 'N/A'}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <button
                              onClick={() => toggleCard(`bulk-${item.SR_NO}`)}
                              className="text-amber-600 hover:text-amber-800 font-medium text-sm flex items-center gap-1"
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp className="w-4 h-4" />
                                  Less
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-4 h-4" />
                                  More
                                </>
                              )}
                            </button>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr>
                            <td colSpan="9" className="px-4 py-4 bg-gray-50">
                              <div className="space-y-6">
                                {/* Reference Information */}
                                <div className="bg-white rounded-lg p-4">
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <span className="text-gray-500 block">SR Number</span>
                                      <span className="font-medium">{item.SR_NO || 'N/A'}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-500 block">SH Reference</span>
                                      <span className="font-medium">{item.SH_Ref || 'N/A'}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Contact Information */}
                                <div>
                                  <h4 className="font-semibold text-gray-800 mb-3">Contact Information</h4>
                                  <div className="bg-white rounded-lg p-4 grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <span className="text-gray-500 block">Primary Phone</span>
                                      <span className="font-medium">{item.Phone_Primary || 'N/A'}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-500 block">Other Phones</span>
                                      <span className="font-medium">{item.Phone_Others || 'N/A'}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Arrival Information */}
                                <div>
                                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                    <Plane className="w-4 h-4" />
                                    Arrival Information
                                  </h4>
                                  <div className="bg-white rounded-lg p-4 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                    <div>
                                      <span className="text-gray-500 block">Airline</span>
                                      <span className="font-medium">{item.Arrival_Airline || 'N/A'}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-500 block">Flight Number</span>
                                      <span className="font-medium">{item.Arrival_Flight_Number || 'N/A'}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-500 block">Airport</span>
                                      <span className="font-medium">{item.Arrival_Airport || 'N/A'}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-500 block">Date</span>
                                      <span className="font-medium">{item.Arrival_Date || 'N/A'}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-500 block">Time</span>
                                      <span className="font-medium">{item.Arrival_Time || 'N/A'}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Departure Information */}
                                <div>
                                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                    <Plane className="w-4 h-4 rotate-45" />
                                    Departure Information
                                  </h4>
                                  <div className="bg-white rounded-lg p-4 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                    <div>
                                      <span className="text-gray-500 block">Airline</span>
                                      <span className="font-medium">{item.Departure_Airline || 'N/A'}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-500 block">Flight Number</span>
                                      <span className="font-medium">{item.Departure_Flight_Number || 'N/A'}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-500 block">Airport</span>
                                      <span className="font-medium">{item.Departure_Airport || 'N/A'}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-500 block">Date</span>
                                      <span className="font-medium">{item.Departure_Date || 'N/A'}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-500 block">Time</span>
                                      <span className="font-medium">{item.Departure_Time || 'N/A'}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Guest Breakdown */}
                                <div>
                                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                    <Users className="w-4 h-4" />
                                    Guest Breakdown
                                  </h4>
                                  <div className="bg-white rounded-lg p-4">
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                                      <div>
                                        <span className="text-gray-500 block">Gents (G)</span>
                                        <span className="font-medium text-lg">{item.G || 0}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-500 block">Ladies (L)</span>
                                        <span className="font-medium text-lg">{item.L || 0}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-500 block">Children (CH)</span>
                                        <span className="font-medium text-lg">{item.CH || 0}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-500 block">Infants (INF)</span>
                                        <span className="font-medium text-lg">{item.INF || 0}</span>
                                      </div>
                                      <div className="border-l pl-4">
                                        <span className="text-gray-500 block">Total</span>
                                        <span className="font-bold text-lg text-amber-600">{item.Tot || totalGuests}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          )}
        </>
      )}
    </div>
  );
};

export default Approved;
