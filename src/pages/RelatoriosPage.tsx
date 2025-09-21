import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useSchedule } from "@/hooks/useSchedule";
import { 
  BarChart3,
  Clock,
  Users,
  TrendingUp,
  Calendar,
  Phone,
  MessageSquare,
  Coffee,
  Target,
  Activity
} from "lucide-react";
import { DAYS, TIME_SLOTS } from "@/types";

export function RelatoriosPage() {
  const { employees, schedule, getEmployeeStats } = useSchedule();
  
  const activeEmployees = employees.filter(emp => emp.active);

  // Calcular estatísticas gerais
  const totalSlotsWeek = DAYS.length * TIME_SLOTS.length;
  const totalLivechatSlots = DAYS.length * TIME_SLOTS.length;
  const totalLigacaoSlots = DAYS.length * TIME_SLOTS.length * 3; // 3 linhas

  let occupiedLivechat = 0;
  let occupiedLigacao = 0;
  let lunchSlots = 0;

  Object.values(schedule).forEach(daySchedule => {
    daySchedule.livechat.forEach(slot => {
      if (slot.employeeId) occupiedLivechat++;
      if (slot.time >= "11:30" && slot.time < "15:00") lunchSlots++;
    });
    
    daySchedule.ligacao.forEach(line => {
      line.forEach(slot => {
        if (slot.employeeId) occupiedLigacao++;
      });
    });
  });

  const livechatCoverage = totalLivechatSlots > 0 ? (occupiedLivechat / totalLivechatSlots) * 100 : 0;
  const ligacaoCoverage = totalLigacaoSlots > 0 ? (occupiedLigacao / totalLigacaoSlots) * 100 : 0;

  // Estatísticas por funcionário
  const employeeStats = activeEmployees.map(emp => ({
    ...emp,
    stats: getEmployeeStats(emp.id)
  })).sort((a, b) => b.stats.totalHours - a.stats.totalHours);

  // Calcular distribuição por dia
  const dayStats = DAYS.map(day => {
    const daySchedule = schedule[day];
    if (!daySchedule) return { day, livechat: 0, ligacao: 0, total: 0 };

    let livechatHours = 0;
    let ligacaoHours = 0;

    daySchedule.livechat.forEach(slot => {
      if (slot.employeeId) livechatHours += 0.5;
    });

    daySchedule.ligacao.forEach(line => {
      line.forEach(slot => {
        if (slot.employeeId) ligacaoHours += 0.5;
      });
    });

    return {
      day,
      livechat: livechatHours,
      ligacao: ligacaoHours,
      total: livechatHours + ligacaoHours
    };
  });

  const totalHoursWeek = dayStats.reduce((acc, day) => acc + day.total, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Relatórios e Análises
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Visão geral da distribuição de turnos e performance da equipe.
          </p>
        </CardHeader>
      </Card>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Funcionários Ativos</p>
                <p className="text-2xl font-bold">{activeEmployees.length}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Horas</p>
                <p className="text-2xl font-bold">{totalHoursWeek}h</p>
              </div>
              <Clock className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cobertura Livechat</p>
                <p className="text-2xl font-bold">{livechatCoverage.toFixed(1)}%</p>
              </div>
              <MessageSquare className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cobertura Ligação</p>
                <p className="text-2xl font-bold">{ligacaoCoverage.toFixed(1)}%</p>
              </div>
              <Phone className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance por Funcionário */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Performance por Funcionário
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {employeeStats.map(employee => (
              <div key={employee.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: employee.color }}
                    />
                    <span className="font-medium text-sm">{employee.name}</span>
                  </div>
                  <span className="text-sm font-medium">{employee.stats.totalHours}h</span>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Livechat: {employee.stats.livechatHours}h</span>
                    <span className="text-muted-foreground">Ligação: {employee.stats.ligacaoHours}h</span>
                  </div>
                  <Progress 
                    value={employee.stats.totalHours > 0 ? (employee.stats.totalHours / Math.max(...employeeStats.map(e => e.stats.totalHours))) * 100 : 0} 
                    className="h-2"
                  />
                </div>
              </div>
            ))}
            
            {employeeStats.length === 0 && (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum funcionário com horas registradas</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Distribuição por Dia */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Distribuição Semanal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {dayStats.map(day => (
              <div key={day.day} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-sm">{day.day}</span>
                  <span className="text-sm font-medium">{day.total}h</span>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {day.livechat}h
                    </span>
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {day.ligacao}h
                    </span>
                  </div>
                  <Progress 
                    value={day.total > 0 ? (day.total / Math.max(...dayStats.map(d => d.total), 1)) * 100 : 0} 
                    className="h-2"
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Análises Adicionais */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Eficiência de Cobertura
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Livechat</span>
                <span className="text-sm font-medium">{livechatCoverage.toFixed(1)}%</span>
              </div>
              <Progress value={livechatCoverage} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Ligação</span>
                <span className="text-sm font-medium">{ligacaoCoverage.toFixed(1)}%</span>
              </div>
              <Progress value={ligacaoCoverage} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coffee className="h-5 w-5" />
              Período de Almoço
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-2xl font-bold">{((lunchSlots / (DAYS.length * 7)) * 100).toFixed(1)}%</p>
              <p className="text-sm text-muted-foreground">Cobertura no almoço</p>
              <Badge variant="outline" className="mt-2">
                11:30 - 15:00
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Balanceamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {employeeStats.length > 0 && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Maior carga:</span>
                    <span className="font-medium">{Math.max(...employeeStats.map(e => e.stats.totalHours))}h</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Menor carga:</span>
                    <span className="font-medium">{Math.min(...employeeStats.map(e => e.stats.totalHours))}h</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Diferença:</span>
                    <span className="font-medium">
                      {Math.max(...employeeStats.map(e => e.stats.totalHours)) - Math.min(...employeeStats.map(e => e.stats.totalHours))}h
                    </span>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}