import { useState, useMemo } from 'react';
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
import { Plus, Grid3x3, List, Inbox } from 'lucide-react';
import { useToast } from '../../../components/ui/Toast';

// Mock data - replace with actual API calls
const mockRooms = [
  {
    id: 1,
    number: '101',
    building: 'Building A',
    floor: 1,
    status: 'occupied',
    totalBeds: 4,
    occupiedBeds: 2,
    lastCleaned: '2h ago',
    occupants: [
      { name: 'Ahmed Khan', bed: 'A', checkIn: '2025-12-28' },
      { name: 'Ali Hassan', bed: 'B', checkIn: '2025-12-28' }
    ]
  },
  {
    id: 2,
    number: '102',
    building: 'Building A',
    floor: 1,
    status: 'available',
    totalBeds: 4,
    occupiedBeds: 0,
    lastCleaned: '1h ago',
    occupants: []
  },
  {
    id: 3,
    number: '103',
    building: 'Building A',
    floor: 1,
    status: 'cleaning',
    totalBeds: 4,
    occupiedBeds: 4,
    lastCleaned: '5h ago',
    occupants: [
      { name: 'Sara Ali', bed: 'A', checkIn: '2025-12-27' },
      { name: 'Fatima Khan', bed: 'B', checkIn: '2025-12-27' },
      { name: 'Zainab Ahmed', bed: 'C', checkIn: '2025-12-27' },
      { name: 'Aisha Hassan', bed: 'D', checkIn: '2025-12-27' }
    ]
  },
  {
    id: 4,
    number: '104',
    building: 'Building A',
    floor: 1,
    status: 'maintenance',
    totalBeds: 2,
    occupiedBeds: 0,
    lastCleaned: '1d ago',
    occupants: [],
    maintenanceIssues: [
      { title: 'AC not working', severity: 'High', status: 'Assigned' }
    ]
  },
  {
    id: 5,
    number: '201',
    building: 'Building A',
    floor: 2,
    status: 'occupied',
    totalBeds: 4,
    occupiedBeds: 3,
    lastCleaned: '3h ago',
    occupants: [
      { name: 'Omar Abdullah', bed: 'A', checkIn: '2025-12-29' },
      { name: 'Yusuf Ibrahim', bed: 'B', checkIn: '2025-12-29' },
      { name: 'Bilal Ahmed', bed: 'C', checkIn: '2025-12-29' }
    ]
  },
  {
    id: 6,
    number: '101',
    building: 'Building B',
    floor: 1,
    status: 'available',
    totalBeds: 6,
    occupiedBeds: 0,
    lastCleaned: '30m ago',
    occupants: []
  }
];

const GridLayout = () => {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [buildingFilter, setBuildingFilter] = useState('all');
  const [floorFilter, setFloorFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Get unique buildings and floors
  const buildings = useMemo(() => {
    const unique = [...new Set(mockRooms.map(r => r.building))];
    return unique.map(b => ({ value: b.toLowerCase().replace(/\s/g, '-'), label: b }));
  }, []);

  const floors = useMemo(() => {
    const unique = [...new Set(mockRooms.map(r => r.floor))];
    return unique.map(f => ({ value: f.toString(), label: `Floor ${f}` }));
  }, []);

  const statusOptions = [
    { value: 'available', label: 'Available' },
    { value: 'occupied', label: 'Occupied' },
    { value: 'cleaning', label: 'Needs Cleaning' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'blocked', label: 'Blocked' }
  ];

  // Filter rooms
  const filteredRooms = useMemo(() => {
    return mockRooms.filter(room => {
      const matchesSearch = room.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          room.building.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesBuilding = buildingFilter === 'all' ||
                            room.building.toLowerCase().replace(/\s/g, '-') === buildingFilter;
      const matchesFloor = floorFilter === 'all' || room.floor.toString() === floorFilter;
      const matchesStatus = statusFilter === 'all' || room.status === statusFilter;

      return matchesSearch && matchesBuilding && matchesFloor && matchesStatus;
    });
  }, [searchQuery, buildingFilter, floorFilter, statusFilter]);

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
            <Button variant="primary" icon={<Plus className="w-5 h-5" />}>
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
            options={buildings}
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
                      <div className={`grid gap-3 ${
                        viewMode === 'grid'
                          ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                          : 'grid-cols-1'
                      }`}>
                        {rooms.map(room => (
                          <RoomCard
                            key={room.id}
                            room={room}
                            onClick={() => openRoomDrawer(room)}
                            actions={
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
    </div>
  );
};

export default GridLayout;
