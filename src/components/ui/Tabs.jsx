const Tabs = ({ value, onChange, children, className = '' }) => {
  return (
    <div className={`border-b border-gray-200 ${className}`}>
      <nav className="flex gap-1 overflow-x-auto" aria-label="Tabs">
        {children}
      </nav>
    </div>
  );
};

const Tab = ({ value, label, count, active, onClick }) => {
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        active
          ? 'border-blue-600 text-blue-600'
          : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
      }`}
      aria-current={active ? 'page' : undefined}
    >
      {label}
      {count !== undefined && (
        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
          active ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
        }`}>
          {count}
        </span>
      )}
    </button>
  );
};

Tabs.Tab = Tab;

export default Tabs;
