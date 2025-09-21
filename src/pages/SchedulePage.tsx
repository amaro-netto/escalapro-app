import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Shuffle,
  Trash2,
  Save,
  Download,
  Upload,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { DragScheduleGrid } from "@/components/DragScheduleGrid";
import { EmployeeCard } from "@/components/EmployeeCard";
import { useSchedule } from "@/hooks/useSchedule";
import { useToast } from "@/hooks/use-toast";

export function SchedulePage() {
  const {
    employees,
    schedule,
    setSchedule,
    autoComplete,
    clearSchedule,
    getEmployeeStats,
    hasScheduleConflict,
    isEmployeeLunchTime
  } = useSchedule();
  
  const { toast } = useToast();

  const handleAutoComplete = () => {
    autoComplete();
    toast({
      title: "Escala gerada automaticamente!",
      description: "A distribuição foi feita considerando balanceamento entre os canais.",
    });
  };

  const handleClearSchedule = () => {
    clearSchedule();
    toast({
      title: "Escala limpa",
      description: "Todos os turnos foram removidos.",
    });
  };

  const activeEmployees = employees.filter(emp => emp.active);
  const hasSchedule = Object.values(schedule).some(daySchedule =>
    daySchedule.livechat.some(slot => slot.employeeId) ||
    daySchedule.ligacao.some(line => line.some(slot => slot.employeeId))
  );

  return (
    <div className="space-y-6">
      {/* Actions Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shuffle className="h-5 w-5" />
                Controles da Escala
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {activeEmployees.length} funcionários ativos • Horário: 8h-18h (Segunda a Sexta)
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button 
                onClick={handleAutoComplete}
                className="flex items-center gap-2"
                disabled={activeEmployees.length < 4}
              >
                <Shuffle className="h-4 w-4" />
                Auto-Completar
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleClearSchedule}
                disabled={!hasSchedule}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Limpar Tudo
              </Button>
              
              <Button 
                variant="secondary"
                disabled={!hasSchedule}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Salvar
              </Button>
            </div>
          </div>
          
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge 
                variant={activeEmployees.length >= 4 ? "default" : "destructive"}
                className="flex items-center gap-1"
              >
                {activeEmployees.length >= 4 ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : (
                  <AlertCircle className="h-3 w-3" />
                )}
                Funcionários: {activeEmployees.length}/4 mínimo
              </Badge>
              
              <Badge variant="outline">
                Livechat: 1 pessoa por turno
              </Badge>
              
              <Badge variant="outline">
                Ligação: 3 pessoas por turno
              </Badge>
              
              <Badge variant="secondary">
                Almoço: 12h-13h (protegido)
              </Badge>
            </div>
          </CardContent>
        </CardHeader>
      </Card>

      {/* Funcionários Ativos */}
      <Card>
        <CardHeader>
          <CardTitle>Funcionários Ativos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {activeEmployees.map(employee => (
              <EmployeeCard
                key={employee.id}
                employee={employee}
                weeklyStats={getEmployeeStats(employee.id)}
              />
            ))}
          </div>
          
          {activeEmployees.length === 0 && (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Nenhum funcionário ativo encontrado. 
                <br />
                Adicione funcionários na seção "Funcionários".
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grade de Escala */}
      <DragScheduleGrid
        employees={employees}
        schedule={schedule}
        onScheduleChange={setSchedule}
        hasScheduleConflict={hasScheduleConflict}
        isEmployeeLunchTime={isEmployeeLunchTime}
      />
    </div>
  );
}