import { useState } from "react";
import { 
  Calendar, 
  Users, 
  Settings, 
  BarChart3, 
  ChevronLeft, 
  ChevronRight,
  CalendarDays,
  Clock,
  Shuffle,
  Eye
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const menuItems = [
  { 
    title: "Escala Semanal", 
    url: "/escala", 
    icon: Calendar,
    description: "Visualizar e editar escala"
  },
  { 
    title: "Funcionários", 
    url: "/funcionarios", 
    icon: Users,
    description: "Gerenciar agentes"
  },
  { 
    title: "Auto-Completar", 
    url: "/auto-completar", 
    icon: Shuffle,
    description: "Distribuição automática"
  },
  { 
    title: "Visualizar", 
    url: "/visualizar", 
    icon: Eye,
    description: "Ver e compartilhar escalas"
  },
  { 
    title: "Relatórios", 
    url: "/relatorios", 
    icon: BarChart3,
    description: "Análises e estatísticas"
  },
  { 
    title: "Configurações", 
    url: "/configuracoes", 
    icon: Settings,
    description: "Ajustes do sistema"
  },
];

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const location = useLocation();
  const isCollapsed = state === "collapsed";

  const isActive = (path: string) => {
    if (path === "/escala") return location.pathname === "/" || location.pathname === "/escala";
    return location.pathname.startsWith(path);
  };

  const getNavClassName = (path: string) => {
    const base = "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 hover:bg-accent";
    return isActive(path) 
      ? `${base} bg-primary text-primary-foreground shadow-md hover:bg-primary/90`
      : base;
  };

  return (
    <Sidebar
      className={`transition-all duration-300`}
      collapsible="icon"
    >
      {/* Header com logo e toggle */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <img
                src="/logo.png"
                alt="Logo EscalaPro" 
                className="w-8 h-8 object-contain"
              />
              <div>
                <h2 className="font-semibold text-sm">EscalaPro App</h2>
                <p className="text-xs text-muted-foreground">Gestão de Turnos</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="h-8 w-8 p-0"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <SidebarContent className="px-2">
        <SidebarGroup>
          {!isCollapsed && (
            <SidebarGroupLabel className="text-xs font-medium text-muted-foreground px-3 pb-2">
              Menu Principal
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={getNavClassName(item.url)}
                      title={isCollapsed ? item.title : undefined}
                    >
                      <item.icon className={`${isCollapsed ? "h-5 w-5" : "h-4 w-4"} flex-shrink-0`} />
                      {!isCollapsed && (
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{item.title}</span>
                          <span className="text-xs text-muted-foreground">
                            {item.description}
                          </span>
                        </div>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Status rápido */}
        {!isCollapsed && (
          <SidebarGroup className="mt-4">
            <SidebarGroupLabel className="text-xs font-medium text-muted-foreground px-3 pb-2">
              Status Atual
            </SidebarGroupLabel>
            <div className="px-3 space-y-2">
              <div className="bg-accent rounded-lg p-3">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="font-medium">Hoje</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  4 agentes ativos
                </p>
              </div>
            </div>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-4 border-t border-border">
          <div className="mb-4 flex justify-center">
            <img 
              src="https://raw.githubusercontent.com/amaro-netto/amaro-netto/refs/heads/main/logos/amaronetto%20solucoes/PNG/Tech%20Logo%20Horizontal%20Black%404x.png" 
              alt="Logo da Empresa" 
              className="max-w-full h-auto max-h-12 object-contain"
            />
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              © 2025 Amaro Netto Soluções
            </p>
            <p className="text-xs text-muted-foreground">
              EscalaPro App v1.0
            </p>
          </div>
        </div>
      )}
    </Sidebar>
  );
}