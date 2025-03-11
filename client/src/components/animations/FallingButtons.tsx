import { useEffect, useState } from "react";

type Button = {
  id: number;
  type: string;
  left: number;
  delay: number;
};

const PS_BUTTONS = ["circle", "square", "triangle", "x"] as const;
const XBOX_BUTTONS = ["a", "b", "x", "y"] as const;

export default function FallingButtons() {
  const [buttons, setButtons] = useState<Button[]>([]);
  const [isPlayStation, setIsPlayStation] = useState(true);

  // Switch between PlayStation and Xbox buttons every 5 seconds
  useEffect(() => {
    const consoleInterval = setInterval(() => {
      setButtons([]); // Clear existing buttons before switching
      setIsPlayStation(prev => !prev);
    }, 5000);

    return () => clearInterval(consoleInterval);
  }, []);

  // Create new falling buttons
  useEffect(() => {
    const currentButtons = isPlayStation ? PS_BUTTONS : XBOX_BUTTONS;

    const interval = setInterval(() => {
      const newButton: Button = {
        id: Date.now(),
        type: currentButtons[Math.floor(Math.random() * currentButtons.length)],
        left: Math.random() * 90 + 5, // Keep buttons away from edges
        delay: Math.random(),
      };

      setButtons(prev => [...prev, newButton]);

      // Remove button after animation
      setTimeout(() => {
        setButtons(prev => prev.filter(b => b.id !== newButton.id));
      }, 5000);
    }, 500);

    return () => clearInterval(interval);
  }, [isPlayStation]);

  const getButtonContent = (type: string) => {
    switch (type) {
      // PlayStation buttons
      case "circle":
        return "○";
      case "square":
        return "□";
      case "triangle":
        return "△";
      case "x":
        return "×";
      // Xbox buttons
      case "a":
        return "A";
      case "b":
        return "B";
      case "c":
        return "X";
      case "y":
        return "Y";
      default:
        return "";
    }
  };

  const getButtonColor = (type: string) => {
    switch (type) {
      // PlayStation colors
      case "circle":
        return "text-red-500";
      case "square":
        return "text-pink-500";
      case "triangle":
        return "text-green-500";
      case "x":
        return "text-blue-500";
      // Xbox colors
      case "a":
        return "text-green-400";
      case "b":
        return "text-red-400";
      case "c":
        return "text-blue-400";
      case "y":
        return "text-yellow-400";
      default:
        return "text-white";
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {buttons.map(button => (
        <div
          key={button.id}
          className={`absolute animate-fall text-2xl font-bold ${getButtonColor(button.type)}`}
          style={{
            left: `${button.left}%`,
            animationDelay: `${button.delay}s`,
            top: "-50px", // Start above viewport
          }}
        >
          {getButtonContent(button.type)}
        </div>
      ))}
    </div>
  );
}