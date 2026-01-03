import React from 'react'

const AboutUs = () => {
  return (
    <div className='min-h-screen bg-gray-50 pt-20'>
      {/* Hero Section */}
      <section className='px-6 md:px-12 lg:px-16 pt-8 pb-6 bg-gradient-to-br from-blue-600 to-indigo-700'>
        <div className='text-center'>
          <h1 className='text-2xl md:text-3xl font-playfair text-white mb-2'>About Us</h1>
          <p className='text-sm text-blue-100'>Contact information and administration details</p>
        </div>
      </section>

      {/* Main Content */}
      <main className='px-6 md:px-12 lg:px-16 py-6'>

        {/* Contact Information Cards */}
        <div className='grid md:grid-cols-2 gap-4 mb-6'>

          {/* Contact Us Card */}
          <article className='bg-white rounded-lg p-4 border border-gray-200 shadow-sm'>
            <div className='text-center'>
              <div className='text-3xl mb-2' aria-hidden="true">📞</div>
              <h2 className='text-lg font-playfair text-gray-900 mb-3'>CONTACT US ON</h2>
              <div className='space-y-1'>
                <div>
                  <a
                    className='text-blue-600 hover:text-blue-700 font-semibold text-sm transition-colors'
                    href="tel:+966125532146"
                  >
                    +966 12 553 2146
                  </a>
                </div>
                <div>
                  <a
                    className='text-blue-600 hover:text-blue-700 font-semibold text-sm transition-colors'
                    href="tel:+966125532147"
                  >
                    +966 12 553 2147
                  </a>
                </div>
              </div>
            </div>
          </article>

          {/* Address Card */}
          <article className='bg-gradient-to-br from-amber-700 to-amber-800 text-white rounded-lg p-4 border border-amber-600 shadow-sm'>
            <div className='text-center'>
              <div className='text-3xl mb-2' aria-hidden="true">📍</div>
              <h2 className='text-lg font-playfair mb-3'>ADDRESS</h2>
              <a
                className='hover:text-amber-100 transition-colors block text-sm leading-relaxed'
                href="https://www.google.com/maps/dir//Mohammedi+Makan,+%D8%B7%D8%B1%D9%8A%D9%82+%D8%A7%D9%84%D9%85%D9%84%D9%83+%D8%B9%D8%A8%D8%AF%D8%A7%D9%84%D8%B9%D8%B2%D9%8A%D8%B2%D8%8C+Makkah%E2%80%AD/@21.397504,39.8655488,14z/data=!3m1!4b1!4m9!4m8!1m0!1m5!1m1!1s0x15c2045a5eda62df:0x1f3a2ac5a5964659!2m2!1d39.8654411!2d21.3984125!3e0?entry=ttu&g_ep=EgoyMDI1MTIwMi4wIKXMDSoASAFQAw%3D%3D"
                target="_blank"
                rel="noopener noreferrer"
              >
                Bldg. No. 6373, Taif-Hada Road, <br />
                Al Jamiah Dist., Near Snood Al Aziziyah Hotel <br />
                South Aziziyah, Makkah Mukarramah - 24243-3432
              </a>
            </div>
          </article>

        </div>

        {/* Administration Section */}
        <section className='mb-6'>
          <h2 className='text-xl font-playfair text-gray-900 text-center mb-4'>ADMINISTRATION</h2>

          <div className='grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3'>

            {/* Janab Shaikh Saifuddin Bhai Makkahwala */}
            <article className='bg-white rounded-lg p-3 border border-gray-200 shadow-sm text-center'>
              <div className='mb-2'>
                <div className='w-16 h-16 mx-auto bg-gray-200 rounded-full flex items-center justify-center text-2xl'>
                  👤
                </div>
              </div>
              <h3 className='text-sm font-semibold text-gray-900 mb-1'>Janab Shaikh Saifuddin Bhai Makkahwala</h3>
              <p className='text-xs text-gray-600 mb-2'>General Manager</p>
              <div className='flex flex-col items-center gap-1'>
                <a
                  className='text-blue-600 hover:text-blue-700 font-semibold text-xs transition-colors'
                  href="tel:+966504502865"
                >
                  +966 50 450 2865
                </a>
                <a
                  className='text-green-600 hover:text-green-700 text-sm transition-colors'
                  href="https://api.whatsapp.com/send?phone=966504502865"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                >
                  💬 WhatsApp
                </a>
              </div>
            </article>

            {/* Shaikh Murtaza Bhai Nagpurwala */}
            <article className='bg-white rounded-lg p-3 border border-gray-200 shadow-sm text-center'>
              <div className='mb-2'>
                <div className='w-16 h-16 mx-auto bg-gray-200 rounded-full flex items-center justify-center text-2xl'>
                  👤
                </div>
              </div>
              <h3 className='text-sm font-semibold text-gray-900 mb-1'>Shaikh Murtaza Bhai Nagpurwala</h3>
              <p className='text-xs text-gray-600 mb-2'>Accounts</p>
              <div className='flex flex-col items-center gap-1'>
                <a
                  className='text-blue-600 hover:text-blue-700 font-semibold text-xs transition-colors'
                  href="tel:+966507719880"
                >
                  +966 50 771 9880
                </a>
                <a
                  className='text-green-600 hover:text-green-700 text-sm transition-colors'
                  href="https://api.whatsapp.com/send?phone=966507719880"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                >
                  💬 WhatsApp
                </a>
              </div>
            </article>

            {/* Shaikh Zohair Bhai Indorewala */}
            <article className='bg-white rounded-lg p-3 border border-gray-200 shadow-sm text-center'>
              <div className='mb-2'>
                <div className='w-16 h-16 mx-auto bg-gray-200 rounded-full flex items-center justify-center text-2xl'>
                  👤
                </div>
              </div>
              <h3 className='text-sm font-semibold text-gray-900 mb-1'>Shaikh Zohair Bhai Indorewala</h3>
              <p className='text-xs text-gray-600 mb-2'>Mawaid</p>
              <div className='flex flex-col items-center gap-1'>
                <a
                  className='text-blue-600 hover:text-blue-700 font-semibold text-xs transition-colors'
                  href="tel:+966532654204"
                >
                  +966 53 265 4204
                </a>
                <a
                  className='text-green-600 hover:text-green-700 text-sm transition-colors'
                  href="https://api.whatsapp.com/send?phone=966532654204"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                >
                  💬 WhatsApp
                </a>
              </div>
            </article>

            {/* Shaikh Murtaza Bhai Morbiwala */}
            <article className='bg-white rounded-lg p-3 border border-gray-200 shadow-sm text-center'>
              <div className='mb-2'>
                <div className='w-16 h-16 mx-auto bg-gray-200 rounded-full flex items-center justify-center text-2xl'>
                  👤
                </div>
              </div>
              <h3 className='text-sm font-semibold text-gray-900 mb-1'>Shaikh Murtaza Bhai Morbiwala</h3>
              <p className='text-xs text-gray-600 mb-2'>Transport</p>
              <div className='flex flex-col items-center gap-1'>
                <a
                  className='text-blue-600 hover:text-blue-700 font-semibold text-xs transition-colors'
                  href="tel:+966557260744"
                >
                  +966 55 726 0744
                </a>
                <a
                  className='text-green-600 hover:text-green-700 text-sm transition-colors'
                  href="https://api.whatsapp.com/send?phone=966557260744"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                >
                  💬 WhatsApp
                </a>
              </div>
            </article>

            {/* Shaikh Huzaifa Bhai Malindiwala */}
            <article className='bg-white rounded-lg p-3 border border-gray-200 shadow-sm text-center'>
              <div className='mb-2'>
                <div className='w-16 h-16 mx-auto bg-gray-200 rounded-full flex items-center justify-center text-2xl'>
                  👤
                </div>
              </div>
              <h3 className='text-sm font-semibold text-gray-900 mb-1'>Shaikh Huzaifa Bhai Malindiwala</h3>
              <p className='text-xs text-gray-600 mb-2'>PR & Visa</p>
              <div className='flex flex-col items-center gap-1'>
                <a
                  className='text-blue-600 hover:text-blue-700 font-semibold text-xs transition-colors'
                  href="tel:+966537252742"
                >
                  +966 53 725 2742
                </a>
                <a
                  className='text-green-600 hover:text-green-700 text-sm transition-colors'
                  href="https://api.whatsapp.com/send?phone=966537252742"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                >
                  💬 WhatsApp
                </a>
              </div>
            </article>

            {/* Mulla Hamza Bhai Jazdanwala */}
            <article className='bg-white rounded-lg p-3 border border-gray-200 shadow-sm text-center'>
              <div className='mb-2'>
                <div className='w-16 h-16 mx-auto bg-gray-200 rounded-full flex items-center justify-center text-2xl'>
                  👤
                </div>
              </div>
              <h3 className='text-sm font-semibold text-gray-900 mb-1'>Mulla Hamza Bhai Jazdanwala</h3>
              <p className='text-xs text-gray-600 mb-2'>Accommodation</p>
              <div className='flex flex-col items-center gap-1'>
                <a
                  className='text-blue-600 hover:text-blue-700 font-semibold text-xs transition-colors'
                  href="tel:+966508313526"
                >
                  +966 50 831 3526
                </a>
                <a
                  className='text-green-600 hover:text-green-700 text-sm transition-colors'
                  href="https://api.whatsapp.com/send?phone=966508313526"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                >
                  💬 WhatsApp
                </a>
              </div>
            </article>

            {/* M Taha Bhai Kamlapurwala */}
            <article className='bg-white rounded-lg p-3 border border-gray-200 shadow-sm text-center'>
              <div className='mb-2'>
                <div className='w-16 h-16 mx-auto bg-gray-200 rounded-full flex items-center justify-center text-2xl'>
                  👤
                </div>
              </div>
              <h3 className='text-sm font-semibold text-gray-900 mb-1'>M Taha Bhai Kamlapurwala</h3>
              <p className='text-xs text-gray-600 mb-2'>Mawaid</p>
              <div className='flex flex-col items-center gap-1'>
                <a
                  className='text-blue-600 hover:text-blue-700 font-semibold text-xs transition-colors'
                  href="tel:+966532534579"
                >
                  +966 53 253 4579
                </a>
                <a
                  className='text-green-600 hover:text-green-700 text-sm transition-colors'
                  href="https://api.whatsapp.com/send?phone=966532534579"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                >
                  💬 WhatsApp
                </a>
              </div>
            </article>

          </div>
        </section>

      </main>

      {/* Footer CTA */}
      <section className='px-6 md:px-12 lg:px-16 py-6 bg-gradient-to-br from-blue-600 to-indigo-700'>
        <div className='text-center'>
          <h3 className='text-lg font-playfair text-white mb-2'>Need More Information?</h3>
          <p className='text-blue-100 text-sm'>Feel free to contact any of our administration members</p>
        </div>
      </section>
    </div>
  )
}

export default AboutUs
