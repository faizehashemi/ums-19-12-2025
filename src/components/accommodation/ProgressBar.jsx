const ProgressBar = ({ value, max = 100, label, showPercentage = true, color = 'blue' }) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const colors = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    yellow: 'bg-yellow-600',
    red: 'bg-red-600',
    purple: 'bg-purple-600',
  };

  return (
    <div className="space-y-1">
      {(label || showPercentage) && (
        <div className="flex items-center justify-between text-xs text-gray-600">
          {label && <span>{label}</span>}
          {showPercentage && <span>{percentage.toFixed(0)}%</span>}
        </div>
      )}
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${colors[color]} transition-all duration-300`}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin="0"
          aria-valuemax="100"
        />
      </div>
    </div>
  );
};

export default ProgressBar;
