import { useState, useMemo } from 'react';
import PageHeader from '../../../components/layout/PageHeader';
import FilterBar from '../../../components/accommodation/FilterBar';
import StatusPill from '../../../components/accommodation/StatusPill';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import { Plus, Users, Clock } from 'lucide-react';
import { useToast } from '../../../components/ui/Toast';

const mockTasks = [
  { id: 1, room: '101', type: 'Deep Clean', assignedTo: 'Fatima', dueTime: '2:00 PM', status: 'open', priority: 'normal' },
  { id: 2, room: '102', type: 'Standard', assignedTo: null, dueTime: '3:00 PM', status: 'open', priority: 'urgent' },
  { id: 3, room: '103', type: 'Standard', assignedTo: 'Aisha', dueTime: '1:00 PM', status: 'in_progress', priority: 'normal' },
  { id: 4, room: '104', type: 'Linen Change', assignedTo: 'Fatima', dueTime: '4:00 PM', status: 'assigned', priority: 'normal' },
  { id: 5, room: '105', type: 'Standard', assignedTo: 'Aisha', dueTime: '11:00 AM', status: 'done', priority: 'normal' },
];

const Housekeeping = () => {
  const { showToast } = useToast();
  const [statusFilter, setStatusFilter] = useState('all');
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const filteredTasks = useMemo(() => {
    if (statusFilter === 'all') return mockTasks;
    return mockTasks.filter(t => t.status === statusFilter);
  }, [statusFilter]);

  const tasksByStatus = useMemo(() => {
    return {
      open: mockTasks.filter(t => t.status === 'open'),
      assigned: mockTasks.filter(t => t.status === 'assigned'),
      in_progress: mockTasks.filter(t => t.status === 'in_progress'),
      done: mockTasks.filter(t => t.status === 'done')
    };
  }, []);

  const TaskCard = ({ task }) => (
    <div className={`bg-white border rounded-lg p-3 ${task.priority === 'urgent' ? 'border-red-500' : ''}`}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-semibold text-sm">Room {task.room}</h3>
          <p className="text-xs text-gray-600">{task.type}</p>
        </div>
        {task.priority === 'urgent' && (
          <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full">Urgent</span>
        )}
      </div>
      <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
        <Clock className="w-3 h-3" />
        {task.dueTime}
      </div>
      {task.assignedTo && (
        <div className="text-xs text-gray-700 mb-2">
          <Users className="w-3 h-3 inline mr-1" />
          {task.assignedTo}
        </div>
      )}
      <StatusPill status={task.status} size="sm" />
    </div>
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="Housekeeping"
        subtitle={`${tasksByStatus.open.length} open tasks`}
        actions={
          <Button variant="primary" icon={<Plus className="w-5 h-5" />} onClick={() => setCreateModalOpen(true)}>
            New Task
          </Button>
        }
      />

      <FilterBar>
        <FilterBar.Chips
          options={['All', 'Open', 'Assigned', 'In Progress', 'Done']}
          active={statusFilter}
          onChange={setStatusFilter}
        />
      </FilterBar>

      {/* Desktop: Kanban */}
      <div className="hidden md:grid md:grid-cols-4 gap-4">
        {['open', 'assigned', 'in_progress', 'done'].map(status => (
          <div key={status} className="bg-gray-50 rounded-lg p-3">
            <h3 className="font-semibold text-sm mb-3 capitalize">
              {status.replace('_', ' ')} ({tasksByStatus[status].length})
            </h3>
            <div className="space-y-2">
              {tasksByStatus[status].map(task => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Mobile: List */}
      <div className="md:hidden space-y-3">
        {filteredTasks.map(task => (
          <div key={task.id} className="bg-white border rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold">Room {task.room}</h3>
                <p className="text-sm text-gray-600">{task.type}</p>
              </div>
              <StatusPill status={task.status} />
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {task.dueTime}
              </span>
              {task.assignedTo && (
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {task.assignedTo}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create Task Modal */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Create Task">
        <Modal.Content>
          <div className="space-y-4">
            <Input label="Room Number" placeholder="101" required />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Task Type</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>Standard</option>
                <option>Deep Clean</option>
                <option>Linen Change</option>
              </select>
            </div>
            <Input label="Due Time" type="time" required />
          </div>
        </Modal.Content>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setCreateModalOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={() => { setCreateModalOpen(false); showToast('Task created', 'success'); }}>Create</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Housekeeping;
