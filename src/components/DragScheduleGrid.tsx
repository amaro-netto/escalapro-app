import { useState, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Clock,
  Users,
  Trash2,
  Coffee,
  MessageSquare,
  Phone,
  AlertTriangle
} from "lucide-react";
import { DAYS, TIME_SLOTS, type Employee, type DragSelection } from "@/types";

interface DragScheduleGridProps {
  employees: Employee[];
  schedule: any;
  onScheduleChange: (schedule: any) => void;
  hasScheduleConflict: (employeeId: string, day: string, timeSlot: string, excludeChannel?: { channel: 'livechat' | 'ligacao'; line?: number }) => boolean;
  isEmployeeLunchTime: (employeeId: string, timeSlot: string) => boolean;
}

export function DragScheduleGrid({ 
  employees, 
  schedule, 
  onScheduleChange,
  hasScheduleConflict,
  isEmployeeLunchTime
}: DragScheduleGridProps) {
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [dragSelection, setDragSelection] = useState<DragSelection>({
    isSelecting: false,
    startSlot: null,
    endSlot: null
  });
  const { toast } = useToast();
  const gridRef = useRef<HTMLDivElement>(null);

  const getEmployeeById = (id: string) => employees.find(emp => emp.id === id);

  // Função para aplicar seleção em massa
  const applyDragSelection = useCallback(() => {
    if (!selectedEmployee || !dragSelection.startSlot || !dragSelection.endSlot) return;

    const { startSlot, endSlot } = dragSelection;
    
    // Verificar se é o mesmo canal e linha
    if (startSlot.channel !== endSlot.channel || 
        (startSlot.channel === 'ligacao' && startSlot.line !== endSlot.line)) {
      toast({
        title: "Seleção inválida",
        description: "Selecione slots do mesmo canal e linha.",
        variant: "destructive"
      });
      return;
    }

    const startIndex = TIME_SLOTS.findIndex(slot => slot.display === startSlot.time);
    const endIndex = TIME_SLOTS.findIndex(slot => slot.display === endSlot.time);
    
    if (startIndex === -1 || endIndex === -1) return;

    const minIndex = Math.min(startIndex, endIndex);
    const maxIndex = Math.max(startIndex, endIndex);

    const newSchedule = { ...schedule };
    
    // Verificar conflitos antes de aplicar
    let hasConflicts = false;
    for (let i = minIndex; i <= maxIndex; i++) {
      const slot = TIME_SLOTS[i];
      if (hasScheduleConflict(
        selectedEmployee, 
        startSlot.day, 
        slot.display,
        { channel: startSlot.channel, line: startSlot.line }
      )) {
        hasConflicts = true;
        break;
      }
    }

    if (hasConflicts) {
      toast({
        title: "Conflito de horário",
        description: "O funcionário já está escalado em outro canal neste horário.",
        variant: "destructive"
      });
      return;
    }

    // Inicializar dia se não existir
    if (!newSchedule[startSlot.day]) {
      newSchedule[startSlot.day] = {
        livechat: TIME_SLOTS.map(slot => ({
          day: startSlot.day,
          time: slot.display,
          employeeId: null,
          channel: 'livechat' as const
        })),
        ligacao: [[], [], []]
      };
      
      for (let i = 0; i < 3; i++) {
        newSchedule[startSlot.day].ligacao[i] = TIME_SLOTS.map(slot => ({
          day: startSlot.day,
          time: slot.display,
          employeeId: null,
          channel: 'ligacao' as const,
          channelLine: i
        }));
      }
    }

    // Aplicar seleção
    for (let i = minIndex; i <= maxIndex; i++) {
      if (startSlot.channel === 'livechat') {
        newSchedule[startSlot.day].livechat[i].employeeId = selectedEmployee;
      } else if (startSlot.channel === 'ligacao' && startSlot.line !== undefined) {
        newSchedule[startSlot.day].ligacao[startSlot.line][i].employeeId = selectedEmployee;
      }
    }

    onScheduleChange(newSchedule);
    setDragSelection({ isSelecting: false, startSlot: null, endSlot: null });
    
    toast({
      title: "Horários aplicados!",
      description: `${maxIndex - minIndex + 1} slots preenchidos para ${getEmployeeById(selectedEmployee)?.name}.`
    });
  }, [selectedEmployee, dragSelection, schedule, onScheduleChange, hasScheduleConflict, getEmployeeById, toast]);

  const handleMouseDown = useCallback((day: string, timeSlot: string, channel: 'livechat' | 'ligacao', lineIndex?: number) => {
    if (!selectedEmployee) return;

    setDragSelection({
      isSelecting: true,
      startSlot: { day, time: timeSlot, channel, line: lineIndex },
      endSlot: null
    });
  }, [selectedEmployee]);

  const handleMouseEnter = useCallback((day: string, timeSlot: string, channel: 'livechat' | 'ligacao', lineIndex?: number) => {
    if (!dragSelection.isSelecting || !dragSelection.startSlot) return;
    
    // Só permitir seleção no mesmo dia, canal e linha
    if (dragSelection.startSlot.day === day && 
        dragSelection.startSlot.channel === channel &&
        dragSelection.startSlot.line === lineIndex) {
      setDragSelection(prev => ({
        ...prev,
        endSlot: { day, time: timeSlot, channel, line: lineIndex }
      }));
    }
  }, [dragSelection]);

  const handleMouseUp = useCallback(() => {
    if (dragSelection.isSelecting && dragSelection.startSlot && dragSelection.endSlot) {
      applyDragSelection();
    }
    setDragSelection({ isSelecting: false, startSlot: null, endSlot: null });
  }, [dragSelection, applyDragSelection]);

  // Verificar se slot está na seleção
  const isInSelection = useCallback((day: string, timeSlot: string, channel: 'livechat' | 'ligacao', lineIndex?: number) => {
    if (!dragSelection.startSlot || !dragSelection.endSlot) return false;
    if (dragSelection.startSlot.day !== day || dragSelection.startSlot.channel !== channel) return false;
    if (channel === 'ligacao' && dragSelection.startSlot.line !== lineIndex) return false;

    const currentIndex = TIME_SLOTS.findIndex(slot => slot.display === timeSlot);
    const startIndex = TIME_SLOTS.findIndex(slot => slot.display === dragSelection.startSlot!.time);
    const endIndex = TIME_SLOTS.findIndex(slot => slot.display === dragSelection.endSlot!.time);
    
    const minIndex = Math.min(startIndex, endIndex);
    const maxIndex = Math.max(startIndex, endIndex);
    
    return currentIndex >= minIndex && currentIndex <= maxIndex;
  }, [dragSelection]);

  const getSlotContent = useCallback((day: string, timeSlot: string, channel: 'livechat' | 'ligacao', lineIndex?: number) => {
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
  }, [schedule]);

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

  // Função para agrupar slots consecutivos do mesmo funcionário
  const getConsecutiveSlots = useCallback((day: string, channel: 'livechat' | 'ligacao', lineIndex?: number) => {
    const groups: Array<{
      employee: Employee | null;
      startIndex: number;
      endIndex: number;
      slots: string[];
    }> = [];
    
    let currentEmployee: string | null = null;
    let currentGroup: string[] = [];
    let startIndex = 0;
    
    TIME_SLOTS.forEach((slot, index) => {
      const employeeId = getSlotContent(day, slot.display, channel, lineIndex);
      
      if (employeeId === currentEmployee && employeeId !== null) {
        // Continuar grupo atual
        currentGroup.push(slot.display);
      } else {
        // Finalizar grupo anterior se existir
        if (currentGroup.length > 0) {
          groups.push({
            employee: currentEmployee ? getEmployeeById(currentEmployee) : null,
            startIndex,
            endIndex: index - 1,
            slots: [...currentGroup]
          });
        }
        
        // Iniciar novo grupo
        currentEmployee = employeeId;
        currentGroup = employeeId ? [slot.display] : [];
        startIndex = index;
      }
    });
    
    // Finalizar último grupo se existir
    if (currentGroup.length > 0) {
      groups.push({
        employee: currentEmployee ? getEmployeeById(currentEmployee) : null,
        startIndex,
        endIndex: TIME_SLOTS.length - 1,
        slots: [...currentGroup]
      });
    }
    
    return groups;
  }, [getSlotContent, getEmployeeById]);

  const renderSlot = useCallback((day: string, timeSlot: string, channel: 'livechat' | 'ligacao', lineIndex?: number) => {
    const employeeId = getSlotContent(day, timeSlot, channel, lineIndex);
    const employee = employeeId ? getEmployeeById(employeeId) : null;
    const isLunchTime = timeSlot >= "11:30" && timeSlot < "15:00";
    const isInCurrentSelection = isInSelection(day, timeSlot, channel, lineIndex);
    const isEmployeeLunch = employee && isEmployeeLunchTime(employee.id, timeSlot);
    const hasConflict = selectedEmployee && !employee && hasScheduleConflict(selectedEmployee, day, timeSlot, { channel, line: lineIndex });

    return (
      <div
        key={`${day}-${timeSlot}-${channel}-${lineIndex || 0}`}
        className={`
          min-h-[40px] border border-grid-border rounded-md p-1 cursor-pointer
          transition-all duration-200 hover:shadow-md relative group select-none
          ${employee ? 'text-white shadow-sm' : (
            isLunchTime ? 'bg-almoco-light hover:bg-almoco-light/80' : 
            'bg-background hover:bg-accent'
          )}
          ${selectedEmployee && !employee && !hasConflict ? 'hover:ring-2 hover:ring-primary' : ''}
          ${isInCurrentSelection ? 'ring-2 ring-primary bg-primary/20' : ''}
          ${hasConflict ? 'bg-destructive/20 border-destructive' : ''}
        `}
        style={employee ? { backgroundColor: getEmployeeById(employeeId)?.color } : {}}
        onMouseDown={() => handleMouseDown(day, timeSlot, channel, lineIndex)}
        onMouseEnter={() => handleMouseEnter(day, timeSlot, channel, lineIndex)}
        onMouseUp={handleMouseUp}
      >
        {employee && (
          <>
            <div className="text-xs font-medium truncate pr-5">
              {employee.name}
            </div>
            {isEmployeeLunch && (
              <Coffee className="absolute top-0.5 right-4 h-3 w-3 opacity-70" />
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
        {hasConflict && (
          <div className="flex items-center justify-center h-full">
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </div>
        )}
      </div>
    );
  }, [getSlotContent, getEmployeeById, isInSelection, isEmployeeLunchTime, hasScheduleConflict, selectedEmployee, handleMouseDown, handleMouseEnter, handleMouseUp, handleClearSlot]);

  // Renderizar barras consecutivas
  const renderConsecutiveBar = useCallback((day: string, channel: 'livechat' | 'ligacao', lineIndex?: number) => {
    const groups = getConsecutiveSlots(day, channel, lineIndex);
    
    return TIME_SLOTS.map((slot, index) => {
      const group = groups.find(g => 
        index >= g.startIndex && index <= g.endIndex && g.employee
      );
      
      if (group && group.employee) {
        // Se é o primeiro slot do grupo, renderizar a barra completa
        if (index === group.startIndex) {
          const width = group.endIndex - group.startIndex + 1;
          const isEmployeeLunch = isEmployeeLunchTime(group.employee.id, slot.display);
          
          return (
            <div
              key={`${day}-${slot.display}-${channel}-${lineIndex || 0}-bar`}
              className={`
                min-h-[40px] border border-grid-border rounded-md p-1 cursor-pointer
                transition-all duration-200 hover:shadow-md relative group select-none touch-friendly
                text-white shadow-sm flex items-center justify-center
              `}
              style={{ 
                backgroundColor: group.employee.color,
                width: `${width * 4}rem`,
                minWidth: `${width * 4}rem`
              }}
            >
              <div className="text-xs font-medium text-center">
                {group.employee.name}
                <div className="text-xs opacity-75">
                  {group.slots[0]} - {group.slots[group.slots.length - 1]}
                </div>
              </div>
              {isEmployeeLunch && (
                <Coffee className="absolute top-1 right-1 h-3 w-3 opacity-70" />
              )}
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 h-5 w-5 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  // Limpar todos os slots do grupo
                  group.slots.forEach(timeSlot => {
                    handleClearSlot(day, timeSlot, channel, lineIndex);
                  });
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          );
        } else {
          // Slots seguintes do grupo são vazios (a barra já ocupa o espaço)
          return null;
        }
      } else {
        // Slot vazio - renderizar normalmente
        const employeeId = getSlotContent(day, slot.display, channel, lineIndex);
        const employee = employeeId ? getEmployeeById(employeeId) : null;
        const isLunchTime = slot.display >= "11:30" && slot.display < "15:00";
        const isInCurrentSelection = isInSelection(day, slot.display, channel, lineIndex);
        const isEmployeeLunch = employee && isEmployeeLunchTime(employee.id, slot.display);
        const hasConflict = selectedEmployee && !employee && hasScheduleConflict(selectedEmployee, day, slot.display, { channel, line: lineIndex });

        return (
          <div
            key={`${day}-${slot.display}-${channel}-${lineIndex || 0}`}
            className={`
              min-h-[40px] w-16 border border-grid-border rounded-md p-1 cursor-pointer
              transition-all duration-200 hover:shadow-md relative group select-none touch-friendly flex-shrink-0
              ${employee ? 'text-white shadow-sm' : (
                isLunchTime ? 'bg-almoco-light hover:bg-almoco-light/80' : 
                'bg-background hover:bg-accent'
              )}
              ${selectedEmployee && !employee && !hasConflict ? 'hover:ring-2 hover:ring-primary' : ''}
              ${isInCurrentSelection ? 'ring-2 ring-primary bg-primary/20' : ''}
              ${hasConflict ? 'bg-destructive/20 border-destructive' : ''}
            `}
            style={employee ? { backgroundColor: getEmployeeById(employeeId)?.color } : {}}
            onMouseDown={() => handleMouseDown(day, slot.display, channel, lineIndex)}
            onMouseEnter={() => handleMouseEnter(day, slot.display, channel, lineIndex)}
            onMouseUp={handleMouseUp}
          >
            {employee && (
              <>
                <div className="text-xs font-medium truncate pr-5">
                  {employee.name}
                </div>
                {isEmployeeLunch && (
                  <Coffee className="absolute top-0.5 right-4 h-3 w-3 opacity-70" />
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 h-5 w-5 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClearSlot(day, slot.display, channel, lineIndex);
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
            {hasConflict && (
              <div className="flex items-center justify-center h-full">
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </div>
            )}
          </div>
        );
      }
    }).filter(Boolean);
  }, [getConsecutiveSlots, isEmployeeLunchTime, handleClearSlot, renderSlot]);

  return (
    <div className="space-y-6">
      {/* Seleção de funcionário */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Selecionar Funcionário
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Clique em um funcionário e arraste na grade para criar turnos. Mantenha pressionado e arraste para selecionar múltiplos horários.
          </p>
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Escala Semanal
            </CardTitle>
            <div className="flex flex-wrap gap-2">
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
          <div 
            ref={gridRef} 
            className="overflow-x-auto schedule-grid-container"
            onMouseLeave={() => setDragSelection({ isSelecting: false, startSlot: null, endSlot: null })}
          >
            <div className="min-w-max">
              {/* Cabeçalho com horários */}
              <div className="flex gap-1 mb-2 sticky top-0 bg-background z-10">
                <div className="w-28 font-medium text-sm bg-grid-header text-white p-2 rounded text-center flex-shrink-0">
                  Horário
                </div>
                <div className="flex gap-1 overflow-x-auto">
                  {TIME_SLOTS.map(slot => (
                    <div key={slot.display} className="text-xs font-medium p-1 bg-muted rounded text-center w-16 flex-shrink-0">
                      {slot.display}
                    </div>
                  ))}
                </div>
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
                    <div className="flex gap-1">
                      <div className="w-28 flex items-center gap-2 bg-livechat-light p-2 rounded flex-shrink-0">
                        <MessageSquare className="h-4 w-4 text-livechat" />
                        <span className="text-sm font-medium">Chat</span>
                      </div>
                      <div className="flex gap-1 overflow-x-auto">
                        {renderConsecutiveBar(day, 'livechat')}
                      </div>
                    </div>
                  </div>

                  {/* Ligação - 3 linhas */}
                  <div className="space-y-1">
                    {[0, 1, 2].map(lineIndex => (
                      <div key={lineIndex} className="flex gap-1">
                        <div className="w-28 flex items-center gap-2 bg-ligacao-light p-2 rounded flex-shrink-0">
                          <Phone className="h-4 w-4 text-ligacao" />
                          <span className="text-sm font-medium">
                            Tel {lineIndex + 1}
                          </span>
                        </div>
                        <div className="flex gap-1 overflow-x-auto">
                          {renderConsecutiveBar(day, 'ligacao', lineIndex)}
                        </div>
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