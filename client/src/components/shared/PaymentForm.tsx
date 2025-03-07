import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { PaymentFormData, PaymentResult, processPayment } from '@/lib/payment';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

type PaymentFormProps = {
  initialData?: Partial<PaymentFormData>;
  onSuccess?: (result: PaymentResult) => void;
  onCancel?: () => void;
};

export default function PaymentForm({ 
  initialData = {}, 
  onSuccess,
  onCancel
}: PaymentFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showMpesaPrompt, setShowMpesaPrompt] = useState(false);

  // Define form schema
  const formSchema = z.object({
    customerName: z.string().min(1, "Customer name is required"),
    stationId: z.number().optional(),
    phoneNumber: z.string().min(1, "Phone number is required").regex(/^254\d{9}$/, "Phone number must be in format 254XXXXXXXXX"),
    amount: z.number().min(1, "Amount must be at least 1"),
    paymentMethod: z.enum(["mpesa", "cash", "card"]),
    sessionType: z.enum(["hourly", "per_game", "tournament", "membership"]),
    duration: z.number().optional(),
    gameName: z.string().optional(),
    discountApplied: z.number().min(0).max(100).optional(),
  });

  // Initialize form with react-hook-form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerName: initialData.customerName || "",
      stationId: initialData.stationId,
      phoneNumber: initialData.phoneNumber || "254",
      amount: initialData.amount || 0,
      paymentMethod: initialData.paymentMethod || "cash",
      sessionType: initialData.sessionType || "hourly",
      duration: initialData.duration,
      gameName: initialData.gameName || "",
      discountApplied: initialData.discountApplied || 0,
    },
  });

  const watchPaymentMethod = form.watch("paymentMethod");

  // Handle form submission
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setLoading(true);
    setError(null);

    try {
      // If using M-Pesa and not yet shown the prompt
      if (data.paymentMethod === "mpesa" && !showMpesaPrompt) {
        setShowMpesaPrompt(true);
        setLoading(false);
        return;
      }

      // Process the payment
      console.log("Processing payment with data:", data);
      const result = await processPayment(data as PaymentFormData);

      setSuccess(true);
      setLoading(false);

      // Call the success callback if provided
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err) {
      console.error("Payment error:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      setLoading(false);
    }
  };

  // Get form field errors
  const { errors } = form.formState;

  return (
    <Card className="p-6 max-w-md mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="customerName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter customer name" {...field} />
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
                <FormLabel>Phone Number (for M-Pesa)</FormLabel>
                <FormControl>
                  <Input placeholder="254XXXXXXXXX" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount (KES)</FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    min="0"
                    placeholder="Enter amount" 
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="paymentMethod"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment Method</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="mpesa">M-Pesa</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Conditionally show M-Pesa prompt */}
          {showMpesaPrompt && watchPaymentMethod === "mpesa" && (
            <Alert className="bg-yellow-50 border-yellow-200">
              <AlertDescription>
                A payment request has been sent to your M-Pesa number. Please check your phone and complete the payment.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button 
              type="submit" 
              disabled={loading || (Object.keys(errors).length > 0)}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {watchPaymentMethod === "mpesa" && !showMpesaPrompt 
                ? "Send M-Pesa Request" 
                : "Complete Payment"}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </form>
      </Form>
    </Card>
  );
}