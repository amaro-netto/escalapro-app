import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSchedule } from "@/hooks/useSchedule";
import { useAuth } from "@/hooks/useAuth";
import {
  BarChart3,
  CalendarDays,
  User,
  MessageSquare,
  Phone,
  Clock,
  Briefcase,
  Hourglass,
  Coffee,
  Sun,
  Moon
} from "lucide-react";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
} from "@/components/ui/chart";
import { Pie, PieChart, Cell, Label } from "recharts";
import { COLORS } from "@/types";

interface EmployeeStats {
  id: string;
  name: string;
  totalHours: number;
  livechatHours: number;
  ligacaoHours: number;
  color: string;
  shiftCoverage: number;
}

const chartConfigLivechat = {
  livechat: {
    label: "Livechat",
    color: COLORS.livechat,
  },
  ligacao: {
    label: "Ligação",
    color: COLORS.ligacao,
  },
} satisfies ChartConfig;

const chartConfigPeriodo = {
  manha: {
    label: "Manhã (8h - 12h)",
    color: "#ffc658",
  },
  tarde: {
    label: "Tarde (13h - 18h)",
    color: "#8884d8",
  },
  noite: {
    label: "Noite (18h - 22h)",
    color: "#3b82f6",
  },
} satisfies ChartConfig;

const RelatoriosPage = () => {
  const { schedule, employees, getEmployeeStats } = useSchedule();
  const { user, role } = useAuth();
  const isManagerOrAdmin = role === 'administrador' || role === 'gerente';

  const employeeStats = useMemo(() => {
    return employees.map(emp => {
      const stats = getEmployeeStats(emp.id);
      return {
        ...stats,
        color: emp.color,
      };
    }).sort((a, b) => b.totalHours - a.totalHours);
  }, [employees, getEmployeeStats]);

  const totalHours = useMemo(() => {
    return employeeStats.reduce((sum, stats) => sum + stats.totalHours, 0);
  }, [employeeStats]);

  const totalLivechatHours = useMemo(() => {
    return employeeStats.reduce((sum, stats) => sum + stats.livechatHours, 0);
  }, [employeeStats]);

  const totalLigacaoHours = useMemo(() => {
    return employeeStats.reduce((sum, stats) => sum + stats.ligacaoHours, 0);
  }, [employeeStats]);

  const getPeriodoHours = (employeeId: string, periodo: 'manha' | 'tarde' | 'noite') => {
    let hours = 0;
    Object.values(schedule).forEach(day => {
      day.livechat.forEach(slot => {
        if (slot.employeeId === employeeId) {
          const time = parseInt(slot.time.split(':')[0]);
          if (periodo === 'manha' && time >= 8 && time < 12) hours += 0.5;
          if (periodo === 'tarde' && time >= 13 && time < 18) hours += 0.5;
          if (periodo === 'noite' && time >= 18 && time < 22) hours += 0.5;
        }
      });
      day.ligacao.forEach(line => {
        line.forEach(slot => {
          if (slot.employeeId === employeeId) {
            const time = parseInt(slot.time.split(':')[0]);
            if (periodo === 'manha' && time >= 8 && time < 12) hours += 0.5;
            if (periodo === 'tarde' && time >= 13 && time < 18) hours += 0.5;
            if (periodo === 'noite' && time >= 18 && time < 22) hours += 0.5;
          }
        });
      });
    });
    return hours;
  };

  const loggedInEmployeeStats = useMemo(() => {
    if (!user) return null;
    const stats = getEmployeeStats(user.id);
    const manha = getPeriodoHours(user.id, 'manha');
    const tarde = getPeriodoHours(user.id, 'tarde');
    const noite = getPeriodoHours(user.id, 'noite');

    return {
      ...stats,
      livechat: stats.livechatHours,
      ligacao: stats.ligacaoHours,
      manha,
      tarde,
      noite
    };
  }, [user, getEmployeeStats, getPeriodoHours]);

  const renderManagerView = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Relatórios da Equipe
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Análises e estatísticas semanais de toda a equipe.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-6">
                <div className="flex items-center justify-center gap-2 text-primary">
                  <Briefcase className="h-6 w-6" />
                  <span className="text-2xl font-bold">{employees.filter(emp => emp.active).length}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">Funcionários Ativos</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-6">
                <div className="flex items-center justify-center gap-2 text-livechat">
                  <MessageSquare className="h-6 w-6" />
                  <span className="text-2xl font-bold">{totalLivechatHours}h</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">Total de Livechat</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-6">
                <div className="flex items-center justify-center gap-2 text-ligacao">
                  <Phone className="h-6 w-6" />
                  <span className="text-2xl font-bold">{totalLigacaoHours}h</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">Total de Ligação</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Distribuição de Horas por Funcionário
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Total de horas semanais por funcionário, ordenado do maior para o menor.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {employeeStats.map(stats => (
              <Card key={stats.id} className="relative overflow-hidden">
                <div 
                  className="absolute inset-x-0 top-0 h-1.5"
                  style={{ backgroundColor: stats.color }}
                />
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-10 h-10 rounded-full flex-shrink-0"
                      style={{ backgroundColor: stats.color }}
                    />
                    <div>
                      <p className="font-semibold">{stats.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {stats.totalHours} horas | {stats.shiftCoverage}% cobertura
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-livechat" />
                      <span className="text-livechat font-medium">{stats.livechatHours}h Livechat</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-ligacao" />
                      <span className="text-ligacao font-medium">{stats.ligacaoHours}h Ligação</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderEmployeeView = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Minhas Estatísticas
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Análise detalhada da sua participação na escala semanal.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-6">
                <div className="flex items-center justify-center gap-2 text-primary">
                  <Clock className="h-6 w-6" />
                  <span className="text-2xl font-bold">{loggedInEmployeeStats?.totalHours}h</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">Total de Horas</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-6">
                <div className="flex items-center justify-center gap-2 text-livechat">
                  <MessageSquare className="h-6 w-6" />
                  <span className="text-2xl font-bold">{loggedInEmployeeStats?.livechatHours}h</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">Livechat</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-6">
                <div className="flex items-center justify-center gap-2 text-ligacao">
                  <Phone className="h-6 w-6" />
                  <span className="text-2xl font-bold">{loggedInEmployeeStats?.ligacaoHours}h</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">Ligação</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Horas por Canal</CardTitle>
            <p className="text-sm text-muted-foreground">
              Distribuição do seu tempo entre canais de atendimento.
            </p>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfigLivechat} className="aspect-square">
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel formatter={(value, name) => [`${value}h`, name]} />}
                />
                <Pie
                  data={[
                    { name: 'livechat', value: loggedInEmployeeStats?.livechat, fill: chartConfigLivechat.livechat.color },
                    { name: 'ligacao', value: loggedInEmployeeStats?.ligacao, fill: chartConfigLivechat.ligacao.color },
                  ]}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={80}
                  innerRadius={50}
                  paddingAngle={5}
                >
                  {['livechat', 'ligacao'].map((entry) => (
                    <Cell key={`cell-${entry}`} fill={chartConfigLivechat[entry as 'livechat' | 'ligacao'].color} />
                  ))}
                  <Label
                    value={`${loggedInEmployeeStats?.livechat + loggedInEmployeeStats?.ligacao}h`}
                    position="center"
                    className="font-bold text-2xl"
                  />
                </Pie>
                <ChartLegend
                  content={<ChartLegendContent />}
                  className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/2 [&>*]:justify-center"
                />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Horas por Período</CardTitle>
            <p className="text-sm text-muted-foreground">
              Distribuição do seu tempo ao longo do dia.
            </p>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfigPeriodo} className="aspect-square">
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel formatter={(value, name) => [`${value}h`, name]} />}
                />
                <Pie
                  data={[
                    { name: 'manha', value: loggedInEmployeeStats?.manha, fill: chartConfigPeriodo.manha.color },
                    { name: 'tarde', value: loggedInEmployeeStats?.tarde, fill: chartConfigPeriodo.tarde.color },
                    { name: 'noite', value: loggedInEmployeeStats?.noite, fill: chartConfigPeriodo.noite.color },
                  ]}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={80}
                  innerRadius={50}
                  paddingAngle={5}
                >
                  {['manha', 'tarde', 'noite'].map((entry) => (
                    <Cell key={`cell-${entry}`} fill={chartConfigPeriodo[entry as 'manha' | 'tarde' | 'noite'].color} />
                  ))}
                  <Label
                    value={`${loggedInEmployeeStats?.manha + loggedInEmployeeStats?.tarde + loggedInEmployeeStats?.noite}h`}
                    position="center"
                    className="font-bold text-2xl"
                  />
                </Pie>
                <ChartLegend
                  content={<ChartLegendContent />}
                  className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/2 [&>*]:justify-center"
                />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {isManagerOrAdmin ? renderManagerView() : renderEmployeeView()}
    </div>
  );
};

export default RelatoriosPage;