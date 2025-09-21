import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSchedule } from "@/hooks/useSchedule";
import { useAuth } from "@/hooks/useAuth";
import { 
  Eye,
  Share2,
  Clock,
  Coffee,
  MessageSquare,
  Phone,
  Calendar,
  User,
  Printer
} from "lucide-react";
import { DAYS, TIME_SLOTS } from "@/types";

const VisualizarEscalaPage = () => {
  const { employees, schedule, getEmployeeStats } = useSchedule();
  const { user, role } = useAuth();
  const isManagerOrAdmin = role === 'administrador' || role === 'gerente';
  
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  
  const activeEmployees = employees.filter(emp => emp.active);
  const loggedInEmployee = useMemo(() => employees.find(emp => emp.id === user?.id), [employees, user]);

  const getSlotContent = (day: string, timeSlot: string, channel: 'livechat' | 'ligacao', lineIndex?: number) => {
    const daySchedule = schedule[day];
    if (!daySchedule) return null;

    if (channel === 'livechat') {
      const slot = daySchedule.livechat.find((s: any) => s.time === timeSlot);
      return slot?.employeeId;
    } else if (channel === 'ligacao' && lineIndex !== undefined) {
      const slot = daySchedule.ligacao[lineIndex]?.find((s: any) => s.time === timeSlot);
      return slot?.employeeId;
    }
    return null;
  };

  const getEmployeeById = (id: string) => employees.find(emp => id === id);

  const getEmployeeScheduleForDay = (employeeId: string, day: string) => {
    const daySchedule = schedule[day];
    if (!daySchedule) return [];

    const employeeSlots = [];

    daySchedule.livechat.forEach((slot: any, index: number) => {
      if (slot.employeeId === employeeId) {
        employeeSlots.push({
          time: slot.time,
          channel: 'Livechat',
          timeSlot: TIME_SLOTS[index]
        });
      }
    });

    daySchedule.ligacao.forEach((line: any[], lineIndex: number) => {
      line.forEach((slot: any, index: number) => {
        if (slot.employeeId === employeeId) {
          employeeSlots.push({
            time: slot.time,
            channel: `Ligação ${lineIndex + 1}`,
            timeSlot: TIME_SLOTS[index]
          });
        }
      });
    });

    return employeeSlots.sort((a, b) => a.time.localeCompare(b.time));
  };

  const groupConsecutiveSlots = (slots: any[]) => {
    if (slots.length === 0) return [];
    
    const groups = [];
    let currentGroup = [slots[0]];
    
    for (let i = 1; i < slots.length; i++) {
      const currentSlot = slots[i];
      const previousSlot = slots[i - 1];
      
      const currentIndex = TIME_SLOTS.findIndex(t => t.display === currentSlot.time);
      const previousIndex = TIME_SLOTS.findIndex(t => t.display === previousSlot.time);
      
      if (currentIndex === previousIndex + 1 && currentSlot.channel === previousSlot.channel) {
        currentGroup.push(currentSlot);
      } else {
        groups.push(currentGroup);
        currentGroup = [currentSlot];
      }
    }
    
    groups.push(currentGroup);
    return groups;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportToEmail = () => {
    const employee = getEmployeeById(selectedEmployeeId);
    if (!employee) return;

    let emailBody = `Olá ${employee.name},\n\nSegue sua escala para a semana:\n\n`;
    
    DAYS.forEach(day => {
      const daySlots = getEmployeeScheduleForDay(selectedEmployeeId, day);
      const groups = groupConsecutiveSlots(daySlots);
      
      if (groups.length > 0) {
        emailBody += `${day}:\n`;
        groups.forEach(group => {
          const startTime = group[0].time;
          const endTime = group[group.length - 1].time;
          const channel = group[0].channel;

          emailBody += `  • ${startTime} - ${endTime} (${channel})\n`;
        });
        emailBody += '\n';
      }
    });
    
    emailBody += 'Atenciosamente,\nEquipe de Gestão';
    
    const subject = `Escala de Trabalho - ${employee.name}`;
    const mailtoLink = `mailto:${employee.name.toLowerCase().replace(' ', '.')}@empresa.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
    
    window.open(mailtoLink);
  };

  const renderEmployeeView = (employeeId: string) => {
    const employee = getEmployeeById(employeeId);
    if (!employee) return null;

    const stats = getEmployeeStats(employeeId);
    
    return (
      <div className="space-y-6">
        {/* Informações do funcionário */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="w-6 h-6 rounded-full"
                  style={{ backgroundColor: employee.color }}
                />
                <div>
                  <CardTitle>{employee.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Total semanal: {stats.totalHours}h | Livechat: {stats.livechatHours}h | Ligação: {stats.ligacaoHours}h
                  </p>
                </div>
              </div>
              <div className="flex gap-2 no-print">
                <Button size="sm" onClick={handleExportToEmail}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Enviar por Email
                </Button>
                <Button size="sm" variant="outline" onClick={handlePrint}>
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Escala do funcionário */}
        <div className="grid gap-4">
          {DAYS.map(day => {
            const daySlots = getEmployeeScheduleForDay(employeeId, day);
            const groups = groupConsecutiveSlots(daySlots);
            
            return (
              <Card key={day} className="print-break">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    {day}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {groups.length > 0 ? (
                    <div className="space-y-2">
                      {groups.map((group, index) => {
                        const startTime = group[0].time;
                        const endTime = group[group.length - 1].time;
                        const channel = group[0].channel;
                        const duration = group.length * 0.5;
                        
                        return (
                          <div 
                            key={index}
                            className="flex items-center justify-between p-3 rounded-lg border"
                            style={{ 
                              backgroundColor: `${employee.color}15`,
                              borderColor: `${employee.color}40`
                            }}
                          >
                            <div className="flex items-center gap-3">
                              {channel === 'Livechat' ? (
                                <MessageSquare className="h-4 w-4 text-livechat" />
                              ) : (
                                <Phone className="h-4 w-4 text-ligacao" />
                              )}
                              <div>
                                <div className="font-medium">
                                  {startTime} - {endTime}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {channel}
                                </div>
                              </div>
                            </div>
                            <Badge variant="outline">
                              <Clock className="h-3 w-3 mr-1" />
                              {duration}h
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Sem escalação para este dia</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  const renderAllEmployeesView = () => {
    return (
      <div className="space-y-6">
        {/* Estatísticas gerais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Funcionários Ativos</p>
                  <p className="text-2xl font-bold">{activeEmployees.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-livechat" />
                <div>
                  <p className="text-sm text-muted-foreground">Livechat</p>
                  <p className="text-2xl font-bold">1</p>
                  <p className="text-xs text-muted-foreground">pessoa por turno</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-ligacao" />
                <div>
                  <p className="text-sm text-muted-foreground">Ligação</p>
                  <p className="text-2xl font-bold">3</p>
                  <p className="text-xs text-muted-foreground">pessoas por turno</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Grade completa */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Escala Completa da Semana
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="min-w-[1200px] space-y-6">
                {DAYS.map(day => (
                  <div key={day}>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <span className="bg-primary text-primary-foreground px-3 py-1 rounded-lg">
                        {day}
                      </span>
                    </h3>

                    
                    {/* Cabeçalho */}
                    <div className="grid grid-cols-[120px_repeat(20,1fr)] gap-1 mb-2">
                      <div className="font-medium text-sm bg-muted p-2 rounded text-center">
                        Canal
                      </div>
                      {TIME_SLOTS.map(slot => (
                        <div key={slot.display} className="text-xs font-medium p-1 bg-muted rounded text-center">
                          {slot.display}
                        </div>
                      ))}
                    </div>
                    
                    {/* Livechat */}
                    <div className="grid grid-cols-[120px_repeat(20,1fr)] gap-1 mb-2">
                      <div className="flex items-center gap-2 bg-livechat-light p-2 rounded">
                        <MessageSquare className="h-4 w-4 text-livechat" />
                        <span className="text-sm font-medium">Livechat</span>
                      </div>
                      {TIME_SLOTS.map(slot => {
                        const employeeId = getSlotContent(day, slot.display, 'livechat');
                        const employee = employeeId ? getEmployeeById(employeeId) : null;

                        const isLunchTime = slot.display >= "11:30" && slot.display < "15:00";
                        
                        return (
                          <div
                            key={slot.display}
                            className={`
                              min-h-[40px] border border-grid-border rounded-md p-1
                              flex items-center justify-center text-xs font-medium
                              ${employee ? 'text-white' : (isLunchTime ? 'bg-almoco-light' : 'bg-background')}
                            `}
                            style={employee ? { backgroundColor: employee.color } : {}}
                          >
                            {employee ? employee.name.split(' ')[0] : (isLunchTime ? <Coffee className="h-3 w-3" /> : '')}
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Ligação */}
                    {[0, 1, 2].map(lineIndex => (
                      <div key={lineIndex} className="grid grid-cols-[120px_repeat(20,1fr)] gap-1 mb-2">
                        <div className="flex items-center gap-2 bg-ligacao-light p-2 rounded">
                          <Phone className="h-4 w-4 text-ligacao" />
                          <span className="text-sm font-medium">Ligação {lineIndex + 1}</span>
                        </div>
                        {TIME_SLOTS.map(slot => {
                          const employeeId = getSlotContent(day, slot.display, 'ligacao', lineIndex);
                          const employee = employeeId ? getEmployeeById(employeeId) : null;
                          const isLunchTime = slot.display >= "11:30" && slot.display < "15:00";
                          
                          return (
                            <div
                              key={slot.display}
                              className={`
                                min-h-[40px] border border-grid-border rounded-md p-1
                                flex items-center justify-center text-xs font-medium
                                ${employee ? 'text-white' : (isLunchTime ? 'bg-almoco-light' : 'bg-background')}
                              `}
                              style={employee ? { backgroundColor: employee.color } : {}}
                            >
                              {employee ? employee.name.split(' ')[0] : (isLunchTime ? <Coffee className="h-3 w-3" /> : '')}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Controles */}
      <Card className="no-print">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Visualizar Escala
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Visualize e compartilhe as escalas de trabalho dos funcionários.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="viewMode">Modo de Visualização</Label>
              <Select 
                value={selectedEmployeeId ? "employee" : "all"} 
                onValueChange={(value) => {
                  if (value === "all") {
                    setSelectedEmployeeId(null);
                  } else {
                    setSelectedEmployeeId(loggedInEmployee?.id || null);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Escala Completa</SelectItem>
                  {loggedInEmployee && (
                    <SelectItem value="employee">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: loggedInEmployee.color }}
                        />
                        Minha Escala ({loggedInEmployee.name})
                      </div>
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            {isManagerOrAdmin && selectedEmployeeId && (
              <div className="flex-1">
                <Label htmlFor="employee">Selecionar Funcionário</Label>
                <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha um funcionário" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeEmployees.map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: emp.color }}
                          />
                          {emp.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
            {selectedEmployeeId && (
              <Button onClick={handleExportToEmail}>
                <Share2 className="h-4 w-4 mr-2" />
                Enviar por Email
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Conteúdo */}
      {selectedEmployeeId ? renderEmployeeView(selectedEmployeeId) : renderAllEmployeesView()}
    </div>
  );
};

export default VisualizarEscalaPage;