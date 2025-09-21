import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { SchedulePage } from "./pages/SchedulePage";
import { FuncionariosPage } from "./pages/FuncionariosPage";
import { AutoCompletarPage } from "./pages/AutoCompletarPage";
import { VisualizarEscalaPage } from "./pages/VisualizarEscalaPage";
import { RelatoriosPage } from "./pages/RelatoriosPage";
import { ConfiguracoesPage } from "./pages/ConfiguracoesPage";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout><SchedulePage /></Layout>} />
          <Route path="/escala" element={<Layout><SchedulePage /></Layout>} />
          <Route path="/funcionarios" element={<Layout><FuncionariosPage /></Layout>} />
          <Route path="/auto-completar" element={<Layout><AutoCompletarPage /></Layout>} />
          <Route path="/visualizar" element={<Layout><VisualizarEscalaPage /></Layout>} />
          <Route path="/relatorios" element={<Layout><RelatoriosPage /></Layout>} />
          <Route path="/configuracoes" element={<Layout><ConfiguracoesPage /></Layout>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;