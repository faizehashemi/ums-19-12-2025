import React, { useMemo, useState } from "react";
import { assets } from "../assets/assets";
import { supabase } from "../lib/supabase";
import ExclusiveOffers from "./ExclusiveOffers";





const Hero = () => {



 



  return (
    <div className='relative h-screen flex flex-col items-start justify-center px-6 md:px-16 lg:px-24 xl:px-32 text-white overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'>
      <ExclusiveOffers />
    </div>
  );
};

export default Hero;
