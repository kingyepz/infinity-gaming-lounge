import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Header() {
  const [, setLocation] = useLocation();

  const handleSignOut = async () => {
    await auth.signOut();
    setLocation("/");
  };

  return (
    <header className="border-b">
      <div className="flex h-16 items-center px-4">
        <div className="flex-1">
          <h1 className="text-xl font-bold">Infinity Gaming Lounge</h1>
        </div>
        
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
    </header>
  );
}
