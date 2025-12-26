import React from 'react'
import Title from './Title'
import { assets, exclusiveOffers } from '../assets/assets'
import { useNavigate } from 'react-router-dom';

const ExclusiveOffers = () => {
  const navigate = useNavigate();
  return (
    <div className='flex flex-col items-center px-6 md:px-16 lg:px-24 xl:px-32 pt-20 pb-30'>
      <div className='flex flex-col md:flex-row items-center justify-between w-full'>
        <Title align='left' title='Select your route' subTitle='Plan your itineraries based on the routes provided below.' />
        
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12'>
        {exclusiveOffers.map((item)=>(
<div key={item._id} className='group relative flex flex-col items-start justify-start gap-1 pt-6 px-4 rounded-xl text-white-400 bg-black/40 border border-white-500/100 shadow-2xl overflow-hidden'><div>
                    <p className='text-2xl font-medium font-playfair'>{item.title}</p>
                    <p>{item.description}</p>
                    
                </div>
                <button 
                  onClick={() => navigate('/route1')} 
                  className='flex items-center gap-2 font-medium cursor-pointer mt-4 mb-5'
                >
                  Book Now
                  <img className='invert group-hover:translate-x-1 transition-all' src={assets.arrowIcon} alt="arrow-icon" />
                </button>
            </div>
        ))}
      </div>
    </div>
  )
}

export default ExclusiveOffers
