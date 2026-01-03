import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import {
  MapPin,
  Bus,
  LogIn,
  Utensils,
  BookOpen,
  LogOut,
  Clock,
} from 'lucide-react';

const Dashboard = () => {
  const [selectedCard, setSelectedCard] = useState(null);
  const [makkahData, setMakkahData] = useState({ count: 0, details: [] });
  const [madinaData, setMadinaData] = useState({ count: 0, details: [] });
  const [toMakkahData, setToMakkahData] = useState({ count: 0, details: [] });
  const [toMadinaData, setToMadinaData] = useState({ count: 0, details: [] });
  const [airportCheckinsData, setAirportCheckinsData] = useState({ count: 0, details: [] });
  const [madinaCheckinsData, setMadinaCheckinsData] = useState({ count: 0, details: [] });
  const [pendingCheckoutsData, setPendingCheckoutsData] = useState({ count: 0, details: [] });
  const [thalCountsData, setThalCountsData] = useState({ count: 'B: 0 | L: 0 | D: 0', details: [] });
  const [wadaSabaqData, setWadaSabaqData] = useState({ count: 0, details: [] });
  const [regularSabaqData, setRegularSabaqData] = useState({ count: 0, details: [] });
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('User');



  const ClockCard = () => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
      const timerId = setInterval(() => setTime(new Date()), 1000);
      return () => clearInterval(timerId);
    }, []);

    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 flex items-center space-x-4">
        <Clock className="w-12 h-12 text-[#DAA520]" />
        <div>
          <p className="text-gray-600 text-sm font-semibold">Current Time</p>
          <p className="text-3xl font-bold text-gray-900">
            {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
        </div>
      </div>
    );
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User';
          setUserName(name);
        }

        const { data, error } = await supabase
          .from('reservations')
          .select('id, members, travel_details, status')
          .in('status', ['approved', 'confirmed']);

        if (error) throw error;

        let makkahCount = 0;
        let makkahDetails = [];
        let madinaCount = 0;
        let madinaDetails = [];
        let toMakkahCount = 0;
        let toMakkahDetails = [];
        let toMadinaCount = 0;
        let toMadinaDetails = [];
        let airportCheckinsCount = 0;
        let airportCheckinsDetails = [];
        let madinaCheckinsCount = 0;
        let madinaCheckinsDetails = [];
        let pendingCheckoutsCount = 0;
        let pendingCheckoutsDetails = [];
        let thalData = { breakfast: 0, lunch: 0, dinner: 0 };
        let wadaSabaqCount = 0;
        let wadaSabaqDetails = [];
        let regularSabaqCount = 0;
        let regularSabaqDetails = [];

        const checkDate = (d) => {
          if (!d) return null;
          const date = new Date(d);
          date.setHours(0, 0, 0, 0);
          return date;
        };

        const current = checkDate(new Date());
        const tomorrow = new Date(current);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Define meal windows for Today
        const bStart = new Date(current); bStart.setHours(5, 0, 0, 0);
        const bEnd = new Date(current); bEnd.setHours(9, 0, 0, 0);
        const lStart = new Date(current); lStart.setHours(12, 0, 0, 0);
        const lEnd = new Date(current); lEnd.setHours(16, 0, 0, 0);
        const dStart = new Date(current); dStart.setHours(19, 30, 0, 0);
        const dEnd = new Date(current); dEnd.setHours(23, 59, 59, 999);

        data.forEach((reservation) => {
          const travel = reservation.travel_details || {};
          const members = reservation.members || [];
          
          if (!Array.isArray(members) || members.length === 0) return;

          let isInMakkah = false;
          let makkahCheckInDate = null;
          let isInMadina = false;
          let madinaCheckInDate = null;

          const arrival = travel.arrivalDateTime ? new Date(travel.arrivalDateTime) : null;
          const departure = travel.departureDateTime ? new Date(travel.departureDateTime) : null;
          const firstArrival = travel.firstArrivalAt?.toUpperCase();

          const arrivalDate = checkDate(arrival);
          const departureDate = checkDate(departure);

          if (firstArrival === 'MAKKAH' && arrivalDate) {
             const madinaTravelDate = checkDate(travel.travelMadinaDate);
             
             if (madinaTravelDate) {
                 // First stay: Arrival -> Madina Travel
                 if (current >= arrivalDate && current < madinaTravelDate) {
                     isInMakkah = true;
                     makkahCheckInDate = travel.arrivalDateTime;
                 } else {
                     // Second stay: Return from Madina -> Departure
                     const makkahReturnDate = checkDate(travel.makkahMadinaDate);
                     if (makkahReturnDate && departureDate) {
                         if (current >= makkahReturnDate && current <= departureDate) {
                             isInMakkah = true;
                             makkahCheckInDate = travel.makkahMadinaDate;
                         }
                     }
                     
                     // Madina Stay: Travel to Madina -> Return to Makkah
                     if (makkahReturnDate && current >= madinaTravelDate && current < makkahReturnDate) {
                         isInMadina = true;
                         madinaCheckInDate = travel.travelMadinaDate;
                     }
                 }
             } else {
                 // Only Makkah stay
                 if (departureDate && current >= arrivalDate && current <= departureDate) {
                     isInMakkah = true;
                     makkahCheckInDate = travel.arrivalDateTime;
                 }
             }
          } else if (firstArrival === 'MADINA') {
              // Madina -> Makkah -> Departure
              const makkahArrivalDate = checkDate(travel.makkahMadinaDate);
              
              // Madina Stay: Arrival -> Travel to Makkah
              if (arrivalDate && makkahArrivalDate) {
                  if (current >= arrivalDate && current < makkahArrivalDate) {
                      isInMadina = true;
                      madinaCheckInDate = travel.arrivalDateTime;
                  }
              }
              
              if (makkahArrivalDate && departureDate) {
                  if (current >= makkahArrivalDate && current <= departureDate) {
                      isInMakkah = true;
                      makkahCheckInDate = travel.makkahMadinaDate;
                  }
              }
          }

          if (isInMakkah) {
              makkahCount += members.length;
              members.forEach(member => {
                  makkahDetails.push({
                      name: member.name || 'Unknown',
                      room: member.room || 'Unassigned',
                      checkIn: makkahCheckInDate ? new Date(makkahCheckInDate).toLocaleDateString() : 'N/A'
                  });
              });
          }
          
          if (isInMadina) {
              madinaCount += members.length;
              members.forEach(member => {
                  madinaDetails.push({
                      name: member.name || 'Unknown',
                      room: member.room || 'Unassigned',
                      checkIn: madinaCheckInDate ? new Date(madinaCheckInDate).toLocaleDateString() : 'N/A'
                  });
              });
          }

          // Logic for "To Makkah"
          const makkahArrivalFromMadinaDate = checkDate(travel.makkahMadinaDate);

          let isTravellingToMakkahToday = false;
          let travelInfo = { time: 'N/A', transport: 'N/A' };

          // Case 1: Arriving from Madina to Makkah today
          if (makkahArrivalFromMadinaDate && makkahArrivalFromMadinaDate.getTime() === current.getTime()) {
              isTravellingToMakkahToday = true;
              travelInfo = {
                  time: 'Today', // No specific time available in travel_details
                  transport: travel.roadMode || 'By Road'
              };
          } 
          // Case 2: Arriving from Airport to Makkah today
          else if (travel.firstArrivalAt?.toUpperCase() === 'MAKKAH' && arrivalDate && arrivalDate.getTime() === current.getTime()) {
              isTravellingToMakkahToday = true;
              travelInfo = {
                  time: new Date(travel.arrivalDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  transport: `Flight ${travel.flightNo || 'N/A'}`
              };
          }

          if (isTravellingToMakkahToday) {
              toMakkahCount += members.length;
              members.forEach(member => {
                  toMakkahDetails.push({
                      name: member.name || 'Unknown',
                      departure: travelInfo.time,
                      bus: travelInfo.transport
                  });
              });
          }

          // Logic for "To Madina"
          const travelMadinaDate = checkDate(travel.travelMadinaDate);

          let isTravellingToMadinaToday = false;
          let madinaTravelInfo = { time: 'N/A', transport: 'N/A' };

          // Case 1: Travel to Madina today (usually from Makkah)
          if (travelMadinaDate && travelMadinaDate.getTime() === current.getTime()) {
              isTravellingToMadinaToday = true;
              madinaTravelInfo = {
                  time: 'Today',
                  transport: travel.roadMode || 'By Road'
              };
          } 
          // Case 2: Arriving from Airport to Madina today
          else if (travel.firstArrivalAt?.toUpperCase() === 'MADINA' && arrivalDate && arrivalDate.getTime() === current.getTime()) {
              isTravellingToMadinaToday = true;
              madinaTravelInfo = {
                  time: new Date(travel.arrivalDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  transport: `Flight ${travel.flightNo || 'N/A'}`
              };
          }

          if (isTravellingToMadinaToday) {
              toMadinaCount += members.length;
              members.forEach(member => {
                  toMadinaDetails.push({
                      name: member.name || 'Unknown',
                      departure: madinaTravelInfo.time,
                      bus: madinaTravelInfo.transport
                  });
              });
          }

          // Logic for "Checkins from Airport"
          if (arrivalDate && arrivalDate.getTime() === current.getTime()) {
              // Check if it's an airport arrival (has flight info or marked as By Air)
              const isFlight = travel.flightNo || travel.arrivalAirport || (travel.travelMode && travel.travelMode.toLowerCase() === 'by air');
              
              if (isFlight) {
                  airportCheckinsCount += members.length;
                  members.forEach(member => {
                      airportCheckinsDetails.push({
                          name: member.name || 'Unknown',
                          flight: travel.flightNo || 'N/A',
                          time: travel.arrivalDateTime ? new Date(travel.arrivalDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A',
                          room: member.room || 'Unassigned'
                      });
                  });
              }
          }

          // Logic for "Checkins from Madina"
          const checkinFromMadinaDate = checkDate(travel.makkahMadinaDate);
          
          if (checkinFromMadinaDate && checkinFromMadinaDate.getTime() === current.getTime()) {
              madinaCheckinsCount += members.length;
              members.forEach(member => {
                  madinaCheckinsDetails.push({
                      name: member.name || 'Unknown',
                      room: member.room || 'Unassigned',
                      checkIn: 'Today'
                  });
              });
          }

          // Logic for "Pending Checkouts"
          // Checks for: 
          // 1. Travel to Madina today (Checkout from Makkah)
          // 2. Travel to Makkah from Madina today (Checkout from Madina)
          // 3. Final Departure today (Checkout from current city)
          
          let isCheckingOutToday = false;
          let checkoutInfo = { time: 'N/A', transport: 'N/A', type: 'bus' };

          if (travelMadinaDate && travelMadinaDate.getTime() === current.getTime()) {
              isCheckingOutToday = true;
              checkoutInfo = {
                  time: 'Today',
                  transport: travel.roadMode || 'Bus',
                  type: 'bus'
              };
          } else if (makkahArrivalFromMadinaDate && makkahArrivalFromMadinaDate.getTime() === current.getTime()) {
              isCheckingOutToday = true;
              checkoutInfo = {
                  time: 'Today',
                  transport: travel.roadMode || 'Bus',
                  type: 'bus'
              };
          } else if (departureDate && departureDate.getTime() === current.getTime()) {
              isCheckingOutToday = true;
              checkoutInfo = {
                  time: travel.departureDateTime ? new Date(travel.departureDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A',
                  transport: `Flight ${travel.departureFlightNo || 'N/A'}`,
                  type: 'flight'
              };
          }

          if (isCheckingOutToday) {
              pendingCheckoutsCount += members.length;
              members.forEach(member => {
                  pendingCheckoutsDetails.push({
                      name: member.name || 'Unknown',
                      room: member.room || 'Unassigned',
                      departure: checkoutInfo.time,
                      [checkoutInfo.type]: checkoutInfo.transport
                  });
              });
          }

          // Logic for "Thal Counts"
          const arrivalTime = travel.arrivalDateTime ? new Date(travel.arrivalDateTime) : null;
          const departureTime = travel.departureDateTime ? new Date(travel.departureDateTime) : null;

          if (arrivalTime && departureTime) {
              const pax = members.length;
              
              // Check if guest is present during meal windows (Arrival < WindowEnd AND Departure > WindowStart)
              if (arrivalTime < bEnd && departureTime > bStart) thalData.breakfast += pax;
              if (arrivalTime < lEnd && departureTime > lStart) thalData.lunch += pax;
              if (arrivalTime < dEnd && departureTime > dStart) thalData.dinner += pax;
          }

          // Logic for "Wada Sabaq" (For travel tomorrow)
          // 1. Makkah to Madina tomorrow
          // 2. Departure from Makkah to Airport tomorrow (if first arrival was Madina)
          
          let isWadaSabaq = false;
          let wadaTime = 'N/A';

          if (travelMadinaDate && travelMadinaDate.getTime() === tomorrow.getTime()) {
              isWadaSabaq = true;
              wadaTime = 'Tomorrow';
          } else if (departureDate && departureDate.getTime() === tomorrow.getTime() && firstArrival === 'MADINA') {
              isWadaSabaq = true;
              wadaTime = travel.departureDateTime ? new Date(travel.departureDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Tomorrow';
          }

          if (isWadaSabaq) {
              wadaSabaqCount += members.length;
              members.forEach(member => {
                  wadaSabaqDetails.push({
                      name: member.name || 'Unknown',
                      time: wadaTime,
                      location: 'Makkah'
                  });
              });
          }

          // Logic for "Regular Sabaq"
          // People one day after their arrival in Makkah.
          // Excludes Wada Sabaq (day before travel) and Departure Day.
          
          let isRegularSabaq = false;

          if (!isWadaSabaq) {
              if (firstArrival === 'MAKKAH' && arrivalDate) {
                 const madinaTravelDate = checkDate(travel.travelMadinaDate);
                 
                 if (madinaTravelDate) {
                     // First stay: Arrival -> Madina Travel
                     const sabaqStartDate = new Date(arrivalDate);
                     sabaqStartDate.setDate(sabaqStartDate.getDate() + 1);

                     if (current >= sabaqStartDate && current < madinaTravelDate) {
                         isRegularSabaq = true;
                     } else {
                         // Second stay: Return from Madina -> Departure
                         const makkahReturnDate = checkDate(travel.makkahMadinaDate);
                         if (makkahReturnDate && departureDate) {
                             const sabaqReturnStartDate = new Date(makkahReturnDate);
                             sabaqReturnStartDate.setDate(sabaqReturnStartDate.getDate() + 1);

                             if (current >= sabaqReturnStartDate && current < departureDate) {
                                 isRegularSabaq = true;
                             }
                         }
                     }
                 } else {
                     // Only Makkah stay
                     const sabaqStartDate = new Date(arrivalDate);
                     sabaqStartDate.setDate(sabaqStartDate.getDate() + 1);
                     
                     if (departureDate && current >= sabaqStartDate && current < departureDate) {
                         isRegularSabaq = true;
                     }
                 }
              } else if (firstArrival === 'MADINA') {
                  // Madina -> Makkah -> Departure
                  const makkahArrivalDate = checkDate(travel.makkahMadinaDate);
                  
                  if (makkahArrivalDate && departureDate) {
                      const sabaqStartDate = new Date(makkahArrivalDate);
                      sabaqStartDate.setDate(sabaqStartDate.getDate() + 1);

                      if (current >= sabaqStartDate && current < departureDate) {
                          isRegularSabaq = true;
                      }
                  }
              }
          }

          if (isRegularSabaq) {
              regularSabaqCount += members.length;
              members.forEach(member => {
                  regularSabaqDetails.push({
                      name: member.name || 'Unknown',
                      time: '09:00 AM',
                      location: 'Makkah Center'
                  });
              });
          }
        });

        setMakkahData({ count: makkahCount, details: makkahDetails });
        setMadinaData({ count: madinaCount, details: madinaDetails });
        setToMakkahData({ count: toMakkahCount, details: toMakkahDetails });
        setToMadinaData({ count: toMadinaCount, details: toMadinaDetails });
        setAirportCheckinsData({ count: airportCheckinsCount, details: airportCheckinsDetails });
        setMadinaCheckinsData({ count: madinaCheckinsCount, details: madinaCheckinsDetails });
        setPendingCheckoutsData({ count: pendingCheckoutsCount, details: pendingCheckoutsDetails });
        setWadaSabaqData({ count: wadaSabaqCount, details: wadaSabaqDetails });
        setRegularSabaqData({ count: regularSabaqCount, details: regularSabaqDetails });

        const bThals = Math.ceil(thalData.breakfast / 8);
        const lThals = Math.ceil(thalData.lunch / 8);
        const dThals = Math.ceil(thalData.dinner / 8);

        setThalCountsData({
            count: `B: ${bThals} | L: ${lThals} | D: ${dThals}`,
            details: [
                { meal: 'Breakfast', count: `${bThals} (${thalData.breakfast} Pax)`, time: '05:00 AM - 09:00 AM' },
                { meal: 'Lunch', count: `${lThals} (${thalData.lunch} Pax)`, time: '12:00 PM - 04:00 PM' },
                { meal: 'Dinner', count: `${dThals} (${thalData.dinner} Pax)`, time: '07:30 PM - 12:00 AM' }
            ]
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Dummy stats data
  const stats = {
    inMakkah: {
      title: 'In Makkah',
      count: loading ? '...' : makkahData.count,
      icon: MapPin,
      color: 'bg-[#DAA520]',
      details: loading ? [] : makkahData.details
    },
    inMadina: {
      title: 'In Madina',
      count: loading ? '...' : madinaData.count,
      icon: MapPin,
      color: 'bg-[#DAA520]',
      details: loading ? [] : madinaData.details
    },
    toMakka: {
      title: 'To Makka',
      count: loading ? '...' : toMakkahData.count,
      icon: Bus,
      color: 'bg-[#DAA520]',
      details: loading ? [] : toMakkahData.details
    },
    toMadina: {
      title: 'To Madina',
      count: loading ? '...' : toMadinaData.count,
      icon: Bus,
      color: 'bg-[#DAA520]',
      details: loading ? [] : toMadinaData.details
    },
    atraaf: {
      title: 'Total Atraaf',
      count: 12,
      subCount: '360 Pax',
      icon: Bus,
      color: 'bg-[#DAA520]',
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
      count: loading ? '...' : wadaSabaqData.count,
      icon: BookOpen,
      color: 'bg-[#DAA520]',
      details: loading ? [] : wadaSabaqData.details
    },
    regularSabaq: {
      title: 'Regular Sabaq',
      count: loading ? '...' : regularSabaqData.count,
      icon: BookOpen,
      color: 'bg-[#DAA520]',
      details: loading ? [] : regularSabaqData.details
    },
    airportCheckins: {
      title: 'Checkins from Airport',
      count: loading ? '...' : airportCheckinsData.count,
      icon: LogIn,
      color: 'bg-[#DAA520]',
      details: loading ? [] : airportCheckinsData.details
    },
    madinaCheckins: {
      title: 'Checkins from Madina',
      count: loading ? '...' : madinaCheckinsData.count,
      icon: LogIn,
      color: 'bg-[#DAA520]',
      details: loading ? [] : madinaCheckinsData.details
    },
    thalCounts: {
      title: 'Thal Counts',
      count: loading ? '...' : thalCountsData.count,
      icon: Utensils,
      color: 'bg-[#DAA520]',
      details: loading ? [] : thalCountsData.details
    },
    pendingCheckouts: {
      title: 'Pending Checkouts',
      count: loading ? '...' : pendingCheckoutsData.count,
      icon: LogOut,
      color: 'bg-[#DAA520]',
      details: loading ? [] : pendingCheckoutsData.details
    }
  };

  const StatCard = ({ stat, onClick }) => {
    const Icon = stat.icon;
    return (
      <div
        onClick={() => onClick(stat)}
        className="bg-white rounded-2xl shadow-lg p-6 cursor-pointer hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className={`${stat.color} p-2 rounded-lg`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-[#B8860B] text-sm font-semibold">{stat.title}</p>
            </div>
            <p className="text-3xl font-bold text-[#583A08]">
              {typeof stat.count === 'number' ? stat.count : stat.count}
            </p>
            {stat.subCount && (
              <p className="text-sm text-gray-500 mt-1 font-medium">{stat.subCount}</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const ThalStatCard = ({ stat, onClick }) => {
    const Icon = stat.icon;
    const counts = typeof stat.count === 'string' 
      ? stat.count.split('|').map(s => s.trim())
      : [];
    
    const countData = counts.map(c => {
      const [label, value] = c.split(':');
      return { label, value };
    });

    const bgColors = {
      'B': 'bg-[#F0E68C]',
      'L': 'bg-[#EEE8AA]',
      'D': 'bg-[#DAA520]'
    };

    return (
      <div
        onClick={() => onClick(stat)}
        className="bg-white rounded-2xl shadow-lg p-6 cursor-pointer hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className={`${stat.color} p-2 rounded-lg`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <p className="text-[#B8860B] text-sm font-semibold">{stat.title}</p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {countData.map(item => (
            <div key={item.label} className={`${bgColors[item.label]} p-2 rounded-lg`}>
              <p className="font-bold text-xl text-[#583A08]">{item.value}</p>
              <p className="text-xs font-semibold text-[#B8860B]">{item.label}</p>
            </div>
          ))}
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
            <thead className="bg-[#F0E68C]">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-[#583A08]">Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-[#583A08]">Room</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-[#583A08]">Check-in</th>
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
            <thead className="bg-[#F0E68C]">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-[#583A08]">Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-[#583A08]">Departure</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-[#583A08]">Bus</th>
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
            <thead className="bg-[#F0E68C]">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-[#583A08]">Bus No</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-[#583A08]">Pax</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-[#583A08]">Route</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-[#583A08]">Driver</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {stat.details.map((detail, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-semibold text-[#B8860B]">{detail.busNo}</td>
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
            <thead className="bg-[#F0E68C]">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-[#583A08]">Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-[#583A08]">Time</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-[#583A08]">Location</th>
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
            <thead className="bg-[#F0E68C]">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-[#583A08]">Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-[#583A08]">Flight</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-[#583A08]">Time</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-[#583A08]">Room</th>
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
            <thead className="bg-[#F0E68C]">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-[#583A08]">Meal</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-[#583A08]">Count</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-[#583A08]">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {stat.details.map((detail, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-semibold text-[#B8860B]">{detail.meal}</td>
                  <td className="px-4 py-3 text-sm text-lg font-bold text-[#583A08]">{detail.count}</td>
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
            <thead className="bg-[#F0E68C]">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-[#583A08]">Presenter</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-[#583A08]">Topic</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-[#583A08]">Time</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-[#583A08]">Attendees</th>
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
            <thead className="bg-[#F0E68C]">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-[#583A08]">Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-[#583A08]">Room</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-[#583A08]">Departure</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-[#583A08]">Transport</th>
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
          <div className="bg-[#DAA520] p-6 text-white">
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
    <div className="p-8 min-h-screen">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-[#583A08] mb-2">Welcome {userName}!</h1>
        <p className="text-[#B8860B] text-lg">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <ClockCard />
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
        <ThalStatCard stat={stats.thalCounts} onClick={setSelectedCard} />
        <StatCard stat={stats.pendingCheckouts} onClick={setSelectedCard} />
      </div>

      {selectedCard && (
        <Modal stat={selectedCard} onClose={() => setSelectedCard(null)} />
      )}
    </div>
  );
};

export default Dashboard;
