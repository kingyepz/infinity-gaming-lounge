
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface CustomerFormProps {
  onSuccess: (customerData: any) => void;
  onCancel: () => void;
}

export default function CustomerForm({ onSuccess, onCancel }: CustomerFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    gamingName: '',
    phoneNumber: '',
    email: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      
      // Validate form data
      if (!formData.displayName || !formData.phoneNumber) {
        toast({
          title: "Missing required fields",
          description: "Please fill in all required fields",
          variant: "destructive"
        });
        return;
      }
      
      // Simple phone number validation (Kenya number format)
      if (!formData.phoneNumber.match(/^254\d{9}$/)) {
        toast({
          title: "Invalid phone number",
          description: "Please enter a valid phone number in format 254XXXXXXXXX",
          variant: "destructive"
        });
        return;
      }
      
      // In a real implementation, this would call the API to register the customer
      // For now, simulate an API call with a timeout
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock response
      const customerData = {
        ...formData,
        id: Math.floor(Math.random() * 1000),
        points: 0,
        level: "beginner",
        referralCode: `INF${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
        createdAt: new Date()
      };
      
      toast({
        title: "Customer registered successfully",
        description: `${formData.displayName} has been registered with 0 points`,
        variant: "default"
      });
      
      onSuccess(customerData);
    } catch (error) {
      console.error("Customer registration error:", error);
      toast({
        title: "Registration failed",
        description: "An error occurred while registering the customer",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Register New Customer</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Full Name <span className="text-red-500">*</span></Label>
            <Input
              id="displayName"
              name="displayName"
              value={formData.displayName}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="gamingName">Gaming Name</Label>
            <Input
              id="gamingName"
              name="gamingName"
              value={formData.gamingName}
              onChange={handleChange}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number <span className="text-red-500">*</span></Label>
            <Input
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="254XXXXXXXXX"
              required
            />
            <p className="text-xs text-muted-foreground">Format: 254XXXXXXXXX</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Registering..." : "Register Customer"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
