import { useState } from 'react';
import {
  MapPin,
  Bus,
  Calendar,
  LogIn,
  Utensils,
  BookOpen,
  LogOut
} from 'lucide-react';

const Dashboard = () => {
  const [selectedCard, setSelectedCard] = useState(null);

  // Dummy stats data
  const stats = {
    inMakkah: {
      title: 'In Makkah',
      count: 450,
      icon: MapPin,
      color: 'bg-purple-500',
      details: [
        { name: 'Ahmed Khan', room: '201', checkIn: '2025-12-28' },
        { name: 'Fatima Ali', room: '305', checkIn: '2025-12-29' },
        { name: 'Hassan Ibrahim', room: '102', checkIn: '2025-12-30' },
        { name: 'Aisha Mohammed', room: '407', checkIn: '2025-12-27' },
        { name: 'Omar Yusuf', room: '156', checkIn: '2025-12-31' }
      ]
    },
    inMadina: {
      title: 'In Madina',
      count: 320,
      icon: MapPin,
      color: 'bg-green-500',
      details: [
        { name: 'Zainab Hassan', room: '88', checkIn: '2025-12-29' },
        { name: 'Ibrahim Malik', room: '124', checkIn: '2025-12-28' },
        { name: 'Mariam Ahmed', room: '201', checkIn: '2025-12-30' },
        { name: 'Khalid Rahman', room: '315', checkIn: '2025-12-27' }
      ]
    },
    toMakka: {
      title: 'To Makka',
      count: 85,
      icon: Bus,
      color: 'bg-blue-500',
      details: [
        { name: 'Yusuf Ali', departure: '10:00 AM', bus: 'A-12' },
        { name: 'Sara Khan', departure: '10:00 AM', bus: 'A-12' },
        { name: 'Abdullah Omar', departure: '02:00 PM', bus: 'B-08' },
        { name: 'Khadija Noor', departure: '02:00 PM', bus: 'B-08' }
      ]
    },
    toMadina: {
      title: 'To Madina',
      count: 92,
      icon: Bus,
      color: 'bg-indigo-500',
      details: [
        { name: 'Hassan Tariq', departure: '11:30 AM', bus: 'C-05' },
        { name: 'Layla Jamil', departure: '11:30 AM', bus: 'C-05' },
        { name: 'Bilal Rashid', departure: '03:00 PM', bus: 'D-11' },
        { name: 'Amina Farooq', departure: '03:00 PM', bus: 'D-11' }
      ]
    },
    atraaf: {
      title: 'Total Atraaf',
      count: 12,
      subCount: '360 Pax',
      icon: Bus,
      color: 'bg-orange-500',
      details: [
        { busNo: 'A-12', pax: 45, route: 'Makkah - Madina', driver: 'Ahmed Ali' },
        { busNo: 'B-08', pax: 38, route: 'Madina - Makkah', driver: 'Hassan Khan' },
        { busNo: 'C-05', pax: 42, route: 'Airport - Makkah', driver: 'Ibrahim Yusuf' },
        { busNo: 'D-11', pax: 40, route: 'Makkah - Arafat', driver: 'Omar Rashid' },
        { busNo: 'E-03', pax: 35, route: 'Madina - Airport', driver: 'Khalid Malik' }
      ]
    },
    wadaSabaq: {
      title: 'Wada Sabaq',
      count: 28,
      icon: BookOpen,
      color: 'bg-pink-500',
      details: [
        { name: 'Ahmed Hassan', time: '09:00 AM', location: 'Makkah Center' },
        { name: 'Fatima Noor', time: '09:00 AM', location: 'Makkah Center' },
        { name: 'Ibrahim Tariq', time: '11:00 AM', location: 'Madina Hall' },
        { name: 'Zainab Ali', time: '11:00 AM', location: 'Madina Hall' }
      ]
    },
    regularSabaq: {
      title: 'Regular Sabaq',
      count: 156,
      icon: BookOpen,
      color: 'bg-teal-500',
      details: [
        { name: 'Hassan Malik', time: '08:00 AM', location: 'Hall A' },
        { name: 'Aisha Rahman', time: '08:00 AM', location: 'Hall A' },
        { name: 'Omar Jamil', time: '10:00 AM', location: 'Hall B' },
        { name: 'Mariam Yusuf', time: '10:00 AM', location: 'Hall B' },
        { name: 'Khalid Ibrahim', time: '02:00 PM', location: 'Hall C' }
      ]
    },
    airportCheckins: {
      title: 'Checkins from Airport',
      count: 45,
      icon: LogIn,
      color: 'bg-red-500',
      details: [
        { name: 'Ali Ahmed', flight: 'SV123', time: '08:30 AM', room: '201' },
        { name: 'Sara Khan', flight: 'SV123', time: '08:30 AM', room: '202' },
        { name: 'Yusuf Hassan', flight: 'EK456', time: '11:00 AM', room: '305' },
        { name: 'Layla Omar', flight: 'QR789', time: '02:15 PM', room: '108' }
      ]
    },
    madinaCheckins: {
      title: 'Checkins from Madina',
      count: 38,
      icon: LogIn,
      color: 'bg-cyan-500',
      details: [
        { name: 'Ibrahim Malik', bus: 'C-05', time: '10:00 AM', room: '401' },
        { name: 'Khadija Noor', bus: 'C-05', time: '10:00 AM', room: '402' },
        { name: 'Bilal Tariq', bus: 'D-11', time: '01:30 PM', room: '215' },
        { name: 'Amina Rashid', bus: 'D-11', time: '01:30 PM', room: '216' }
      ]
    },
    thalCounts: {
      title: 'Thal Counts',
      count: 'B: 680 | L: 720 | D: 695',
      icon: Utensils,
      color: 'bg-yellow-500',
      details: [
        { meal: 'Breakfast', count: 680, time: '07:00 AM - 09:00 AM' },
        { meal: 'Lunch', count: 720, time: '01:00 PM - 03:00 PM' },
        { meal: 'Dinner', count: 695, time: '08:00 PM - 10:00 PM' }
      ]
    },
    darees: {
      title: 'Darees Today',
      count: 5,
      icon: Calendar,
      color: 'bg-violet-500',
      details: [
        { name: 'Ahmed Hassan', topic: 'Fiqh Discussion', time: '09:00 AM', attendees: 35 },
        { name: 'Fatima Ibrahim', topic: 'Quran Tafseer', time: '11:00 AM', attendees: 42 },
        { name: 'Omar Yusuf', topic: 'Hadith Studies', time: '02:00 PM', attendees: 28 },
        { name: 'Zainab Malik', topic: 'Islamic History', time: '04:00 PM', attendees: 38 },
        { name: 'Hassan Ali', topic: 'Akhlaq Session', time: '07:00 PM', attendees: 45 }
      ]
    },
    pendingCheckouts: {
      title: 'Pending Checkouts',
      count: 24,
      icon: LogOut,
      color: 'bg-rose-500',
      details: [
        { name: 'Khalid Rahman', room: '305', departure: '11:00 AM', bus: 'A-12' },
        { name: 'Mariam Ahmed', room: '201', departure: '11:00 AM', bus: 'A-12' },
        { name: 'Abdullah Tariq', room: '108', departure: '02:00 PM', flight: 'SV789' },
        { name: 'Aisha Jamil', room: '407', departure: '02:00 PM', flight: 'SV789' },
        { name: 'Ibrahim Noor', room: '156', departure: '04:00 PM', bus: 'B-08' }
      ]
    }
  };

  const StatCard = ({ stat, onClick }) => {
    const Icon = stat.icon;
    return (
      <div
        onClick={() => onClick(stat)}
        className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-xl transition-shadow duration-300 border-l-4"
        style={{ borderLeftColor: stat.color.replace('bg-', '#') }}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-gray-500 text-sm font-medium mb-1">{stat.title}</p>
            <p className="text-3xl font-bold text-gray-800">
              {typeof stat.count === 'number' ? stat.count : stat.count}
            </p>
            {stat.subCount && (
              <p className="text-sm text-gray-600 mt-1">{stat.subCount}</p>
            )}
          </div>
          <div className={`${stat.color} p-4 rounded-full`}>
            <Icon className="w-8 h-8 text-white" />
          </div>
        </div>
      </div>
    );
  };

  const Modal = ({ stat, onClose }) => {
    if (!stat) return null;

    const renderDetails = () => {
      const firstDetail = stat.details[0];

      if ('room' in firstDetail && 'checkIn' in firstDetail) {
        return (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Room</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Check-in</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {stat.details.map((detail, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{detail.name}</td>
                  <td className="px-4 py-3 text-sm">{detail.room}</td>
                  <td className="px-4 py-3 text-sm">{detail.checkIn}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      }

      if ('departure' in firstDetail && 'bus' in firstDetail) {
        return (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Departure</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Bus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {stat.details.map((detail, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{detail.name}</td>
                  <td className="px-4 py-3 text-sm">{detail.departure}</td>
                  <td className="px-4 py-3 text-sm">{detail.bus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      }

      if ('busNo' in firstDetail) {
        return (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Bus No</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Pax</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Route</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Driver</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {stat.details.map((detail, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-semibold">{detail.busNo}</td>
                  <td className="px-4 py-3 text-sm">{detail.pax}</td>
                  <td className="px-4 py-3 text-sm">{detail.route}</td>
                  <td className="px-4 py-3 text-sm">{detail.driver}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      }

      if ('location' in firstDetail && 'time' in firstDetail) {
        return (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Time</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {stat.details.map((detail, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{detail.name}</td>
                  <td className="px-4 py-3 text-sm">{detail.time}</td>
                  <td className="px-4 py-3 text-sm">{detail.location}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      }

      if ('flight' in firstDetail) {
        return (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Flight</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Time</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Room</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {stat.details.map((detail, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{detail.name}</td>
                  <td className="px-4 py-3 text-sm">{detail.flight}</td>
                  <td className="px-4 py-3 text-sm">{detail.time}</td>
                  <td className="px-4 py-3 text-sm">{detail.room}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      }

      if ('meal' in firstDetail) {
        return (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Meal</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Count</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {stat.details.map((detail, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-semibold">{detail.meal}</td>
                  <td className="px-4 py-3 text-sm text-lg font-bold text-purple-600">{detail.count}</td>
                  <td className="px-4 py-3 text-sm">{detail.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      }

      if ('topic' in firstDetail) {
        return (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Presenter</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Topic</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Time</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Attendees</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {stat.details.map((detail, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{detail.name}</td>
                  <td className="px-4 py-3 text-sm">{detail.topic}</td>
                  <td className="px-4 py-3 text-sm">{detail.time}</td>
                  <td className="px-4 py-3 text-sm">{detail.attendees}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      }

      if ('room' in firstDetail && ('bus' in firstDetail || 'flight' in firstDetail)) {
        return (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Room</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Departure</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Transport</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {stat.details.map((detail, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{detail.name}</td>
                  <td className="px-4 py-3 text-sm">{detail.room}</td>
                  <td className="px-4 py-3 text-sm">{detail.departure}</td>
                  <td className="px-4 py-3 text-sm">{detail.bus || detail.flight}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      }

      return null;
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          <div className={`${stat.color} p-6 text-white`}>
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">{stat.title}</h2>
              <button
                onClick={onClose}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-3xl font-bold mt-2">
              {typeof stat.count === 'number' ? `${stat.count} People` : stat.count}
            </p>
          </div>
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-160px)]">
            {renderDetails()}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard</h1>
        <p className="text-gray-600">Today's Overview - {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <StatCard stat={stats.inMakkah} onClick={setSelectedCard} />
        <StatCard stat={stats.inMadina} onClick={setSelectedCard} />
        <StatCard stat={stats.toMakka} onClick={setSelectedCard} />
        <StatCard stat={stats.toMadina} onClick={setSelectedCard} />
        <StatCard stat={stats.atraaf} onClick={setSelectedCard} />
        <StatCard stat={stats.wadaSabaq} onClick={setSelectedCard} />
        <StatCard stat={stats.regularSabaq} onClick={setSelectedCard} />
        <StatCard stat={stats.airportCheckins} onClick={setSelectedCard} />
        <StatCard stat={stats.madinaCheckins} onClick={setSelectedCard} />
        <StatCard stat={stats.thalCounts} onClick={setSelectedCard} />
        <StatCard stat={stats.darees} onClick={setSelectedCard} />
        <StatCard stat={stats.pendingCheckouts} onClick={setSelectedCard} />
      </div>

      {selectedCard && (
        <Modal stat={selectedCard} onClose={() => setSelectedCard(null)} />
      )}
    </div>
  );
};

export default Dashboard;
