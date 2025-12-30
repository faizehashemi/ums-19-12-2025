import { User, BrushCleaning, Wrench, Ban } from 'lucide-react';

const QuickActions = ({ children }) => {
  return <div className="flex gap-2">{children}</div>;
};

const QuickActionButton = ({ icon, label, onClick, variant = 'default' }) => {
  const icons = {
    user: User,
    broom: BrushCleaning,
    wrench: Wrench,
    ban: Ban,
  };

  const Icon = typeof icon === 'string' ? icons[icon] : null;

  const variants = {
    default: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    primary: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
    success: 'bg-green-100 text-green-700 hover:bg-green-200',
    danger: 'bg-red-100 text-red-700 hover:bg-red-200',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${variants[variant]}`}
      aria-label={label}
      title={label}
    >
      {Icon ? <Icon className="w-4 h-4" /> : icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
};

QuickActions.Button = QuickActionButton;

export default QuickActions;
