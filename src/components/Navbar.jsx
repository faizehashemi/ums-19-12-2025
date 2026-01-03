import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";
import { useAuth } from "../contexts/AuthContext";
import { hasRole } from "../utils/permissions";
import { ROLES } from "../config/rolePermissions";

const BookIcon = ()=>(
    <svg className="w-4 h-4 text-gray-700" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" >
    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 19V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v13H7a2 2 0 0 0-2 2Zm0 0a2 2 0 0 0 2 2h12M9 3v14m7 0v4" />
</svg>
)

const Navbar = () => {
    const navLinks = [
        { name: 'Home', path: '/' },
        { name: 'My Bookings', path: '/my-bookings' },
        { name: 'Tour Operator', path: '/tourOperator' },
        { name: 'About Us', path: '/aboutUs' },
    ];

    const informationDropdown = [
        { name: 'Overview', path: '/information?tab=overview' },
        { name: 'Guidelines', path: '/information?tab=guidelines' },
        { name: 'Registration', path: '/information?tab=registration' },
        { name: 'Lawazim & Fees', path: '/information?tab=lawazim' },
        { name: 'Transport', path: '/information?tab=transport' },
    ];

    const [isScrolled, setIsScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isInfoDropdownOpen, setIsInfoDropdownOpen] = useState(false);

    const { user, profile, signOut } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()

    // Check if user is authorized (not a guest)
    const isAuthorizedUser = profile && !hasRole(profile, ROLES.GUEST)

    useEffect(() => {

        if(location.pathname !== '/'){
            setIsScrolled(true);
            return;
        }else{
            setIsScrolled(false)
        }
        setIsScrolled(prev => location.pathname !== '/' ? true : prev);

        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, [location.pathname]);

    return (
            <nav className={`fixed top-0 left-0 w-full flex items-center justify-between px-4 md:px-16 lg:px-24 xl:px-32 transition-all duration-500 z-50 ${isScrolled ? "bg-white/80 shadow-md text-gray-700 backdrop-blur-lg py-3 md:py-4" : "py-4 md:py-6"}`}>

                {/* Logo */}
                <Link to='/'>
                    <img src={assets.logo} alt="logo" className={`h-9 ${isScrolled && "invert opacity-80"}`} />
                </Link>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-4 lg:gap-8">
                    {navLinks.map((link, i) => (
                        <a key={i} href={link.path} className={`group flex flex-col gap-0.5 ${isScrolled ? "text-gray-700" : "text-white"}`}>
                            {link.name}
                            <div className={`${isScrolled ? "bg-gray-700" : "bg-white"} h-0.5 w-0 group-hover:w-full transition-all duration-300`} />
                        </a>
                    ))}

                    {/* Information Dropdown */}
                    <div
                        className="relative group"
                        onMouseEnter={() => setIsInfoDropdownOpen(true)}
                        onMouseLeave={() => setIsInfoDropdownOpen(false)}
                    >
                        <button className={`flex items-center gap-1 ${isScrolled ? "text-gray-700" : "text-white"}`}>
                            Information
                            <svg className={`w-4 h-4 transition-transform ${isInfoDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {/* Dropdown Menu */}
                        <div className={`absolute top-full left-0 mt-2 w-48 bg-white shadow-lg rounded-lg overflow-hidden transition-all duration-300 ${isInfoDropdownOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'}`}>
                            {informationDropdown.map((item, i) => (
                                <a
                                    key={i}
                                    href={item.path}
                                    className="block px-4 py-3 text-gray-700 hover:bg-gray-100 transition-colors text-sm border-b border-gray-100 last:border-b-0"
                                >
                                    {item.name}
                                </a>
                            ))}
                        </div>
                    </div>

                    {isAuthorizedUser && (
                        <button className={`border px-4 py-1 text-sm font-light rounded-full cursor-pointer ${isScrolled ? 'text-black' : 'text-white'} transition-all`} onClick={()=> navigate('/owner/dashboard')}>
                        Admin
                        </button>
                    )}
                </div>

                {/* Desktop Right */}
                <div className="hidden md:flex items-center gap-4">
                    <img src={assets.searchIcon} alt="search" className={`${isScrolled && 'invert'} h-7 transition-all duration-500`} />

                {user ?
                (
                    <div className="relative group">
                        <button className={`flex items-center gap-2 px-4 py-2 rounded-full ${isScrolled ? 'bg-gray-100 hover:bg-gray-200' : 'bg-white/10 hover:bg-white/20'} transition-all`}>
                            <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-white font-semibold">
                                {profile?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <span className={`${isScrolled ? 'text-gray-700' : 'text-white'}`}>
                                {profile?.full_name || user?.email?.split('@')[0] || 'User'}
                            </span>
                        </button>

                        <div className="absolute right-0 top-full mt-2 w-48 bg-white shadow-lg rounded-lg overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
                            <button
                                onClick={() => navigate('/my-bookings')}
                                className="w-full flex items-center gap-2 px-4 py-3 text-gray-700 hover:bg-gray-100 transition-colors text-sm border-b border-gray-100"
                            >
                                <BookIcon />
                                My Bookings
                            </button>
                            <button
                                onClick={() => signOut()}
                                className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-100 transition-colors text-sm"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                )
                :
                (<button onClick={() => navigate('/')} className="bg-black text-white px-8 py-2.5 rounded-full ml-4 transition-all duration-500">
                        Login
                    </button>)
                }

                    
                </div>

                {/* Mobile Menu Button */}
               

                <div className="flex items-center gap-3 md:hidden">
                {user && (
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                    >
                        {profile?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                    </button>
                )}

                    <img onClick={()=> setIsMenuOpen(!isMenuOpen)} src={assets.menuIcon} alt="" className={`${isScrolled && "invert"} h-4`}/>
                </div>

                {/* Mobile Menu */}
                <div className={`fixed top-0 left-0 w-full h-screen bg-white text-base flex flex-col md:hidden items-center justify-center gap-6 font-medium text-gray-800 transition-all duration-500 overflow-y-auto ${isMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
                    <button className="absolute top-4 right-4" onClick={() => setIsMenuOpen(false)}>
                        <img src={assets.closeIcon} alt="close-menu" className="h-6.5" />
                    </button>

                    {navLinks.map((link, i) => (
                        <a key={i} href={link.path} onClick={() => setIsMenuOpen(false)}>
                            {link.name}
                        </a>
                    ))}

                    {/* Mobile Information Dropdown */}
                    <div className="flex flex-col items-center gap-3">
                        <button
                            onClick={() => setIsInfoDropdownOpen(!isInfoDropdownOpen)}
                            className="flex items-center gap-1 text-gray-800 font-medium"
                        >
                            Information
                            <svg className={`w-4 h-4 transition-transform ${isInfoDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {isInfoDropdownOpen && (
                            <div className="flex flex-col gap-2 items-center">
                                {informationDropdown.map((item, i) => (
                                    <a
                                        key={i}
                                        href={item.path}
                                        onClick={() => setIsMenuOpen(false)}
                                        className="text-sm text-gray-600 hover:text-gray-800"
                                    >
                                        {item.name}
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>

                  {user && (
                        <button
                            onClick={() => navigate('/my-bookings')}
                            className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
                        >
                            <BookIcon />
                            My Bookings
                        </button>
                    )}

                  {isAuthorizedUser && (
                        <button className="border px-4 py-1 text-sm font-light rounded-full cursor-pointer transition-all" onClick={()=> navigate('/owner/dashboard')}>
                        Dashboard
                        </button>
                    )}

                   {user ? (
                        <button onClick={() => signOut()} className="bg-red-500 text-white px-8 py-2.5 rounded-full transition-all duration-500 hover:bg-red-600">
                            Sign Out
                        </button>
                    ) : (
                        <button onClick={() => navigate('/')} className="bg-black text-white px-8 py-2.5 rounded-full transition-all duration-500">
                            Login
                        </button>
                    )}
                </div>
            </nav>
    );
}

export default Navbar;