import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export default function FallingButtons() {
  const [buttons, setButtons] = useState<Array<{id: number, button: string, x: number, y: number, speed: number}>>([]);
  const [lastId, setLastId] = useState(0);

  const getRandomButton = () => {
    const buttons = ["a", "b", "y"];
    return buttons[Math.floor(Math.random() * buttons.length)];
  };

  const getButtonIcon = (button: string) => {
    switch (button) {
      case "a":
        return "A";
      case "b":
        return "B";
      case "y":
        return "Y";
      default:
        return "";
    }
  };

  const getButtonColor = (button: string) => {
    switch (button) {
      case "a":
        return "text-green-400";
      case "b":
        return "text-red-400";
      case "y":
        return "text-yellow-400";
      default:
        return "text-white";
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      // Add a new button
      if (buttons.length < 20) {
        const newButton = {
          id: lastId + 1,
          button: getRandomButton(),
          x: Math.random() * 100,
          y: -10,
          speed: 0.5 + Math.random() * 1.5
        };
        setLastId(lastId + 1);
        setButtons([...buttons, newButton]);
      }

      // Move buttons down
      setButtons(buttons.map(button => ({
        ...button,
        y: button.y + button.speed
      })).filter(button => button.y < 110));
    }, 200);

    return () => clearInterval(interval);
  }, [buttons, lastId]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {buttons.map(button => (
        <div
          key={button.id}
          className={cn(
            "absolute inline-flex items-center justify-center w-8 h-8 rounded-full border-2 font-bold",
            getButtonColor(button.button)
          )}
          style={{
            left: `${button.x}%`,
            top: `${button.y}%`,
            opacity: (100 - button.y) / 100,
            transform: `rotate(${Math.sin(button.y / 10) * 20}deg)`,
            borderColor: `currentColor`
          }}
        >
          {getButtonIcon(button.button)}
        </div>
      ))}
    </div>
  );
}