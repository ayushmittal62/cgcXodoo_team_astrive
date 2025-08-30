"use client";

import React, { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

interface CodeVerificationFormProps {
  code: string[];
  onCodeChange: (index: number, value: string) => void;
  onKeyDown: (index: number, e: React.KeyboardEvent<HTMLInputElement>) => void;
  onBack: () => void;
  onContinue: () => void;
  onResendCode: () => void;
  isCodeComplete: boolean;
}

export function CodeVerificationForm({
  code,
  onCodeChange,
  onKeyDown,
  onBack,
  onContinue,
  onResendCode,
  isCodeComplete
}: CodeVerificationFormProps) {
  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input when component mounts
  useEffect(() => {
    setTimeout(() => {
      codeInputRefs.current[0]?.focus();
    }, 500);
  }, []);

  return (
    <motion.div 
      key="code-step"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-6 text-center"
    >
      <div className="space-y-1">
        <h1 className="text-[2.5rem] font-bold leading-[1.1] tracking-tight text-white">We sent you a code</h1>
        <p className="text-[1.25rem] text-white/50 font-light">Please enter it</p>
      </div>
      
      <div className="w-full">
        <div className="relative rounded-full py-4 px-5 border border-white/10 bg-transparent">
          <div className="flex items-center justify-center">
            {code.map((digit, i) => (
              <div key={i} className="flex items-center">
                <div className="relative">
                  <input
                    ref={(el) => {
                      codeInputRefs.current[i] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={e => onCodeChange(i, e.target.value)}
                    onKeyDown={e => onKeyDown(i, e)}
                    className="w-8 text-center text-xl bg-transparent text-white border-none focus:outline-none focus:ring-0 appearance-none caret-transparent"
                    aria-label={`Verification code digit ${i + 1}`}
                    title={`Enter digit ${i + 1} of verification code`}
                  />
                  {!digit && (
                    <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center pointer-events-none">
                      <span className="text-xl text-white/30">0</span>
                    </div>
                  )}
                </div>
                {i < 5 && <span className="text-white/20 text-xl">|</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div>
        <motion.p 
          className="text-white/50 hover:text-white/70 transition-colors cursor-pointer text-sm"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
          onClick={onResendCode}
        >
          Resend code
        </motion.p>
      </div>
      
      <div className="flex w-full gap-3">
        <motion.button 
          onClick={onBack}
          className="rounded-full bg-white text-black font-medium px-8 py-3 hover:bg-white/90 transition-colors w-[30%]"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.2 }}
        >
          Back
        </motion.button>
        <motion.button 
          onClick={onContinue}
          className={`flex-1 rounded-full font-medium py-3 border transition-all duration-300 ${
            isCodeComplete
            ? "bg-white text-black border-transparent hover:bg-white/90 cursor-pointer" 
            : "bg-[#111] text-white/50 border-white/10 cursor-not-allowed"
          }`}
          disabled={!isCodeComplete}
        >
          Continue
        </motion.button>
      </div>
      
      <div className="pt-16">
        <p className="text-xs text-white/40">
          By continuing, you agree to the <Link href="#" className="underline text-white/40 hover:text-white/60 transition-colors">Terms of Service</Link>, <Link href="#" className="underline text-white/40 hover:text-white/60 transition-colors">Privacy Policy</Link>, and <Link href="#" className="underline text-white/40 hover:text-white/60 transition-colors">Cookie Policy</Link>.
        </p>
      </div>
    </motion.div>
  );
}
