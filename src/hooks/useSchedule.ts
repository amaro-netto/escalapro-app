import { useState, useCallback, useEffect } from "react";
import React from "react";
import { Employee, DaySchedule, DAYS, TIME_SLOTS, LUNCH_PERIOD, ScheduleConfig } from "@/types";
import { supabase } from "@/lib/supabaseClient";

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16"];

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
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [schedule, setSchedule] = useState<DaySchedule>(createEmptySchedule());
  const [config, setConfig] = useState<ScheduleConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar configurações do localStorage
  const loadConfig = useCallback((): ScheduleConfig => {
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
  }, []);

  // Carregar dados do Supabase
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select('*');

      const { data: scheduleData, error: scheduleError } = await supabase
        .from('schedule')
        .select('*');

      if (employeesError || scheduleError) {
        throw employeesError || scheduleError;
      }

      if (employeesData) {
        setEmployees(employeesData);
      }
      if (scheduleData && scheduleData.length > 0) {
        setSchedule(scheduleData[0].data);
      } else {
        setSchedule(createEmptySchedule());
      }
    } catch (err) {
      setError("Failed to fetch data from Supabase.");
      console.error("Supabase fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const saveSchedule = useCallback(async (newSchedule: DaySchedule) => {
    setSchedule(newSchedule);
    
    try {
      const { error: upsertError } = await supabase
        .from('schedule')
        .upsert({ id: 1, data: newSchedule }, { onConflict: 'id' });

      if (upsertError) {
        throw upsertError;
      }
    } catch (err) {
      setError("Failed to save schedule to Supabase.");
      console.error("Supabase save error:", err);
    }
  }, []);

  const addEmployee = useCallback(async (employee: Omit<Employee, 'id'>) => {
    const newEmployee: Omit<Employee, 'id'> = {
      ...employee,
      color: employee.color || COLORS[employees.length % COLORS.length],
    };
    
    try {
      const { data, error: insertError } = await supabase
        .from('employees')
        .insert([newEmployee])
        .select();

      if (insertError) throw insertError;
      
      setEmployees(prev => [...prev, data[0]]);
    } catch (err) {
      setError("Failed to add employee.");
      console.error("Supabase insert error:", err);
    }
  }, [employees.length]);

  const updateEmployee = useCallback(async (id: string, updates: Partial<Employee>) => {
    try {
      const { data, error: updateError } = await supabase
        .from('employees')
        .update(updates)
        .eq('id', id)
        .select();
      
      if (updateError) throw updateError;
      
      setEmployees(prev => prev.map(emp => 
        emp.id === id ? { ...emp, ...updates } : emp
      ));
    } catch (err) {
      setError("Failed to update employee.");
      console.error("Supabase update error:", err);
    }
  }, []);

  const removeEmployee = useCallback(async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      
      setEmployees(prev => prev.filter(emp => emp.id !== id));

      const newSchedule = { ...schedule };
      Object.keys(newSchedule).forEach(day => {
        newSchedule[day].livechat.forEach(slot => {
          if (slot.employeeId === id) {
            slot.employeeId = null;
          }
        });
        newSchedule[day].ligacao.forEach(line => {
          line.forEach(slot => {
            if (slot.employeeId === id) {
              slot.employeeId = null;
            }
          });
        });
      });
      saveSchedule(newSchedule);
    } catch (err) {
      setError("Failed to remove employee.");
      console.error("Supabase delete error:", err);
    }
  }, [schedule, saveSchedule]);
  
  const autoComplete = useCallback(async () => {
    try {
        const { error } = await supabase.functions.invoke('auto-complete-schedule');
        
        if (error) {
            console.error('Error invoking Edge Function:', error);
            // Lidar com o erro de forma apropriada
            return;
        }

        await fetchData();
        
    } catch (err) {
        console.error('Unexpected error:', err);
    }
}, [fetchData]);

  const clearSchedule = useCallback(() => {
    const newSchedule = createEmptySchedule();
    saveSchedule(newSchedule);
  }, [saveSchedule]);
  
  const getEmployeeStats = useCallback((employeeId: string) => {
    let totalHours = 0;
    let livechatHours = 0;
    let ligacaoHours = 0;
    Object.values(schedule).forEach(daySchedule => {
      daySchedule.livechat.forEach(slot => {
        if (slot.employeeId === employeeId) {
          totalHours += 0.5;
          livechatHours += 0.5;
        }
      });
      daySchedule.ligacao.forEach(line => {
        line.forEach(slot => {
          if (slot.employeeId === employeeId) {
            totalHours += 0.5;
            ligacaoHours += 0.5;
          }
        });
      });
    });
    return { totalHours, livechatHours, ligacaoHours };
  }, [schedule]);

  const hasScheduleConflict = useCallback((employeeId: string, day: string, timeSlot: string, excludeChannel?: { channel: 'livechat' | 'ligacao'; line?: number }) => {
    const daySchedule = schedule[day];
    if (!daySchedule) return false;
    const slotIndex = TIME_SLOTS.findIndex(slot => slot.display === timeSlot);
    if (slotIndex === -1) return false;
    if (excludeChannel?.channel !== 'livechat') {
      if (daySchedule.livechat[slotIndex]?.employeeId === employeeId) return true;
    }
    for (let i = 0; i < 3; i++) {
      if (excludeChannel?.channel === 'ligacao' && excludeChannel?.line === i) continue;
      if (daySchedule.ligacao[i]?.[slotIndex]?.employeeId === employeeId) return true;
    }
    return false;
  }, [schedule]);

  const isEmployeeLunchTime = useCallback((employeeId: string, timeSlot: string): boolean => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) return false;
    if (config.lunchType === 'fixo' && config.fixedLunchStart && config.fixedLunchEnd) {
      return timeSlot >= config.fixedLunchStart && timeSlot < config.fixedLunchEnd;
    }
    if (employee.lunchStart && employee.lunchEnd) {
      return timeSlot >= employee.lunchStart && timeSlot < employee.lunchEnd;
    }
    return false;
  }, [employees, config]);

  const refreshConfig = useCallback(() => {
    setConfig(loadConfig());
  }, [loadConfig]);

  useEffect(() => {
    refreshConfig();
    const handleStorageChange = () => refreshConfig();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refreshConfig]);

  return {
    employees,
    schedule,
    setSchedule: saveSchedule,
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
    loading,
    error,
  };
};