import { useState } from 'react';
import PageHeader from '../../../components/layout/PageHeader';
import StatCard from '../../../components/accommodation/StatCard';
import ProgressBar from '../../../components/accommodation/ProgressBar';
import DateRangePicker from '../../../components/accommodation/DateRangePicker';
import Button from '../../../components/ui/Button';
import Accordion from '../../../components/ui/Accordion';
import { Download, Bed, Users, TrendingUp, TrendingDown } from 'lucide-react';

const mockStats = {
  totalBeds: 240,
  occupied: 180,
  available: 60,
  occupancyRate: 75,
  expectedOut: 12,
  expectedIn: 8
};

const mockBuildings = [
  { id: 1, name: 'Building A', totalBeds: 100, occupied: 80, available: 20, occupancyRate: 80 },
  { id: 2, name: 'Building B', totalBeds: 80, occupied: 60, available: 20, occupancyRate: 75 },
  { id: 3, name: 'Building C', totalBeds: 60, occupied: 40, available: 20, occupancyRate: 67 }
];

const VacancyForecast = () => {
  const [dateRange, setDateRange] = useState({
    startDate: '2025-12-30',
    endDate: '2026-01-06'
  });

  const handleExport = (format) => {
    alert(`Exporting as ${format}...`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vacancy Forecast"
        subtitle="Plan capacity and track occupancy trends"
        actions={
          <div className="relative group">
            <Button variant="secondary" icon={<Download className="w-5 h-5" />}>
              Export
            </Button>
            <div className="hidden group-hover:block absolute right-0 mt-1 bg-white border rounded-lg shadow-lg py-2 min-w-[150px] z-10">
              <button onClick={() => handleExport('PDF')} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100">
                Export PDF
              </button>
              <button onClick={() => handleExport('CSV')} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100">
                Export CSV
              </button>
              <button onClick={() => handleExport('Excel')} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100">
                Export Excel
              </button>
            </div>
          </div>
        }
      />

      <div className="flex items-center justify-between">
        <DateRangePicker
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
          onChange={setDateRange}
        />
        <p className="text-sm text-gray-600">Last updated: 2 min ago</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          label="Total Beds"
          value={mockStats.totalBeds}
          icon={<Bed />}
          color="gray"
        />
        <StatCard
          label="Occupied"
          value={mockStats.occupied}
          percentage={mockStats.occupancyRate}
          icon={<Users />}
          color="purple"
        />
        <StatCard
          label="Available"
          value={mockStats.available}
          percentage={100 - mockStats.occupancyRate}
          icon={<Bed />}
          color="green"
        />
        <StatCard
          label="Expected Out"
          value={mockStats.expectedOut}
          icon={<TrendingDown />}
          color="blue"
        />
        <StatCard
          label="Expected In"
          value={mockStats.expectedIn}
          icon={<TrendingUp />}
          color="blue"
        />
        <StatCard
          label="Occupancy Rate"
          value={`${mockStats.occupancyRate}%`}
          color="purple"
        />
      </div>

      {/* Building Breakdown */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Building Breakdown</h2>

        {/* Desktop: Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Building</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Total Beds</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Occupied</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Available</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Occupancy</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {mockBuildings.map(building => (
                <tr key={building.id}>
                  <td className="px-4 py-3 font-medium">{building.name}</td>
                  <td className="px-4 py-3">{building.totalBeds}</td>
                  <td className="px-4 py-3">{building.occupied}</td>
                  <td className="px-4 py-3">{building.available}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <ProgressBar value={building.occupancyRate} showPercentage={false} color="purple" />
                      </div>
                      <span className="text-sm font-medium">{building.occupancyRate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-semibold">
                <td className="px-4 py-3">Total</td>
                <td className="px-4 py-3">{mockStats.totalBeds}</td>
                <td className="px-4 py-3">{mockStats.occupied}</td>
                <td className="px-4 py-3">{mockStats.available}</td>
                <td className="px-4 py-3">{mockStats.occupancyRate}%</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Mobile: Accordion */}
        <div className="md:hidden">
          <Accordion>
            {mockBuildings.map(building => (
              <Accordion.Item key={building.id} title={building.name} badge={`${building.occupancyRate}%`}>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Beds</span>
                    <span className="font-semibold">{building.totalBeds}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Occupied</span>
                    <span className="font-semibold">{building.occupied}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Available</span>
                    <span className="font-semibold">{building.available}</span>
                  </div>
                  <ProgressBar
                    value={building.occupancyRate}
                    label={`${building.occupancyRate}% Occupied`}
                    color="purple"
                  />
                </div>
              </Accordion.Item>
            ))}
          </Accordion>
        </div>
      </div>
    </div>
  );
};

export default VacancyForecast;
