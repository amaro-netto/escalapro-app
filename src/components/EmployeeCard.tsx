import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Clock, MessageSquare, Phone, Edit2, Trash2 } from "lucide-react";
import { type Employee } from "@/types";

interface EmployeeCardProps {
  employee: Employee;
  onEdit?: (employee: Employee) => void;
  onDelete?: (employeeId: string) => void;
  weeklyStats?: {
    totalHours: number;
    livechatHours: number;
    ligacaoHours: number;
  };
}

export function EmployeeCard({ employee, onEdit, onDelete, weeklyStats }: EmployeeCardProps) {
  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${employee.active ? '' : 'opacity-50'}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
              style={{ backgroundColor: employee.color }}
            >
              <User className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold">{employee.name}</h3>
              <Badge variant={employee.active ? "default" : "secondary"} className="text-xs">
                {employee.active ? "Ativo" : "Inativo"}
              </Badge>
            </div>
          </div>

          <div className="flex gap-1">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(employee)}
                className="h-8 w-8 p-0"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(employee.id)}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {weeklyStats && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{weeklyStats.totalHours}h</span>
              <span className="text-muted-foreground">esta semana</span>
            </div>

            <div className="flex gap-4 text-xs">
              <div className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3 text-livechat" />
                <span>{weeklyStats.livechatHours}h</span>
              </div>
              <div className="flex items-center gap-1">
                <Phone className="h-3 w-3 text-ligacao" />
                <span>{weeklyStats.ligacaoHours}h</span>
              </div>
            </div>

            {/* Barra de progresso visual */}
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full flex">
                <div 
                  className="bg-livechat" 
                  style={{ 
                    width: `${weeklyStats.totalHours > 0 ? (weeklyStats.livechatHours / weeklyStats.totalHours) * 100 : 0}%` 
                  }} 
                />
                <div 
                  className="bg-ligacao" 
                  style={{ 
                    width: `${weeklyStats.totalHours > 0 ? (weeklyStats.ligacaoHours / weeklyStats.totalHours) * 100 : 0}%` 
                  }} 
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}