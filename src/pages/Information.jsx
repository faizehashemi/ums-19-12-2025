import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

const Information = () => {
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview')

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab) {
      setActiveTab(tab)
      // Scroll to top when tab changes
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [searchParams])

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📋' },
    { id: 'guidelines', label: 'Guidelines', icon: '📖' },
    { id: 'registration', label: 'Registration', icon: '✍️' },
    { id: 'lawazim', label: 'Lawazim & Fees', icon: '💰' },
    { id: 'transport', label: 'Transport', icon: '🚗' },
  ]

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Hero Section
      <section className='px-6 md:px-16 lg:px-24 xl:px-32 pt-20 pb-12 bg-gradient-to-br from-blue-600 to-indigo-700'>
        <div className='text-center'>
          <h1 className='text-4xl md:text-5xl font-playfair text-white mb-4'>Important Information</h1>
          <p className='text-lg text-blue-100 max-w-2xl mx-auto'>Essential guidelines and regulations for your Umrah journey</p>
        </div>
      </section> */}

      {/* Tab Navigation
      <nav className='sticky top-0 z-40 bg-white shadow-md border-b border-gray-200' aria-label="Information sections">
        <div className='px-6 md:px-16 lg:px-24 xl:px-32'>
          <div className='flex overflow-x-auto scrollbar-hide gap-2 py-4'>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg whitespace-nowrap transition-all duration-300 font-medium ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                aria-current={activeTab === tab.id ? 'page' : undefined}
              >
                <span aria-hidden="true">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav> */}

      {/* Content Sections */}
      <main className='px-6 md:px-16 lg:px-24 xl:px-32 py-12'>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <section aria-labelledby="overview-heading">
            <h2 id="overview-heading" className='text-3xl font-playfair text-gray-900 mb-8'>Overview</h2>

            {/* Video Section */}
            <div className='mb-12'>
              <div className='bg-white rounded-xl p-6 border border-gray-200 shadow-sm'>
                <h3 className='text-xl font-semibold text-gray-900 mb-4'>Introduction Video</h3>
                <div className='aspect-video bg-gray-100 rounded-lg flex items-center justify-center border border-gray-300'>
                  <div className='text-center'>
                    <div className='text-6xl mb-4' aria-hidden="true">🎥</div>
                    <p className='text-gray-700 font-medium'>Video Placeholder</p>
                    <p className='text-sm text-gray-500 mt-2'>Introductory video coming soon</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Masjid Information Cards */}
            <div className='grid md:grid-cols-2 gap-6 mb-8'>
              <article className='bg-white rounded-xl p-6 border border-gray-200 shadow-sm'>
                <h3 className='text-2xl font-playfair text-gray-900 mb-4 flex items-center gap-2'>
                  <span aria-hidden="true">🕋</span>
                  <span>Al Masjid al Haram</span>
                </h3>
                <p className='text-gray-700 leading-relaxed'>
                  Even in normal days, gents need to wear Ehram to enter Al Masjid al Haram whereas ladies can enter in Haram rida.
                </p>
              </article>

              <article className='bg-white rounded-xl p-6 border border-gray-200 shadow-sm'>
                <h3 className='text-2xl font-playfair text-gray-900 mb-4 flex items-center gap-2'>
                  <span aria-hidden="true">🕌</span>
                  <span>Al Masjid al Nabawi - Madina Munawwara</span>
                </h3>
                <div className='space-y-3 text-gray-700'>
                  <p className='leading-relaxed'>
                    <strong className='text-gray-900'>Zaereen (Mardo):</strong> Can perform Ziyarat of Rasulullah (S.A.W) 24 hours except during Imamat Namaz time.
                  </p>
                  <p className='leading-relaxed'>
                    <strong className='text-gray-900'>BALAG Timings:</strong> Everyday from Zawal to Asar end and After Magrib Namaz to 8:45 PM (Approx) except during Imamat Namaz time.
                  </p>
                  <p className='leading-relaxed'>
                    <strong className='text-gray-900'>Night Time:</strong> 01:00 AM to 3:30 AM (Approx)
                  </p>
                  <p className='leading-relaxed'>
                    <strong className='text-gray-900'>Zaereen (Bairao):</strong> Can perform Ziyarat and pray namaz from 05:45 AM to 06:45 AM and 07:45 PM to 09:30 PM everyday.
                  </p>
                </div>
              </article>
            </div>

            {/* Jannatul Baqi Timings */}
            <article className='bg-white rounded-xl p-6 border border-gray-200 shadow-sm'>
              <h3 className='text-2xl font-playfair text-gray-900 mb-4 flex items-center gap-2'>
                <span aria-hidden="true">⏰</span>
                <span>Jannatul Baqi Timings</span>
                <span className='text-sm font-normal text-gray-600'>(Only for Mardo)</span>
              </h3>
              <dl className='grid md:grid-cols-2 gap-4'>
                <div>
                  <dt className='font-semibold text-gray-900 mb-1'>Morning</dt>
                  <dd className='text-gray-700'>05:45 AM to 07:30 AM (approx)</dd>
                </div>
                <div>
                  <dt className='font-semibold text-gray-900 mb-1'>Evening</dt>
                  <dd className='text-gray-700'>03:45 PM to 04:15 PM (approx)</dd>
                </div>
              </dl>
            </article>
          </section>
        )}

        {/* Guidelines Tab */}
        {activeTab === 'guidelines' && (
          <section aria-labelledby="guidelines-heading">
            <h2 id="guidelines-heading" className='text-3xl font-playfair text-gray-900 mb-8'>Guidelines & Regulations</h2>

            {/* Visa Requirements */}
            <article className='bg-white rounded-xl p-6 border border-gray-200 shadow-sm mb-6'>
              <h3 className='text-2xl font-playfair text-gray-900 mb-4 flex items-center gap-2'>
                <span aria-hidden="true">📄</span>
                <span>Visa Requirements</span>
              </h3>
              <ul className='space-y-3 text-gray-700 list-disc list-inside'>
                <li>For both group and individual arrivals, passengers (Mumineen) must have visas issued by the same company if they wish to travel together.</li>
                <li>As per NUSUK regulations, if passengers have visas from different companies, they must be transported in separate vehicles.</li>
                <li>This rule applies to both groups and individuals.</li>
              </ul>
            </article>

            {/* Vehicle Allocation */}
            <article className='bg-white rounded-xl p-6 border border-gray-200 shadow-sm mb-6'>
              <h3 className='text-2xl font-playfair text-gray-900 mb-4 flex items-center gap-2'>
                <span aria-hidden="true">🚐</span>
                <span>Vehicle Allocation by Faiz</span>
              </h3>
              <div className='space-y-3 text-gray-700'>
                <p>Faiz will arrange only one vehicle per registered group or individual, based on the arrival details provided.</p>
                <p><strong className='text-gray-900'>For additional vehicles:</strong></p>
                <ul className='list-disc list-inside ml-4 space-y-2'>
                  <li>A prior request must be submitted to Faiz, OR</li>
                  <li>The tour operator or individual Zaereen must arrange their own transportation from the airport to Faiz.</li>
                  <li>Additional vehicles are subject to availability, and extra charges will apply depending on the type of vehicle requested.</li>
                </ul>
                <div className='bg-red-50 border border-red-200 rounded-lg p-4 mt-4'>
                  <p className='text-red-800'>
                    <strong>⚠️ Important:</strong> If the individual Zaereen or tour operator does not request an additional vehicle when required, any penalties imposed by the authorities will be their responsibility.
                  </p>
                </div>
              </div>
            </article>

            {/* Accommodation Notice */}
            <article className='bg-white rounded-xl p-6 border border-gray-200 shadow-sm mb-6'>
              <h3 className='text-2xl font-playfair text-gray-900 mb-4 flex items-center gap-2'>
                <span aria-hidden="true">🏨</span>
                <span>Accommodation Notice</span>
              </h3>
              <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
                <p className='text-blue-900'>
                  For accommodation in Madinah during the months of November 2025 to January 2026, all men and women will be accommodated in separate rooms.
                </p>
              </div>
            </article>

            {/* Important Guidelines */}
            <article className='bg-white rounded-xl p-6 border border-gray-200 shadow-sm'>
              <h3 className='text-2xl font-playfair text-gray-900 mb-4'>Important Guidelines</h3>
              <ul className='space-y-3 text-gray-700'>
                <li className='flex items-start gap-3'>
                  <span className='text-blue-600 mt-1' aria-hidden="true">✓</span>
                  <span>For FakkulEhram, groups are sent to haram twice a day: 7:30 AM in the morning & 8:00 PM at night.</span>
                </li>
                <li className='flex items-start gap-3'>
                  <span className='text-blue-600 mt-1' aria-hidden="true">✓</span>
                  <span>Those groups planning for 2 umrahs shall make sure that they have minimum of 10 days gap between 2 umrahs.</span>
                </li>
                <li className='flex items-start gap-3'>
                  <span className='text-blue-600 mt-1' aria-hidden="true">✓</span>
                  <span>Wheelchairs are totally barred from entering Mataaf. Hence Tawaf is to be done walking only. Wheelchair assistance is allowed in Safa-Marwa against a fee of approximately 100 SR.</span>
                </li>
                <li className='flex items-start gap-3'>
                  <span className='text-blue-600 mt-1' aria-hidden="true">✓</span>
                  <span>Zaereen shall take Sabaq from Raza na Saheb in their respective native places and also procure Mansak before coming for Umrah.</span>
                </li>
              </ul>
            </article>
          </section>
        )}

        {/* Registration Tab */}
        {activeTab === 'registration' && (
          <section aria-labelledby="registration-heading">
            <h2 id="registration-heading" className='text-3xl font-playfair text-gray-900 mb-8'>Registration Process</h2>

            {/* Registration Alert */}
            <div className='bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8'>
              <h3 className='text-xl font-semibold text-amber-900 mb-3 flex items-center gap-2'>
                <span aria-hidden="true">⚠️</span>
                <span>Important Notice</span>
              </h3>
              <p className='text-amber-900 leading-relaxed'>
                All zaereen kiram who wish to come for umrah should first register themselves on <a href="https://www.sigatulhaj.org" className='underline hover:text-amber-800 font-semibold' target="_blank" rel="noopener noreferrer">www.sigatulhaj.org</a> and wait for approval - book or issue tickets only after you have got an Approval from SigatulHaj.
              </p>
            </div>

            {/* Video Tutorial */}
            <div className='mb-8'>
              <div className='bg-white rounded-xl p-6 border border-gray-200 shadow-sm'>
                <h3 className='text-xl font-semibold text-gray-900 mb-4'>Registration Tutorial</h3>
                <div className='aspect-video bg-gray-100 rounded-lg flex items-center justify-center border border-gray-300'>
                  <div className='text-center'>
                    <div className='text-6xl mb-4' aria-hidden="true">🎥</div>
                    <p className='text-gray-700 font-medium'>Video Tutorial Placeholder</p>
                    <p className='text-sm text-gray-500 mt-2'>Step-by-step registration guide coming soon</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Registration Requirements */}
            <article className='bg-white rounded-xl p-6 border border-gray-200 shadow-sm mb-6'>
              <h3 className='text-2xl font-playfair text-gray-900 mb-4 flex items-center gap-2'>
                <span aria-hidden="true">📝</span>
                <span>Registration Requirements</span>
              </h3>
              <div className='space-y-4 text-gray-700'>
                <p className='bg-red-50 border border-red-200 rounded-lg p-4 text-red-800'>
                  <strong>Note:</strong> Unregistered or Unapproved Zaereen would not be attended in Makkah & Madina.
                </p>
                <p>Zaereen either coming in tour groups or individually must bring along with them the following:</p>
                <ol className='list-decimal list-inside ml-4 space-y-2'>
                  <li>Approval Letter (to be printed from the sigatulhaj website only)</li>
                  <li>Safai Chithhi</li>
                  <li>ITS Card</li>
                </ol>
                <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4 space-y-2'>
                  <p className='text-blue-900'><strong>Note 1:</strong> Approval Letter obtained from sigatulhaj website is not for Visa purposes. It is only for Faiz administration.</p>
                  <p className='text-blue-900'><strong>Note 2:</strong> For Visa purposes Zaereen can print Accommodation Letter from the website after their application is approved.</p>
                </div>
              </div>
            </article>

            {/* Registration Timeline */}
            <article className='bg-white rounded-xl p-6 border border-gray-200 shadow-sm mb-6'>
              <h3 className='text-2xl font-playfair text-gray-900 mb-4 flex items-center gap-2'>
                <span aria-hidden="true">⏱️</span>
                <span>Important Timelines</span>
              </h3>
              <dl className='space-y-4'>
                <div className='flex items-start gap-3'>
                  <span className='text-2xl' aria-hidden="true">📅</span>
                  <div>
                    <dt className='font-semibold text-gray-900'>New Applications</dt>
                    <dd className='text-gray-700'>Individuals can make new applications up to 24 hours before their arrival time at Saudi Arabia.</dd>
                  </div>
                </div>
                <div className='flex items-start gap-3'>
                  <span className='text-2xl' aria-hidden="true">✏️</span>
                  <div>
                    <dt className='font-semibold text-gray-900'>Edit Applications</dt>
                    <dd className='text-gray-700'>Applications can be edited up to 48 hours prior to the flight arrival time in Saudi Arabia.</dd>
                  </div>
                </div>
                <div className='flex items-start gap-3'>
                  <span className='text-2xl' aria-hidden="true">🖨️</span>
                  <div>
                    <dt className='font-semibold text-gray-900'>Approval Letter</dt>
                    <dd className='text-gray-700'>Though approved by Sigatulhaj, Approval Letter can be printed only after edit option is locked (48 hours prior to arrival time).</dd>
                  </div>
                </div>
              </dl>
            </article>

            {/* Cancellation Policy */}
            <article className='bg-white rounded-xl p-6 border border-gray-200 shadow-sm'>
              <h3 className='text-2xl font-playfair text-gray-900 mb-4 flex items-center gap-2'>
                <span aria-hidden="true">🚫</span>
                <span>Cancellation Policy</span>
              </h3>
              <div className='bg-orange-50 border border-orange-200 rounded-lg p-4'>
                <p className='text-orange-900'>
                  If in case, after getting approval, Mumineen Zaereen Kiram could not come for Umrah & Ziarat for any reasons, Tour Operators / Individuals must send request through email for cancellation of their registration, prior to their arrival date, failing which would lead to blockage of their ITS IDs for any transaction on sigatulhaj website.
                </p>
              </div>
            </article>
          </section>
        )}

        {/* Lawazim & Fees Tab */}
        {activeTab === 'lawazim' && (
          <section aria-labelledby="lawazim-heading">
            <h2 id="lawazim-heading" className='text-3xl font-playfair text-gray-900 mb-8'>Lawazim & Fees</h2>

            {/* Makkah Lawazim */}
            <article className='bg-white rounded-xl p-6 border border-gray-200 shadow-sm mb-6'>
              <h3 className='text-2xl font-playfair text-gray-900 mb-6 flex items-center gap-2'>
                <span aria-hidden="true">🕋</span>
                <span>Faiz Lawazim - Makkah</span>
              </h3>

              <div className='space-y-6'>
                <div>
                  <h4 className='text-lg font-semibold text-gray-900 mb-3'>Sharing Room</h4>
                  <div className='overflow-x-auto'>
                    <table className='w-full text-left border-collapse'>
                      <thead>
                        <tr className='border-b-2 border-gray-300 bg-gray-50'>
                          <th className='py-3 px-4 text-gray-900 font-semibold'>Category</th>
                          <th className='py-3 px-4 text-gray-900 font-semibold'>Age Range</th>
                          <th className='py-3 px-4 text-gray-900 font-semibold'>Rate</th>
                        </tr>
                      </thead>
                      <tbody className='text-gray-700'>
                        <tr className='border-b border-gray-200'>
                          <td className='py-3 px-4'>Adult</td>
                          <td className='py-3 px-4'>12 years & above</td>
                          <td className='py-3 px-4 font-semibold text-blue-700'>130 SR per day per person</td>
                        </tr>
                        <tr className='border-b border-gray-200'>
                          <td className='py-3 px-4'>Child</td>
                          <td className='py-3 px-4'>2 to 11 years</td>
                          <td className='py-3 px-4 font-semibold text-blue-700'>65 SR per day per person</td>
                        </tr>
                        <tr>
                          <td className='py-3 px-4'>Infant</td>
                          <td className='py-3 px-4'>Under 2 years</td>
                          <td className='py-3 px-4 font-semibold text-green-700'>Free</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h4 className='text-lg font-semibold text-gray-900 mb-3'>Exclusive Room</h4>
                  <div className='overflow-x-auto'>
                    <table className='w-full text-left border-collapse'>
                      <thead>
                        <tr className='border-b-2 border-gray-300 bg-gray-50'>
                          <th className='py-3 px-4 text-gray-900 font-semibold'>Category</th>
                          <th className='py-3 px-4 text-gray-900 font-semibold'>Age Range</th>
                          <th className='py-3 px-4 text-gray-900 font-semibold'>Rate</th>
                        </tr>
                      </thead>
                      <tbody className='text-gray-700'>
                        <tr className='border-b border-gray-200'>
                          <td className='py-3 px-4'>Adult</td>
                          <td className='py-3 px-4'>12 years & above</td>
                          <td className='py-3 px-4 font-semibold text-blue-700'>170 SR per day per person</td>
                        </tr>
                        <tr className='border-b border-gray-200'>
                          <td className='py-3 px-4'>Child</td>
                          <td className='py-3 px-4'>2 to 11 years</td>
                          <td className='py-3 px-4 font-semibold text-blue-700'>85 SR per day per person</td>
                        </tr>
                        <tr>
                          <td className='py-3 px-4'>Infant</td>
                          <td className='py-3 px-4'>Under 2 years</td>
                          <td className='py-3 px-4 font-semibold text-green-700'>Free</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </article>

            {/* Madina Lawazim */}
            <article className='bg-white rounded-xl p-6 border border-gray-200 shadow-sm mb-6'>
              <h3 className='text-2xl font-playfair text-gray-900 mb-6 flex items-center gap-2'>
                <span aria-hidden="true">🕌</span>
                <span>Faiz Lawazim - Madina</span>
              </h3>

              <div className='overflow-x-auto'>
                <table className='w-full text-left border-collapse'>
                  <thead>
                    <tr className='border-b-2 border-gray-300 bg-gray-50'>
                      <th className='py-3 px-4 text-gray-900 font-semibold'>Category</th>
                      <th className='py-3 px-4 text-gray-900 font-semibold'>Age Range</th>
                      <th className='py-3 px-4 text-gray-900 font-semibold'>Rate</th>
                    </tr>
                  </thead>
                  <tbody className='text-gray-700'>
                    <tr className='border-b border-gray-200'>
                      <td className='py-3 px-4'>Adult</td>
                      <td className='py-3 px-4'>12 years & above</td>
                      <td className='py-3 px-4 font-semibold text-blue-700'>130 SR per day per person</td>
                    </tr>
                    <tr className='border-b border-gray-200'>
                      <td className='py-3 px-4'>Child</td>
                      <td className='py-3 px-4'>2 to 11 years</td>
                      <td className='py-3 px-4 font-semibold text-blue-700'>65 SR per day per person</td>
                    </tr>
                    <tr>
                      <td className='py-3 px-4'>Infant</td>
                      <td className='py-3 px-4'>Under 2 years</td>
                      <td className='py-3 px-4 font-semibold text-green-700'>Free</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4'>
                <p className='text-blue-900'>
                  <strong>Note:</strong> Exclusive room facility is not available in Madina right now.
                </p>
              </div>
            </article>

            {/* Government Taxes */}
            <article className='bg-white rounded-xl p-6 border border-gray-200 shadow-sm mb-6'>
              <h3 className='text-2xl font-playfair text-gray-900 mb-4 flex items-center gap-2'>
                <span aria-hidden="true">💳</span>
                <span>Government Taxes</span>
              </h3>
              <ul className='space-y-2 text-gray-700'>
                <li className='flex items-center gap-3'>
                  <span className='text-blue-600' aria-hidden="true">•</span>
                  <span>15% VAT applicable on Makkah and Madina Lawazim as well as Transport Charges</span>
                </li>
                <li className='flex items-center gap-3'>
                  <span className='text-blue-600' aria-hidden="true">•</span>
                  <span>2.5% Municipal Tax applicable on Makkah and Madina Lawazim</span>
                </li>
              </ul>
            </article>

            {/* Payment Notice */}
            <div className='bg-green-50 border border-green-200 rounded-xl p-6'>
              <p className='text-green-900 text-center font-semibold'>
                💵 Lawazim would be accepted in Saudi Riyals Only and no other currency would be accepted under any condition.
              </p>
            </div>
          </section>
        )}

        {/* Transport Tab */}
        {activeTab === 'transport' && (
          <section aria-labelledby="transport-heading">
            <h2 id="transport-heading" className='text-3xl font-playfair text-gray-900 mb-8'>Transport Information</h2>

            {/* Transport Lawazim Overview */}
            <article className='bg-white rounded-xl p-6 border border-gray-200 shadow-sm mb-6'>
              <h3 className='text-2xl font-playfair text-gray-900 mb-4'>Transport Lawazim Overview</h3>
              <p className='text-gray-700 mb-4'>
                Transport lawazim are as per the number of pax in a group. It is a one-time fee for all the transfers within Saudi Arabia.
              </p>
            </article>

            {/* Route Details */}
            <div className='space-y-6 mb-8'>
              {[
                { route: 'ROUTE 1', description: 'JEDDAH AIRPORT - MAKKAH - ATRAF MAKKAH - MADINA - ATRAF MADINA - MAKKAH - JEDDAH AIRPORT', rates: [[2,4,400],[5,8,300],[9,24,250],[25,39,200],[40,49,180]] },
                { route: 'ROUTE 2', description: 'JEDDAH AIRPORT - MAKKAH - ATRAF MAKKAH - MADINA - ATRAF MADINA - JEDDAH AIRPORT', rates: [[2,4,400],[5,8,300],[9,24,250],[25,39,200],[40,49,150]] },
                { route: 'ROUTE 3', description: 'JEDDAH AIRPORT - MADINA - ATRAF MADINA - MAKKAH - ATRAF MAKKAH - JEDDAH AIRPORT', rates: [[2,4,400],[5,8,300],[9,24,250],[25,39,180],[40,49,150]] },
                { route: 'ROUTE 4', description: 'JEDDAH AIRPORT - MAKKAH - ATRAF MAKKAH - MADINA - ATRAF MADINA - MADINA AIRPORT', rates: [[2,4,300],[5,8,250],[9,24,200],[25,39,150],[40,49,100]] },
                { route: 'ROUTE 5', description: 'MADINA AIRPORT - MADINA - ATRAF MADINA - MAKKAH - ATRAF MAKKAH - JEDDAH AIRPORT', rates: [[2,4,300],[5,8,250],[9,24,200],[25,39,150],[40,49,100]] },
                { route: 'ROUTE 6', description: 'MADINA AIRPORT - MADINA - ATRAF MADINA - MAKKAH - ATRAF MAKKAH - MADINA AIRPORT', rates: [[2,4,400],[5,8,300],[9,24,250],[25,39,180],[40,49,150]] },
              ].map((routeInfo, idx) => (
                <article key={idx} className='bg-white rounded-xl p-6 border border-gray-200 shadow-sm'>
                  <h4 className='text-xl font-semibold text-gray-900 mb-2'>{routeInfo.route}</h4>
                  <p className='text-gray-600 text-sm mb-4'>{routeInfo.description}</p>
                  <div className='overflow-x-auto'>
                    <table className='w-full text-left border-collapse'>
                      <thead>
                        <tr className='border-b-2 border-gray-300 bg-gray-50'>
                          <th className='py-3 px-4 text-gray-900 font-semibold'>No. of Passengers</th>
                          <th className='py-3 px-4 text-gray-900 font-semibold'>Charge per Person</th>
                        </tr>
                      </thead>
                      <tbody className='text-gray-700'>
                        {routeInfo.rates.map(([min, max, rate], i) => (
                          <tr key={i} className='border-b border-gray-200'>
                            <td className='py-3 px-4'>{min} - {max}</td>
                            <td className='py-3 px-4 font-semibold text-blue-700'>SR. {rate}/-</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </article>
              ))}
            </div>

            {/* Airport Information */}
            <div className='grid md:grid-cols-2 gap-6 mb-6'>
              <article className='bg-white rounded-xl p-6 border border-gray-200 shadow-sm'>
                <h3 className='text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2'>
                  <span aria-hidden="true">✈️</span>
                  <span>Jeddah Airport</span>
                </h3>
                <div className='space-y-3 text-gray-700 text-sm'>
                  <p>Zaereen landing at Jeddah airport should take their Visa agent's Mandub name and contact no. from their travel agent.</p>
                  <p className='font-semibold text-gray-900'>Contact for Coordination:</p>
                  <p>WhatsApp: Sh Murtaza Bhai Morbiwala <a href="tel:+917426958553" className='text-blue-600 hover:underline font-semibold'>+91 74269 58553</a></p>
                  <p className='text-amber-800 bg-amber-50 rounded px-2 py-1'>⚠️ Request for pickup must be done at least 24 hours prior to arrival.</p>
                </div>
              </article>

              <article className='bg-white rounded-xl p-6 border border-gray-200 shadow-sm'>
                <h3 className='text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2'>
                  <span aria-hidden="true">✈️</span>
                  <span>Madina Airport</span>
                </h3>
                <div className='space-y-3 text-gray-700 text-sm'>
                  <p>Madina airport pickup is possible and would be arranged for zaereen kiram landing at Madina airport depending upon the registration details on the website.</p>
                  <p className='font-semibold text-gray-900'>Contact for Coordination:</p>
                  <p><a href="tel:+966552362928" className='text-blue-600 hover:underline font-semibold'>+966 55 236 2928</a></p>
                </div>
              </article>
            </div>

            {/* Airport Refund Tables */}
            <article className='bg-white rounded-xl p-6 border border-gray-200 shadow-sm mb-6'>
              <h3 className='text-2xl font-playfair text-gray-900 mb-6'>Airport Refund Rates</h3>
              <p className='text-gray-700 mb-6 text-sm'>
                If Mumineen Zaereen Kiram landing at Jeddah Airport comes to Faiz in Visa Agent's arranged pickup, they would be refunded for the Airport to Faiz Transfer as per following rates:
              </p>

              <div className='grid md:grid-cols-2 gap-6'>
                <div>
                  <h4 className='text-lg font-semibold text-gray-900 mb-3'>Jeddah Airport to Makkah</h4>
                  <div className='overflow-x-auto'>
                    <table className='w-full text-left border-collapse'>
                      <thead>
                        <tr className='border-b-2 border-gray-300 bg-gray-50'>
                          <th className='py-3 px-4 text-gray-900 font-semibold'>No. of Pax</th>
                          <th className='py-3 px-4 text-gray-900 font-semibold'>Refund Amount</th>
                        </tr>
                      </thead>
                      <tbody className='text-gray-700'>
                        {[[2,3,200],[4,8,300],[9,14,400],[15,24,500],[25,49,750]].map(([min, max, amt], i) => (
                          <tr key={i} className='border-b border-gray-200'>
                            <td className='py-3 px-4'>{min} - {max}</td>
                            <td className='py-3 px-4 font-semibold text-green-700'>SR. {amt}/-</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h4 className='text-lg font-semibold text-gray-900 mb-3'>Jeddah Airport to Madina</h4>
                  <div className='overflow-x-auto'>
                    <table className='w-full text-left border-collapse'>
                      <thead>
                        <tr className='border-b-2 border-gray-300 bg-gray-50'>
                          <th className='py-3 px-4 text-gray-900 font-semibold'>No. of Pax</th>
                          <th className='py-3 px-4 text-gray-900 font-semibold'>Refund Amount</th>
                        </tr>
                      </thead>
                      <tbody className='text-gray-700'>
                        {[[2,3,500],[4,8,600],[9,14,700],[15,24,900],[25,49,1000]].map(([min, max, amt], i) => (
                          <tr key={i} className='border-b border-gray-200'>
                            <td className='py-3 px-4'>{min} - {max}</td>
                            <td className='py-3 px-4 font-semibold text-green-700'>SR. {amt}/-</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6'>
                <p className='text-blue-900 text-sm'>
                  <strong>Note:</strong> Zaereen Kiram landing in the SAME FLIGHT with SAME VISA AGENT would be considered as single group while calculating Airport Refund.
                </p>
              </div>
            </article>

            {/* Important Notes */}
            <div className='bg-amber-50 border border-amber-200 rounded-xl p-6'>
              <h4 className='text-lg font-semibold text-amber-900 mb-3'>⚠️ Important Notes</h4>
              <ul className='space-y-2 text-amber-900 text-sm list-disc list-inside'>
                <li>Only those Zaereen whose arrival & departure are in the same flight & who does all the transfers within Saudi Arabia TOGETHER would only be considered as ONE GROUP.</li>
                <li>Single Individuals would not be provided transport on the above rates.</li>
              </ul>
            </div>
          </section>
        )}

      </main>

      {/* Footer CTA */}
      <section className='px-6 md:px-16 lg:px-24 xl:px-32 py-12 bg-gradient-to-br from-blue-600 to-indigo-700'>
        <div className='text-center'>
          <h3 className='text-2xl font-playfair text-white mb-4'>Need More Information?</h3>
          <p className='text-blue-100 mb-6'>Contact us for any queries or clarifications</p>
          <div className='flex flex-wrap justify-center gap-4'>
            <a
              href="mailto:umrah@sigatulhaj.org"
              className='px-6 py-3 bg-white text-blue-700 font-semibold rounded-lg hover:bg-blue-50 transition-colors shadow-md'
              aria-label="Email us at umrah@sigatulhaj.org"
            >
              📧 Email Us
            </a>
            <a
              href="https://www.sigatulhaj.org"
              target="_blank"
              rel="noopener noreferrer"
              className='px-6 py-3 bg-blue-800 text-white font-semibold border-2 border-white rounded-lg hover:bg-blue-900 transition-colors shadow-md'
              aria-label="Visit Sigatul Haj website"
            >
              🌐 Visit Website
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Information
