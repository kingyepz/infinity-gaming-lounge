import { useState } from "react";
import { Link, useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";

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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

// Icons
import {
  ArrowLeft,
  FilePlus,
  Gamepad2,
  ListPlus,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";

// Form validation
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

// Custom components
import GameCatalogSection from "@/components/pos/GameCatalogSection";

// Game type definition - matches the schema in shared/schema.ts
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

// Form validation schema for game
const gameFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  pricePerSession: z.coerce.number().min(0, "Price must be positive"),
  pricePerHour: z.coerce.number().min(0, "Price must be positive"),
  isActive: z.boolean().default(true),
});

type GameFormValues = z.infer<typeof gameFormSchema>;

export default function GameCatalog() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("catalog");
  const [showAddGameDialog, setShowAddGameDialog] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  // Form for adding/editing games
  const form = useForm<GameFormValues>({
    resolver: zodResolver(gameFormSchema),
    defaultValues: {
      name: "",
      description: "",
      pricePerSession: 0,
      pricePerHour: 0,
      isActive: true,
    },
  });

  // Handle game selection from catalog
  const handleSelectGame = (game: Game, pricingType: "hourly" | "perGame") => {
    // For the moment, just show a toast - this would be expanded in the future
    toast({
      title: `Selected ${game.name}`,
      description: `Using ${pricingType} pricing at ${
        pricingType === "hourly" ? game.pricePerHour : game.pricePerSession
      } KES`,
    });
  };

  // Create a new game
  const handleCreateGame = async (values: GameFormValues) => {
    setIsSubmitting(true);
    try {
      await apiRequest({
        path: "/api/games",
        method: "POST",
        data: values
      });

      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      setShowAddGameDialog(false);
      toast({
        title: "Game Created",
        description: `${values.name} has been added to the catalog`,
      });
      form.reset();
    } catch (error) {
      toast({
        title: "Error Creating Game",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update an existing game
  const handleUpdateGame = async (values: GameFormValues) => {
    if (!editingGame) return;
    setIsSubmitting(true);
    try {
      await apiRequest({
        path: `/api/games/${editingGame.id}`,
        method: "PATCH",
        data: values
      });

      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      setShowAddGameDialog(false);
      toast({
        title: "Game Updated",
        description: `${values.name} has been updated`,
      });
      setEditingGame(null);
      form.reset();
    } catch (error) {
      toast({
        title: "Error Updating Game",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete a game
  const handleDeleteGame = async () => {
    if (!editingGame) return;
    setIsSubmitting(true);
    try {
      await apiRequest({
        path: `/api/games/${editingGame.id}`,
        method: "DELETE"
      });

      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      setShowAddGameDialog(false);
      toast({
        title: "Game Deleted",
        description: `${editingGame.name} has been removed from the catalog`,
      });
      setEditingGame(null);
      form.reset();
    } catch (error) {
      toast({
        title: "Error Deleting Game",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open the dialog for editing a game
  const handleEditGameClick = (game: Game) => {
    setEditingGame(game);
    form.reset({
      name: game.name,
      description: game.description || "",
      pricePerSession: game.pricePerSession,
      pricePerHour: game.pricePerHour,
      isActive: game.isActive,
    });
    setShowAddGameDialog(true);
  };

  // Open the dialog for creating a new game
  const handleAddGameClick = () => {
    setEditingGame(null);
    form.reset({
      name: "",
      description: "",
      pricePerSession: 0,
      pricePerHour: 0,
      isActive: true,
    });
    setShowAddGameDialog(true);
  };

  return (
    <div className="flex h-screen">
      <Sidebar onLogout={handleLogout} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate("/pos")}
                className="mr-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-2xl font-bold flex items-center">
                <Gamepad2 className="mr-2 h-6 w-6 text-primary" />
                Game Catalog
              </h1>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddGameClick} className="gap-1">
                <Plus className="h-4 w-4" />
                Add Game
              </Button>
            </div>
          </div>

          <Tabs 
            defaultValue="catalog"
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="catalog">Catalog View</TabsTrigger>
              <TabsTrigger value="management">Management</TabsTrigger>
            </TabsList>
            
            <TabsContent 
              value="catalog" 
              className="bg-black/10 rounded-lg mt-4 p-4"
            >
              <GameCatalogSection 
                onSelectGame={handleSelectGame}
                showTitle={false}
              />
            </TabsContent>
            
            <TabsContent 
              value="management" 
              className="mt-4"
            >
              <GameManagementTab onEditGame={handleEditGameClick} />
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Add/Edit Game Dialog */}
      <Dialog open={showAddGameDialog} onOpenChange={setShowAddGameDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingGame ? "Edit Game" : "Add New Game"}
            </DialogTitle>
            <DialogDescription>
              {editingGame
                ? "Update the game details and pricing"
                : "Fill in the game details to add it to your catalog"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(
                editingGame ? handleUpdateGame : handleCreateGame
              )}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Game Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter game name"
                        autoComplete="off"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter game description (optional)"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="pricePerSession"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price Per Session (KES)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          step={100}
                          placeholder="0"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pricePerHour"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price Per Hour (KES)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          step={100}
                          placeholder="0"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Active Status</FormLabel>
                      <FormDescription>
                        Inactive games will not appear in the catalog
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter className="mt-6 gap-2">
                {editingGame && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDeleteGame}
                    disabled={isSubmitting}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddGameDialog(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                  {editingGame ? "Update Game" : "Add Game"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Game Management Tab Component
function GameManagementTab({ onEditGame }: { onEditGame: (game: Game) => void }) {
  const { data: games = [], isLoading } = useQuery({
    queryKey: ["/api/games"],
    queryFn: async () => {
      const response = await apiRequest<Game[]>({
        path: "/api/games"
      });
      return response;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-4 flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-9 w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="border border-dashed rounded-lg p-8 text-center">
        <Gamepad2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium mb-2">No Games Available</h3>
        <p className="text-sm text-gray-400 mb-4">
          Your game catalog is empty. Add your first game to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {games.map((game) => (
        <Card
          key={game.id}
          className={`bg-black/10 ${!game.isActive && "border-red-900/40 bg-red-900/5"}`}
        >
          <div className="p-4 sm:p-6 flex items-center justify-between flex-wrap gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-lg">{game.name}</h3>
                {!game.isActive && (
                  <Badge variant="outline" className="text-xs bg-red-900/20 border-red-900/30">
                    Inactive
                  </Badge>
                )}
              </div>
              {game.description && (
                <p className="text-sm text-gray-400 line-clamp-1 max-w-md">
                  {game.description}
                </p>
              )}
              <div className="flex items-center gap-4 mt-1">
                <div className="text-sm flex items-center">
                  <span className="text-gray-400 mr-1">Per Game:</span>
                  <span className="font-medium">KES {game.pricePerSession.toLocaleString()}</span>
                </div>
                <div className="text-sm flex items-center">
                  <span className="text-gray-400 mr-1">Per Hour:</span>
                  <span className="font-medium">KES {game.pricePerHour.toLocaleString()}</span>
                </div>
              </div>
            </div>
            <Button onClick={() => onEditGame(game)}>Edit</Button>
          </div>
        </Card>
      ))}
    </div>
  );
}