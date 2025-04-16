import { useEffect } from "react";
import { Label } from "@/components/ui/label";
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
          <div className="grid gap-1.5">
            <Label htmlFor="customer-select">Customer</Label>
            <Select 
              value={selectedCustomerId?.toString() || ""} 
              onValueChange={(value) => onCustomerSelect(parseInt(value))}
              disabled={isLoading}
            >
              <SelectTrigger id="customer-select">
                <SelectValue placeholder="Select a customer" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id.toString()}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedCustomer && (
          <>
            <div className="sm:col-span-3">
              <div className="grid gap-1.5">
                <Label htmlFor="customer-name">Name</Label>
                <Input id="customer-name" value={selectedCustomer.name} readOnly />
              </div>
            </div>
            <div className="sm:col-span-3">
              <div className="grid gap-1.5">
                <Label htmlFor="customer-email">Email</Label>
                <Input id="customer-email" value={selectedCustomer.email} readOnly />
              </div>
            </div>
            <div className="sm:col-span-3">
              <div className="grid gap-1.5">
                <Label htmlFor="customer-phone">Phone</Label>
                <Input id="customer-phone" value={selectedCustomer.phone} readOnly />
              </div>
            </div>
            <div className="sm:col-span-3">
              <div className="grid gap-1.5">
                <Label htmlFor="customer-address">Address</Label>
                <Input id="customer-address" value={selectedCustomer.address} readOnly />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}