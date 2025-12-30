import { useState, useMemo } from 'react';
import PageHeader from '../../../components/layout/PageHeader';
import SearchInput from '../../../components/accommodation/SearchInput';
import FilterBar from '../../../components/accommodation/FilterBar';
import Table from '../../../components/ui/Table';
import Button from '../../../components/ui/Button';
import Drawer from '../../../components/ui/Drawer';
import { Plus, AlertCircle, Download } from 'lucide-react';
import { useToast } from '../../../components/ui/Toast';

const mockTickets = [
  { id: 1, room: '101', category: 'Plumbing', description: 'Water leak', severity: 'urgent', assignee: null, status: 'new', createdAt: '2h ago' },
  { id: 2, room: '203', category: 'Electrical', description: 'AC broken', severity: 'high', assignee: 'Ahmed', status: 'assigned', createdAt: '5h ago' },
  { id: 3, room: '305', category: 'Carpentry', description: 'Door handle loose', severity: 'normal', assignee: 'Sara', status: 'fixed', createdAt: '1d ago' },
];

const Maintenance = () => {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filteredTickets = useMemo(() => {
    return mockTickets.filter(t => {
      const matchesSearch = t.room.includes(searchQuery) || t.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchQuery, statusFilter]);

  const SeverityBadge = ({ severity }) => {
    const config = {
      urgent: 'bg-red-100 text-red-700',
      high: 'bg-orange-100 text-orange-700',
      normal: 'bg-blue-100 text-blue-700',
      low: 'bg-gray-100 text-gray-700'
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${config[severity]}`}>
        {severity === 'urgent' && <AlertCircle className="w-3 h-3 inline mr-1" />}
        {severity.charAt(0).toUpperCase() + severity.slice(1)}
      </span>
    );
  };

  const openTicketDrawer = (ticket) => {
    setSelectedTicket(ticket);
    setDrawerOpen(true);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Maintenance"
        subtitle={`${filteredTickets.filter(t => t.status === 'new' || t.status === 'assigned').length} open tickets`}
        actions={
          <>
            <Button variant="secondary" icon={<Download className="w-5 h-5" />}>Export</Button>
            <Button variant="primary" icon={<Plus className="w-5 h-5" />}>New Ticket</Button>
          </>
        }
      />

      <div className="space-y-3">
        <SearchInput
          placeholder="Search tickets..."
          value={searchQuery}
          onChange={setSearchQuery}
          onClear={() => setSearchQuery('')}
        />

        <FilterBar>
          <FilterBar.Chips
            options={['All', 'New', 'Assigned', 'In Progress', 'Fixed']}
            active={statusFilter}
            onChange={setStatusFilter}
          />
        </FilterBar>
      </div>

      {/* Desktop: Table */}
      <div className="hidden md:block">
        <Table>
          <Table.Header>
            <Table.Column>Severity</Table.Column>
            <Table.Column>Room</Table.Column>
            <Table.Column>Category</Table.Column>
            <Table.Column>Description</Table.Column>
            <Table.Column>Assignee</Table.Column>
            <Table.Column>Status</Table.Column>
          </Table.Header>
          <Table.Body>
            {filteredTickets.map(ticket => (
              <Table.Row key={ticket.id} onClick={() => openTicketDrawer(ticket)}>
                <Table.Cell><SeverityBadge severity={ticket.severity} /></Table.Cell>
                <Table.Cell className="font-semibold">{ticket.room}</Table.Cell>
                <Table.Cell>{ticket.category}</Table.Cell>
                <Table.Cell>{ticket.description}</Table.Cell>
                <Table.Cell>{ticket.assignee || 'Unassigned'}</Table.Cell>
                <Table.Cell>
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs capitalize">
                    {ticket.status}
                  </span>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </div>

      {/* Mobile: Cards */}
      <div className="md:hidden space-y-3">
        {filteredTickets.map(ticket => (
          <div key={ticket.id} className="bg-white border rounded-lg p-4" onClick={() => openTicketDrawer(ticket)}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold">Room {ticket.room}</h3>
                <p className="text-sm text-gray-600">{ticket.category}</p>
              </div>
              <SeverityBadge severity={ticket.severity} />
            </div>
            <p className="text-sm text-gray-700 mb-2">{ticket.description}</p>
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>{ticket.assignee || 'Unassigned'}</span>
              <span className="capitalize">{ticket.status}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Ticket Detail Drawer */}
      <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} title={`Ticket #${selectedTicket?.id}`}>
        {selectedTicket && (
          <>
            <Drawer.Content>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Room</p>
                  <p className="font-semibold">{selectedTicket.room}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Category</p>
                  <p className="font-semibold">{selectedTicket.category}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Severity</p>
                  <SeverityBadge severity={selectedTicket.severity} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Description</p>
                  <p>{selectedTicket.description}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="capitalize">{selectedTicket.status}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Created</p>
                  <p>{selectedTicket.createdAt}</p>
                </div>
              </div>
            </Drawer.Content>
            <Drawer.Footer>
              <Button variant="secondary" full>Assign</Button>
              <Button variant="primary" full onClick={() => { showToast('Status updated', 'success'); setDrawerOpen(false); }}>Update Status</Button>
            </Drawer.Footer>
          </>
        )}
      </Drawer>
    </div>
  );
};

export default Maintenance;
