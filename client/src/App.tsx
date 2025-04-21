import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import MainLayout from "./components/layout/MainLayout";
import Dashboard from "./pages/dashboard";
import CustomersList from "./pages/customers";
import AddCustomer from "./pages/customers/add";
import EditCustomer from "./pages/customers/edit";
import CustomerDetailPage from "./pages/customers/detail";
import QuotationsList from "./pages/quotations";
import CreateQuotation from "./pages/quotations/create";
import EditQuotation from "./pages/quotations/edit";
import ViewQuotation from "./pages/quotations/view";
import SalesOrdersPage from "./pages/sales-orders";
import CreateSalesOrder from "./pages/sales-orders/create";
import ViewSalesOrder from "./pages/sales-orders/view";
import SalesOrderPaymentsPage from "./pages/sales-orders/payments";
import AddPaymentPage from "./pages/sales-orders/payments/add";
import PaymentsPage from "./pages/payments";
import CreatePaymentPage from "./pages/payments/create";
import ViewPaymentPage from "./pages/payments/view";
import AccessoryCatalogPage from "./pages/accessories";
import UsersPage from "./pages/users/UsersPage";
import TeamsPage from "./pages/teams/TeamsPage";
import TeamDetailsPage from "./pages/teams/TeamDetailsPage";
import SettingsPage from "./pages/settings";
import NotFound from "./pages/not-found";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MainLayout>
        <Switch>
          <Route path="/" component={Dashboard} />
          
          {/* Customer Routes */}
          <Route path="/customers" component={CustomersList} />
          <Route path="/customers/add" component={AddCustomer} />
          <Route path="/customers/edit/:id" component={EditCustomer} />
          <Route path="/customers/view/:id" component={CustomerDetailPage} />
          
          {/* Quotation Routes */}
          <Route path="/quotations" component={QuotationsList} />
          <Route path="/quotations/create" component={CreateQuotation} />
          <Route path="/quotations/edit/:id" component={EditQuotation} />
          <Route path="/quotations/view/:id" component={ViewQuotation} />
          
          {/* Sales Order Routes */}
          <Route path="/sales-orders" component={SalesOrdersPage} />
          <Route path="/sales-orders/create/:quotationId" component={CreateSalesOrder} />
          <Route path="/sales-orders/view/:id" component={ViewSalesOrder} />
          <Route path="/sales-orders/:id/payments" component={SalesOrderPaymentsPage} />
          <Route path="/sales-orders/:id/payments/add" component={AddPaymentPage} />
          
          {/* Payment Routes */}
          <Route path="/payments" component={PaymentsPage} />
          <Route path="/payments/create" component={CreatePaymentPage} />
          <Route path="/payments/view/:id" component={ViewPaymentPage} />
          
          {/* Other Routes */}
          <Route path="/accessories" component={AccessoryCatalogPage} />
          <Route path="/users" component={UsersPage} />
          <Route path="/teams" component={TeamsPage} />
          <Route path="/teams/:id" component={TeamDetailsPage} />
          <Route path="/settings" component={SettingsPage} />
          <Route component={NotFound} />
        </Switch>
      </MainLayout>
    </QueryClientProvider>
  );
}

export default App;
