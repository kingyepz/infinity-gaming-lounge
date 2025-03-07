
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface RegisterFormProps {
  onSuccess?: (userData: any) => void;
  onCancel?: () => void;
}

export default function RegisterForm({ onSuccess, onCancel }: RegisterFormProps) {
  const [formData, setFormData] = useState({
    displayName: "",
    gamingName: "",
    phoneNumber: "",
    referredBy: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate phone number
      if (!formData.phoneNumber.match(/^254\d{9}$/)) {
        toast({
          title: "Invalid Phone Number",
          description: "Please enter a valid phone number starting with 254",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      const response = await fetch("/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Registration failed");
      }

      const userData = await response.json();
      
      toast({
        title: "Registration Successful",
        description: "Your account has been created successfully!"
      });

      if (onSuccess) {
        onSuccess(userData);
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="displayName">Full Name</Label>
        <Input
          id="displayName"
          name="displayName"
          value={formData.displayName}
          onChange={handleChange}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="gamingName">Gaming Name/Nickname</Label>
        <Input
          id="gamingName"
          name="gamingName"
          value={formData.gamingName}
          onChange={handleChange}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phoneNumber">Phone Number (format: 254XXXXXXXXX)</Label>
        <Input
          id="phoneNumber"
          name="phoneNumber"
          value={formData.phoneNumber}
          onChange={handleChange}
          placeholder="e.g. 254700000000"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="referredBy">Referred By (Phone Number - Optional)</Label>
        <Input
          id="referredBy"
          name="referredBy"
          value={formData.referredBy}
          onChange={handleChange}
          placeholder="e.g. 254700000000"
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Registering..." : "Register"}
        </Button>
      </div>
    </form>
  );
}
