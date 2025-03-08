
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useToast } from '../../components/ui/use-toast';
import PaymentModal from '../../components/shared/PaymentModal';
import BonusGameNotification from '../../components/shared/BonusGameNotification';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { GameSession, UserWithoutPassword } from '../../../shared/schema';

export default function POSDashboard() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('gaming');
  const [users, setUsers] = useState<UserWithoutPassword[]>([]);
  const [gameSessions, setGameSessions] = useState<GameSession[]>([]);
  const [filteredUser, setFilteredUser] = useState<UserWithoutPassword | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserWithoutPassword | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentDescription, setPaymentDescription] = useState('');
  const [showBonusGame, setShowBonusGame] = useState(false);
  const [bonusGameType, setBonusGameType] = useState<string>('');
  const [streakCount, setStreakCount] = useState(0);
  const [activeUserStreaks, setActiveUserStreaks] = useState<{[key: number]: string[]}>({});

  useEffect(() => {
    // Fetch users and active game sessions
    fetchUsers();
    fetchGameSessions();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        toast({ title: 'Error', description: 'Failed to fetch users', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({ title: 'Error', description: 'Network error', variant: 'destructive' });
    }
  };

  const fetchGameSessions = async () => {
    try {
      const response = await fetch('/api/game-sessions');
      if (response.ok) {
        const data = await response.json();
        setGameSessions(data);
        
        // Calculate active streaks for users
        const streaks: {[key: number]: string[]} = {};
        data.forEach((session: GameSession) => {
          if (!session.endTime) {
            if (!streaks[session.userId]) {
              streaks[session.userId] = [];
            }
            streaks[session.userId].push(session.gameType);
          }
        });
        setActiveUserStreaks(streaks);
      } else {
        toast({ title: 'Error', description: 'Failed to fetch game sessions', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error fetching game sessions:', error);
      toast({ title: 'Error', description: 'Network error', variant: 'destructive' });
    }
  };

  const handleSearch = () => {
    const foundUser = users.find(
      (user) => 
        user.phoneNumber === searchQuery || 
        user.gamingName.toLowerCase() === searchQuery.toLowerCase()
    );
    
    setFilteredUser(foundUser || null);
    
    if (!foundUser) {
      toast({
        title: 'User Not Found',
        description: 'No user found with that phone number or gaming name',
        variant: 'destructive'
      });
    }
  };

  const startGameSession = async (user: UserWithoutPassword, gameType: string) => {
    try {
      // Check if user already has an active session
      const activeSession = gameSessions.find(
        session => session.userId === user.id && !session.endTime
      );
      
      if (activeSession) {
        toast({
          title: 'Active Session Exists',
          description: `${user.displayName} already has an active ${activeSession.gameType} session`,
          variant: 'destructive'
        });
        return;
      }
      
      // Initialize game cost and points
      let cost = 40; // Default cost for single games
      let pointsEarned = 5; // Default points earned
      
      // Check if user will achieve a streak with this game
      let isPartOfStreak = false;
      let streakSessionId = null;
      
      if (activeUserStreaks[user.id]) {
        const streak = [...activeUserStreaks[user.id], gameType];
        if (streak.length === 5) {
          // User completes a streak of 5 games
          cost = 200;
          pointsEarned = 25;
          isPartOfStreak = true;
          
          // Award bonus game
          setBonusGameType(gameType);
          setShowBonusGame(true);
        } else if (streak.length < 5) {
          // Track that this is part of a potential streak
          isPartOfStreak = true;
        }
      }
      
      // Create the game session
      const response = await fetch('/api/game-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user.id,
          gameType,
          startTime: new Date(),
          endTime: null,
          pointsEarned: null, // Will be calculated on session end
          cost,
          isPartOfStreak,
          streakSessionId
        })
      });
      
      if (response.ok) {
        const newSession = await response.json();
        setGameSessions([...gameSessions, newSession]);
        
        // Update active streaks
        const updatedStreaks = { ...activeUserStreaks };
        if (!updatedStreaks[user.id]) {
          updatedStreaks[user.id] = [];
        }
        updatedStreaks[user.id].push(gameType);
        setActiveUserStreaks(updatedStreaks);
        
        // Show payment modal
        setCurrentUser(user);
        setPaymentAmount(cost);
        setPaymentDescription(`${gameType} gaming session`);
        setShowPaymentModal(true);
        
        toast({
          title: 'Session Started',
          description: `Started ${gameType} session for ${user.displayName}`
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to start game session',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error starting game session:', error);
      toast({
        title: 'Error',
        description: 'Failed to start game session',
        variant: 'destructive'
      });
    }
  };

  const endGameSession = async (sessionId: number) => {
    try {
      const session = gameSessions.find(s => s.id === sessionId);
      if (!session) {
        toast({
          title: 'Error',
          description: 'Session not found',
          variant: 'destructive'
        });
        return;
      }
      
      const response = await fetch(`/api/game-sessions/${sessionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          endTime: new Date(),
          pointsEarned: session.pointsEarned || 5 // Use default if not set
        })
      });
      
      if (response.ok) {
        const updatedSession = await response.json();
        setGameSessions(gameSessions.map(s => s.id === sessionId ? updatedSession : s));
        
        // Update active streaks
        const updatedStreaks = { ...activeUserStreaks };
        if (updatedStreaks[session.userId]) {
          const index = updatedStreaks[session.userId].indexOf(session.gameType);
          if (index > -1) {
            updatedStreaks[session.userId].splice(index, 1);
          }
          if (updatedStreaks[session.userId].length === 0) {
            delete updatedStreaks[session.userId];
          }
        }
        setActiveUserStreaks(updatedStreaks);
        
        toast({
          title: 'Session Ended',
          description: `Ended ${session.gameType} session`
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to end game session',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error ending game session:', error);
      toast({
        title: 'Error',
        description: 'Failed to end game session',
        variant: 'destructive'
      });
    }
  };

  const handlePaymentComplete = async (paymentMethod: string) => {
    if (!currentUser) return;
    
    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: currentUser.id,
          amount: paymentAmount,
          paymentMethod,
          description: paymentDescription,
          pointsEarned: paymentAmount === 200 ? 25 : 5 // 25 points for 200 KES, 5 points for single games
        })
      });
      
      if (response.ok) {
        toast({
          title: 'Payment Recorded',
          description: `Payment of ${paymentAmount} KES processed via ${paymentMethod}`
        });
        
        // Update user with new points
        fetchUsers();
      } else {
        toast({
          title: 'Error',
          description: 'Failed to record payment',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error recording payment:', error);
      toast({
        title: 'Error',
        description: 'Failed to record payment',
        variant: 'destructive'
      });
    }
    
    setShowPaymentModal(false);
  };

  const renderActiveSessions = () => {
    const activeSessions = gameSessions.filter(session => !session.endTime);
    
    if (activeSessions.length === 0) {
      return (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">No active gaming sessions</p>
          </CardContent>
        </Card>
      );
    }
    
    return activeSessions.map(session => {
      const user = users.find(u => u.id === session.userId);
      return (
        <Card key={session.id} className="mb-4">
          <CardHeader>
            <CardTitle>{user ? user.displayName : 'Unknown User'}</CardTitle>
            <CardDescription>
              {user?.gamingName} • {session.gameType}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Started: {new Date(session.startTime).toLocaleTimeString()}</p>
            {session.isPartOfStreak && (
              <p className="text-green-500">Part of streak session</p>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={() => endGameSession(session.id)}>End Session</Button>
          </CardFooter>
        </Card>
      );
    });
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Infinity Gaming Lounge POS</h1>
      
      <Tabs defaultValue="gaming" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="gaming">Gaming Sessions</TabsTrigger>
          <TabsTrigger value="food">Food & Drinks</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="membership">Membership</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        
        <TabsContent value="gaming">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column: Customer Lookup */}
            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Customer Lookup</CardTitle>
                  <CardDescription>Find customer by phone or gaming name</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Input
                      placeholder="Phone number or gaming name"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Button onClick={handleSearch} className="w-full">Search</Button>
                  </div>
                  
                  {filteredUser && (
                    <div className="mt-4 p-4 border rounded-lg">
                      <h3 className="font-bold">{filteredUser.displayName}</h3>
                      <p>Gaming Name: {filteredUser.gamingName}</p>
                      <p>Points: {filteredUser.points}</p>
                      <div className="grid grid-cols-2 gap-2 mt-4">
                        <Button 
                          onClick={() => startGameSession(filteredUser, 'fc25')}
                          className="text-xs"
                        >
                          Start FC25
                        </Button>
                        <Button 
                          onClick={() => startGameSession(filteredUser, 'fc26')}
                          className="text-xs"
                        >
                          Start FC26
                        </Button>
                        <Button 
                          onClick={() => startGameSession(filteredUser, 'nba2k')}
                          className="text-xs"
                        >
                          Start NBA2K
                        </Button>
                        <Button 
                          onClick={() => startGameSession(filteredUser, 'other')}
                          className="text-xs"
                        >
                          Start Other
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Middle Column: Active Sessions */}
            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Active Sessions</CardTitle>
                  <CardDescription>Currently active gaming sessions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {renderActiveSessions()}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Right Column: Streaks & Bonuses */}
            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Streaks & Bonuses</CardTitle>
                  <CardDescription>Track customer game streaks</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(activeUserStreaks).length === 0 ? (
                      <p className="text-center text-gray-500">No active streaks</p>
                    ) : (
                      Object.entries(activeUserStreaks).map(([userId, games]) => {
                        const user = users.find(u => u.id === parseInt(userId));
                        return (
                          <div key={userId} className="p-3 border rounded-lg">
                            <h3 className="font-bold">{user?.displayName || 'Unknown User'}</h3>
                            <p>Streak: {games.length} / 5 games</p>
                            <div className="flex mt-2 gap-1">
                              {games.map((game, index) => (
                                <span 
                                  key={index} 
                                  className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs"
                                >
                                  {game}
                                </span>
                              ))}
                              {Array(5 - games.length).fill(0).map((_, index) => (
                                <span 
                                  key={`empty-${index}`} 
                                  className="px-2 py-1 bg-gray-100 text-gray-400 rounded text-xs"
                                >
                                  ?
                                </span>
                              ))}
                            </div>
                            {games.length === 5 && (
                              <p className="text-green-500 mt-2 font-bold">Streak Complete!</p>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="food">
          <Card>
            <CardHeader>
              <CardTitle>Food & Drinks</CardTitle>
              <CardDescription>Manage food and drink orders</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Food and drinks ordering functionality will be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="inventory">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Management</CardTitle>
              <CardDescription>Track and manage inventory</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Inventory management functionality will be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="membership">
          <Card>
            <CardHeader>
              <CardTitle>Membership Management</CardTitle>
              <CardDescription>Manage customer memberships and loyalty</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Membership management functionality will be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Reports</CardTitle>
              <CardDescription>View business reports and analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Reports and analytics functionality will be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Payment Modal */}
      {showPaymentModal && currentUser && (
        <PaymentModal
          user={currentUser}
          amount={paymentAmount}
          description={paymentDescription}
          onPaymentComplete={handlePaymentComplete}
          onCancel={() => setShowPaymentModal(false)}
        />
      )}
      
      {/* Bonus Game Notification */}
      {showBonusGame && (
        <BonusGameNotification
          gameType={bonusGameType}
          onClose={() => setShowBonusGame(false)}
        />
      )}
    </div>
  );
}
