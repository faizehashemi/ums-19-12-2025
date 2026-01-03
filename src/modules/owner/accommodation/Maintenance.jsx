import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../../../components/layout/PageHeader';
import SearchInput from '../../../components/accommodation/SearchInput';
import FilterBar from '../../../components/accommodation/FilterBar';
import Table from '../../../components/ui/Table';
import Button from '../../../components/ui/Button';
import Drawer from '../../../components/ui/Drawer';
import { Plus, AlertCircle, Download } from 'lucide-react';
import { useToast } from '../../../components/ui/Toast';
import EmptyState from '../../../components/layout/EmptyState';
import { supabase } from '../../../lib/supabase';
import Modal from '../../../components/ui/Modal';

const STATUS_FLOW = ['new', 'assigned', 'in_progress', 'fixed', 'closed'];
const TICKET_TABLE = 'maintenance_tickets';

const mapPriorityToSeverity = (priority) => {
  if (!priority) return null;
  const map = {
    low: 'low',
    medium: 'normal',
    high: 'high',
    urgent: 'urgent'
  };
  return map[String(priority).toLowerCase()] || null;
};

const mapSeverityToPriority = (severity) => {
  const map = {
    urgent: 'urgent',
    high: 'high',
    normal: 'medium',
    low: 'low'
  };
  return map[severity] || 'medium';
};

const Maintenance = () => {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState([]);
  const [newTicketOpen, setNewTicketOpen] = useState(false);
  const [newTicket, setNewTicket] = useState({
    roomId: '',
    category: '',
    severity: 'normal',
    description: '',
    assignee: ''
  });

  useEffect(() => {
    fetchTickets();
    fetchRooms();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from(TICKET_TABLE)
        .select(`
          id,
          room_id,
          title,
          description,
          priority,
          severity,
          status,
          assignee,
          created_at,
          updated_at,
          rooms (
            room_number,
            floor,
            buildings ( name )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const normalized = (data || []).map((ticket) => ({
        id: ticket.id,
        room: ticket.rooms?.room_number || 'N/A',
        building: ticket.rooms?.buildings?.name || 'Unassigned',
        floor: ticket.rooms?.floor,
        category: ticket.title || 'General',
        description: ticket.description || '',
        severity: (ticket.severity || mapPriorityToSeverity(ticket.priority) || 'normal').toLowerCase(),
        assignee: ticket.assignee,
        status: (ticket.status || 'new').toLowerCase(),
        createdAt: ticket.created_at
          ? new Date(ticket.created_at).toLocaleString()
          : '-'
      }));

      setTickets(normalized);
    } catch (err) {
      console.error('Error fetching maintenance tickets:', err);
      showToast('Failed to load maintenance tickets', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select(`id, room_number, floor, buildings ( name )`)
        .order('building_id', { ascending: true })
        .order('floor', { ascending: true })
        .order('room_number', { ascending: true });

      if (error) throw error;

      const roomOptions = (data || []).map((room) => ({
        id: room.id,
        label: `Room ${room.room_number} - ${room.buildings?.name || 'Unassigned'} - Floor ${room.floor}`
      }));
      setRooms(roomOptions);
    } catch (err) {
      console.error('Error loading rooms:', err);
      showToast('Failed to load rooms list', 'error');
    }
  };

  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const matchesSearch = t.room.includes(searchQuery) || t.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchQuery, statusFilter, tickets]);

  const openTicketsCount = useMemo(() => {
    return tickets.filter(t => ['new', 'assigned', 'in_progress', 'open'].includes(t.status)).length;
  }, [tickets]);

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

  const handleAssign = async () => {
    if (!selectedTicket) return;
    const assignee = window.prompt('Assign to (leave blank to unassign):', selectedTicket.assignee || '');
    if (assignee === null) return;
    try {
      const { error } = await supabase
        .from(TICKET_TABLE)
        .update({ assignee: assignee || null, status: assignee ? 'assigned' : 'new' })
        .eq('id', selectedTicket.id);

      if (error) throw error;
      showToast('Assignment saved', 'success');
      setDrawerOpen(false);
      fetchTickets();
    } catch (err) {
      console.error('Error assigning ticket:', err);
      showToast('Failed to assign ticket', 'error');
    }
  };

  const handleAdvanceStatus = async () => {
    if (!selectedTicket) return;
    const current = selectedTicket.status || 'new';
    const normalized = current === 'open' ? 'new' : current === 'resolved' ? 'fixed' : current;
    const idx = STATUS_FLOW.indexOf(normalized);
    if (idx === -1 || idx === STATUS_FLOW.length - 1) {
      showToast('Ticket already closed', 'info');
      return;
    }
    const nextStatus = STATUS_FLOW[idx + 1];
    try {
      const { error } = await supabase
        .from(TICKET_TABLE)
        .update({ status: nextStatus })
        .eq('id', selectedTicket.id);

      if (error) throw error;
      showToast(`Status updated to ${nextStatus.replace('_', ' ')}`, 'success');
      setDrawerOpen(false);
      fetchTickets();
    } catch (err) {
      console.error('Error updating status:', err);
      showToast('Failed to update status', 'error');
    }
  };

  const validateNewTicket = () => {
    const errors = [];
    if (!newTicket.roomId) errors.push('Room is required');
    if (!newTicket.category.trim()) errors.push('Category is required');
    if (!newTicket.description.trim()) errors.push('Description is required');
    return errors;
  };

  const handleCreateTicket = async () => {
    const errors = validateNewTicket();
    if (errors.length) {
      showToast(errors.join(', '), 'error');
      return;
    }
    try {
      const payload = {
        room_id: newTicket.roomId,
        title: newTicket.category.trim(),
        description: newTicket.description.trim(),
        severity: newTicket.severity,
        priority: mapSeverityToPriority(newTicket.severity),
        status: 'new',
        assignee: newTicket.assignee.trim() || null
      };
      const { error } = await supabase.from(TICKET_TABLE).insert([payload]);
      if (error) throw error;
      showToast('Ticket created', 'success');
      setNewTicket({
        roomId: '',
        category: '',
        severity: 'normal',
        description: '',
        assignee: ''
      });
      setNewTicketOpen(false);
      fetchTickets();
    } catch (err) {
      console.error('Error creating ticket:', err);
      showToast('Failed to create ticket', 'error');
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Maintenance"
        subtitle={`${openTicketsCount} open tickets`}
        actions={
          <>
            <Button variant="secondary" icon={<Download className="w-5 h-5" />}>Export</Button>
            <Button variant="primary" icon={<Plus className="w-5 h-5" />} onClick={() => setNewTicketOpen(true)}>New Ticket</Button>
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
            options={['All', 'New', 'Assigned', 'In Progress', 'Fixed', 'Closed', 'Open', 'Resolved']}
            active={statusFilter}
            onChange={setStatusFilter}
          />
        </FilterBar>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredTickets.length === 0 ? (
        <EmptyState
          icon={<AlertCircle className="w-8 h-8" />}
          title="No tickets found"
          description="No maintenance tickets match your filters"
        />
      ) : (
        <>
          <div className="hidden md:block">
            <Table>
              <Table.Header>
                <Table.Column>Severity</Table.Column>
                <Table.Column>Room</Table.Column>
                <Table.Column>Building</Table.Column>
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
                    <Table.Cell>{ticket.building}</Table.Cell>
                    <Table.Cell>{ticket.category}</Table.Cell>
                    <Table.Cell>{ticket.description}</Table.Cell>
                    <Table.Cell>{ticket.assignee || 'Unassigned'}</Table.Cell>
                    <Table.Cell>
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs capitalize">
                        {ticket.status.replace('_', ' ')}
                      </span>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </div>

          <div className="md:hidden space-y-3">
            {filteredTickets.map(ticket => (
              <div key={ticket.id} className="bg-white border rounded-lg p-4" onClick={() => openTicketDrawer(ticket)}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold">Room {ticket.room}</h3>
                    <p className="text-sm text-gray-600">{ticket.category}</p>
                    <p className="text-xs text-gray-500">{ticket.building}</p>
                  </div>
                  <SeverityBadge severity={ticket.severity} />
                </div>
                <p className="text-sm text-gray-700 mb-2">{ticket.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>{ticket.assignee || 'Unassigned'}</span>
                  <span className="capitalize">{ticket.status.replace('_', ' ')}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

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
                  <p className="capitalize">{selectedTicket.status.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Assignee</p>
                  <p>{selectedTicket.assignee || 'Unassigned'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Created</p>
                  <p>{selectedTicket.createdAt}</p>
                </div>
              </div>
            </Drawer.Content>
            <Drawer.Footer>
              <Button variant="secondary" full onClick={handleAssign}>Assign</Button>
              <Button variant="primary" full onClick={handleAdvanceStatus}>Update Status</Button>
            </Drawer.Footer>
          </>
        )}
      </Drawer>

      <Modal
        isOpen={newTicketOpen}
        onClose={() => setNewTicketOpen(false)}
        title="Create Maintenance Ticket"
        size="md"
      >
        <Modal.Content>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Room *</label>
              <select
                value={newTicket.roomId}
                onChange={(e) => setNewTicket({ ...newTicket, roomId: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Select a room</option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>{room.label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Category *</label>
                <input
                  type="text"
                  value={newTicket.category}
                  onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="Plumbing, Electrical..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Severity</label>
                <select
                  value={newTicket.severity}
                  onChange={(e) => setNewTicket({ ...newTicket, severity: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="normal">Normal</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description *</label>
              <textarea
                value={newTicket.description}
                onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                rows={3}
                placeholder="Describe the issue"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Assignee</label>
              <input
                type="text"
                value={newTicket.assignee}
                onChange={(e) => setNewTicket({ ...newTicket, assignee: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="Optional"
              />
            </div>
          </div>
        </Modal.Content>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setNewTicketOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleCreateTicket}>Create Ticket</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Maintenance;
