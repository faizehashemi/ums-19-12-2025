const StatCard = ({ label, value, percentage, color = 'blue', icon, trend }) => {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    red: 'bg-red-100 text-red-600',
    purple: 'bg-purple-100 text-purple-600',
    gray: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-1">{label}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {percentage !== undefined && (
              <span className="text-sm text-gray-600">({percentage}%)</span>
            )}
          </div>
          {trend && (
            <p className={`text-xs mt-1 ${trend.direction === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              {trend.direction === 'up' ? '↑' : '↓'} {trend.value}
            </p>
          )}
        </div>

        {icon && (
          <div className={`p-3 rounded-lg ${colors[color]}`}>
            <div className="w-6 h-6">{icon}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
