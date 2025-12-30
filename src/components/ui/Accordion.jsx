import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

const Accordion = ({ children, className = '' }) => {
  return <div className={`space-y-2 ${className}`}>{children}</div>;
};

const AccordionItem = ({ title, children, defaultOpen = false, badge }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          {isOpen ? (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-500" />
          )}
          <span className="font-medium text-gray-900">{title}</span>
          {badge && (
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
              {badge}
            </span>
          )}
        </div>
      </button>

      {isOpen && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
          {children}
        </div>
      )}
    </div>
  );
};

Accordion.Item = AccordionItem;

export default Accordion;
