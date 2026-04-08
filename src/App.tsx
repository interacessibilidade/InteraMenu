import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AccessibilityProvider } from "@/hooks/useAccessibility";
import { LanguageProvider } from "@/hooks/useLanguage";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import WaiterPanel from "./pages/admin/WaiterPanel";
import MenuManagement from "./pages/admin/MenuManagement";
import QRCodeGenerator from "./pages/admin/QRCodeGenerator";
import WaiterReport from "./pages/admin/WaiterReport";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <AccessibilityProvider>
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/admin/painel" element={<WaiterPanel />} />
              <Route path="/admin/gestao" element={<MenuManagement />} />
              <Route path="/admin/qrcode" element={<QRCodeGenerator />} />
              <Route path="/admin/relatorio" element={<WaiterReport />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AccessibilityProvider>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
