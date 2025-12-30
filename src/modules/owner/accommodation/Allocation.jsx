import { useState, useMemo } from 'react';
import PageHeader from '../../../components/layout/PageHeader';
import SearchInput from '../../../components/accommodation/SearchInput';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import EmptyState from '../../../components/layout/EmptyState';
import { Plus, UserPlus, Bed, Calendar, AlertCircle } from 'lucide-react';
import { useToast } from '../../../components/ui/Toast';

// Mock data
const mockUnassignedPeople = [
  { id: 1, name: 'Ahmed Khan', checkIn: '2025-12-30', priority: 'high', group: 'Family A' },
  { id: 2, name: 'Sara Ali', checkIn: '2025-12-30', priority: 'normal', group: 'Family A' },
  { id: 3, name: 'Omar Abdullah', checkIn: '2025-12-31', priority: 'high', group: null },
  { id: 4, name: 'Fatima Hassan', checkIn: '2025-12-31', priority: 'normal', group: 'Group B' },
];

const mockAvailableBeds = [
  { id: 1, room: '101', bed: 'A', building: 'Building A', floor: 1, type: 'Standard' },
  { id: 2, room: '101', bed: 'B', building: 'Building A', floor: 1, type: 'Standard' },
  { id: 3, room: '102', bed: 'A', building: 'Building A', floor: 1, type: 'Standard' },
  { id: 4, room: '201', bed: 'C', building: 'Building A', floor: 2, type: 'Premium' },
  { id: 5, room: '101', bed: 'A', building: 'Building B', floor: 1, type: 'Standard' },
];

const Allocation = () => {
  const { showToast } = useToast();
  const [searchPeople, setSearchPeople] = useState('');
  const [searchBeds, setSearchBeds] = useState('');
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [selectedBed, setSelectedBed] = useState(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);

  const filteredPeople = useMemo(() => {
    return mockUnassignedPeople.filter(p =>
      p.name.toLowerCase().includes(searchPeople.toLowerCase())
    );
  }, [searchPeople]);

  const filteredBeds = useMemo(() => {
    return mockAvailableBeds.filter(b =>
      b.room.includes(searchBeds) || b.building.toLowerCase().includes(searchBeds.toLowerCase())
    );
  }, [searchBeds]);

  const handleAssign = () => {
    if (!selectedPerson || !selectedBed) {
      showToast('Please select both a person and a bed', 'warning');
      return;
    }

    // Simulate allocation
    showToast(`${selectedPerson.name} assigned to Room ${selectedBed.room}, Bed ${selectedBed.bed}`, 'success');
    setSelectedPerson(null);
    setSelectedBed(null);
  };

  const PersonCard = ({ person, selected, onClick }) => (
    <div
      onClick={onClick}
      className={`p-4 border rounded-lg cursor-pointer transition-all ${
        selected ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50' : 'hover:shadow-md bg-white'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{person.name}</h3>
          <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
            <Calendar className="w-3 h-3" />
            Check-in: {new Date(person.checkIn).toLocaleDateString()}
          </p>
          {person.group && (
            <p className="text-xs text-gray-500 mt-1">Group: {person.group}</p>
          )}
        </div>
        {person.priority === 'high' && (
          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">Priority</span>
        )}
      </div>
    </div>
  );

  const BedCard = ({ bed, selected, onClick }) => (
    <div
      onClick={onClick}
      className={`p-4 border rounded-lg cursor-pointer transition-all ${
        selected ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50' : 'hover:shadow-md bg-white'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">Room {bed.room}, Bed {bed.bed}</h3>
          <p className="text-sm text-gray-600">{bed.building}, Floor {bed.floor}</p>
          <span className="inline-block mt-2 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
            {bed.type}
          </span>
        </div>
        <Bed className="w-5 h-5 text-gray-400" />
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col space-y-4">
      <PageHeader
        title="Room Allocation"
        subtitle={`${filteredPeople.length} unassigned • ${filteredBeds.length} available beds`}
        actions={
          <Button variant="primary" icon={<Plus className="w-5 h-5" />} onClick={() => setWizardOpen(true)}>
            Assign Bed
          </Button>
        }
      />

      <div className="flex-1 grid md:grid-cols-2 gap-4 overflow-hidden">
        {/* Unassigned People */}
        <div className="flex flex-col border rounded-lg bg-white">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-gray-900 mb-3">
              Unassigned People ({filteredPeople.length})
            </h2>
            <SearchInput
              placeholder="Search by name..."
              value={searchPeople}
              onChange={setSearchPeople}
              onClear={() => setSearchPeople('')}
            />
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredPeople.length === 0 ? (
              <EmptyState
                icon={<UserPlus className="w-8 h-8" />}
                title="No unassigned people"
                description="All guests have been allocated to rooms"
              />
            ) : (
              filteredPeople.map(person => (
                <PersonCard
                  key={person.id}
                  person={person}
                  selected={selectedPerson?.id === person.id}
                  onClick={() => setSelectedPerson(person)}
                />
              ))
            )}
          </div>
        </div>

        {/* Available Beds */}
        <div className="flex flex-col border rounded-lg bg-white">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-gray-900 mb-3">
              Available Beds ({filteredBeds.length})
            </h2>
            <SearchInput
              placeholder="Search by room, building..."
              value={searchBeds}
              onChange={setSearchBeds}
              onClear={() => setSearchBeds('')}
            />
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredBeds.length === 0 ? (
              <EmptyState
                icon={<Bed className="w-8 h-8" />}
                title="No available beds"
                description="All beds are currently occupied"
              />
            ) : (
              filteredBeds.map(bed => (
                <BedCard
                  key={bed.id}
                  bed={bed}
                  selected={selectedBed?.id === bed.id}
                  onClick={() => setSelectedBed(bed)}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Floating Action Bar */}
      {selectedPerson && selectedBed && (
        <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md">
          <div className="bg-blue-600 text-white rounded-lg p-4 shadow-lg">
            <p className="text-sm mb-2">
              Assign <strong>{selectedPerson.name}</strong> to Room <strong>{selectedBed.room}</strong>, Bed <strong>{selectedBed.bed}</strong>
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                full
                onClick={() => {
                  setSelectedPerson(null);
                  setSelectedBed(null);
                }}
              >
                Cancel
              </Button>
              <Button variant="success" full onClick={handleAssign}>
                Confirm Assignment
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Allocation;
