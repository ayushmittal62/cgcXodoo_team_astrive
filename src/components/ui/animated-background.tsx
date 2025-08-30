"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { DotMatrix } from "./canvas-animation";

export interface AnimatedBackgroundProps {
  children: React.ReactNode;
  className?: string;
  variant?: "dark" | "light" | "gradient";
  animationSpeed?: number;
  opacities?: number[];
  colors?: number[][];
  dotSize?: number;
  showGradient?: boolean;
  reverse?: boolean;
  gradientDirection?: "t" | "b" | "l" | "r" | "tl" | "tr" | "bl" | "br";
}

export const AnimatedBackground = ({
  children,
  className,
  variant = "dark",
  animationSpeed = 10,
  opacities = [0.3, 0.3, 0.3, 0.5, 0.5, 0.5, 0.8, 0.8, 0.8, 1],
  colors = [[255, 255, 255]],
  dotSize = 6,
  showGradient = true,
  reverse = false,
  gradientDirection = "t",
}: AnimatedBackgroundProps) => {
  // Determine base background color based on variant
  const getBackgroundClass = () => {
    switch (variant) {
      case "light":
        return "bg-white";
      case "gradient":
        return "bg-gradient-to-br from-gray-900 via-black to-gray-800";
      case "dark":
      default:
        return "bg-black";
    }
  };

  // Determine gradient direction
  const getGradientClass = () => {
    const gradientMap = {
      t: "bg-gradient-to-t",
      b: "bg-gradient-to-b", 
      l: "bg-gradient-to-l",
      r: "bg-gradient-to-r",
      tl: "bg-gradient-to-tl",
      tr: "bg-gradient-to-tr",
      bl: "bg-gradient-to-bl",
      br: "bg-gradient-to-br",
    };
    return gradientMap[gradientDirection];
  };

  // Determine gradient colors based on variant
  const getGradientColors = () => {
    switch (variant) {
      case "light":
        return "from-white to-transparent";
      case "gradient":
        return "from-gray-900 to-transparent";
      case "dark":
      default:
        return "from-black to-transparent";
    }
  };

  return (
    <div className={cn("relative min-h-screen", getBackgroundClass(), className)}>
      {/* Animated Canvas Background */}
      <div className="absolute inset-0 z-0">
        <div className="h-full w-full">
          <DotMatrix
            colors={colors}
            dotSize={dotSize}
            opacities={opacities}
            shader={`
              ${reverse ? 'u_reverse_active' : 'false'}_;
              animation_speed_factor_${animationSpeed.toFixed(1)}_;
            `}
            center={["x", "y"]}
          />
        </div>
        
        {/* Gradient Overlays */}
        {showGradient && (
          <>
            <div className={cn("absolute inset-0", getGradientClass(), getGradientColors())} />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,0,0,1)_0%,_transparent_100%)]" />
            <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-black to-transparent" />
          </>
        )}
      </div>
      
      {/* Content Layer */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};
