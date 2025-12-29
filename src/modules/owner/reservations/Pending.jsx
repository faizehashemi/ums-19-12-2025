import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { ChevronDown, ChevronUp, Users, Calendar, DollarSign, Plane, Home } from "lucide-react";
import ApprovalModal from "../../../components/reservation/modals/ApprovalModal";
import RejectionModal from "../../../components/reservation/modals/RejectionModal";

const Pending = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedCards, setExpandedCards] = useState(new Set());
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchPendingReservations();
  }, []);

  const fetchPendingReservations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setReservations(data || []);
    } catch (err) {
      console.error('Error fetching reservations:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
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

  const handleApproveClick = (reservation) => {
    setSelectedReservation(reservation);
    setShowApprovalModal(true);
  };

  const handleRejectClick = (reservation) => {
    setSelectedReservation(reservation);
    setShowRejectionModal(true);
  };

  const handleApproveConfirm = async (reservation) => {
    try {
      setActionLoading(true);

      console.log('Approving reservation:', reservation.id);

      const { data, error } = await supabase
        .from('reservations')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString()
        })
        .eq('id', reservation.id)
        .select();

      console.log('Update response:', { data, error });

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error('No rows were updated. Check RLS policies or reservation ID.');
      }

      alert('Reservation approved successfully!');
      setShowApprovalModal(false);
      setSelectedReservation(null);
      fetchPendingReservations();
    } catch (err) {
      console.error('Error approving reservation:', err);
      alert('Error approving reservation: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectConfirm = async (reservation, reason) => {
    try {
      setActionLoading(true);

      console.log('Rejecting reservation:', reservation.id, 'Reason:', reason);

      const { data, error } = await supabase
        .from('reservations')
        .update({
          status: 'rejected',
          rejected_at: new Date().toISOString(),
          rejection_reason: reason
        })
        .eq('id', reservation.id)
        .select();

      console.log('Update response:', { data, error });

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error('No rows were updated. Check RLS policies or reservation ID.');
      }

      alert('Reservation rejected successfully!');
      setShowRejectionModal(false);
      setSelectedReservation(null);
      fetchPendingReservations();
    } catch (err) {
      console.error('Error rejecting reservation:', err);
      alert('Error rejecting reservation: ' + err.message);
    } finally {
      setActionLoading(false);
    }
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
        <h1 className="text-2xl font-bold mb-4">Pending Reservations</h1>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Pending Reservations</h1>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p className="font-medium">Error loading reservations</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Pending Reservations</h1>
        <div className="text-sm text-gray-600">
          {reservations.length} {reservations.length === 1 ? 'reservation' : 'reservations'}
        </div>
      </div>

      {reservations.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600">No pending reservations at the moment.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reservations.map((reservation) => {
            const isExpanded = expandedCards.has(reservation.id);
            const travelDetails = reservation.travel_details || {};
            const members = reservation.members || [];

            return (
              <div
                key={reservation.id}
                className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden transition-all hover:shadow-md"
              >
                {/* Card Header - Always Visible */}
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleCard(reservation.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">
                          {travelDetails.country || 'Unknown Country'}
                        </h3>
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
                          <span className="font-semibold">${reservation.total_fee?.toFixed(2) || '0.00'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span className="text-xs">Submitted: {formatDate(reservation.created_at)}</span>
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
                      {/* Travel Details Section */}
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <Plane className="w-4 h-4" />
                          Travel Details
                        </h4>
                        <div className="bg-white rounded-lg p-4 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
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
                          {travelDetails.travelMode === 'By Road' && (
                            <div>
                              <span className="text-gray-500 block">Road Mode</span>
                              <span className="font-medium">{travelDetails.roadMode || 'N/A'}</span>
                            </div>
                          )}
                          <div>
                            <span className="text-gray-500 block">Arrival</span>
                            <span className="font-medium">{formatDate(travelDetails.arrivalDateTime)}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 block">Departure</span>
                            <span className="font-medium">{formatDate(travelDetails.departureDateTime)}</span>
                          </div>
                          {travelDetails.departureAirport && (
                            <div>
                              <span className="text-gray-500 block">Departure Airport</span>
                              <span className="font-medium">{travelDetails.departureAirport}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Members Section */}
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
                                  <span className="text-gray-500 block">Phone</span>
                                  <span className="font-medium">{member.phone || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500 block">Email</span>
                                  <span className="font-medium text-xs">{member.email || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500 block">Visa Type</span>
                                  <span className="font-medium">{member.visaType || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500 block">Passport Number</span>
                                  <span className="font-medium">{member.passportNumber || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500 block">Age</span>
                                  <span className="font-medium">{member.age || 'N/A'}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Accommodation & Fees Section */}
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <Home className="w-4 h-4" />
                          Accommodation & Fees
                        </h4>
                        <div className="bg-white rounded-lg p-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                            <div>
                              <span className="text-gray-500 block">Accommodation Type</span>
                              <span className="font-medium">{reservation.accommodation}</span>
                            </div>
                            <div>
                              <span className="text-gray-500 block">Base Fee</span>
                              <span className="font-medium">${reservation.base_fee?.toFixed(2) || '0.00'}</span>
                            </div>
                            <div>
                              <span className="text-gray-500 block">Accommodation Fee</span>
                              <span className="font-medium">${reservation.accommodation_fee?.toFixed(2) || '0.00'}</span>
                            </div>
                            <div>
                              <span className="text-gray-500 block">Per Person Fee</span>
                              <span className="font-medium">${reservation.per_person_fee?.toFixed(2) || '0.00'}</span>
                            </div>
                          </div>
                          <div className="border-t pt-3">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-700 font-semibold">Total Fee</span>
                              <span className="text-xl font-bold text-amber-600">
                                ${reservation.total_fee?.toFixed(2) || '0.00'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApproveClick(reservation);
                          }}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRejectClick(reservation);
                          }}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                          Reject
                        </button>
                        <button className="px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg font-medium transition-colors">
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <ApprovalModal
        reservation={selectedReservation}
        isOpen={showApprovalModal}
        onClose={() => {
          setShowApprovalModal(false);
          setSelectedReservation(null);
        }}
        onConfirm={handleApproveConfirm}
        loading={actionLoading}
      />

      <RejectionModal
        reservation={selectedReservation}
        isOpen={showRejectionModal}
        onClose={() => {
          setShowRejectionModal(false);
          setSelectedReservation(null);
        }}
        onConfirm={handleRejectConfirm}
        loading={actionLoading}
      />
    </div>
  );
};

export default Pending;
