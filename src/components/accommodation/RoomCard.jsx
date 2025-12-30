import { Users, Bed, Clock } from 'lucide-react';
import StatusPill from './StatusPill';

const RoomCard = ({ room, onClick, actions, selectable = false, selected = false, onSelect }) => {
  const handleCardClick = (e) => {
    if (selectable && e.target.type !== 'button') {
      onSelect?.();
    } else if (onClick) {
      onClick();
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={`bg-white border rounded-lg p-4 transition-all cursor-pointer ${
        selected ? 'ring-2 ring-blue-500 border-blue-500' : 'hover:shadow-md'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {selectable && (
            <input
              type="checkbox"
              checked={selected}
              onChange={onSelect}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              onClick={(e) => e.stopPropagation()}
            />
          )}
          <div>
            <h3 className="font-semibold text-lg text-gray-900">{room.number}</h3>
            <p className="text-sm text-gray-600">{room.building}, Floor {room.floor}</p>
          </div>
        </div>
        <StatusPill status={room.status} />
      </div>

      <div className="space-y-2 text-sm text-gray-700">
        <div className="flex items-center gap-2">
          <Bed className="w-4 h-4 text-gray-400" />
          <span>{room.occupiedBeds || 0}/{room.totalBeds} beds occupied</span>
        </div>

        {room.lastCleaned && (
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span>Cleaned: {room.lastCleaned}</span>
          </div>
        )}

        {room.occupants && room.occupants.length > 0 && (
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400" />
            <span>{room.occupants.length} guest{room.occupants.length > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {actions && (
        <div className="mt-4 flex gap-2" onClick={(e) => e.stopPropagation()}>
          {actions}
        </div>
      )}
    </div>
  );
};

export default RoomCard;
