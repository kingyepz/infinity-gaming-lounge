import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";

// Icons
import {
  Search,
  PlusCircle,
  Edit,
  Trash2,
  SortAsc,
  SortDesc,
  Filter,
  GamepadIcon,
  Clock,
  DollarSign,
  BarChart,
  Star,
  StarHalf,
  StarOff,
  ChevronUp,
  ChevronDown,
  Gamepad2,
} from "lucide-react";

// Game type definition
interface Game {
  id: number;
  name: string;
  description?: string;
  pricePerSession: number;
  pricePerHour: number;
  popularity: number;
  isActive: boolean;
}

// Filtering and sorting options
type SortOption = "nameAsc" | "nameDesc" | "popularityDesc" | "priceAsc" | "priceDesc";

export default function GameCatalog() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State variables
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddGameDialog, setShowAddGameDialog] = useState(false);
  const [showEditGameDialog, setShowEditGameDialog] = useState(false);
  const [confirmDeleteGameDialog, setConfirmDeleteGameDialog] = useState(false);
  const [gameToDelete, setGameToDelete] = useState<number | null>(null);
  const [editGameId, setEditGameId] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("nameAsc");
  const [showInactiveGames, setShowInactiveGames] = useState(false);

  // Form states for adding/editing games
  const [newGameName, setNewGameName] = useState("");
  const [newGameDescription, setNewGameDescription] = useState("");
  const [newGamePricePerSession, setNewGamePricePerSession] = useState("");
  const [newGamePricePerHour, setNewGamePricePerHour] = useState("");
  const [newGameIsActive, setNewGameIsActive] = useState(true);

  // Edit states
  const [editGameName, setEditGameName] = useState("");
  const [editGameDescription, setEditGameDescription] = useState("");
  const [editGamePricePerSession, setEditGamePricePerSession] = useState("");
  const [editGamePricePerHour, setEditGamePricePerHour] = useState("");
  const [editGameIsActive, setEditGameIsActive] = useState(true);

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
      return response;
    },
  });

  // Add game mutation
  const addGameMutation = useMutation({
    mutationFn: async (newGame: Omit<Game, "id" | "popularity">) => {
      return await apiRequest("/api/games", {
        method: "POST",
        data: newGame,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      setShowAddGameDialog(false);
      resetAddForm();
      toast({
        title: "Game Added",
        description: "The game has been added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add game",
        variant: "destructive",
      });
    },
  });

  // Update game mutation
  const updateGameMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<Game>;
    }) => {
      return await apiRequest(`/api/games/${id}`, {
        method: "PATCH",
        data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      setShowEditGameDialog(false);
      toast({
        title: "Game Updated",
        description: "The game has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update game",
        variant: "destructive",
      });
    },
  });

  // Delete game mutation
  const deleteGameMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/games/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      setConfirmDeleteGameDialog(false);
      toast({
        title: "Game Deleted",
        description: "The game has been deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete game",
        variant: "destructive",
      });
    },
  });

  // Clear the form when closing dialogs
  useEffect(() => {
    if (!showAddGameDialog) {
      resetAddForm();
    }
  }, [showAddGameDialog]);

  // Initialize edit form when edit dialog opens
  useEffect(() => {
    if (editGameId && showEditGameDialog) {
      const gameToEdit = games.find((game) => game.id === editGameId);
      if (gameToEdit) {
        setEditGameName(gameToEdit.name);
        setEditGameDescription(gameToEdit.description || "");
        setEditGamePricePerSession(gameToEdit.pricePerSession.toString());
        setEditGamePricePerHour(gameToEdit.pricePerHour.toString());
        setEditGameIsActive(gameToEdit.isActive);
      }
    }
  }, [editGameId, showEditGameDialog, games]);

  // Reset add game form
  const resetAddForm = () => {
    setNewGameName("");
    setNewGameDescription("");
    setNewGamePricePerSession("");
    setNewGamePricePerHour("");
    setNewGameIsActive(true);
  };

  // Handle adding a new game
  const handleAddGame = () => {
    if (!newGameName || !newGamePricePerSession || !newGamePricePerHour) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const newGame = {
      name: newGameName,
      description: newGameDescription,
      pricePerSession: parseInt(newGamePricePerSession, 10),
      pricePerHour: parseInt(newGamePricePerHour, 10),
      isActive: newGameIsActive,
    };

    addGameMutation.mutate(newGame);
  };

  // Handle editing a game
  const handleEditGame = () => {
    if (!editGameId || !editGameName || !editGamePricePerSession || !editGamePricePerHour) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const updatedGame = {
      name: editGameName,
      description: editGameDescription,
      pricePerSession: parseInt(editGamePricePerSession, 10),
      pricePerHour: parseInt(editGamePricePerHour, 10),
      isActive: editGameIsActive,
    };

    updateGameMutation.mutate({ id: editGameId, data: updatedGame });
  };

  // Handle deleting a game
  const handleDeleteGame = () => {
    if (!gameToDelete) return;
    deleteGameMutation.mutate(gameToDelete);
  };

  // Handle clicking the edit button
  const handleEditGameClick = (game: Game) => {
    setEditGameId(game.id);
    setShowEditGameDialog(true);
  };

  // Filter and sort games based on current criteria
  const filteredAndSortedGames = games
    .filter(game => {
      // Apply search query filter
      const matchesSearch = game.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (game.description && game.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Filter by active/inactive status
      const matchesActiveStatus = showInactiveGames ? true : game.isActive;
      
      return matchesSearch && matchesActiveStatus;
    })
    .sort((a, b) => {
      // Apply sorting
      switch (sortBy) {
        case "nameAsc":
          return a.name.localeCompare(b.name);
        case "nameDesc":
          return b.name.localeCompare(a.name);
        case "popularityDesc":
          return b.popularity - a.popularity;
        case "priceAsc":
          return a.pricePerSession - b.pricePerSession;
        case "priceDesc":
          return b.pricePerSession - a.pricePerSession;
        default:
          return a.name.localeCompare(b.name);
      }
    });

  // Render popularity stars
  const renderPopularity = (popularity: number) => {
    const maxStars = 5;
    const fullStars = Math.floor(popularity / 20);
    const hasHalfStar = (popularity % 20) >= 10;
    
    return (
      <div className="flex">
        {Array.from({ length: fullStars }).map((_, i) => (
          <Star key={`full-${i}`} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
        ))}
        {hasHalfStar && <StarHalf className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
        {Array.from({ length: maxStars - fullStars - (hasHalfStar ? 1 : 0) }).map((_, i) => (
          <StarOff key={`empty-${i}`} className="w-4 h-4 text-gray-400" />
        ))}
      </div>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto p-4 space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Game Catalog</h2>
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="bg-black/30 border-primary/20">
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-2/3 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <div className="flex justify-between text-sm mt-2">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 w-24" />
                </div>
              </CardContent>
              <CardFooter className="pt-0 flex justify-end space-x-2">
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
      <div className="container mx-auto p-4">
        <Card className="bg-red-900/20 border-red-500">
          <CardHeader>
            <CardTitle>Error Loading Games</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{(error as Error)?.message || "Failed to load game catalog"}</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/games"] })}>
              Retry
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <h2 className="text-2xl font-bold flex items-center">
          <Gamepad2 className="mr-2 h-6 w-6" />
          Game Catalog
        </h2>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setShowAddGameDialog(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Game
          </Button>
        </div>
      </div>

      {/* Search and filter controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search games..."
            className="pl-9 bg-black/30"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Select
            value={sortBy}
            onValueChange={(value: SortOption) => setSortBy(value)}
          >
            <SelectTrigger className="w-full bg-black/30">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span>Sort By</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nameAsc">Name (A-Z)</SelectItem>
              <SelectItem value="nameDesc">Name (Z-A)</SelectItem>
              <SelectItem value="popularityDesc">Popularity</SelectItem>
              <SelectItem value="priceAsc">Price (Low to High)</SelectItem>
              <SelectItem value="priceDesc">Price (High to Low)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2">
          <Label htmlFor="show-inactive" className="flex items-center cursor-pointer">
            <Switch
              id="show-inactive"
              checked={showInactiveGames}
              onCheckedChange={setShowInactiveGames}
            />
            <span className="ml-2">Show Inactive Games</span>
          </Label>
        </div>
      </div>

      {/* Games Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {filteredAndSortedGames.length > 0 ? (
          filteredAndSortedGames.map((game) => (
            <Card 
              key={game.id} 
              className={`border-primary/20 ${!game.isActive ? 'opacity-60 bg-gray-900/30' : 'bg-black/30'} transition-all hover:border-primary/30`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base flex-grow flex items-center gap-2">
                    <GamepadIcon className="h-4 w-4" />
                    {game.name}
                    {!game.isActive && (
                      <Badge variant="outline" className="ml-2 text-xs">Inactive</Badge>
                    )}
                  </CardTitle>
                  {renderPopularity(game.popularity)}
                </div>
                <CardDescription className="line-clamp-2 h-10">
                  {game.description || "No description available"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                  <div className="flex items-center gap-1">
                    <GamepadIcon className="h-3.5 w-3.5 text-primary/80" />
                    <span>Per Game:</span>
                  </div>
                  <Badge variant="outline" className="justify-self-end font-mono">
                    KES {game.pricePerSession.toLocaleString()}
                  </Badge>
                  
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-primary/80" />
                    <span>Per Hour:</span>
                  </div>
                  <Badge variant="outline" className="justify-self-end font-mono">
                    KES {game.pricePerHour.toLocaleString()}
                  </Badge>
                </div>
              </CardContent>
              <CardFooter className="pt-0 flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleEditGameClick(game)}
                  className="h-8 px-2 text-xs"
                >
                  <Edit className="mr-1 h-3 w-3" />
                  Edit
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => {
                    setGameToDelete(game.id);
                    setConfirmDeleteGameDialog(true);
                  }}
                  className="h-8 px-2 text-xs"
                >
                  <Trash2 className="mr-1 h-3 w-3" />
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="col-span-full flex justify-center items-center p-12 border border-dashed border-gray-700 rounded-lg">
            <div className="text-center">
              <GamepadIcon className="mx-auto h-12 w-12 text-gray-500" />
              <h3 className="mt-2 text-xl font-medium">No Games Found</h3>
              <p className="mt-1 text-gray-500">
                {searchQuery ? `No games matching "${searchQuery}"` : "No games have been added yet"}
              </p>
              <Button 
                className="mt-4" 
                onClick={() => {
                  setSearchQuery("");
                  setShowAddGameDialog(true);
                }}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Your First Game
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Add Game Dialog */}
      <Dialog open={showAddGameDialog} onOpenChange={setShowAddGameDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Game</DialogTitle>
            <DialogDescription>
              Add a new game to the catalog with pricing information.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="gameName" className="required">Game Name</Label>
              <Input
                id="gameName"
                placeholder="Enter game name"
                value={newGameName}
                onChange={(e) => setNewGameName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="gameDescription">Description</Label>
              <Textarea
                id="gameDescription"
                placeholder="Enter game description"
                value={newGameDescription}
                onChange={(e) => setNewGameDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="pricePerSession" className="required">Price Per Game (KES)</Label>
                <Input
                  id="pricePerSession"
                  type="number"
                  placeholder="Price per game"
                  value={newGamePricePerSession}
                  onChange={(e) => setNewGamePricePerSession(e.target.value)}
                  min={0}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pricePerHour" className="required">Price Per Hour (KES)</Label>
                <Input
                  id="pricePerHour"
                  type="number"
                  placeholder="Price per hour"
                  value={newGamePricePerHour}
                  onChange={(e) => setNewGamePricePerHour(e.target.value)}
                  min={0}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="gameActive"
                checked={newGameIsActive}
                onCheckedChange={setNewGameIsActive}
              />
              <Label htmlFor="gameActive">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddGameDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddGame}
              disabled={addGameMutation.isPending}
            >
              {addGameMutation.isPending ? "Adding..." : "Add Game"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Game Dialog */}
      <Dialog open={showEditGameDialog} onOpenChange={setShowEditGameDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Game</DialogTitle>
            <DialogDescription>
              Update game information and pricing.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="editGameName" className="required">Game Name</Label>
              <Input
                id="editGameName"
                placeholder="Enter game name"
                value={editGameName}
                onChange={(e) => setEditGameName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="editGameDescription">Description</Label>
              <Textarea
                id="editGameDescription"
                placeholder="Enter game description"
                value={editGameDescription}
                onChange={(e) => setEditGameDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="editPricePerSession" className="required">Price Per Game (KES)</Label>
                <Input
                  id="editPricePerSession"
                  type="number"
                  placeholder="Price per game"
                  value={editGamePricePerSession}
                  onChange={(e) => setEditGamePricePerSession(e.target.value)}
                  min={0}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="editPricePerHour" className="required">Price Per Hour (KES)</Label>
                <Input
                  id="editPricePerHour"
                  type="number"
                  placeholder="Price per hour"
                  value={editGamePricePerHour}
                  onChange={(e) => setEditGamePricePerHour(e.target.value)}
                  min={0}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="editGameActive"
                checked={editGameIsActive}
                onCheckedChange={setEditGameIsActive}
              />
              <Label htmlFor="editGameActive">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditGameDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleEditGame}
              disabled={updateGameMutation.isPending}
            >
              {updateGameMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={confirmDeleteGameDialog} onOpenChange={setConfirmDeleteGameDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this game? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteGameDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteGame}
              disabled={deleteGameMutation.isPending}
            >
              {deleteGameMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}