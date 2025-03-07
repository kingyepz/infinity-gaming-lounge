import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  GamepadIcon, 
  LayoutDashboardIcon,
  UserIcon,
  BarChartIcon,
  FileText,
  LogOut
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

interface SidebarProps {
  onLogout: () => void;
}

export default function Sidebar({ onLogout }: SidebarProps) {
  const [location, setLocation] = useLocation();

  return (
    <div className="w-64 border-r border-primary/20 p-4 space-y-2 backdrop-blur-sm bg-black/50">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-bold text-primary">Infinity Gaming</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={onLogout}
          className="hover:bg-primary/20"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-4rem)]">
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
      </ScrollArea>
    </div>
  );
}