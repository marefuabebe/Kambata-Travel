import React from "react";

export function SvgIcon({ src }: { src: string }) {
  return function CustomSvgIcon({ width = 24, height = 24, className = "" }: { width?: number; height?: number; className?: string }) {
    return (
      <div
        className={`bg-current ${className}`}
        style={{
          width,
          height,
          maskImage: `url(${src})`,
          WebkitMaskImage: `url(${src})`,
          maskSize: "contain",
          WebkitMaskSize: "contain",
          maskRepeat: "no-repeat",
          WebkitMaskRepeat: "no-repeat",
          maskPosition: "center",
          WebkitMaskPosition: "center",
        }}
      />
    );
  };
}
