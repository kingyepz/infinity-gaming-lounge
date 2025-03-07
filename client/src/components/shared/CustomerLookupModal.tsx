
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import RegisterForm from "@/components/customer/RegisterForm";

interface CustomerLookupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectCustomer: (customer: any) => void;
}

export default function CustomerLookupModal({ 
  open, 
  onOpenChange, 
  onSelectCustomer 
}: CustomerLookupModalProps) {
  const [activeTab, setActiveTab] = useState("search");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<any>(null);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!phoneNumber) {
      toast({
        title: "Phone Number Required",
        description: "Please enter a phone number to search",
        variant: "destructive"
      });
      return;
    }

    setIsSearching(true);
    try {
      // In a real app, this would be an API call
      const response = await fetch(`/api/users/phone/${phoneNumber}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          toast({
            title: "Customer Not Found",
            description: "No customer found with that phone number"
          });
          setSearchResult(null);
          return;
        }
        throw new Error("Search failed");
      }

      const customer = await response.json();
      setSearchResult(customer);
      
    } catch (error) {
      console.error("Customer search error:", error);
      
      // For demo purposes, create a mock customer if not found
      if (phoneNumber === "254700000000") {
        setSearchResult({
          id: 1,
          displayName: "John Doe",
          gamingName: "JDGamer",
          phoneNumber: "254700000000",
          role: "customer",
          points: 750
        });
      } else {
        toast({
          title: "Search Failed",
          description: "Error searching for customer. Try 254700000000 for demo.",
          variant: "destructive"
        });
        setSearchResult(null);
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectCustomer = () => {
    if (searchResult) {
      onSelectCustomer(searchResult);
      onOpenChange(false);
    }
  };

  const handleRegistrationSuccess = (userData: any) => {
    toast({
      title: "Customer Registered",
      description: "The customer has been registered successfully!"
    });
    onSelectCustomer(userData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Customer Management</DialogTitle>
          <DialogDescription>
            Look up an existing customer or register a new one
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="search">Search</TabsTrigger>
            <TabsTrigger value="register">Register New</TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="phone-search">Phone Number</Label>
              <div className="flex space-x-2">
                <Input
                  id="phone-search"
                  placeholder="e.g. 254700000000"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
                <Button onClick={handleSearch} disabled={isSearching}>
                  {isSearching ? "Searching..." : "Search"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Demo: Try 254700000000 for test customer
              </p>
            </div>

            {searchResult && (
              <div className="border rounded-md p-4 mt-4">
                <h3 className="font-medium">{searchResult.displayName}</h3>
                <p className="text-sm text-muted-foreground">
                  Gaming Name: {searchResult.gamingName}
                </p>
                <p className="text-sm text-muted-foreground">
                  Phone: {searchResult.phoneNumber}
                </p>
                <p className="text-sm text-muted-foreground">
                  Loyalty Points: {searchResult.points || 0}
                </p>
                <Button 
                  className="w-full mt-2" 
                  onClick={handleSelectCustomer}
                >
                  Select Customer
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="register">
            <RegisterForm 
              onSuccess={handleRegistrationSuccess}
              onCancel={() => setActiveTab("search")}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
