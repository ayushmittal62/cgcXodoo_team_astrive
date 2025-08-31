"use client";

import dynamic from 'next/dynamic'
import React from 'react'

const SignUp = dynamic(() => import('@/components/sign-up-form').then(m => m.SignUp), { ssr: false })

const SignUpPage = () => {
  return <SignUp />
}

export default SignUpPage
