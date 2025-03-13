import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/payment";

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

// Icons
import {
  Search,
  Plus,
  Minus,
  ShoppingCart,
  GamepadIcon,
  Clock,
  DollarSign,
  Tag,
  Star,
  StarHalf,
  StarOff,
  Filter,
  Gamepad2,
} from "lucide-react";

// Game type definition
interface Game {
  id: number;
  name: string;
  description?: string;
  category?: string;
  pricePerSession: number;
  pricePerHour: number;
  popularity: number;
  isActive: boolean;
}

// Parent component will provide these props
interface GameCatalogSectionProps {
  onSelectGame: (game: Game, pricingType: "hourly" | "perGame") => void;
  compact?: boolean;
  className?: string;
  showTitle?: boolean;
}

export default function GameCatalogSection({
  onSelectGame,
  compact = false,
  className = "",
  showTitle = true,
}: GameCatalogSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showGameDetailsDialog, setShowGameDetailsDialog] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);

  // Fetch games
  const {
    data: games = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["/api/games"],
    queryFn: async () => {
      const response = await apiRequest<Game[]>("/api/games");
      // Filter out inactive games
      return response.filter(game => game.isActive);
    },
  });

  // Filter games based on search query
  const filteredGames = games.filter(game => 
    game.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (game.description && game.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Get game details and show dialog
  const handleViewGameDetails = (game: Game) => {
    setSelectedGame(game);
    setShowGameDetailsDialog(true);
  };

  // Helper function to render popularity stars
  const renderPopularity = (popularity: number, small = false) => {
    const maxStars = 5;
    const fullStars = Math.floor(popularity / 20);
    const hasHalfStar = (popularity % 20) >= 10;
    const starSize = small ? "w-3 h-3" : "w-4 h-4";
    
    return (
      <div className="flex">
        {Array.from({ length: fullStars }).map((_, i) => (
          <Star key={`full-${i}`} className={`${starSize} text-yellow-500 fill-yellow-500`} />
        ))}
        {hasHalfStar && <StarHalf className={`${starSize} text-yellow-500 fill-yellow-500`} />}
        {Array.from({ length: maxStars - fullStars - (hasHalfStar ? 1 : 0) }).map((_, i) => (
          <StarOff key={`empty-${i}`} className={`${starSize} text-gray-400`} />
        ))}
      </div>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={className}>
        {showTitle && <h3 className="text-lg font-semibold mb-4">Game Catalog</h3>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: compact ? 4 : 6 }).map((_, i) => (
            <Card key={i} className="bg-black/20 border-primary/20">
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-2/3 mb-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <div className="flex justify-between text-sm mt-2">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 w-24" />
                </div>
              </CardContent>
              <CardFooter className="pt-0 flex justify-between">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className={className}>
        {showTitle && <h3 className="text-lg font-semibold mb-4">Game Catalog</h3>}
        <Card className="bg-red-900/20 border-red-500">
          <CardHeader>
            <CardTitle>Error Loading Games</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{(error as Error)?.message || "Failed to load game catalog"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={className}>
      {showTitle && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Gamepad2 className="mr-2 h-5 w-5" />
            Game Catalog
          </h3>
          <div className="relative w-48">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search games..."
              className="pl-9 h-9 bg-black/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      )}

      {!showTitle && (
        <div className="relative mb-4">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search games catalog..."
            className="pl-9 bg-black/20"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      )}

      {filteredGames.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-gray-700 rounded-lg">
          <GamepadIcon className="mx-auto h-10 w-10 text-gray-500" />
          <p className="mt-2 text-gray-400">
            {searchQuery ? `No games found matching "${searchQuery}"` : "No games available"}
          </p>
        </div>
      ) : (
        <ScrollArea className={compact ? "h-[400px]" : "h-auto max-h-[70vh]"}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pr-4">
            {filteredGames.map((game) => (
              <Card key={game.id} className="bg-black/20 border-primary/20 hover:bg-black/30 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base flex-grow">{game.name}</CardTitle>
                    {renderPopularity(game.popularity)}
                  </div>
                  {game.category && (
                    <div className="mt-1">
                      <Badge variant="outline" className="capitalize text-xs">
                        {game.category}
                      </Badge>
                    </div>
                  )}
                  {game.description && !compact && (
                    <CardDescription className="line-clamp-2 mt-1">
                      {game.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center text-sm text-gray-400">
                        <GamepadIcon className="h-3.5 w-3.5 mr-1 text-primary/70" />
                        <span>Per Game:</span>
                      </div>
                      <Badge variant="outline" className="font-mono">
                        KES {game.pricePerSession.toLocaleString()}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center text-sm text-gray-400">
                        <Clock className="h-3.5 w-3.5 mr-1 text-primary/70" />
                        <span>Per Hour:</span>
                      </div>
                      <Badge variant="outline" className="font-mono">
                        KES {game.pricePerHour.toLocaleString()}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-0 flex justify-between">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleViewGameDetails(game)}
                    className="text-xs"
                  >
                    Details
                  </Button>
                  <div className="flex space-x-2">
                    <Button 
                      variant="default" 
                      size="sm"
                      className="text-xs"
                      onClick={() => onSelectGame(game, "perGame")}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Per Game
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="sm"
                      className="text-xs"
                      onClick={() => onSelectGame(game, "hourly")}
                    >
                      <Clock className="h-3.5 w-3.5 mr-1" />
                      Hourly
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Game Details Dialog */}
      <Dialog open={showGameDetailsDialog} onOpenChange={setShowGameDetailsDialog}>
        {selectedGame && (
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <GamepadIcon className="h-5 w-5" />
                {selectedGame.name}
              </DialogTitle>
              <div className="flex items-center mt-1">
                <span className="text-sm text-gray-400 mr-2">Popularity:</span>
                {renderPopularity(selectedGame.popularity)}
              </div>
            </DialogHeader>
            
            <div className="py-4 space-y-4">
              {selectedGame.description && (
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-1">Description</h4>
                  <p className="text-sm">{selectedGame.description}</p>
                </div>
              )}
              
              {selectedGame.category && (
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-1">Category</h4>
                  <Badge variant="secondary" className="capitalize">{selectedGame.category}</Badge>
                </div>
              )}
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-400">Pricing Options</h4>
                <div className="bg-black/30 rounded-lg p-3 grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center text-sm">
                      <GamepadIcon className="h-4 w-4 mr-2 text-primary/70" />
                      <span>Per Game</span>
                    </div>
                    <div className="font-mono font-bold text-lg">
                      KES {selectedGame.pricePerSession.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-400">
                      Single play session
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center text-sm">
                      <Clock className="h-4 w-4 mr-2 text-primary/70" />
                      <span>Per Hour</span>
                    </div>
                    <div className="font-mono font-bold text-lg">
                      KES {selectedGame.pricePerHour.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-400">
                      Hourly play rate
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button 
                variant="outline"
                onClick={() => setShowGameDetailsDialog(false)}
                className="w-full sm:w-auto"
              >
                Close
              </Button>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button 
                  onClick={() => {
                    onSelectGame(selectedGame, "perGame");
                    setShowGameDetailsDialog(false);
                  }}
                  className="flex-1"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Per Game
                </Button>
                <Button 
                  variant="secondary"
                  onClick={() => {
                    onSelectGame(selectedGame, "hourly");
                    setShowGameDetailsDialog(false);
                  }}
                  className="flex-1"
                >
                  <Clock className="h-4 w-4 mr-1" />
                  Hourly
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}