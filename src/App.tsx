import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { Layout } from "./components/Layout";
import { useAuth } from "./hooks/useAuth";
import React, { Suspense } from 'react';

// Importação dinâmica de componentes para otimização de bundle
const SchedulePage = React.lazy(() => import("./pages/SchedulePage"));
const FuncionariosPage = React.lazy(() => import("./pages/FuncionariosPage"));
const AutoCompletarPage = React.lazy(() => import("./pages/AutoCompletarPage"));
const VisualizarEscalaPage = React.lazy(() => import("./pages/VisualizarEscalaPage"));
const RelatoriosPage = React.lazy(() => import("./pages/RelatoriosPage"));
const ConfiguracoesPage = React.lazy(() => import("./pages/ConfiguracoesPage"));
const NotFound = React.lazy(() => import("./pages/NotFound"));
const LoginPage = React.lazy(() => import("./pages/LoginPage"));
const RegisterPage = React.lazy(() => import("./pages/RegisterPage"));

const queryClient = new QueryClient();

// Componente para rotas protegidas
const ProtectedRoutes = ({ roles }: { roles?: string[] }) => {
  const { user, role, loading } = useAuth();
  
  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(role || '')) {
    return <Navigate to="/" replace />;
  }

  return <Layout><Outlet /></Layout>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<div>Carregando...</div>}>
          <Routes>
            {/* Rota de login, sem proteção */}
            <Route path="/login" element={<LoginPage />} />
            
            {/* Rotas agrupadas e protegidas */}
            <Route element={<ProtectedRoutes />}>
              <Route path="/" element={<SchedulePage />} />
              <Route path="/escala" element={<SchedulePage />} />
              <Route path="/visualizar" element={<VisualizarEscalaPage />} />
              <Route path="/relatorios" element={<RelatoriosPage />} />
              <Route path="/funcionarios" element={<FuncionariosPage />} />
              <Route path="/auto-completar" element={<AutoCompletarPage />} />
              <Route path="/cadastro" element={<RegisterPage />} />
              <Route path="/configuracoes" element={<ConfiguracoesPage />} />
            </Route>

            {/* Rota de erro 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;