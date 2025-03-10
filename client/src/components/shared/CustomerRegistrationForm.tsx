import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { insertUserSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

export default function CustomerRegistrationForm() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      displayName: "",
      gamingName: "",
      phoneNumber: "",
      role: "customer" as const
    }
  });

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      await apiRequest("POST", "/api/users", data);
      
      toast({
        title: "Success",
        description: "Customer registered successfully"
      });
      
      form.reset();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="gamingName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Gaming Name</FormLabel>
              <FormControl>
                <Input placeholder="ProGamer123" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input placeholder="254700000000" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="referralCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Referral Code (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="Enter referral code if any" {...field} />
              </FormControl>
              <FormMessage />
              <p className="text-xs text-muted-foreground">If referred by a friend, enter their code for bonus points</p>
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Registering..." : "Register Customer"}
        </Button>
      </form>
    </Form>
  );
}
import React from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  displayName: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  gamingName: z.string().min(3, {
    message: "Gaming name must be at least 3 characters.",
  }),
  phoneNumber: z.string().regex(/^254[0-9]{9}$/, {
    message: "Please enter a valid Kenyan phone number starting with 254",
  }),
  referredBy: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CustomerRegistrationFormProps {
  onSuccess: (customer: any) => void;
  onCancel?: () => void;
}

export function CustomerRegistrationForm({ onSuccess, onCancel }: CustomerRegistrationFormProps) {
  const { toast } = useToast();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: "",
      gamingName: "",
      phoneNumber: "254",
      referredBy: "",
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      const response = await apiRequest("POST", "/api/users/register", values);
      
      toast({
        title: "Registration Successful",
        description: `${values.displayName} has been registered successfully!`,
      });
      
      onSuccess(response);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.message || "There was a problem with the registration.",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="gamingName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Gaming Name</FormLabel>
              <FormControl>
                <Input placeholder="ProGamer123" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input placeholder="254700000000" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="referredBy"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Referred By (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="Friend's phone number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex space-x-2 pt-2">
          <Button type="submit">Register Customer</Button>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
