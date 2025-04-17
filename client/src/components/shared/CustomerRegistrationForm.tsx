import React from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button"; // Import Button from the correct path
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from '@/hooks/use-toast';
// Define the form schema using zod
const formSchema = z.object({
  displayName: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  gamingName: z.string().min(3, {
    message: "Gaming name must be at least 3 characters.",
  }),
  phoneNumber: z.string().regex(/^254[0-9]{9}$/, { message: "Please enter a valid Kenyan phone number (e.g., 254700000000)"

  }),
  referredBy: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

// Define a type for the Customer object returned by the API
interface Customer {
  id: number;
  displayName: string;
  gamingName: string;
  phoneNumber: string;
  referredBy?: string;
}

// Define the props for the CustomerRegistrationForm component
interface CustomerRegistrationFormProps {
  onSuccess: (customer: Customer) => void;
  onCancel?: () => void;
}

export const CustomerRegistrationForm = ({ onSuccess, onCancel }: CustomerRegistrationFormProps) => {
  const { toast } = useToast()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: "",
      gamingName: "",
      phoneNumber: "254",
    },
  });


  async function onSubmit(values: FormValues) {
    try {
      const response = await apiRequest({
        path: "/api/users/create",
        method: "POST",
        data: values
      })


      onSuccess(response);
    } catch (error:any) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.response?.data?.message||"There was a problem with the registration.",

      });

    }
  }

  return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" >

        <FormField
          control={form.control}
            name="displayName"
          render={({ field }) => (
            <FormItem >
              <FormLabel >Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field}  />
                </FormControl>
                 {form.formState.errors.displayName?.message && <FormMessage>{form.formState.errors.displayName?.message}</FormMessage>}
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
            name="gamingName"
          render={({ field }) => (
            <FormItem >
              <FormLabel htmlFor="gamingName">Gaming Name</FormLabel>
                <FormControl>
                  <Input placeholder="ProGamer123" {...field}/>
                </FormControl>
                {form.formState.errors.gamingName?.message && <FormMessage>{form.formState.errors.gamingName?.message}</FormMessage>}
            </FormItem>
          )}
        /> 

        <FormField
          control={form.control}
            name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="phoneNumber">Phone Number</FormLabel>
              <FormControl>
                <Input placeholder="254700000000" {...field}/>
              </FormControl>
              {form.formState.errors.phoneNumber?.message && <FormMessage>{form.formState.errors.phoneNumber?.message}</FormMessage>}
            </FormItem>
          )} />

        <FormField
          control={form.control}
          name="referredBy"
          render={({ field }) => (
              <FormItem>
              <FormLabel htmlFor="referredBy">Referred By (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="Friend's phone number" {...field} value={field.value ?? ""} />
              </FormControl>
              {form.formState.errors.referredBy?.message && <FormMessage>{form.formState.errors.referredBy?.message}</FormMessage>}
            </FormItem>
          )} />

      {/* Submit and Cancel Buttons */}
        <div className="flex space-x-2 pt-2"> 
          <Button type="submit" disabled={form.formState.isSubmitting}>Register Customer</Button>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
};
