import { useState, useMemo, useEffect } from 'react';
import PageHeader from '../../../components/layout/PageHeader';
import SearchInput from '../../../components/accommodation/SearchInput';
import FilterBar from '../../../components/accommodation/FilterBar';
import Accordion from '../../../components/ui/Accordion';
import RoomCard from '../../../components/accommodation/RoomCard';
import QuickActions from '../../../components/accommodation/QuickActions';
import Button from '../../../components/ui/Button';
import EmptyState from '../../../components/layout/EmptyState';
import LoadingSkeleton from '../../../components/layout/LoadingSkeleton';
import RoomDrawer from './components/RoomDrawer';
import BuildingModal from '../../../components/accommodation/BuildingModal';
import RoomModal from '../../../components/accommodation/RoomModal';
import { Plus, Grid3x3, List, Inbox, Maximize2, Minimize2, Building2, ChevronDown } from 'lucide-react';
import { useToast } from '../../../components/ui/Toast';
import { supabase } from '../../../lib/supabase';

const GridLayout = () => {
  const { showToast } = useToast();

  // State for buildings and rooms
  const [buildingsList, setBuildingsList] = useState([]);
  const [roomsList, setRoomsList] = useState([]);

  // Modal states
  const [buildingModalOpen, setBuildingModalOpen] = useState(false);
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState(null);
  const [editingRoom, setEditingRoom] = useState(null);
  const [showBuildingMenu, setShowBuildingMenu] = useState(false);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [buildingFilter, setBuildingFilter] = useState('all');
  const [floorFilter, setFloorFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [cardSize, setCardSize] = useState('compact'); // compact or large
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch buildings and rooms on mount
  useEffect(() => {
    fetchBuildingsAndRooms();
  }, []);

  const fetchBuildingsAndRooms = async () => {
    setIsLoading(true);
    try {
      // Fetch buildings
      const { data: buildings, error: buildingsError } = await supabase
        .from('buildings')
        .select('*')
        .order('name', { ascending: true });

      if (buildingsError) throw buildingsError;

      // Fetch rooms with building info
      const { data: rooms, error: roomsError } = await supabase
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

      // Transform rooms data to match component expectations
      const transformedRooms = rooms.map(room => ({
        id: room.id,
        number: room.room_number,
        room_number: room.room_number,
        building_id: room.building_id,
        building: room.buildings?.name || 'Unknown',
        floor: room.floor,
        status: room.status,
        bed_capacity: room.bed_capacity,
        totalBeds: room.bed_capacity,
        room_type: room.room_type,
        notes: room.notes,
        lastCleaned: room.last_cleaned_at ? formatTimeAgo(room.last_cleaned_at) : 'Never',
        occupiedBeds: 0,
        occupants: []
      }));

      setBuildingsList(buildings || []);
      setRoomsList(transformedRooms || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      showToast('Failed to load buildings and rooms', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  // Get unique buildings and floors from current rooms
  const buildingsForFilter = useMemo(() => {
    const unique = [...new Set(roomsList.map(r => r.building))];
    return unique.map(b => ({ value: b.toLowerCase().replace(/\s/g, '-'), label: b }));
  }, [roomsList]);

  const floors = useMemo(() => {
    const unique = [...new Set(roomsList.map(r => r.floor))];
    return unique.map(f => ({ value: f.toString(), label: `Floor ${f}` }));
  }, [roomsList]);

  const statusOptions = [
    { value: 'available', label: 'Available' },
    { value: 'occupied', label: 'Occupied' },
    { value: 'cleaning', label: 'Needs Cleaning' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'blocked', label: 'Blocked' }
  ];

  // Filter rooms
  const filteredRooms = useMemo(() => {
    return roomsList.filter(room => {
      const matchesSearch = room.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          room.building.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesBuilding = buildingFilter === 'all' ||
                            room.building.toLowerCase().replace(/\s/g, '-') === buildingFilter;
      const matchesFloor = floorFilter === 'all' || room.floor.toString() === floorFilter;
      const matchesStatus = statusFilter === 'all' || room.status === statusFilter;

      return matchesSearch && matchesBuilding && matchesFloor && matchesStatus;
    });
  }, [roomsList, searchQuery, buildingFilter, floorFilter, statusFilter]);

  // Group by building and floor
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

  const hasActiveFilters = searchQuery || buildingFilter !== 'all' ||
                          floorFilter !== 'all' || statusFilter !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setBuildingFilter('all');
    setFloorFilter('all');
    setStatusFilter('all');
  };

  const openRoomDrawer = (room) => {
    setSelectedRoom(room);
    setDrawerOpen(true);
  };

  const handleRoomAction = (action) => {
    switch (action) {
      case 'assign':
        showToast('Allocation form opened', 'info');
        setDrawerOpen(false);
        break;
      case 'clean':
        showToast(`Room ${selectedRoom.number} marked as cleaned`, 'success');
        setDrawerOpen(false);
        break;
      case 'maintenance':
        showToast('Maintenance ticket form opened', 'info');
        setDrawerOpen(false);
        break;
      default:
        break;
    }
  };

  const handleQuickAction = (room, action) => {
    setSelectedRoom(room);
    handleRoomAction(action);
  };

  // Building handlers
  const handleSaveBuilding = async (buildingData) => {
    try {
      if (buildingData.id) {
        // Update existing building
        const { data, error } = await supabase
          .from('buildings')
          .update({
            name: buildingData.name,
            address: buildingData.address,
            total_floors: buildingData.total_floors,
            description: buildingData.description,
            status: buildingData.status,
            updated_at: new Date().toISOString()
          })
          .eq('id', buildingData.id)
          .select()
          .single();

        if (error) throw error;

        setBuildingsList(prev => prev.map(b => b.id === buildingData.id ? data : b));
        showToast(`Building "${buildingData.name}" updated successfully`, 'success');
      } else {
        // Add new building
        const { data, error } = await supabase
          .from('buildings')
          .insert([{
            name: buildingData.name,
            address: buildingData.address,
            total_floors: buildingData.total_floors,
            description: buildingData.description,
            status: buildingData.status
          }])
          .select()
          .single();

        if (error) throw error;

        setBuildingsList(prev => [...prev, data]);
        showToast(`Building "${buildingData.name}" added successfully`, 'success');
      }
    } catch (error) {
      console.error('Error saving building:', error);
      showToast('Failed to save building', 'error');
    }
  };

  const handleDeleteBuilding = async (buildingId) => {
    const building = buildingsList.find(b => b.id === buildingId);
    try {
      const { error } = await supabase
        .from('buildings')
        .delete()
        .eq('id', buildingId);

      if (error) throw error;

      setBuildingsList(prev => prev.filter(b => b.id !== buildingId));
      // Also remove rooms from UI (cascade delete should handle DB)
      setRoomsList(prev => prev.filter(r => r.building_id !== buildingId));
      showToast(`Building "${building.name}" and all its rooms deleted`, 'success');
    } catch (error) {
      console.error('Error deleting building:', error);
      showToast('Failed to delete building', 'error');
    }
  };

  const openBuildingModal = (building = null) => {
    setEditingBuilding(building);
    setBuildingModalOpen(true);
  };

  // Room handlers
  const handleSaveRoom = async (roomsData) => {
    try {
      // roomsData is an array (for bulk creation or single room)
      if (roomsData[0].id) {
        // Update existing room
        const roomData = roomsData[0];
        const { data, error } = await supabase
          .from('rooms')
          .update({
            room_number: roomData.room_number,
            floor: roomData.floor,
            bed_capacity: roomData.bed_capacity,
            status: roomData.status,
            room_type: roomData.room_type,
            notes: roomData.notes,
            updated_at: new Date().toISOString()
          })
          .eq('id', roomData.id)
          .select()
          .single();

        if (error) throw error;

        setRoomsList(prev => prev.map(r => r.id === roomData.id ? {
          ...data,
          number: data.room_number,
          building: buildingsList.find(b => b.id === data.building_id)?.name || '',
          totalBeds: data.bed_capacity,
          occupiedBeds: r.occupiedBeds || 0,
          occupants: r.occupants || []
        } : r));
        showToast(`Room ${roomData.room_number} updated successfully`, 'success');
      } else {
        // Add new room(s)
        const roomsToInsert = roomsData.map(room => ({
          building_id: room.building_id,
          room_number: room.room_number,
          floor: room.floor,
          bed_capacity: room.bed_capacity,
          status: room.status,
          room_type: room.room_type,
          notes: room.notes
        }));

        const { data, error } = await supabase
          .from('rooms')
          .insert(roomsToInsert)
          .select();

        if (error) throw error;

        const newRooms = data.map(room => ({
          ...room,
          number: room.room_number,
          building: buildingsList.find(b => b.id === room.building_id)?.name || '',
          totalBeds: room.bed_capacity,
          occupiedBeds: 0,
          occupants: []
        }));

        setRoomsList(prev => [...prev, ...newRooms]);
        showToast(
          newRooms.length === 1
            ? `Room ${newRooms[0].room_number} added successfully`
            : `${newRooms.length} rooms added successfully`,
          'success'
        );
      }
    } catch (error) {
      console.error('Error saving room:', error);
      showToast('Failed to save room', 'error');
    }
  };

  const handleDeleteRoom = async (roomId) => {
    const room = roomsList.find(r => r.id === roomId);
    try {
      const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('id', roomId);

      if (error) throw error;

      setRoomsList(prev => prev.filter(r => r.id !== roomId));
      showToast(`Room ${room.number} deleted`, 'success');
    } catch (error) {
      console.error('Error deleting room:', error);
      showToast('Failed to delete room', 'error');
    }
  };

  const openRoomModal = (room = null) => {
    setEditingRoom(room);
    setRoomModalOpen(true);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Grid Layout"
        subtitle={`${filteredRooms.length} room${filteredRooms.length !== 1 ? 's' : ''}`}
        actions={
          <>
            <div className="hidden md:flex gap-1 border border-gray-300 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
                aria-label="Grid view"
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
                aria-label="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
            {viewMode === 'grid' && (
              <div className="hidden md:flex gap-1 border border-gray-300 rounded-lg p-1">
                <button
                  onClick={() => setCardSize('compact')}
                  className={`p-2 rounded ${cardSize === 'compact' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
                  aria-label="Compact size"
                  title="Compact (20+ per row)"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCardSize('large')}
                  className={`p-2 rounded ${cardSize === 'large' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
                  aria-label="Large size"
                  title="Large"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Building Management Dropdown */}
            <div className="relative">
              <Button
                variant="secondary"
                icon={<Building2 className="w-5 h-5" />}
                onClick={() => setShowBuildingMenu(!showBuildingMenu)}
              >
                Buildings
                <ChevronDown className="w-4 h-4 ml-1" />
              </Button>
              {showBuildingMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowBuildingMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                    <button
                      onClick={() => {
                        openBuildingModal();
                        setShowBuildingMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Building
                    </button>
                    {buildingsList.map(building => (
                      <button
                        key={building.id}
                        onClick={() => {
                          openBuildingModal(building);
                          setShowBuildingMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                      >
                        {building.name}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <Button
              variant="primary"
              icon={<Plus className="w-5 h-5" />}
              onClick={() => openRoomModal()}
            >
              Add Room
            </Button>
          </>
        }
      />

      {/* Filters */}
      <div className="space-y-3">
        <SearchInput
          placeholder="Search rooms, buildings..."
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
          <FilterBar.Dropdown
            label="Status"
            value={statusFilter}
            options={statusOptions}
            onChange={setStatusFilter}
          />
        </FilterBar>
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingSkeleton type="grid" count={6} />
      ) : filteredRooms.length === 0 ? (
        <EmptyState
          icon={<Inbox className="w-8 h-8" />}
          title="No rooms found"
          description="Try adjusting your filters or search terms"
          action={
            hasActiveFilters && (
              <Button variant="secondary" onClick={clearFilters}>
                Clear Filters
              </Button>
            )
          }
        />
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedRooms).map(([building, floors]) => (
            <Accordion key={building}>
              <Accordion.Item
                title={building}
                badge={Object.values(floors).flat().length}
                defaultOpen={true}
              >
                <div className="space-y-3">
                  {Object.entries(floors).map(([floor, rooms]) => (
                    <div key={floor}>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">
                        Floor {floor}
                      </h3>
                      <div className={`grid ${
                        viewMode === 'grid'
                          ? cardSize === 'compact'
                            ? 'grid-cols-6 sm:grid-cols-12 md:grid-cols-16 lg:grid-cols-20 xl:grid-cols-24 gap-1.5'
                            : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3'
                          : 'grid-cols-1 gap-3'
                      }`}>
                        {rooms.map(room => (
                          <RoomCard
                            key={room.id}
                            room={room}
                            size={cardSize}
                            onClick={() => openRoomDrawer(room)}
                            actions={
                              cardSize !== 'compact' && (
                                <QuickActions>
                                  <QuickActions.Button
                                    icon="user"
                                    label="Assign"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleQuickAction(room, 'assign');
                                    }}
                                  />
                                  <QuickActions.Button
                                    icon="broom"
                                    label="Clean"
                                    variant="success"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleQuickAction(room, 'clean');
                                    }}
                                  />
                                  <QuickActions.Button
                                    icon="wrench"
                                    label="Issue"
                                    variant="danger"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleQuickAction(room, 'maintenance');
                                    }}
                                  />
                                </QuickActions>
                              )
                            }
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Accordion.Item>
            </Accordion>
          ))}
        </div>
      )}

      {/* Room Detail Drawer */}
      <RoomDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        room={selectedRoom}
        onAction={handleRoomAction}
      />

      {/* Building Modal */}
      <BuildingModal
        isOpen={buildingModalOpen}
        onClose={() => {
          setBuildingModalOpen(false);
          setEditingBuilding(null);
        }}
        building={editingBuilding}
        onSave={handleSaveBuilding}
        onDelete={handleDeleteBuilding}
      />

      {/* Room Modal */}
      <RoomModal
        isOpen={roomModalOpen}
        onClose={() => {
          setRoomModalOpen(false);
          setEditingRoom(null);
        }}
        room={editingRoom}
        buildings={buildingsList}
        onSave={handleSaveRoom}
        onDelete={handleDeleteRoom}
      />
    </div>
  );
};

export default GridLayout;
