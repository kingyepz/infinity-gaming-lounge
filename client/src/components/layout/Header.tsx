
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import InfinityLogo from "@/components/animations/InfinityLogo";

export default function Header() {
  const [, setLocation] = useLocation();

  const handleSignOut = async () => {
    await auth.signOut();
    setLocation("/");
  };

  return (
    <header className="border-b">
      <div className="flex h-16 items-center px-4 relative">
        {/* User profile on the right */}
        <div className="flex-1 flex justify-start">
          {auth.currentUser && (
            <div className="flex items-center gap-4">
              <Avatar>
                <AvatarImage src={auth.currentUser.photoURL || undefined} />
                <AvatarFallback>
                  {auth.currentUser.displayName?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <Button variant="ghost" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          )}
        </div>
        
        {/* Centered logo and title */}
        <div className="absolute left-1/2 transform -translate-x-1/2 flex flex-col items-center justify-center">
          <InfinityLogo compact={true} />
          <h1 className="text-xl font-bold text-center mt-1">Infinity Gaming Lounge</h1>
        </div>
        
        {/* Empty div to balance the layout */}
        <div className="flex-1"></div>
      </div>
    </header>
  );
}
