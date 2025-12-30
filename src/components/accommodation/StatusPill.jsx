const StatusPill = ({ status, size = 'sm', showIcon = true }) => {
  const config = {
    available: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      dot: 'bg-green-600',
      label: 'Available'
    },
    occupied: {
      bg: 'bg-purple-100',
      text: 'text-purple-800',
      dot: 'bg-purple-600',
      label: 'Occupied'
    },
    cleaning: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      dot: 'bg-yellow-600',
      label: 'Needs Cleaning'
    },
    maintenance: {
      bg: 'bg-red-100',
      text: 'text-red-800',
      dot: 'bg-red-600',
      label: 'Maintenance'
    },
    blocked: {
      bg: 'bg-gray-100',
      text: 'text-gray-800',
      dot: 'bg-gray-600',
      label: 'Blocked'
    },
    // Task statuses
    open: {
      bg: 'bg-blue-100',
      text: 'text-blue-800',
      dot: 'bg-blue-600',
      label: 'Open'
    },
    in_progress: {
      bg: 'bg-orange-100',
      text: 'text-orange-800',
      dot: 'bg-orange-600',
      label: 'In Progress'
    },
    done: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      dot: 'bg-green-600',
      label: 'Done'
    },
    assigned: {
      bg: 'bg-indigo-100',
      text: 'text-indigo-800',
      dot: 'bg-indigo-600',
      label: 'Assigned'
    }
  };

  const statusConfig = config[status] || config.available;
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-1' : 'text-sm px-3 py-1.5';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${statusConfig.bg} ${statusConfig.text} ${sizeClass}`}>
      {showIcon && (
        <span className={`w-2 h-2 rounded-full ${statusConfig.dot}`} />
      )}
      {statusConfig.label}
    </span>
  );
};

export default StatusPill;
