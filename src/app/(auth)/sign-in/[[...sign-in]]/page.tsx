"use client";

import dynamic from 'next/dynamic'
import React from 'react'

// Load client-only to avoid SSR chunk issues in Turbopack for nested catch-all routes
const SignIn = dynamic(() => import('@/components/sign-in-form').then(m => m.SignIn), { ssr: false })

const SignInPage = () => {
  return <SignIn />
}

export default SignInPage
