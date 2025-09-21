import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Clock,
  Users,
  Trash2,
  Edit,
  Coffee,
  MessageSquare,
  Phone,
  Plus,
  Shuffle
} from "lucide-react";
import { DAYS, TIME_SLOTS, type Employee, type ScheduleSlot } from "@/types";

interface ScheduleGridProps {
  employees: Employee[];
  schedule: any;
  onScheduleChange: (schedule: any) => void;
}

export function ScheduleGrid({ employees, schedule, onScheduleChange }: ScheduleGridProps) {
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [dragMode, setDragMode] = useState<'livechat' | 'ligacao' | null>(null);

  const getEmployeeById = (id: string) => employees.find(emp => emp.id === id);

  const handleSlotClick = useCallback((day: string, timeSlot: string, channel: 'livechat' | 'ligacao', lineIndex?: number) => {
    if (!selectedEmployee) return;

    const newSchedule = { ...schedule };
    
    // Inicializar dia se não existir
    if (!newSchedule[day]) {
      newSchedule[day] = {
        livechat: TIME_SLOTS.map(slot => ({
          day,
          time: slot.display,
          employeeId: null,
          channel: 'livechat' as const
        })),
        ligacao: [[], [], []] // 3 linhas
      };
      
      // Inicializar linhas de ligação
      for (let i = 0; i < 3; i++) {
        newSchedule[day].ligacao[i] = TIME_SLOTS.map(slot => ({
          day,
          time: slot.display,
          employeeId: null,
          channel: 'ligacao' as const,
          channelLine: i
        }));
      }
    }

    if (channel === 'livechat') {
      const slotIndex = TIME_SLOTS.findIndex(slot => slot.display === timeSlot);
      if (slotIndex !== -1) {
        newSchedule[day].livechat[slotIndex].employeeId = selectedEmployee;
      }
    } else if (channel === 'ligacao' && lineIndex !== undefined) {
      const slotIndex = TIME_SLOTS.findIndex(slot => slot.display === timeSlot);
      if (slotIndex !== -1) {
        newSchedule[day].ligacao[lineIndex][slotIndex].employeeId = selectedEmployee;
      }
    }

    onScheduleChange(newSchedule);
  }, [selectedEmployee, schedule, onScheduleChange]);

  const handleClearSlot = useCallback((day: string, timeSlot: string, channel: 'livechat' | 'ligacao', lineIndex?: number) => {
    const newSchedule = { ...schedule };
    
    if (channel === 'livechat') {
      const slotIndex = TIME_SLOTS.findIndex(slot => slot.display === timeSlot);
      if (slotIndex !== -1) {
        newSchedule[day].livechat[slotIndex].employeeId = null;
      }
    } else if (channel === 'ligacao' && lineIndex !== undefined) {
      const slotIndex = TIME_SLOTS.findIndex(slot => slot.display === timeSlot);
      if (slotIndex !== -1) {
        newSchedule[day].ligacao[lineIndex][slotIndex].employeeId = null;
      }
    }

    onScheduleChange(newSchedule);
  }, [schedule, onScheduleChange]);

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

  const renderSlot = (day: string, timeSlot: string, channel: 'livechat' | 'ligacao', lineIndex?: number) => {
    const employeeId = getSlotContent(day, timeSlot, channel, lineIndex);
    const employee = employeeId ? getEmployeeById(employeeId) : null;
    const isLunchTime = timeSlot >= "11:30" && timeSlot < "15:00";

    return (
      <div
        key={`${day}-${timeSlot}-${channel}-${lineIndex || 0}`}
        className={`
          min-h-[40px] border border-grid-border rounded-md p-1 cursor-pointer
          transition-all duration-200 hover:shadow-md relative group
          ${employee ? 'text-white shadow-sm' : (
            isLunchTime ? 'bg-almoco-light hover:bg-almoco-light/80' : 
            'bg-background hover:bg-accent'
          )}
          ${selectedEmployee && !employee ? 'hover:ring-2 hover:ring-primary' : ''}
        `}
        style={employee ? { backgroundColor: getEmployeeById(employeeId)?.color } : {}}
        onClick={() => {
          if (employee && !selectedEmployee) return;
          if (employee && selectedEmployee) {
            // Permitir trocar funcionário
            handleSlotClick(day, timeSlot, channel, lineIndex);
          } else if (!employee) {
            handleSlotClick(day, timeSlot, channel, lineIndex);
          }
        }}
      >
        {employee && (
          <>
            <div className="text-xs font-medium truncate">
              {employee.name}
            </div>
            {isLunchTime && (
              <Coffee className="absolute top-0.5 right-0.5 h-3 w-3 opacity-70" />
            )}
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 h-5 w-5 p-0"
              onClick={(e) => {
                e.stopPropagation();
                handleClearSlot(day, timeSlot, channel, lineIndex);
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </>
        )}
        {!employee && isLunchTime && (
          <div className="flex items-center justify-center h-full">
            <Coffee className="h-4 w-4 text-muted-foreground opacity-50" />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Seleção de funcionário */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Selecionar Funcionário
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {employees.filter(emp => emp.active).map(employee => (
              <Button
                key={employee.id}
                variant={selectedEmployee === employee.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedEmployee(
                  selectedEmployee === employee.id ? null : employee.id
                )}
                className="flex items-center gap-2"
              >
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: employee.color }}
                />
                {employee.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Grade de horários */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Escala Semanal
            </CardTitle>
            <div className="flex gap-2">
              <Badge variant="outline" className="bg-livechat-light text-livechat">
                <MessageSquare className="w-3 h-3 mr-1" />
                Livechat
              </Badge>
              <Badge variant="outline" className="bg-ligacao-light text-ligacao">
                <Phone className="w-3 h-3 mr-1" />
                Ligação
              </Badge>
              <Badge variant="outline" className="bg-muted text-muted-foreground">
                <Coffee className="w-3 h-3 mr-1" />
                Período de Almoço (11:30-15:00)
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-[1200px]">
              {/* Cabeçalho com horários */}
              <div className="grid grid-cols-[120px_repeat(20,1fr)] gap-1 mb-2">
                <div className="font-medium text-sm bg-grid-header text-white p-2 rounded text-center">
                  Horário
                </div>
                {TIME_SLOTS.map(slot => (
                  <div key={slot.display} className="text-xs font-medium p-2 bg-muted rounded text-center">
                    {slot.display}
                  </div>
                ))}
              </div>

              {/* Dias da semana */}
              {DAYS.map(day => (
                <div key={day} className="mb-6">
                  {/* Dia da semana */}
                  <div className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <span className="bg-primary text-primary-foreground px-3 py-1 rounded-lg">
                      {day}
                    </span>
                  </div>

                  {/* Livechat */}
                  <div className="mb-3">
                    <div className="grid grid-cols-[120px_repeat(20,1fr)] gap-1">
                      <div className="flex items-center gap-2 bg-livechat-light p-2 rounded">
                        <MessageSquare className="h-4 w-4 text-livechat" />
                        <span className="text-sm font-medium">Livechat</span>
                      </div>
                      {TIME_SLOTS.map(slot => renderSlot(day, slot.display, 'livechat'))}
                    </div>
                  </div>

                  {/* Ligação - 3 linhas */}
                  <div className="space-y-1">
                    {[0, 1, 2].map(lineIndex => (
                      <div key={lineIndex} className="grid grid-cols-[120px_repeat(20,1fr)] gap-1">
                        <div className="flex items-center gap-2 bg-ligacao-light p-2 rounded">
                          <Phone className="h-4 w-4 text-ligacao" />
                          <span className="text-sm font-medium">
                            Ligação {lineIndex + 1}
                          </span>
                        </div>
                        {TIME_SLOTS.map(slot => renderSlot(day, slot.display, 'ligacao', lineIndex))}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}