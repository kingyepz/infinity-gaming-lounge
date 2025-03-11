import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { UsersIcon, ShieldIcon, Facebook, Instagram, MessageSquare } from "lucide-react";
import { FaXTwitter, FaTiktok, FaReddit } from "react-icons/fa6";
import { useToast } from "@/hooks/use-toast";
import FallingButtons from "@/components/animations/FallingButtons";
import InfinityLogo from "@/components/animations/InfinityLogo";

export default function WelcomePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleStaffLogin = () => {
    try {
      // Set default staff user
      const userData = {
        id: 2,
        displayName: "Staff Test",
        gamingName: "staff",
        phoneNumber: "254700000001",
        role: "staff" as const,
        points: 0,
        createdAt: new Date()
      };

      console.log('Welcome: Setting staff test user:', userData);
      localStorage.setItem("user", JSON.stringify(userData));
      setLocation("/pos");
    } catch (error) {
      console.error('Welcome: Error during staff login:', error);
      toast({
        variant: "destructive",
        title: "Login failed",
        description: "Could not set up staff test account"
      });
    }
  };
  
  const handleAdminLogin = () => {
    try {
      // Set default admin user
      const userData = {
        id: 1,
        displayName: "Admin Test",
        gamingName: "admin",
        phoneNumber: "254700000000",
        role: "admin" as const,
        points: 0,
        createdAt: new Date()
      };

      console.log('Welcome: Setting admin test user:', userData);
      localStorage.setItem("user", JSON.stringify(userData));
      setLocation("/pos");
    } catch (error) {
      console.error('Welcome: Error during admin login:', error);
      toast({
        variant: "destructive",
        title: "Login failed",
        description: "Could not set up admin test account"
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black overflow-hidden relative">
      {/* Animated gradient background */}
      <div className="absolute inset-0 w-full h-full">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-pink-500/20 animate-gradient-x"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYwIiBoZWlnaHQ9IjE2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZmlsdGVyIGlkPSJub2lzZSIgeD0iMCIgeT0iMCI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuNzUiIG51bU9jdGF2ZXM9IjQiIHN0aXRjaFRpbGVzPSJzdGl0Y2giLz48L2ZpbHRlcj48cmVjdCB3aWR0aD0iMTYwIiBoZWlnaHQ9IjE2MCIgZmlsdGVyPSJ1cmwoI25vaXNlKSIgb3BhY2l0eT0iMC4xNSIvPjwvc3ZnPg==')] opacity-20"></div>
      </div>

      {/* Falling Buttons Animation */}
      <FallingButtons />

      <div className="z-10 text-center px-4 sm:px-6 lg:px-8">
        <InfinityLogo />
        <h1 className="mt-6 text-4xl sm:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-pink-500 tracking-tight">
          Infinity Gaming Lounge
        </h1>
        <p className="mt-4 text-lg sm:text-xl text-gray-300">
          Experience gaming like never before
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            className="relative group px-8 py-6 overflow-hidden backdrop-blur-sm bg-white/10 hover:bg-white/20 border-2 border-primary/50 hover:border-primary transition-all duration-300"
            onClick={handleStaffLogin}
          >
            <div className="absolute inset-0 w-1/2 bg-gradient-to-r from-primary/40 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-500" />
            <UsersIcon className="mr-2 h-5 w-5" />
            <span className="relative z-10">Staff Portal</span>
          </Button>

          <Button
            className="relative group px-8 py-6 overflow-hidden backdrop-blur-sm bg-white/10 hover:bg-white/20 border-2 border-primary/50 hover:border-primary transition-all duration-300"
            onClick={handleAdminLogin}
          >
            <div className="absolute inset-0 w-1/2 bg-gradient-to-r from-primary/40 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-500" />
            <ShieldIcon className="mr-2 h-5 w-5" />
            <span className="relative z-10">Admin Portal</span>
          </Button>
        </div>

        {/* Social Media Links */}
        <div className="mt-10">
          <p className="text-gray-400 mb-4">Connect with us</p>
          <div className="flex justify-center space-x-4">
            <a href="#" className="text-white hover:text-primary transition-colors p-2 bg-white/10 rounded-full">
              <Facebook className="h-5 w-5" />
            </a>
            <a href="#" className="text-white hover:text-primary transition-colors p-2 bg-white/10 rounded-full">
              <FaXTwitter className="h-5 w-5" />
            </a>
            <a href="#" className="text-white hover:text-primary transition-colors p-2 bg-white/10 rounded-full">
              <Instagram className="h-5 w-5" />
            </a>
            <a href="#" className="text-white hover:text-primary transition-colors p-2 bg-white/10 rounded-full">
              <MessageSquare className="h-5 w-5" />
            </a>
            <a href="#" className="text-white hover:text-primary transition-colors p-2 bg-white/10 rounded-full">
              <FaTiktok className="h-5 w-5" />
            </a>
            <a href="#" className="text-white hover:text-primary transition-colors p-2 bg-white/10 rounded-full">
              <FaReddit className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}