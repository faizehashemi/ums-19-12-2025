import React from 'react'
import Title from './Title'
import { assets, exclusiveOffers } from '../assets/assets'
import { useNavigate } from 'react-router-dom';

const ExclusiveOffers = () => {
  const navigate = useNavigate();
  return (
    <div className='flex flex-col items-center px-4 md:px-16 lg:px-24 xl:px-32 pt-12 md:pt-20 pb-20 md:pb-30'>
      <div className='flex flex-col md:flex-row items-center justify-between w-full'>
        <Title align='left' title='Select your route' subTitle='Plan your itineraries based on the routes provided below.' />

      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 mt-6 md:mt-12'>
        {exclusiveOffers.map((item, index)=>(
<div key={item._id} onClick={() => navigate(`/route${index + 1}`)} className='group relative flex flex-col items-start justify-start gap-1 pt-3 px-3 md:pt-6 md:px-4 rounded-lg md:rounded-xl text-white-400 bg-black/40 border border-white-500/100 shadow-2xl overflow-hidden cursor-pointer hover:bg-black/50 transition-all'><div>
                    <p className='text-lg md:text-2xl font-medium font-playfair'>{item.title}</p>
                    <p className='text-sm md:text-base'>{item.description}</p>

                </div>
                <div className='flex items-center gap-2 text-sm md:text-base font-medium mt-2 mb-3 md:mt-4 md:mb-5'>
                  Book Now
                  <img className='w-3 h-3 md:w-4 md:h-4 invert group-hover:translate-x-1 transition-all' src={assets.arrowIcon} alt="arrow-icon" />
                </div>
            </div>
        ))}
      </div>
    </div>
  )
}

export default ExclusiveOffers
