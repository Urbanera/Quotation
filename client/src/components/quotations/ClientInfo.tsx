import { useEffect } from "react";
import { FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Customer } from "@shared/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ClientInfoProps {
  customers: Customer[];
  isLoading: boolean;
  selectedCustomerId: number | null;
  onCustomerSelect: (id: number) => void;
}

export default function ClientInfo({
  customers,
  isLoading,
  selectedCustomerId,
  onCustomerSelect
}: ClientInfoProps) {
  // If there's only one customer, select it by default
  useEffect(() => {
    if (customers.length === 1 && !selectedCustomerId) {
      onCustomerSelect(customers[0].id);
    }
  }, [customers, selectedCustomerId, onCustomerSelect]);

  // Find the selected customer
  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  return (
    <div>
      <h3 className="text-lg leading-6 font-medium text-gray-900">Client Information</h3>
      <div className="mt-4 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
        <div className="sm:col-span-6">
          <FormItem>
            <FormLabel>Customer</FormLabel>
            <Select 
              value={selectedCustomerId?.toString() || ""} 
              onValueChange={(value) => onCustomerSelect(parseInt(value))}
              disabled={isLoading}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id.toString()}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormItem>
        </div>

        {selectedCustomer && (
          <>
            <div className="sm:col-span-3">
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input value={selectedCustomer.name} readOnly />
                </FormControl>
              </FormItem>
            </div>
            <div className="sm:col-span-3">
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input value={selectedCustomer.email} readOnly />
                </FormControl>
              </FormItem>
            </div>
            <div className="sm:col-span-3">
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input value={selectedCustomer.phone} readOnly />
                </FormControl>
              </FormItem>
            </div>
            <div className="sm:col-span-3">
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Input value={selectedCustomer.address} readOnly />
                </FormControl>
              </FormItem>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
