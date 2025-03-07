
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function FallingButtons() {
  const [buttons, setButtons] = useState<Array<{
    id: number;
    x: number;
    y: number;
    type: string;
    rotation: number;
    scale: number;
    opacity: number;
  }>>([]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      const newButton = {
        id: Math.random(),
        x: Math.random() * 100,
        y: -10,
        type: ["a", "b", "y"][Math.floor(Math.random() * 3)],
        rotation: Math.random() * 360,
        scale: 0.5 + Math.random() * 1.5,
        opacity: 0.3 + Math.random() * 0.5
      };
      
      setButtons(prev => [...prev, newButton]);
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  useEffect(() => {
    const animationInterval = setInterval(() => {
      setButtons(prev => 
        prev.map(button => ({
          ...button,
          y: button.y + 1 + Math.random() * 0.5,
          rotation: button.rotation + (Math.random() * 2 - 1),
        })).filter(button => button.y < 110)
      );
    }, 50);
    
    return () => clearInterval(animationInterval);
  }, []);
  
  const getButtonLabel = (type: string) => {
    switch(type) {
      case "a":
        return "A";
      case "b":
        return "B";
      case "y":
        return "Y";
      default:
        return "X";
    }
  };
  
  const getButtonColor = (type: string) => {
    switch(type) {
      case "a":
        return "text-green-400";
      case "b":
        return "text-red-400";
      case "y":
        return "text-yellow-400";
      default:
        return "text-blue-400";
    }
  };
  
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {buttons.map(button => (
        <div 
          key={button.id}
          className={cn(
            "absolute transform -translate-x-1/2 -translate-y-1/2",
            getButtonColor(button.type)
          )}
          style={{
            left: `${button.x}%`,
            top: `${button.y}%`,
            transform: `translate(-50%, -50%) rotate(${button.rotation}deg) scale(${button.scale})`,
            opacity: button.opacity
          }}
        >
          <div className="text-2xl font-bold border-2 border-current rounded-full w-10 h-10 flex items-center justify-center">
            {getButtonLabel(button.type)}
          </div>
        </div>
      ))}
    </div>
  );
}
