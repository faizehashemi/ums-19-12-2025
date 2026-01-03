import { useState, useMemo, useEffect } from 'react';
import PageHeader from '../../../components/layout/PageHeader';
import FilterBar from '../../../components/accommodation/FilterBar';
import Button from '../../../components/ui/Button';
import EmptyState from '../../../components/layout/EmptyState';
import { CheckCircle, Building, AlertCircle } from 'lucide-react';
import { useToast } from '../../../components/ui/Toast';
import { supabase } from '../../../lib/supabase';

const Housekeeping = () => {
  const { showToast } = useToast();
  const [statusFilter, setStatusFilter] = useState('all');
  const [rooms, setRooms] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const { data: roomsData, error: roomsError } = await supabase
        .from('rooms')
        .select(`
          *,
          buildings (
            id,
            name
          )
        `)
        .order('building_id', { ascending: true })
        .order('floor', { ascending: true })
        .order('room_number', { ascending: true });

      if (roomsError) throw roomsError;

      const transformedRooms = roomsData.map(room => ({
        id: room.id,
        room_number: room.room_number,
        building: room.buildings?.name || 'Unknown',
        building_id: room.building_id,
        floor: room.floor,
        status: room.status,
        last_cleaned_at: room.last_cleaned_at,
        updated_at: room.updated_at
      }));

      setRooms(transformedRooms || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      showToast('Failed to load rooms', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredRooms = useMemo(() => {
    if (statusFilter === 'all') return rooms;
    return rooms.filter(r => r.status === statusFilter);
  }, [rooms, statusFilter]);

  const roomsByStatus = useMemo(() => {
    return {
      cleaning: rooms.filter(r => r.status === 'cleaning'),
      available: rooms.filter(r => r.status === 'available'),
      occupied: rooms.filter(r => r.status === 'occupied'),
      maintenance: rooms.filter(r => r.status === 'maintenance')
    };
  }, [rooms]);

  const handleCompleteCleaning = async (roomId) => {
    try {
      // Call the complete_room_cleaning function
      const { error } = await supabase.rpc('complete_room_cleaning', {
        room_uuid: roomId
      });

      if (error) throw error;

      showToast('Room cleaning completed successfully', 'success');
      fetchRooms(); // Refresh the list
    } catch (error) {
      console.error('Error completing cleaning:', error);
      showToast('Failed to complete cleaning', 'error');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'cleaning':
        return 'bg-yellow-50 border-yellow-400 text-yellow-700';
      case 'available':
        return 'bg-green-50 border-green-400 text-green-700';
      case 'occupied':
        return 'bg-blue-50 border-blue-400 text-blue-700';
      case 'maintenance':
        return 'bg-red-50 border-red-400 text-red-700';
      default:
        return 'bg-gray-50 border-gray-400 text-gray-700';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'cleaning':
        return <AlertCircle className="w-3 h-3" />;
      case 'available':
        return <CheckCircle className="w-3 h-3" />;
      default:
        return <Building className="w-3 h-3" />;
    }
  };

  const RoomCard = ({ room }) => (
    <div className={`border rounded-md p-2 ${getStatusColor(room.status)}`}>
      <div className="flex items-start justify-between mb-1">
        <div>
          <h3 className="font-medium text-xs">Room {room.room_number}</h3>
          <p className="text-[11px] opacity-75">{room.building}</p>
        </div>
        {getStatusIcon(room.status)}
      </div>

      {room.last_cleaned_at && (
        <p className="text-[11px] opacity-75 mb-1">
          Last cleaned: {new Date(room.last_cleaned_at).toLocaleDateString()}
        </p>
      )}

      <div className="flex items-center justify-between">
        <span className="text-xs font-medium capitalize">{room.status.replace('_', ' ')}</span>
        {room.status === 'cleaning' && (
          <Button
            variant="primary"
            size="sm"
            className="px-2 py-1 text-xs h-8"
            onClick={() => handleCompleteCleaning(room.id)}
          >
            Mark Clean
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="Housekeeping"
        subtitle={`${roomsByStatus.cleaning.length} rooms need cleaning`}
      />

      <FilterBar>
        <FilterBar.Chips
          options={['All', 'Cleaning', 'Available', 'Occupied', 'Maintenance']}
          active={statusFilter}
          onChange={setStatusFilter}
        />
      </FilterBar>

      {/* Desktop: Kanban Board */}
      <div className="hidden md:grid md:grid-cols-4 gap-4">
        {['cleaning', 'available', 'occupied', 'maintenance'].map(status => (
          <div key={status} className="bg-gray-50 rounded-lg p-2">
            <h3 className="font-semibold text-xs mb-2 capitalize">
              {status} ({roomsByStatus[status].length})
            </h3>
            <div className="space-y-2">
              {roomsByStatus[status].map(room => (
                <RoomCard key={room.id} room={room} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Mobile: List View */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredRooms.length === 0 ? (
          <EmptyState
            icon={<Building className="w-8 h-8" />}
            title="No rooms found"
            description="No rooms match the selected filter"
          />
        ) : (
          filteredRooms.map(room => (
            <div key={room.id} className={`border rounded-md p-2 ${getStatusColor(room.status)}`}>
              <div className="flex items-start justify-between mb-1">
                <div>
                  <h3 className="font-medium text-sm">Room {room.room_number}</h3>
                  <p className="text-[11px] opacity-75">{room.building}</p>
                </div>
                {getStatusIcon(room.status)}
              </div>
              {room.last_cleaned_at && (
                <p className="text-[11px] opacity-75 mb-1">
                  Last cleaned: {new Date(room.last_cleaned_at).toLocaleDateString()}
                </p>
              )}
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm font-medium capitalize">{room.status.replace('_', ' ')}</span>
                {room.status === 'cleaning' && (
                  <Button
                    variant="primary"
                    size="sm"
                    className="px-2 py-1 text-xs h-8"
                    onClick={() => handleCompleteCleaning(room.id)}
                  >
                    Mark Clean
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Housekeeping;
