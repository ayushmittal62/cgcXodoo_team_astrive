import React from 'react'
import Link from 'next/link'

const Home = () => {
  return (
    <div className='flex min-h-screen items-center justify-center text-3xl font-bold'>
      Welcome to{" "}
      <Link 
        href="/attendee" 
        className="text-blue-600 hover:text-blue-800 transition-colors cursor-pointer ml-2"
      >
        EventHive!
      </Link>
    </div>
  )
}

export default Home
