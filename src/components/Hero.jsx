import React, { useMemo, useState } from "react";
import { assets } from "../assets/assets";
import { supabase } from "../lib/supabaseClient";
import ExclusiveOffers from "./ExclusiveOffers";





const Hero = () => {



 



  return (
<div className='relative h-screen flex flex-col items-start justify-center px-6 md:px-16 lg:px-24 xl:px-32 text-white overflow-hidden'><div className='absolute inset-0 bg-[url("/src/assets/day.jpg")] bg-cover bg-center scale-105 -z-10' />     
        <ExclusiveOffers />


    </div>
  );
};

export default Hero;
