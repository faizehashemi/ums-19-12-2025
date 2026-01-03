import { useEffect, useState } from 'react';
import PageHeader from '../../../components/layout/PageHeader';
import StatCard from '../../../components/accommodation/StatCard';
import ProgressBar from '../../../components/accommodation/ProgressBar';
import DateRangePicker from '../../../components/accommodation/DateRangePicker';
import Button from '../../../components/ui/Button';
import Accordion from '../../../components/ui/Accordion';
import { Download, Bed, Users, TrendingUp, TrendingDown } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useToast } from '../../../components/ui/Toast';

const VacancyForecast = () => {
  const { showToast } = useToast();
  const [dateRange, setDateRange] = useState({
    startDate: '2025-12-30',
    endDate: '2026-01-06'
  });
  const [stats, setStats] = useState({
    totalBeds: 0,
    occupied: 0,
    available: 0,
    occupancyRate: 0,
    expectedOut: 0,
    expectedIn: 0
  });
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    fetchVacancyData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  const parseDate = (value) => {
    if (!value) return null;
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  };

  const fetchVacancyData = async () => {
    setLoading(true);
    try {
      const rangeStart = parseDate(dateRange.startDate);
      const rangeEnd = parseDate(dateRange.endDate);

      const [{ data: roomsData, error: roomsError }, { data: reservationsData, error: reservationsError }] =
        await Promise.all([
          supabase
            .from('rooms')
            .select(`
              id,
              room_number,
              bed_capacity,
              status,
              building_id,
              buildings ( id, name )
            `)
            .order('building_id', { ascending: true })
            .order('floor', { ascending: true })
            .order('room_number', { ascending: true }),
          supabase
            .from('reservations')
            .select('id, status, members, travel_details')
            .in('status', ['approved', 'confirmed'])
        ]);

      if (roomsError) throw roomsError;
      if (reservationsError) throw reservationsError;

      const roomMeta = new Map();
      const buildingMap = new Map();
      let totalBeds = 0;

      (roomsData || []).forEach((room) => {
        totalBeds += room.bed_capacity || 0;
        roomMeta.set(room.room_number, {
          buildingId: room.building_id,
          bedCapacity: room.bed_capacity || 0
        });

        const buildingId = room.building_id || 'unassigned';
        const existing = buildingMap.get(buildingId) || {
          id: buildingId,
          name: room.buildings?.name || 'Unassigned',
          totalBeds: 0,
          occupied: 0
        };
        existing.totalBeds += room.bed_capacity || 0;
        buildingMap.set(buildingId, existing);
      });

      const occupiedBedsByRoom = new Map();
      let expectedIn = 0;
      let expectedOut = 0;

      (reservationsData || []).forEach((reservation) => {
        const members = reservation.members || [];
        const travelDetails = reservation.travel_details || {};
        const arrival = parseDate(travelDetails.arrivalDateTime);
        const departure = parseDate(travelDetails.departureDateTime);

        members.forEach((member) => {
          const arrivalInRange = arrival && rangeStart && rangeEnd && arrival >= rangeStart && arrival <= rangeEnd;
          const departureInRange = departure && rangeStart && rangeEnd && departure >= rangeStart && departure <= rangeEnd;
          if (arrivalInRange) expectedIn += 1;
          if (departureInRange) expectedOut += 1;

          const overlapsRange =
            !arrival || !departure || (!rangeStart || !rangeEnd)
              ? true
              : arrival <= rangeEnd && departure >= rangeStart;

          if (
            member.room &&
            member.bed &&
            member.checkin_status === 'completed' &&
            member.checkout_status !== 'completed' &&
            overlapsRange
          ) {
            const currentCount = occupiedBedsByRoom.get(member.room) || 0;
            occupiedBedsByRoom.set(member.room, currentCount + 1);
          }
        });
      });

      let occupiedBeds = 0;
      occupiedBedsByRoom.forEach((count, roomNumber) => {
        const meta = roomMeta.get(roomNumber);
        const roomOccupied = meta ? Math.min(count, meta.bedCapacity) : count;
        occupiedBeds += roomOccupied;
        if (meta && buildingMap.has(meta.buildingId)) {
          const building = buildingMap.get(meta.buildingId);
          building.occupied += roomOccupied;
          buildingMap.set(meta.buildingId, building);
        }
      });

      const availableBeds = Math.max(totalBeds - occupiedBeds, 0);
      const occupancyRate = totalBeds ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

      const buildingList = Array.from(buildingMap.values()).map((building) => ({
        ...building,
        available: Math.max(building.totalBeds - building.occupied, 0),
        occupancyRate: building.totalBeds ? Math.round((building.occupied / building.totalBeds) * 100) : 0
      }));

      setStats({
        totalBeds,
        occupied: occupiedBeds,
        available: availableBeds,
        occupancyRate,
        expectedOut,
        expectedIn
      });
      setBuildings(buildingList);
      setLastUpdated(new Date().toISOString());
    } catch (error) {
      console.error('Error loading vacancy forecast:', error);
      showToast('Failed to load vacancy data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format) => {
    alert(`Exporting as ${format}...`);
  };

  const lastUpdatedLabel = lastUpdated
    ? new Date(lastUpdated).toLocaleString()
    : '—';

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
        <p className="text-sm text-gray-600">
          {loading ? 'Loading...' : `Last updated: ${lastUpdatedLabel}`}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          label="Total Beds"
          value={stats.totalBeds}
          icon={<Bed />}
          color="gray"
        />
        <StatCard
          label="Occupied"
          value={stats.occupied}
          percentage={stats.occupancyRate}
          icon={<Users />}
          color="purple"
        />
        <StatCard
          label="Available"
          value={stats.available}
          percentage={100 - stats.occupancyRate}
          icon={<Bed />}
          color="green"
        />
        <StatCard
          label="Expected Out"
          value={stats.expectedOut}
          icon={<TrendingDown />}
          color="blue"
        />
        <StatCard
          label="Expected In"
          value={stats.expectedIn}
          icon={<TrendingUp />}
          color="blue"
        />
        <StatCard
          label="Occupancy Rate"
          value={`${stats.occupancyRate}%`}
          color="purple"
        />
      </div>

      {/* Building Breakdown */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Building Breakdown</h2>

        {loading ? (
          <div className="text-sm text-gray-600">Loading occupancy data...</div>
        ) : buildings.length === 0 ? (
          <div className="text-sm text-gray-600">No building data available.</div>
        ) : (
          <>
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
                  {buildings.map(building => (
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
                    <td className="px-4 py-3">{stats.totalBeds}</td>
                    <td className="px-4 py-3">{stats.occupied}</td>
                    <td className="px-4 py-3">{stats.available}</td>
                    <td className="px-4 py-3">{stats.occupancyRate}%</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Mobile: Accordion */}
            <div className="md:hidden">
              <Accordion>
                {buildings.map(building => (
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
          </>
        )}
      </div>
    </div>
  );
};

export default VacancyForecast;
