import { useState, useMemo } from 'react';
import PageHeader from '../../../components/layout/PageHeader';
import Tabs from '../../../components/ui/Tabs';
import SearchInput from '../../../components/accommodation/SearchInput';
import DateRangePicker from '../../../components/accommodation/DateRangePicker';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import EmptyState from '../../../components/layout/EmptyState';
import { Download, Users, CheckCircle, Clock } from 'lucide-react';
import { useToast } from '../../../components/ui/Toast';

// Mock data
const mockCheckins = [
  { id: 1, name: 'Ahmed Khan', room: '101', bed: 'A', time: '10:00 AM', reservationId: '#12345', status: 'pending' },
  { id: 2, name: 'Sara Ali', room: '102', bed: 'B', time: '11:30 AM', reservationId: '#12346', status: 'pending' },
  { id: 3, name: 'Omar Abdullah', room: '103', bed: 'A', time: '02:00 PM', reservationId: '#12347', status: 'completed' },
];

const mockCheckouts = [
  { id: 1, name: 'Fatima Hassan', room: '201', bed: 'A', time: '09:00 AM', checkoutDate: '2025-12-30', status: 'pending' },
  { id: 2, name: 'Ali Ahmed', room: '202', bed: 'B', time: '10:00 AM', checkoutDate: '2025-12-30', status: 'pending' },
];

const CheckinsCheckouts = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('checkin');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('2025-12-30');
  const [checkinModalOpen, setCheckinModalOpen] = useState(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);

  const currentData = activeTab === 'checkin' ? mockCheckins : mockCheckouts;

  const filteredData = useMemo(() => {
    return currentData.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.room.includes(searchQuery) ||
      (item.reservationId && item.reservationId.includes(searchQuery))
    );
  }, [currentData, searchQuery]);

  const pendingCount = filteredData.filter(item => item.status === 'pending').length;

  const handleCheckin = (guest) => {
    setSelectedGuest(guest);
    setCheckinModalOpen(true);
  };

  const handleCheckout = (guest) => {
    setSelectedGuest(guest);
    setCheckoutModalOpen(true);
  };

  const confirmCheckin = () => {
    showToast(`${selectedGuest.name} checked in successfully`, 'success');
    setCheckinModalOpen(false);
    setSelectedGuest(null);
  };

  const confirmCheckout = () => {
    showToast(`${selectedGuest.name} checked out successfully`, 'success');
    setCheckoutModalOpen(false);
    setSelectedGuest(null);
  };

  const toggleSelect = (id) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkAction = () => {
    showToast(`${selectedItems.length} guests processed`, 'success');
    setSelectedItems([]);
  };

  const GuestCard = ({ guest, onAction }) => (
    <div className="bg-white border rounded-lg p-4">
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={selectedItems.includes(guest.id)}
          onChange={() => toggleSelect(guest.id)}
          className="w-4 h-4 mt-1 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">{guest.name}</h3>
              <p className="text-sm text-gray-600">Room {guest.room}, Bed {guest.bed}</p>
              {guest.reservationId && (
                <p className="text-xs text-gray-500 mt-1">Reservation: {guest.reservationId}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {guest.time}
              </p>
              {guest.status === 'completed' && (
                <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                  <CheckCircle className="w-3 h-3" />
                  Done
                </span>
              )}
            </div>
          </div>
          {guest.status === 'pending' && (
            <Button
              variant="primary"
              size="sm"
              className="mt-3"
              onClick={() => onAction(guest)}
            >
              {activeTab === 'checkin' ? 'Check In' : 'Check Out'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );

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
        <Tabs value={activeTab} onChange={setActiveTab} className="flex-1">
          <Tabs.Tab
            value="checkin"
            label="Check-in"
            count={mockCheckins.filter(c => c.status === 'pending').length}
            active={activeTab === 'checkin'}
            onClick={setActiveTab}
          />
          <Tabs.Tab
            value="checkout"
            label="Check-out"
            count={mockCheckouts.filter(c => c.status === 'pending').length}
            active={activeTab === 'checkout'}
            onClick={setActiveTab}
          />
        </Tabs>

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

      {/* Content */}
      <div className="space-y-3">
        {filteredData.length === 0 ? (
          <EmptyState
            icon={<Users className="w-8 h-8" />}
            title={`No ${activeTab === 'checkin' ? 'check-ins' : 'check-outs'} scheduled`}
            description="There are no guests scheduled for today"
          />
        ) : (
          filteredData.map(guest => (
            <GuestCard
              key={guest.id}
              guest={guest}
              onAction={activeTab === 'checkin' ? handleCheckin : handleCheckout}
            />
          ))
        )}
      </div>

      {/* Check-in Modal */}
      <Modal
        isOpen={checkinModalOpen}
        onClose={() => setCheckinModalOpen(false)}
        title="Confirm Check-in"
        size="sm"
      >
        <Modal.Content>
          {selectedGuest && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Guest Name</p>
                <p className="font-semibold">{selectedGuest.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Room Assignment</p>
                <p className="font-semibold">Room {selectedGuest.room}, Bed {selectedGuest.bed}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Reservation ID</p>
                <p className="font-semibold">{selectedGuest.reservationId}</p>
              </div>
            </div>
          )}
        </Modal.Content>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setCheckinModalOpen(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={confirmCheckin}>
            Confirm Check-in
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Check-out Modal with Damage Checklist */}
      <Modal
        isOpen={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        title="Confirm Check-out"
        size="md"
      >
        <Modal.Content>
          {selectedGuest && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Guest Name</p>
                <p className="font-semibold">{selectedGuest.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Room</p>
                <p className="font-semibold">Room {selectedGuest.room}, Bed {selectedGuest.bed}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-2">Damage Checklist</p>
                <div className="space-y-2">
                  {['Bedding', 'Furniture', 'AC/Heater', 'Bathroom', 'Windows'].map(item => (
                    <label key={item} className="flex items-center gap-2">
                      <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" />
                      <span className="text-sm">{item} - OK</span>
                    </label>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" defaultChecked />
                <span className="text-sm">Keys collected</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" defaultChecked />
                <span className="text-sm">Request cleaning</span>
              </label>
            </div>
          )}
        </Modal.Content>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setCheckoutModalOpen(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={confirmCheckout}>
            Confirm Check-out
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default CheckinsCheckouts;
