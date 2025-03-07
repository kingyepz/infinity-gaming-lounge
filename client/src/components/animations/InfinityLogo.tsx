import { GamepadIcon } from "lucide-react";

export default function InfinityLogo({ compact = false }) {
  const svgClass = compact ? "w-24 h-12" : "w-32 h-16";
  const gamepadClass = compact ? "w-8 h-8" : "w-12 h-12";
  const gapClass = compact ? "gap-4" : "gap-8";

  return (
    <div className={`flex items-center justify-center ${gapClass}`}>
      {/* Infinity Sign SVG */}
      <svg
        className={svgClass}
        viewBox="0 0 100 40"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M30,20 C30,12 37,12 45,20 C53,28 60,28 60,20 C60,12 53,12 45,20 C37,28 30,28 30,20"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          className="text-primary animate-trace-infinity"
        />
      </svg>

      {/* Separate Gamepad Icon */}
      <div className="animate-pulse">
        <GamepadIcon className={`${gamepadClass} text-primary`} />
      </div>
    </div>
  );
}