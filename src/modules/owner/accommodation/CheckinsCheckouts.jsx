import { useState, useMemo, useEffect } from 'react';
import PageHeader from '../../../components/layout/PageHeader';
import SearchInput from '../../../components/accommodation/SearchInput';
import Button from '../../../components/ui/Button';
import EmptyState from '../../../components/layout/EmptyState';
import RoomAllocationModal from './components/RoomAllocationModal';
import { Download, Users, CheckCircle, Clock } from 'lucide-react';
import { useToast } from '../../../components/ui/Toast';
import { supabase } from '../../../lib/supabase';

const CheckinsCheckouts = () => {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allocationModalOpen, setAllocationModalOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);

  // Fetch reservations from Supabase
  useEffect(() => {
    fetchReservations();
  }, [selectedDate]);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .in('status', ['approved', 'confirmed'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReservations(data || []);
    } catch (error) {
      console.error('Error fetching reservations:', error);
      showToast('Failed to load reservations', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Transform reservations to checkin format (one card per group)
  const transformedData = useMemo(() => {
    if (!reservations.length) return [];

    return reservations.map(reservation => {
      const members = reservation.members || [];
      const travelDetails = reservation.travel_details || {};
      const firstMember = members[0] || {};

      // Determine overall group check-in status
      const allCheckedIn = members.every(m => m.checkin_status === 'completed');
      const groupStatus = allCheckedIn ? 'completed' : 'pending';

      // Extract arrival info
      const arrivalDate = travelDetails.arrivalDateTime
        ? travelDetails.arrivalDateTime.split('T')[0]
        : null;
      const arrivalTime = travelDetails.arrivalDateTime
        ? new Date(travelDetails.arrivalDateTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
        : '12:00 PM';

      return {
        id: reservation.id,
        reservationId: reservation.sh_id ? `#${reservation.sh_id}` : `#${reservation.id.substring(0, 8)}`,
        name: firstMember.name || 'N/A',
        memberCount: members.length,
        room: firstMember.room || 'TBD',
        bed: firstMember.bed || 'TBD',
        time: arrivalTime,
        arrivalDate: arrivalDate,
        status: groupStatus,
        originalReservation: reservation,
        members: members
      };
    });
  }, [reservations, selectedDate]);

  // Filter based on check-in date
  const currentData = useMemo(() => {
    return transformedData.filter(item => {
      // Show only items for selected arrival date
      return item.arrivalDate === selectedDate;
    });
  }, [transformedData, selectedDate]);

  const filteredData = useMemo(() => {
    return currentData.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.room.includes(searchQuery) ||
      (item.reservationId && item.reservationId.includes(searchQuery))
    );
  }, [currentData, searchQuery]);

  const pendingCount = filteredData.filter(item => item.status === 'pending').length;

  const handleCheckin = (guest) => {
    // Open room allocation modal for check-in
    setSelectedReservation(guest.originalReservation);
    setAllocationModalOpen(true);
  };

  const handleAllocationSuccess = async () => {
    // After room allocation is successful, mark as checked in
    if (!selectedReservation) return;

    try {
      // Fetch the latest reservation data to get the room/bed assignments
      const { data: latestReservation, error: fetchError } = await supabase
        .from('reservations')
        .select('*')
        .eq('id', selectedReservation.id)
        .single();

      if (fetchError) throw fetchError;

      const members = [...(latestReservation.members || [])];
      const checkinTime = new Date().toISOString();

      // Update all members' checkin status while preserving room/bed assignments
      const updatedMembers = members.map(member => ({
        ...member,
        checkin_status: 'completed',
        checkin_time: checkinTime
      }));

      const { error } = await supabase
        .from('reservations')
        .update({ members: updatedMembers })
        .eq('id', selectedReservation.id);

      if (error) throw error;

      showToast(`Group of ${members.length} members checked in successfully`, 'success');
      fetchReservations(); // Refresh data
      setAllocationModalOpen(false);
      setSelectedReservation(null);
    } catch (error) {
      console.error('Error during check-in:', error);
      showToast('Failed to complete check-in', 'error');
    }
  };

  const handleUnassignRoom = async (guest) => {
    try {
      const members = guest.originalReservation.members || [];
      const updatedMembers = members.map(member => ({
        ...member,
        checkin_status: 'pending',
        checkin_time: null,
        room: null,
        bed: null
      }));

      const { error } = await supabase
        .from('reservations')
        .update({ members: updatedMembers })
        .eq('id', guest.originalReservation.id);

      if (error) throw error;

      showToast('Room assignment removed', 'success');
      fetchReservations();
    } catch (error) {
      console.error('Error unassigning room:', error);
      showToast('Failed to unassign room', 'error');
    }
  };

  const handleBulkAction = () => {
    showToast(`${selectedItems.length} groups processed`, 'success');
    setSelectedItems([]);
  };


  return (
    <div className="space-y-4">
      <PageHeader
        title="Check-ins & Check-outs"
        actions={
          <>
            <Button variant="secondary" icon={<Download className="w-5 h-5" />}>
              Export
            </Button>
            {selectedItems.length > 0 && (
              <Button variant="primary" icon={<Users className="w-5 h-5" />} onClick={handleBulkAction}>
                Bulk Action ({selectedItems.length})
              </Button>
            )}
          </>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <div className="bg-white rounded-lg border p-1">
            <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded font-medium text-sm">
              Check-in Schedule ({pendingCount} pending)
            </div>
          </div>
        </div>

        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <SearchInput
        placeholder="Search by name, room, or reservation ID..."
        value={searchQuery}
        onChange={setSearchQuery}
        onClear={() => setSearchQuery('')}
      />

      {/* Content - Table View */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="py-12">
            <EmptyState
              icon={<Users className="w-8 h-8" />}
              title="No check-ins scheduled"
              description={`There are no guest arrivals scheduled for ${selectedDate}`}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedItems(filteredData.map(g => g.id));
                        } else {
                          setSelectedItems([]);
                        }
                      }}
                      checked={selectedItems.length === filteredData.length && filteredData.length > 0}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Reservation ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Primary Guest</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Members</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Room</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredData.map((guest) => (
                  <tr key={guest.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(guest.id)}
                        onChange={() => {
                          setSelectedItems(prev =>
                            prev.includes(guest.id) ? prev.filter(i => i !== guest.id) : [...prev, guest.id]
                          );
                        }}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-gray-900">{guest.reservationId}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-900">{guest.name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                        <Users className="w-3 h-3" />
                        {guest.memberCount}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">
                        {guest.room}{guest.bed !== 'TBD' ? `, ${guest.bed}` : ''}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">{guest.time}</span>
                    </td>
                    <td className="px-4 py-3">
                      {guest.status === 'completed' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full">
                          <CheckCircle className="w-3 h-3" />
                          Completed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-50 text-yellow-700 text-xs rounded-full">
                          <Clock className="w-3 h-3" />
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {guest.status === 'pending' && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleCheckin(guest)}
                          >
                            Check In
                          </Button>
                        )}
                        {guest.room !== 'TBD' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleUnassignRoom(guest)}
                          >
                            Unassign Room
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Room Allocation Modal for Check-in */}
      <RoomAllocationModal
        isOpen={allocationModalOpen}
        onClose={() => {
          setAllocationModalOpen(false);
          setSelectedReservation(null);
        }}
        reservation={selectedReservation}
        onSuccess={handleAllocationSuccess}
      />
    </div>
  );
};

export default CheckinsCheckouts;
