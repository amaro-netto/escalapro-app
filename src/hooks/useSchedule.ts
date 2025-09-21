import { useState, useCallback, useEffect } from "react";
import React from "react";
import { Employee, DaySchedule, DAYS, TIME_SLOTS, LUNCH_PERIOD, ScheduleConfig } from "@/types";

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16"];

const INITIAL_EMPLOYEES: Employee[] = [
  { id: "1", name: "Ana Silva", color: "#3B82F6", active: true, lunchStart: "12:00", lunchEnd: "13:00" },
  { id: "2", name: "Carlos Santos", color: "#10B981", active: true, lunchStart: "12:30", lunchEnd: "13:30" },
  { id: "3", name: "Maria Oliveira", color: "#F59E0B", active: true, lunchStart: "13:00", lunchEnd: "14:00" },
  { id: "4", name: "João Costa", color: "#EF4444", active: true, lunchStart: "13:30", lunchEnd: "14:30" },
];

const DEFAULT_CONFIG: ScheduleConfig = {
  turnDuration: 4,
  lunchCoverage: 50,
  balanceHours: true,
  rotateChannels: true,
  respectLunch: true,
  lunchType: 'aleatorio',
  fixedLunchStart: '12:00',
  fixedLunchEnd: '13:00'
};

const createEmptySchedule = (): DaySchedule => {
  const schedule: DaySchedule = {};
  
  DAYS.forEach(day => {
    schedule[day] = {
      livechat: TIME_SLOTS.map(slot => ({
        day,
        time: slot.display,
        employeeId: null,
        channel: 'livechat' as const
      })),
      ligacao: [[], [], []] // 3 linhas de ligação
    };
    
    // Inicializar as 3 linhas de ligação
    for (let i = 0; i < 3; i++) {
      schedule[day].ligacao[i] = TIME_SLOTS.map(slot => ({
        day,
        time: slot.display,
        employeeId: null,
        channel: 'ligacao' as const,
        channelLine: i
      }));
    }
  });
  
  return schedule;
};

export const useSchedule = () => {
  // Carregar configurações do localStorage
  const loadConfig = (): ScheduleConfig => {
    try {
      const savedSettings = localStorage.getItem('app-settings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        if (settings.escalas) {
          return {
            turnDuration: settings.escalas.duracaoMinimaTurno || DEFAULT_CONFIG.turnDuration,
            lunchCoverage: settings.escalas.coberturaMinima / 100 || DEFAULT_CONFIG.lunchCoverage,
            balanceHours: settings.escalas.alertaConflitos || DEFAULT_CONFIG.balanceHours,
            rotateChannels: true,
            respectLunch: true,
            lunchType: settings.escalas.almocoTipo || 'aleatorio',
            fixedLunchStart: settings.escalas.almocoFixoInicio || '12:00',
            fixedLunchEnd: settings.escalas.almocoFixoFim || '13:00'
          };
        }
      }
    } catch (error) {
      console.warn('Erro ao carregar configurações:', error);
    }
    return DEFAULT_CONFIG;
  };

  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem('escala-employees');
    return saved ? JSON.parse(saved) : INITIAL_EMPLOYEES;
  });
  const [schedule, setSchedule] = useState<DaySchedule>(() => {
    const saved = localStorage.getItem('escala-schedule');
    return saved ? JSON.parse(saved) : createEmptySchedule();
  });
  const [config, setConfig] = useState<ScheduleConfig>(loadConfig);

  // Atualizar as configurações quando mudarem no localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      setConfig(loadConfig());
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Salvar no localStorage quando houver mudanças
  React.useEffect(() => {
    localStorage.setItem('escala-employees', JSON.stringify(employees));
  }, [employees]);

  React.useEffect(() => {
    localStorage.setItem('escala-schedule', JSON.stringify(schedule));
  }, [schedule]);

  React.useEffect(() => {
    localStorage.setItem('escala-config', JSON.stringify(config));
  }, [config]);

  const addEmployee = useCallback((employee: Omit<Employee, 'id'>) => {
    const newEmployee: Employee = {
      ...employee,
      id: Date.now().toString(),
      color: employee.color || COLORS[employees.length % COLORS.length],
      lunchStart: employee.lunchStart || "12:00",
      lunchEnd: employee.lunchEnd || "13:00"
    };
    setEmployees(prev => [...prev, newEmployee]);
  }, [employees.length]);

  const updateEmployee = useCallback((id: string, updates: Partial<Employee>) => {
    setEmployees(prev => prev.map(emp => 
      emp.id === id ? { ...emp, ...updates } : emp
    ));
  }, []);

  const removeEmployee = useCallback((id: string) => {
    setEmployees(prev => prev.filter(emp => emp.id !== id));
    // Remover funcionário da escala
    setSchedule(prev => {
      const newSchedule = { ...prev };
      Object.keys(newSchedule).forEach(day => {
        // Livechat
        newSchedule[day].livechat.forEach(slot => {
          if (slot.employeeId === id) {
            slot.employeeId = null;
          }
        });
        // Ligação
        newSchedule[day].ligacao.forEach(line => {
          line.forEach(slot => {
            if (slot.employeeId === id) {
              slot.employeeId = null;
            }
          });
        });
      });
      return newSchedule;
    });
  }, []);

  // Verificar conflitos de horário
  const hasScheduleConflict = useCallback((employeeId: string, day: string, timeSlot: string, excludeChannel?: { channel: 'livechat' | 'ligacao'; line?: number }) => {
    const daySchedule = schedule[day];
    if (!daySchedule) return false;

    const slotIndex = TIME_SLOTS.findIndex(slot => slot.display === timeSlot);
    if (slotIndex === -1) return false;

    // Verificar livechat
    if (excludeChannel?.channel !== 'livechat') {
      if (daySchedule.livechat[slotIndex]?.employeeId === employeeId) return true;
    }

    // Verificar ligação  
    for (let i = 0; i < 3; i++) {
      if (excludeChannel?.channel === 'ligacao' && excludeChannel?.line === i) continue;
      if (daySchedule.ligacao[i]?.[slotIndex]?.employeeId === employeeId) return true;
    }

    return false;
  }, [schedule]);

  // Verificar se funcionário está no horário de almoço
  const isEmployeeLunchTime = useCallback((employeeId: string, timeSlot: string): boolean => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) return false;

    // Se horário fixo está configurado, usar ele
    if (config.lunchType === 'fixo' && config.fixedLunchStart && config.fixedLunchEnd) {
      return timeSlot >= config.fixedLunchStart && timeSlot < config.fixedLunchEnd;
    }

    // Senão, usar horário individual do funcionário
    if (employee.lunchStart && employee.lunchEnd) {
      return timeSlot >= employee.lunchStart && timeSlot < employee.lunchEnd;
    }

    return false;
  }, [employees, config]);

  // Função melhorada de auto-completar com rotação e balanceamento
  const autoComplete = useCallback(() => {
    const activeEmployees = employees.filter(emp => emp.active);
    if (activeEmployees.length < 4) return;

    const newSchedule = createEmptySchedule();
    const employeeWorkHours: { [key: string]: number } = {};
    const employeeChannelHours: { [key: string]: { livechat: number; ligacao: number } } = {};
    
    // Inicializar contadores
    activeEmployees.forEach(emp => {
      employeeWorkHours[emp.id] = 0;
      employeeChannelHours[emp.id] = { livechat: 0, ligacao: 0 };
    });

    // Definir turnos de 4 horas: 8-12h, 12-16h, 16-18h (2h)
    const shifts = [
      { start: 0, end: 7, hours: 4 },   // 8:00-12:00 (8 slots de 30min)
      { start: 8, end: 15, hours: 4 },  // 12:00-16:00 (8 slots de 30min)
      { start: 16, end: 19, hours: 2 }  // 16:00-18:00 (4 slots de 30min)
    ];

    DAYS.forEach(day => {
      let employeeIndex = 0;
      const dailyAssignments: { [key: string]: string[] } = {}; // empId -> channels assigned
      
      shifts.forEach(shift => {
        // Para cada turno, precisamos de 1 pessoa no livechat e 3 nas ligações
        const shiftEmployees = [];
        const availableEmployees = activeEmployees.filter(emp => {
          // Verificar se não tem conflito com horário de almoço
          for (let i = shift.start; i <= shift.end; i++) {
            const timeSlot = TIME_SLOTS[i];
            if (isEmployeeLunchTime(emp.id, timeSlot.display)) {
              return false;
            }
          }
          return true;
        });

        if (availableEmployees.length >= 4) {
          // Selecionar funcionários com menos horas trabalhadas
          const sortedByHours = availableEmployees.sort((a, b) => 
            employeeWorkHours[a.id] - employeeWorkHours[b.id]
          );

          // 1 pessoa para livechat - rotacionar canais
          const livechatEmployee = sortedByHours.find(emp => 
            !dailyAssignments[emp.id] || 
            employeeChannelHours[emp.id].livechat <= employeeChannelHours[emp.id].ligacao
          ) || sortedByHours[0];

          shiftEmployees.push({ employee: livechatEmployee, channel: 'livechat' });
          dailyAssignments[livechatEmployee.id] = dailyAssignments[livechatEmployee.id] || [];
          dailyAssignments[livechatEmployee.id].push('livechat');

          // 3 pessoas para ligação
          const remainingEmployees = sortedByHours.filter(emp => emp.id !== livechatEmployee.id);
          for (let line = 0; line < 3 && line < remainingEmployees.length; line++) {
            const ligacaoEmployee = remainingEmployees[line];
            shiftEmployees.push({ employee: ligacaoEmployee, channel: 'ligacao', line });
            dailyAssignments[ligacaoEmployee.id] = dailyAssignments[ligacaoEmployee.id] || [];
            dailyAssignments[ligacaoEmployee.id].push(`ligacao-${line}`);
          }

          // Aplicar as atribuições ao schedule
          for (let i = shift.start; i <= shift.end; i++) {
            const timeSlot = TIME_SLOTS[i];
            
            shiftEmployees.forEach(({ employee, channel, line }) => {
              if (channel === 'livechat') {
                newSchedule[day].livechat[i] = {
                  day,
                  time: timeSlot.display,
                  employeeId: employee.id,
                  channel: 'livechat'
                };
                employeeChannelHours[employee.id].livechat += 0.5;
              } else if (channel === 'ligacao' && line !== undefined) {
                newSchedule[day].ligacao[line][i] = {
                  day,
                  time: timeSlot.display,
                  employeeId: employee.id,
                  channel: 'ligacao',
                  channelLine: line
                };
                employeeChannelHours[employee.id].ligacao += 0.5;
              }
              employeeWorkHours[employee.id] += 0.5;
            });
          }
        }
      });
    });

    setSchedule(newSchedule);
  }, [employees, isEmployeeLunchTime]);

  // Atualizar configurações quando as configurações do app mudarem
  const refreshConfig = useCallback(() => {
    setConfig(loadConfig());
  }, []);

  const clearSchedule = useCallback(() => {
    setSchedule(createEmptySchedule());
  }, []);

  const getEmployeeStats = useCallback((employeeId: string) => {
    let totalHours = 0;
    let livechatHours = 0;
    let ligacaoHours = 0;

    Object.values(schedule).forEach(daySchedule => {
      // Contar livechat
      daySchedule.livechat.forEach(slot => {
        if (slot.employeeId === employeeId) {
          totalHours += 0.5; // 30 minutos
          livechatHours += 0.5;
        }
      });
      
      // Contar ligação
      daySchedule.ligacao.forEach(line => {
        line.forEach(slot => {
          if (slot.employeeId === employeeId) {
            totalHours += 0.5; // 30 minutos
            ligacaoHours += 0.5;
          }
        });
      });
    });

    return { totalHours, livechatHours, ligacaoHours };
  }, [schedule]);

  return {
    employees,
    schedule,
    setSchedule,
    addEmployee,
    updateEmployee,
    removeEmployee,
    autoComplete,
    clearSchedule,
    getEmployeeStats,
    config,
    setConfig,
    hasScheduleConflict,
    isEmployeeLunchTime,
    refreshConfig
  };
};