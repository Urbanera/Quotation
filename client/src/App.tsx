import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import MainLayout from "./components/layout/MainLayout";
import Dashboard from "./pages/dashboard";
import CustomersList from "./pages/customers";
import AddCustomer from "./pages/customers/add";
import EditCustomer from "./pages/customers/edit";
import QuotationsList from "./pages/quotations";
import CreateQuotation from "./pages/quotations/create";
import EditQuotation from "./pages/quotations/edit";
import ViewQuotation from "./pages/quotations/view";
import NotFound from "./pages/not-found";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MainLayout>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/customers" component={CustomersList} />
          <Route path="/customers/add" component={AddCustomer} />
          <Route path="/customers/edit/:id" component={EditCustomer} />
          <Route path="/quotations" component={QuotationsList} />
          <Route path="/quotations/create" component={CreateQuotation} />
          <Route path="/quotations/edit/:id" component={EditQuotation} />
          <Route path="/quotations/view/:id" component={ViewQuotation} />
          <Route component={NotFound} />
        </Switch>
      </MainLayout>
    </QueryClientProvider>
  );
}

export default App;
