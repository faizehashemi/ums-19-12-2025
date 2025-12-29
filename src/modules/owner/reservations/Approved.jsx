import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { ChevronDown, ChevronUp, Users, Calendar, DollarSign, Plane, Home } from "lucide-react";

const Approved = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedCards, setExpandedCards] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredReservations, setFilteredReservations] = useState([]);

  useEffect(() => {
    fetchApprovedReservations();
  }, []);

  useEffect(() => {
    filterReservations();
  }, [searchTerm, reservations]);

  const fetchApprovedReservations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('status', 'approved')
        .order('approved_at', { ascending: false });

      if (error) throw error;

      setReservations(data || []);
    } catch (err) {
      console.error('Error fetching approved reservations:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filterReservations = () => {
    if (!searchTerm.trim()) {
      setFilteredReservations(reservations);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = reservations.filter(reservation => {
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

    setFilteredReservations(filtered);
  };

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
          {filteredReservations.length} {filteredReservations.length === 1 ? 'reservation' : 'reservations'}
        </div>
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
        <div className="space-y-4">
          {filteredReservations.map((reservation) => {
            const isExpanded = expandedCards.has(reservation.id);
            const travelDetails = reservation.travel_details || {};
            const members = reservation.members || [];
            const primaryMember = members[0] || {};

            return (
              <div
                key={reservation.id}
                className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden transition-all hover:shadow-md"
              >
                {/* Card Header */}
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleCard(reservation.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">
                          {primaryMember.name || 'Guest Name'}
                        </h3>
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                          Approved
                        </span>
                        <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded">
                          {reservation.accommodation}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Users className="w-4 h-4" />
                          <span>{reservation.num_members} {reservation.num_members === 1 ? 'member' : 'members'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(travelDetails.arrivalDateTime)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <DollarSign className="w-4 h-4" />
                          <span className="font-semibold">SAR {reservation.total_fee?.toFixed(2) || '0.00'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <span className="text-xs">Approved: {formatDate(reservation.approved_at)}</span>
                        </div>
                      </div>
                    </div>

                    <button className="ml-4 p-2 hover:bg-gray-100 rounded-full transition-colors">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-600" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-gray-200 bg-gray-50">
                    <div className="p-4 space-y-6">
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
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Approved;
