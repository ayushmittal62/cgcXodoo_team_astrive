"use client";

import React from "react";
import { AnimatedBackground } from "./ui/animated-background";

interface PageLayoutProps {
  children: React.ReactNode;
  variant?: "dark" | "light" | "gradient";
  showAnimation?: boolean;
  className?: string;
}

/**
 * Page Layout wrapper that provides consistent animated background
 * across your entire website
 */
export function PageLayout({ 
  children, 
  variant = "dark", 
  showAnimation = true, 
  className 
}: PageLayoutProps) {
  if (!showAnimation) {
    // Return without animation for pages that don't need it
    return (
      <div className={className}>
        {children}
      </div>
    );
  }

  return (
    <AnimatedBackground 
      variant={variant}
      className={className}
      animationSpeed={3}
      colors={[
        [255, 255, 255], // White dots
        [200, 200, 200], // Light gray dots
      ]}
      dotSize={4}
      showGradient={true}
    >
      {children}
    </AnimatedBackground>
  );
}
