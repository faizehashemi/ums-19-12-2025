import { ChevronDown, ChevronUp } from 'lucide-react';

const Table = ({ children, className = '' }) => {
  return (
    <div className="overflow-x-auto">
      <table className={`w-full ${className}`}>
        {children}
      </table>
    </div>
  );
};

const TableHeader = ({ children }) => (
  <thead className="bg-gray-50 border-b border-gray-200">
    <tr>{children}</tr>
  </thead>
);

const TableColumn = ({ children, sortable = false, sorted, onSort, className = '' }) => (
  <th
    className={`px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider ${
      sortable ? 'cursor-pointer hover:bg-gray-100' : ''
    } ${className}`}
    onClick={sortable ? onSort : undefined}
  >
    <div className="flex items-center gap-2">
      {children}
      {sortable && (
        <span className="text-gray-400">
          {sorted === 'asc' ? <ChevronUp className="w-4 h-4" /> :
           sorted === 'desc' ? <ChevronDown className="w-4 h-4" /> :
           <ChevronDown className="w-4 h-4 opacity-30" />}
        </span>
      )}
    </div>
  </th>
);

const TableBody = ({ children }) => (
  <tbody className="bg-white divide-y divide-gray-200">
    {children}
  </tbody>
);

const TableRow = ({ children, onClick, selected = false, className = '' }) => (
  <tr
    className={`${onClick ? 'cursor-pointer hover:bg-gray-50' : ''} ${
      selected ? 'bg-blue-50' : ''
    } ${className}`}
    onClick={onClick}
  >
    {children}
  </tr>
);

const TableCell = ({ children, className = '' }) => (
  <td className={`px-4 py-3 text-sm text-gray-900 ${className}`}>
    {children}
  </td>
);

Table.Header = TableHeader;
Table.Column = TableColumn;
Table.Body = TableBody;
Table.Row = TableRow;
Table.Cell = TableCell;

export default Table;
