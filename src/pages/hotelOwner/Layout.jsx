import React from 'react'
import Navbar from '../../components/hotelOwner/Navbar'
import Sidebar from '../../components/hotelOwner/Sidebar'
import { Outlet } from 'react-router-dom'
import patternBg from '../../assets/pattern_gold_2x.png'

const Layout = () => {
  return (
    <div className='flex flex-col h-screen' style={{ backgroundImage: `url(${patternBg})`, backgroundRepeat: 'repeat' }}>
      <Navbar/>
      <div className='flex h-full'>
        <Sidebar />
        <div className='flex-1 p-4 pt-20 md:px-10 h-full'>
            <Outlet/>
        </div>
      </div>
    </div>
  )
}

export default Layout
