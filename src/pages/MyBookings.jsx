import React, { useState, useEffect } from 'react'
import Title from '../components/Title'
import { assets } from '../assets/assets'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const MyBookings = () => {
  const { user, isLoaded } = useAuth();
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  // Fetch user's bookings from Supabase
  useEffect(() => {
    const fetchBookings = async () => {
      if (!isLoaded || !user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('reservations')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching bookings:', error);
          setBookings([]);
        } else {
          setBookings(data || []);
        }
      } catch (err) {
        console.error('Error:', err);
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [user, isLoaded]);

  if (loading) {
    return (
      <div className='py-28 md:pb-35 md:pt-32 px-4 md:px-16 lg:px-24 xl:px-32'>
        <Title title='My Bookings' subTitle='Easily manage your past, current, and upcoming hotel reservations in one place. Plan your trips seamlessly with just a few clicks' align='left' />
        <div className='max-w-6xl mt-8 w-full text-gray-800 text-center py-12'>
          <p>Loading your bookings...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className='py-28 md:pb-35 md:pt-32 px-4 md:px-16 lg:px-24 xl:px-32'>
        <Title title='My Bookings' subTitle='Easily manage your past, current, and upcoming hotel reservations in one place. Plan your trips seamlessly with just a few clicks' align='left' />
        <div className='max-w-6xl mt-8 w-full text-gray-800 text-center py-12'>
          <p>Please log in to view your bookings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className='py-28 md:pb-35 md:pt-32 px-4 md:px-16 lg:px-24 xl:px-32'>

      <Title title='My Bookings' subTitle='Easily manage your past, current, and upcoming hotel reservations in one place. Plan your trips seamlessly with just a few clicks' align='left' />

      <div className='max-w-6xl mt-8 w-full text-gray-800'>

        {bookings.length === 0 ? (
          <div className='text-center py-12'>
            <p className='text-gray-600'>You haven't made any bookings yet.</p>
          </div>
        ) : (
          <>
            <div className='hidden md:grid md:grid-cols-[3fr_2fr_1fr] w-full border-b border-gray-300 font-medium text-base py-3'>
              <div className="w-1/3">Reservation Details</div>
              <div className="w-1/3">Travel Dates</div>
              <div className="w-1/3">Status</div>
            </div>

            {bookings.map((booking)=>(
          <div key={booking.id} className='grid grid-cols-1 md:grid-cols-[3fr_2fr_1fr] w-full border-b border-gray-300 py-6 first:border-t'>
            {/* ------ Reservation Details ---- */}
            <div className='flex flex-col md:flex-row'>
              <div className='flex flex-col gap-1.5 max-md:mt-3'>
                  <p className='font-playfair text-2xl'>
                    {booking.travel_details?.country || 'Travel Reservation'}
                  </p>
                <div className='flex items-center gap-1 text-sm text-gray-500'>
                  <img src={assets.locationIcon} alt="location-icon"/>
                  <span>
                    {booking.travel_details?.travelMode === 'By Air'
                      ? `${booking.travel_details?.airline || 'Airline'} - Flight ${booking.travel_details?.flightNo || ''}`
                      : booking.travel_details?.travelMode || 'Travel Mode'}
                  </span>
                </div>
                <div className='flex items-center gap-1 text-sm text-gray-500'>
                  <img src={assets.guestsIcon} alt="guests-icon"/>
                  <span>Members: {booking.num_members || 0}</span>
                </div>
                <p className='text-sm text-gray-600'>Accommodation: {booking.accommodation || 'N/A'}</p>
                <p className='text-base font-semibold'>Total: ${booking.total_fee || 0}</p>
              </div>
            </div>
            {/* ------ Date & Timings ---- */}
            <div className='flex flex-row md:items-center md:gap-12 mt-3 gap-8'>
              <div>
                <p>Arrival:</p>
                <p className='text-gray-500 text-sm'>
                  {booking.travel_details?.arrivalDateTime
                    ? new Date(booking.travel_details.arrivalDateTime).toLocaleDateString()
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p>Departure:</p>
                <p className='text-gray-500 text-sm'>
                  {booking.travel_details?.departureDateTime
                    ? new Date(booking.travel_details.departureDateTime).toLocaleDateString()
                    : 'N/A'}
                </p>
              </div>
            </div>
            {/* ------ Status ---- */}
            <div className='flex flex-col items-start justify-center pt-3'>
              <div className='flex items-center gap-2'>
                <div className={`h-3 w-3 rounded-full ${
                  booking.status === 'approved' ? "bg-green-500" :
                  booking.status === 'pending' ? "bg-yellow-500" :
                  "bg-red-500"
                }`}></div>
                <p className={`text-sm capitalize ${
                  booking.status === 'approved' ? "text-green-500" :
                  booking.status === 'pending' ? "text-yellow-600" :
                  "text-red-500"
                }`}>
                  {booking.status || 'Pending'}
                </p>
              </div>
            </div>
          </div>
        ))}
          </>
        )}

      </div>
    </div>
  )
}

export default MyBookings
