import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  GamepadIcon, 
  LayoutDashboardIcon,
  UserIcon,
  BarChartIcon
} from "lucide-react";

const routes = [
  {
    path: "/pos",
    label: "POS Dashboard",
    icon: GamepadIcon,
    role: "staff"
  },
  {
    path: "/portal",
    label: "Customer Portal",
    icon: UserIcon,
    role: "customer"
  },
  {
    path: "/admin",
    label: "Analytics",
    icon: BarChartIcon,
    role: "admin"
  }
];

export default function Sidebar() {
  const [location, setLocation] = useLocation();

  return (
    <div className="w-64 border-r bg-card">
      <ScrollArea className="h-[calc(100vh-4rem)]">
        <div className="space-y-4 py-4">
          <div className="px-3 py-2">
            <div className="space-y-1">
              {routes.map((route) => (
                <Button
                  key={route.path}
                  variant={location === route.path ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setLocation(route.path)}
                >
                  <route.icon className="mr-2 h-4 w-4" />
                  {route.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
