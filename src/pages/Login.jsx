import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import logo from '../assets/logo.svg'
import placeholderVideo from '../assets/placeholder.mp4'
import posterImage from '../assets/clockTower.jpg'
import ExclusiveOffers from '../components/ExclusiveOffers'
import { useAuth } from '../contexts/AuthContext'

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false)
  const [useMagicLink, setUseMagicLink] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const { signIn, signUp, signInWithMagicLink, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || '/'

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, navigate, from])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (useMagicLink) {
        const { error } = await signInWithMagicLink(email)
        if (error) throw error
        setSuccess('Magic link sent! Check your email to sign in.')
        setEmail('')
      } else if (isSignUp) {
        const { error } = await signUp(email, password, fullName)
        if (error) throw error
        setSuccess('Account created! Please check your email to verify your account.')
        setIsSignUp(false)
        setEmail('')
        setPassword('')
        setFullName('')
      } else {
        const { error } = await signIn(email, password)
        if (error) throw error
        // Navigation handled by useEffect
      }
    } catch (err) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Only show login section when NOT authenticated */}
      {!isAuthenticated && (
        <div className="relative w-full h-screen overflow-hidden">
          {/* Background Video */}
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            poster={posterImage}
            src={placeholderVideo}
            className="absolute top-0 left-0 w-full h-full object-cover bg-black"
          />

          {/* Overlay */}
          <div className="absolute top-0 left-0 w-full h-full bg-blur bg-opacity-90"></div>

          {/* Login Content */}
          <div className="relative z-10 flex flex-col items-center justify-center h-full px-4">
            {/* Logo */}
            <div className="mb-8">
              <img src={logo} alt="QuickStay Logo" className="h-16 md:h-20 w-auto" />
            </div>

            {/* Login Form */}
            <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-2xl p-8 w-full max-w-md border border-gray-200">
              <h2 className="text-3xl font-bold text-gray-900 text-center mb-6">
                {isSignUp ? 'Create Account' : 'Welcome Back'}
              </h2>

              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                  {success}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {isSignUp && (
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      required={isSignUp}
                    />
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    required
                  />
                </div>

                {!useMagicLink && (
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      required={!useMagicLink}
                      minLength={6}
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 px-6 rounded-lg transition duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? 'Processing...' : useMagicLink ? 'Send Magic Link' : isSignUp ? 'Sign Up' : 'Sign In'}
                </button>
              </form>

              <div className="mt-6 space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    setUseMagicLink(!useMagicLink)
                    setError('')
                    setSuccess('')
                  }}
                  className="w-full text-sm text-amber-600 hover:text-amber-700 font-medium"
                >
                  {useMagicLink ? 'Use password instead' : 'Use magic link instead'}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(!isSignUp)
                      setError('')
                      setSuccess('')
                      setUseMagicLink(false)
                    }}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section - Shows when authenticated */}
      {isAuthenticated && (
        <div id="hero-section" className='relative h-screen flex flex-col items-start justify-center px-6 md:px-16 lg:px-24 xl:px-32 text-white overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'>
          <ExclusiveOffers />
        </div>
      )}
    </>
  )
}

export default Login
