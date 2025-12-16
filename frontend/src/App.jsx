import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthProvider';
import LoginPage from './pages/LoginPage';
import CompanySelectionPage from './pages/CompanySelectionPage';
import DashboardPage from './pages/DashboardPage';
import CompaniesPage from './pages/admin/CompaniesPage';
import UsersPage from './pages/admin/UsersPage';
import CustomersPage from './pages/sales/CustomersPage';
import QuotationsPage from './pages/sales/QuotationsPage';
import QuotationForm from './pages/sales/QuotationForm';
import ProductsPage from './pages/inventory/ProductsPage';
import ProjectsPage from './pages/projects/ProjectsPage';
import ProjectDetailPage from './pages/projects/ProjectDetailPage';
import ContractsPage from './pages/contracts/ContractsPage';
import ContractForm from './pages/contracts/ContractForm';
import ContractDetail from './pages/contracts/ContractDetail';
import SuppliersPage from './pages/purchases/SuppliersPage';
import SupplierForm from './pages/purchases/SupplierForm';
import SupplierDetail from './pages/purchases/SupplierDetail';
import PurchaseOrdersPage from './pages/purchases/PurchaseOrdersPage';
import PurchaseOrderForm from './pages/purchases/PurchaseOrderForm';
import PurchaseOrderDetail from './pages/purchases/PurchaseOrderDetail';
import ReportsPage from './pages/reports/ReportsPage';
import MainLayout from './components/Layout/MainLayout';

// Layout para rutas que requieren autenticación
const ProtectedLayout = () => {
  const { user, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">Cargando...</div>;

  return user ? <Outlet /> : <Navigate to="/login" />;
};

// Layout para rutas que requieren empresa seleccionada
const CompanyLayout = () => {
  const { selectedCompany, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">Cargando...</div>;

  return selectedCompany ? <Outlet /> : <Navigate to="/companies" />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedLayout />}>
            <Route path="/companies" element={<CompanySelectionPage />} />

            <Route element={<CompanyLayout />}>
              <Route element={<MainLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/customers" element={<CustomersPage />} />
                <Route path="/quotations" element={<QuotationsPage />} />
                <Route path="/quotations/new" element={<QuotationForm />} />
                <Route path="/quotations/:id" element={<QuotationForm />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/projects" element={<ProjectsPage />} />
                <Route path="/projects/:id" element={<ProjectDetailPage />} />
                <Route path="/admin/users" element={<UsersPage />} />
                <Route path="/admin/companies" element={<CompaniesPage />} />
                <Route path="/contracts" element={<ContractsPage />} />
                <Route path="/contracts/new" element={<ContractForm />} />
                <Route path="/contracts/:id" element={<ContractDetail />} />
                <Route path="/contracts/:id/edit" element={<ContractForm />} />
                <Route path="/suppliers" element={<SuppliersPage />} />
                <Route path="/suppliers/new" element={<SupplierForm />} />
                <Route path="/suppliers/:id" element={<SupplierDetail />} />
                <Route path="/suppliers/:id/edit" element={<SupplierForm />} />

                <Route path="/purchase-orders" element={<PurchaseOrdersPage />} />
                <Route path="/purchase-orders/new" element={<PurchaseOrderForm />} />
                <Route path="/purchase-orders/:id" element={<PurchaseOrderDetail />} />
                <Route path="/purchase-orders/:id/edit" element={<PurchaseOrderForm />} />
                <Route path="/reports" element={<ReportsPage />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;