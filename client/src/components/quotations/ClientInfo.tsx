import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Customer } from "@shared/schema";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

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
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // If there's only one customer, select it by default
  useEffect(() => {
    if (customers.length === 1 && !selectedCustomerId) {
      onCustomerSelect(customers[0].id);
    }
  }, [customers, selectedCustomerId, onCustomerSelect]);

  // Find the selected customer
  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
  
  // Filter customers based on search query
  const filteredCustomers = searchQuery === ""
    ? customers
    : customers.filter((customer) => {
        const searchLower = searchQuery.toLowerCase();
        return (
          customer.name.toLowerCase().includes(searchLower) ||
          customer.email.toLowerCase().includes(searchLower) ||
          customer.phone.toLowerCase().includes(searchLower) ||
          customer.id.toString().includes(searchLower)
        );
      });

  return (
    <div>
      <h3 className="text-lg leading-6 font-medium text-gray-900">Client Information</h3>
      <div className="mt-4 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
        <div className="sm:col-span-6">
          <div className="grid gap-1.5">
            <Label htmlFor="customer-select">Customer</Label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  id="customer-select"
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between"
                  disabled={isLoading}
                >
                  {selectedCustomer
                    ? `${selectedCustomer.name} (ID: ${selectedCustomer.id})`
                    : "Search a customer by name or ID..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput 
                    placeholder="Search customer..." 
                    value={searchQuery}
                    onValueChange={setSearchQuery}
                  />
                  <CommandEmpty>No customer found.</CommandEmpty>
                  <CommandGroup className="max-h-64 overflow-auto">
                    {filteredCustomers.map((customer) => (
                      <CommandItem
                        key={customer.id}
                        value={customer.id.toString()}
                        onSelect={(value: string) => {
                          onCustomerSelect(parseInt(value));
                          setOpen(false);
                          setSearchQuery("");
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedCustomerId === customer.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {customer.name} (ID: {customer.id})
                        <span className="ml-2 text-xs text-gray-500">{customer.phone}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
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