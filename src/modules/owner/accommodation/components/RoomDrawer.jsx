import { useState } from 'react';
import Drawer from '../../../../components/ui/Drawer';
import Button from '../../../../components/ui/Button';
import StatusPill from '../../../../components/accommodation/StatusPill';
import { Users, Calendar, Clock, AlertCircle } from 'lucide-react';

const RoomDrawer = ({ isOpen, onClose, room, onAction }) => {
  if (!room) return null;

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title={`Room ${room.number}`}>
      <Drawer.Content>
        <div className="space-y-6">
          {/* Room Status */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Status</h3>
              <StatusPill status={room.status} />
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <p>Building: {room.building}</p>
              <p>Floor: {room.floor}</p>
              <p>Total Beds: {room.totalBeds}</p>
              <p>Occupied: {room.occupiedBeds || 0}</p>
            </div>
          </div>

          {/* Occupants */}
          {room.occupants && room.occupants.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Occupants ({room.occupants.length})
              </h3>
              <div className="space-y-2">
                {room.occupants.map((occupant, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium text-sm">{occupant.name}</p>
                    <p className="text-xs text-gray-600">Bed {occupant.bed}</p>
                    {occupant.checkIn && (
                      <p className="text-xs text-gray-500 mt-1">
                        Check-in: {new Date(occupant.checkIn).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Housekeeping */}
          {room.lastCleaned && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Housekeeping
              </h3>
              <div className="p-3 bg-gray-50 rounded-lg text-sm">
                <p className="text-gray-600">Last cleaned: {room.lastCleaned}</p>
                {room.cleaningNotes && (
                  <p className="text-gray-500 mt-1">{room.cleaningNotes}</p>
                )}
              </div>
            </div>
          )}

          {/* Maintenance Issues */}
          {room.maintenanceIssues && room.maintenanceIssues.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                Active Issues ({room.maintenanceIssues.length})
              </h3>
              <div className="space-y-2">
                {room.maintenanceIssues.map((issue, idx) => (
                  <div key={idx} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="font-medium text-sm text-red-900">{issue.title}</p>
                    <p className="text-xs text-red-700 mt-1">{issue.severity} • {issue.status}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Drawer.Content>

      <Drawer.Footer>
        <Button
          variant="secondary"
          full
          onClick={() => onAction?.('assign')}
        >
          Assign Guest
        </Button>
        <Button
          variant="primary"
          full
          onClick={() => onAction?.('clean')}
        >
          Mark as Cleaned
        </Button>
        {room.status !== 'maintenance' && (
          <Button
            variant="ghost"
            full
            onClick={() => onAction?.('maintenance')}
          >
            Report Issue
          </Button>
        )}
      </Drawer.Footer>
    </Drawer>
  );
};

export default RoomDrawer;
