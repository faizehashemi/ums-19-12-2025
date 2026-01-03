import { useState, useMemo, useEffect } from 'react';
import Modal from '../../../../components/ui/Modal';
import Button from '../../../../components/ui/Button';
import SearchInput from '../../../../components/accommodation/SearchInput';
import FilterBar from '../../../../components/accommodation/FilterBar';
import Accordion from '../../../../components/ui/Accordion';
import { Users, CheckCircle, AlertCircle, Bed } from 'lucide-react';
import { supabase } from '../../../../lib/supabase';
import { useToast } from '../../../../components/ui/Toast';

const RoomAllocationModal = ({ isOpen, onClose, reservation, onSuccess }) => {
  const { showToast } = useToast();
  const [rooms, setRooms] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [buildingFilter, setBuildingFilter] = useState('all');
  const [floorFilter, setFloorFilter] = useState('all');
  const [assignments, setAssignments] = useState({});
  const [selectedMember, setSelectedMember] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchRooms();
      initializeAssignments();
    }
  }, [isOpen, reservation]);

  const initializeAssignments = () => {
    if (!reservation?.members) return;

    const initialAssignments = {};
    reservation.members.forEach((member, idx) => {
      if (member.room && member.bed) {
        initialAssignments[idx] = {
          room: member.room,
          bed: member.bed
        };
      }
    });
    setAssignments(initialAssignments);
  };

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const { data: buildingsData, error: buildingsError } = await supabase
        .from('buildings')
        .select('*')
        .order('name', { ascending: true });

      if (buildingsError) throw buildingsError;

      const { data: roomsData, error: roomsError } = await supabase
        .from('rooms')
        .select(`
          *,
          buildings (
            id,
            name
          )
        `)
        .in('status', ['available', 'occupied'])
        .order('building_id', { ascending: true })
        .order('floor', { ascending: true })
        .order('room_number', { ascending: true });

      if (roomsError) throw roomsError;

      // Fetch all current reservations to get occupied beds
      const { data: reservationsData, error: reservationsError } = await supabase
        .from('reservations')
        .select('members, travel_details')
        .in('status', ['approved', 'confirmed']);

      if (reservationsError) throw reservationsError;

      // Get the arrival date for the current reservation being allocated
      const currentArrivalDate = reservation?.travel_details?.arrivalDateTime
        ? reservation.travel_details.arrivalDateTime.split('T')[0]
        : null;

      // Build a map of occupied beds per room (only beds that will be occupied at arrival time)
      const occupiedBedsMap = {};
      reservationsData?.forEach(res => {
        const members = res.members || [];
        const travelDetails = res.travel_details || {};

        // Extract check-in and check-out dates for this reservation
        const resCheckinDate = travelDetails.arrivalDateTime
          ? travelDetails.arrivalDateTime.split('T')[0]
          : null;
        const resCheckoutDate = travelDetails.departureDateTime
          ? travelDetails.departureDateTime.split('T')[0]
          : null;

        members.forEach(member => {
          // Only count this bed as occupied if:
          // 1. Member is checked in (or will be)
          // 2. Member hasn't checked out
          // 3. The date ranges overlap with our arrival date
          if (member.room && member.bed &&
              member.checkin_status === 'completed' &&
              member.checkout_status !== 'completed') {

            // Check if this bed will be occupied on our arrival date
            const willBeOccupied = currentArrivalDate && resCheckinDate && resCheckoutDate
              ? currentArrivalDate >= resCheckinDate && currentArrivalDate < resCheckoutDate
              : true; // If we can't determine dates, assume occupied for safety

            if (willBeOccupied) {
              if (!occupiedBedsMap[member.room]) {
                occupiedBedsMap[member.room] = new Set();
              }
              occupiedBedsMap[member.room].add(member.bed);
            }
          }
        });
      });

      const transformedRooms = roomsData.map(room => ({
        id: room.id,
        number: room.room_number,
        building_id: room.building_id,
        building: room.buildings?.name || 'Unknown',
        floor: room.floor,
        status: room.status,
        bed_capacity: room.bed_capacity,
        room_type: room.room_type,
        occupied_beds: occupiedBedsMap[room.room_number] ? Array.from(occupiedBedsMap[room.room_number]) : []
      }));

      setBuildings(buildingsData || []);
      setRooms(transformedRooms || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      showToast('Failed to load rooms', 'error');
    } finally {
      setLoading(false);
    }
  };

  const buildingsForFilter = useMemo(() => {
    const unique = [...new Set(rooms.map(r => r.building))];
    return unique.map(b => ({ value: b.toLowerCase().replace(/\s/g, '-'), label: b }));
  }, [rooms]);

  const floors = useMemo(() => {
    const unique = [...new Set(rooms.map(r => r.floor))];
    return unique.map(f => ({ value: f.toString(), label: `Floor ${f}` }));
  }, [rooms]);

  const filteredRooms = useMemo(() => {
    return rooms.filter(room => {
      const matchesSearch = room.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          room.building.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesBuilding = buildingFilter === 'all' ||
                            room.building.toLowerCase().replace(/\s/g, '-') === buildingFilter;
      const matchesFloor = floorFilter === 'all' || room.floor.toString() === floorFilter;

      return matchesSearch && matchesBuilding && matchesFloor;
    });
  }, [rooms, searchQuery, buildingFilter, floorFilter]);

  const groupedRooms = useMemo(() => {
    const grouped = {};
    filteredRooms.forEach(room => {
      if (!grouped[room.building]) {
        grouped[room.building] = {};
      }
      if (!grouped[room.building][room.floor]) {
        grouped[room.building][room.floor] = [];
      }
      grouped[room.building][room.floor].push(room);
    });
    return grouped;
  }, [filteredRooms]);

  const getOccupiedBeds = (roomNumber) => {
    // Get beds occupied in current session
    const sessionOccupied = Object.values(assignments).filter(a => a.room === roomNumber).length;

    // Get beds already occupied in database
    const room = rooms.find(r => r.number === roomNumber);
    const dbOccupied = room?.occupied_beds?.length || 0;

    return sessionOccupied + dbOccupied;
  };

  const handleRoomClick = (room) => {
    if (!selectedMember && selectedMember !== 0) {
      showToast('Please select a member first', 'info');
      return;
    }

    const occupiedBeds = getOccupiedBeds(room.number);
    if (occupiedBeds >= room.bed_capacity) {
      showToast('This room is full', 'error');
      return;
    }

    // Find next available bed
    // Combine beds occupied in DB and current session
    const dbOccupiedBeds = room.occupied_beds || [];
    const sessionOccupiedBeds = Object.values(assignments)
      .filter(a => a.room === room.number)
      .map(a => a.bed);

    const allOccupiedBeds = [...dbOccupiedBeds, ...sessionOccupiedBeds];

    const allBeds = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const nextBed = allBeds.find(bed => !allOccupiedBeds.includes(bed));

    if (!nextBed) {
      showToast('No available beds in this room', 'error');
      return;
    }

    setAssignments(prev => ({
      ...prev,
      [selectedMember]: {
        room: room.number,
        bed: nextBed
      }
    }));

    // Move to next unassigned member
    const nextUnassigned = reservation.members.findIndex((m, idx) =>
      idx > selectedMember && !assignments[idx]
    );
    if (nextUnassigned !== -1) {
      setSelectedMember(nextUnassigned);
    } else {
      setSelectedMember(null);
    }
  };

  const assignedCount = Object.keys(assignments).length;
  const totalMembers = reservation?.members?.length || 0;
  const pendingCount = totalMembers - assignedCount;

  const handleSave = async () => {
    if (pendingCount > 0) {
      showToast(`Please assign all ${pendingCount} pending members`, 'error');
      return;
    }

    try {
      const updatedMembers = reservation.members.map((member, idx) => ({
        ...member,
        room: assignments[idx]?.room || null,
        bed: assignments[idx]?.bed || null
      }));

      const { error } = await supabase
        .from('reservations')
        .update({ members: updatedMembers })
        .eq('id', reservation.id);

      if (error) throw error;

      showToast('Room assignments saved successfully', 'success');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error saving assignments:', error);
      showToast('Failed to save assignments', 'error');
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setBuildingFilter('all');
    setFloorFilter('all');
  };

  const hasActiveFilters = searchQuery || buildingFilter !== 'all' || floorFilter !== 'all';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assign Rooms" size="xl">
      <Modal.Content>
        <div className="space-y-4">
          {/* Assignment Status */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-blue-700">
                <Users className="w-4 h-4" />
                <span className="text-sm font-medium">Total Members</span>
              </div>
              <p className="text-2xl font-bold text-blue-900 mt-1">{totalMembers}</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Assigned</span>
              </div>
              <p className="text-2xl font-bold text-green-900 mt-1">{assignedCount}</p>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-orange-700">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Pending</span>
              </div>
              <p className="text-2xl font-bold text-orange-900 mt-1">{pendingCount}</p>
            </div>
          </div>

          {/* Members List */}
          <div className="border rounded-lg p-3 max-h-48 overflow-y-auto">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Group Members</h3>
            <div className="space-y-2">
              {reservation?.members?.map((member, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedMember(idx)}
                  className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                    selectedMember === idx
                      ? 'bg-blue-100 border-2 border-blue-500'
                      : assignments[idx]
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">{member.name}</span>
                    {selectedMember === idx && (
                      <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded">Selected</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    {assignments[idx] ? (
                      <span className="flex items-center gap-1 text-green-700">
                        <CheckCircle className="w-3 h-3" />
                        Room {assignments[idx].room}, Bed {assignments[idx].bed}
                      </span>
                    ) : (
                      <span className="text-orange-600">Not assigned</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="space-y-2">
            <SearchInput
              placeholder="Search rooms..."
              value={searchQuery}
              onChange={setSearchQuery}
              onClear={() => setSearchQuery('')}
            />
            <FilterBar onClearAll={clearFilters} hasActiveFilters={hasActiveFilters}>
              <FilterBar.Dropdown
                label="Building"
                value={buildingFilter}
                options={buildingsForFilter}
                onChange={setBuildingFilter}
              />
              <FilterBar.Dropdown
                label="Floor"
                value={floorFilter}
                options={floors}
                onChange={setFloorFilter}
              />
            </FilterBar>
          </div>

          {/* Room Grid */}
          <div className="border rounded-lg max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="p-3 space-y-3">
                {Object.entries(groupedRooms).map(([building, floors]) => (
                  <Accordion key={building}>
                    <Accordion.Item
                      title={building}
                      badge={Object.values(floors).flat().length}
                      defaultOpen={true}
                    >
                      <div className="space-y-3">
                        {Object.entries(floors).map(([floor, floorRooms]) => (
                          <div key={floor}>
                            <h3 className="text-sm font-semibold text-gray-700 mb-2">
                              Floor {floor}
                            </h3>
                            <div className="grid grid-cols-8 sm:grid-cols-12 md:grid-cols-16 lg:grid-cols-20 gap-1.5">
                              {floorRooms.map(room => {
                                const occupiedBeds = getOccupiedBeds(room.number);
                                const isFull = occupiedBeds >= room.bed_capacity;
                                const hasAssignments = occupiedBeds > 0;

                                return (
                                  <button
                                    key={room.id}
                                    onClick={() => handleRoomClick(room)}
                                    disabled={isFull}
                                    className={`
                                      relative aspect-square rounded border-2 p-1
                                      flex flex-col items-center justify-center
                                      text-xs font-semibold transition-all
                                      ${isFull
                                        ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                                        : hasAssignments
                                        ? 'bg-blue-50 border-blue-400 text-blue-700 hover:bg-blue-100'
                                        : room.status === 'available'
                                        ? 'bg-green-50 border-green-400 text-green-700 hover:bg-green-100 cursor-pointer'
                                        : 'bg-yellow-50 border-yellow-400 text-yellow-700 hover:bg-yellow-100 cursor-pointer'
                                      }
                                    `}
                                    title={`${room.number} - ${occupiedBeds}/${room.bed_capacity} beds`}
                                  >
                                    <span className="text-xs">{room.number}</span>
                                    <div className="flex items-center gap-0.5 mt-0.5">
                                      <Bed className="w-2.5 h-2.5" />
                                      <span className="text-[10px]">{occupiedBeds}/{room.bed_capacity}</span>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </Accordion.Item>
                  </Accordion>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal.Content>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={pendingCount > 0}
        >
          Save Assignments {pendingCount > 0 && `(${pendingCount} pending)`}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default RoomAllocationModal;
