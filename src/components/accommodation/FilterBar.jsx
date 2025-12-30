import { Filter, X } from 'lucide-react';
import Button from '../ui/Button';

const FilterBar = ({ children, onClearAll, hasActiveFilters = false, className = '' }) => {
  return (
    <div className={`flex items-center gap-2 overflow-x-auto pb-2 ${className}`}>
      {children}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          icon={<X className="w-4 h-4" />}
        >
          Clear
        </Button>
      )}
    </div>
  );
};

const FilterDropdown = ({ label, value, options, onChange }) => {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
      aria-label={label}
    >
      <option value="all">{label}: All</option>
      {options.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

const FilterChips = ({ options, active, onChange }) => {
  return (
    <div className="flex gap-2">
      {options.map(option => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option.toLowerCase())}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
            active === option.toLowerCase()
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
};

FilterBar.Dropdown = FilterDropdown;
FilterBar.Chips = FilterChips;

export default FilterBar;
