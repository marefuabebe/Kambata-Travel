import React from "react";

export function SvgIcon({ src, scale = 1.8 }: { src: string; scale?: number }) {
  return function CustomSvgIcon({ width = 24, height = 24, className = "" }: { width?: number; height?: number; className?: string }) {
    // We scale the size up slightly because these SVGs are highly detailed and look too faint at small sizes.
    const scaledWidth = (width || 24) * scale;
    const scaledHeight = (height || 24) * scale;
    
    return (
      <div className={`flex items-center justify-center`} style={{ width, height, overflow: "visible" }}>
        <div
          className={`bg-current ${className} shrink-0`}
          style={{
            width: scaledWidth,
            height: scaledHeight,
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
      </div>
    );
  };
}
