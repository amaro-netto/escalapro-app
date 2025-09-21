import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header global */}
          <header className="h-14 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
            <div className="flex h-full items-center gap-4 px-6">
              <SidebarTrigger className="md:hidden" />
              
              <div className="flex-1">
                <h1 className="font-semibold text-lg">Sistema de Escala de Trabalho</h1>
                <p className="text-sm text-muted-foreground hidden sm:block">
                  Gerencie turnos e distribuição de funcionários de forma eficiente
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium">Semana Atual</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date().toLocaleDateString('pt-BR', { 
                      day: '2-digit', 
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </header>

          {/* Conteúdo principal */}
          <main className="flex-1 overflow-auto">
            <div className="p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}