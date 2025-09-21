export interface Employee {
  id: string;
  name: string;
  color: string;
  active: boolean;
  lunchStart?: string; // horário de início do almoço
  lunchEnd?: string;   // horário de fim do almoço
}

export interface TimeSlot {
  hour: number;
  minute: number;
  display: string;
}

export interface ScheduleSlot {
  day: string;
  time: string;
  employeeId: string | null;
  channel: 'livechat' | 'ligacao';
  channelLine?: number; // Para as 3 linhas de ligação
  isLunch?: boolean;
}

export interface DaySchedule {
  [key: string]: {
    livechat: ScheduleSlot[];
    ligacao: ScheduleSlot[][];
  };
}

export const DAYS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'] as const;
export const WORK_HOURS = { start: 8, end: 18 };
export const LUNCH_PERIOD = { start: "11:30", end: "15:00" }; // Período de almoço flexível

export interface ScheduleConfig {
  turnDuration: number; // duração dos turnos em horas
  lunchCoverage: number; // % de cobertura durante almoço
  balanceHours: boolean; // balancear horas entre funcionários
  rotateChannels: boolean; // rotacionar entre canais
  respectLunch: boolean; // respeitar horário de almoço
  lunchType?: 'fixo' | 'aleatorio';
  fixedLunchStart?: string;
  fixedLunchEnd?: string;
}

export interface DragSelection {
  isSelecting: boolean;
  startSlot: { day: string; time: string; channel: 'livechat' | 'ligacao'; line?: number } | null;
  endSlot: { day: string; time: string; channel: 'livechat' | 'ligacao'; line?: number } | null;
}

// Gerar slots de tempo de 30 em 30 minutos
export const generateTimeSlots = (): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  for (let hour = WORK_HOURS.start; hour < WORK_HOURS.end; hour++) {
    slots.push(
      { hour, minute: 0, display: `${hour.toString().padStart(2, '0')}:00` },
      { hour, minute: 30, display: `${hour.toString().padStart(2, '0')}:30` }
    );
  }
  return slots;
};

export const TIME_SLOTS = generateTimeSlots();

export const COLORS = {
  livechat: "#3B82F6",
  ligacao: "#10B981",
  almoco: "#F59E0B",
  warning: "#EF4444",
  success: "#10B981",
  primary: "#3B82F6",
  destructive: "#EF4444"
};