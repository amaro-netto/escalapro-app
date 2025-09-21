import { useState, useCallback, useEffect } from "react";
import React from "react";
import { Employee, DaySchedule, DAYS, TIME_SLOTS, LUNCH_PERIOD, ScheduleConfig, COLORS } from "@/types";
import { supabase } from "@/lib/supabaseClient";

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
      ligacao: [[], [], []]
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

  // Carregar configurações do Supabase
  const loadConfig = useCallback(async (): Promise<ScheduleConfig> => {
    try {
      const { data, error } = await supabase.from('settings').select('config').eq('id', 1).single();
      
      if (error && error.code !== 'PGRST116') { // Ignora "não encontrado"
          throw error;
      }
      
      if (data && data.config) {
        return data.config as ScheduleConfig;
      }
    } catch (error) {
      console.warn('Erro ao carregar configurações do Supabase:', error);
    }
    return DEFAULT_CONFIG;
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [employeesRes, scheduleRes, configRes] = await Promise.all([
        supabase.from('employees').select('*'),
        supabase.from('schedule').select('*'),
        loadConfig()
      ]);

      if (employeesRes.error) throw employeesRes.error;
      if (scheduleRes.error) throw scheduleRes.error;

      if (employeesRes.data) {
        setEmployees(employeesRes.data);
      }
      if (scheduleRes.data && scheduleRes.data.length > 0) {
        setSchedule(scheduleRes.data[0].data);
      } else {
        setSchedule(createEmptySchedule());
      }
      
      setConfig(configRes);

    } catch (err) {
      setError("Failed to fetch data from Supabase.");
      console.error("Supabase fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [loadConfig]);

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

  const saveConfig = useCallback(async (newConfig: ScheduleConfig) => {
      setConfig(newConfig);
      try {
          const { error: upsertError } = await supabase
              .from('settings')
              .upsert({ id: 1, config: newConfig }, { onConflict: 'id' });
  
          if (upsertError) throw upsertError;
      } catch (err) {
          setError("Failed to save config to Supabase.");
          console.error("Supabase config save error:", err);
      }
  }, []);

  const addEmployee = useCallback(async (employee: Omit<Employee, 'id'>) => {
    const newEmployee: Omit<Employee, 'id'> = {
      ...employee,
      color: employee.color || COLORS.primary,
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
    saveConfig,
    hasScheduleConflict,
    isEmployeeLunchTime,
    loading,
    error,
  };
};