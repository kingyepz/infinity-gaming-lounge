
import React, { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Customer {
  id: number;
  displayName: string;
  gamingName: string;
  phoneNumber: string;
  points: number;
}

interface CustomerSelectorProps {
  onSelectCustomer: (customer: Customer) => void;
  onRegisterNewCustomer?: () => void;
}

export function CustomerSelector({ onSelectCustomer, onRegisterNewCustomer }: CustomerSelectorProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchCustomers() {
      try {
        const data = await apiRequest({ path: '/api/users/customers' });
        setCustomers(data);
        setFilteredCustomers(data);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch customers:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load customers"
        });
        setLoading(false);
      }
    }

    fetchCustomers();
  }, [toast]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredCustomers(customers);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredCustomers(
        customers.filter(
          c => 
            c.displayName.toLowerCase().includes(term) || 
            c.gamingName.toLowerCase().includes(term) ||
            c.phoneNumber.includes(term)
        )
      );
    }
  }, [searchTerm, customers]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input 
          placeholder="Search customers..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        {onRegisterNewCustomer && (
          <Button onClick={onRegisterNewCustomer} variant="outline">
            New Customer
          </Button>
        )}
      </div>
      
      {loading ? (
        <div className="flex justify-center py-4">Loading customers...</div>
      ) : filteredCustomers.length === 0 ? (
        <div className="flex flex-col items-center py-4 text-center">
          <p className="text-muted-foreground">No customers found</p>
          {searchTerm && (
            <Button 
              variant="ghost" 
              className="mt-2" 
              onClick={() => setSearchTerm('')}
            >
              Clear search
            </Button>
          )}
        </div>
      ) : (
        <ScrollArea className="h-[300px] rounded-md border">
          <div className="p-4 space-y-2">
            {filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                onClick={() => onSelectCustomer(customer)}
                className="p-3 rounded-md cursor-pointer hover:bg-primary/10 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{customer.displayName}</p>
                    <p className="text-sm text-muted-foreground">@{customer.gamingName}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{customer.points} points</Badge>
                    <Badge variant="secondary">{customer.phoneNumber}</Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
