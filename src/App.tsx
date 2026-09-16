import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AccessibilityProvider } from "@/hooks/useAccessibility";
import { LanguageProvider } from "@/hooks/useLanguage";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AdminDashboard from "./pages/admin/AdminDashboard";
import WaiterPanel from "./pages/admin/WaiterPanel";
import MenuManagement from "./pages/admin/MenuManagement";
import QRCodeGenerator from "./pages/admin/QRCodeGenerator";
import WaiterReport from "./pages/admin/WaiterReport";
import SuperAdminDashboard from "./pages/admin/SuperAdminDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <AccessibilityProvider>
          <AuthProvider>
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/:restaurantSlug" element={<Index />} />

                <Route path="/login" element={<Login />} />
                <Route path="/cadastro" element={<Signup />} />

                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/painel"
                  element={
                    <ProtectedRoute>
                      <WaiterPanel />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/gestao"
                  element={
                    <ProtectedRoute>
                      <MenuManagement />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/qrcode"
                  element={
                    <ProtectedRoute>
                      <QRCodeGenerator />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/relatorio"
                  element={
                    <ProtectedRoute>
                      <WaiterReport />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/superadmin"
                  element={
                    <ProtectedRoute requireRole="super_admin">
                      <SuperAdminDashboard />
                    </ProtectedRoute>
                  }
                />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </AccessibilityProvider>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

