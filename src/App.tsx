import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AccessibilityProvider } from "@/hooks/useAccessibility";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import WaiterPanel from "./pages/admin/WaiterPanel";
import MenuManagement from "./pages/admin/MenuManagement";
import QRCodeGenerator from "./pages/admin/QRCodeGenerator";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AccessibilityProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/admin/painel" element={<WaiterPanel />} />
            <Route path="/admin/gestao" element={<MenuManagement />} />
            <Route path="/admin/qrcode" element={<QRCodeGenerator />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AccessibilityProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
