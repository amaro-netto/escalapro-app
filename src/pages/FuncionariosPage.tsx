import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useSchedule } from "@/hooks/useSchedule";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { 
  Plus,
  Edit,
  Trash2,
  Users,
  UserCheck,
  UserX,
  Clock,
  Coffee,
  Palette
} from "lucide-react";
import { Employee } from "@/types";
import { EmployeeCard } from "@/components/EmployeeCard";

const FuncionariosPage = () => {
  const { employees, addEmployee, updateEmployee, removeEmployee, getEmployeeStats } = useSchedule();
  const { toast } = useToast();
  const { user, role } = useAuth();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Employee>>({
    name: '',
    color: '#3B82F6',
    active: true,
    lunchStart: '12:00',
    lunchEnd: '13:00'
  });

  const availableColors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
    '#F97316', '#6366F1', '#14B8A6', '#F43F5E'
  ];

  const availableLunchTimes = [
    '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30'
  ];

  const resetForm = () => {
    setFormData({
      name: '',
      color: '#3B82F6',
      active: true,
      lunchStart: '12:00',
      lunchEnd: '13:00'
    });
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name?.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, informe o nome do funcionário.",
        variant: "destructive"
      });
      return;
    }

    // Validar horário de almoço
    if (formData.lunchStart && formData.lunchEnd) {
      const startTime = new Date(`2000-01-01 ${formData.lunchStart}:00`);
      const endTime = new Date(`2000-01-01 ${formData.lunchEnd}:00`);
      const diffInHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      
      if (diffInHours <= 0 || diffInHours > 1) {
        toast({
          title: "Horário de almoço inválido",
          description: "O almoço deve durar entre 30 minutos e 1 hora.",
          variant: "destructive"
        });
        return;
      }
    }

    if (editingId) {
      updateEmployee(editingId, formData);
      toast({
        title: "Funcionário atualizado!",
        description: "As informações foram salvas com sucesso.",
      });
    } else {
      addEmployee(formData as Omit<Employee, 'id'>);
      toast({
        title: "Funcionário adicionado!",
        description: `${formData.name} foi adicionado à equipe.`,
      });
    }
    
    resetForm();
    setIsDialogOpen(false);
  };

  const handleEdit = (employee: Employee) => {
    setFormData({
      name: employee.name,
      color: employee.color,
      active: employee.active,
      lunchStart: employee.lunchStart || '12:00',
      lunchEnd: employee.lunchEnd || '13:00'
    });
    setEditingId(employee.id);
    setIsDialogOpen(true);
  };

  const handleRemove = (id: string, name: string) => {
    removeEmployee(id);
    toast({
      title: "Funcionário removido",
      description: `${name} foi removido da equipe e da escala.`,
    });
  };

  const handleToggleActive = (id: string, active: boolean) => {
    updateEmployee(id, { active });
    toast({
      title: active ? "Funcionário ativado" : "Funcionário desativado",
      description: active ? "O funcionário está agora disponível para escalas." : "O funcionário foi removido das escalas ativas.",
    });
  };

  const isManagerOrAdmin = role === 'administrador' || role === 'gerente';
  const loggedInEmployee = employees.find(emp => emp.id === user?.id);

  if (!isManagerOrAdmin && loggedInEmployee) {
    const stats = getEmployeeStats(loggedInEmployee.id);
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Meu Perfil
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Visualização das suas informações e estatísticas semanais.
            </p>
          </CardHeader>
          <CardContent>
            <EmployeeCard 
              employee={loggedInEmployee} 
              weeklyStats={stats} 
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Gestão de Funcionários
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {employees.length} funcionários cadastrados • {employees.filter(emp => emp.active).length} ativos
              </p>
            </div>
            
            {isManagerOrAdmin && (
              <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Adicionar Funcionário
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>
                      {editingId ? 'Editar Funcionário' : 'Novo Funcionário'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Nome</Label>
                      <Input
                        id="name"
                        value={formData.name || ''}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="Digite o nome do funcionário"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="color">Cor</Label>
                      <div className="flex flex-wrap gap-2">
                        {availableColors.map(color => (
                          <button
                            key={color}
                            type="button"
                            className={`w-8 h-8 rounded-full border-2 transition-all ${
                              formData.color === color ? 'border-foreground scale-110' : 'border-muted'
                            }`}
                            style={{ backgroundColor: color }}
                            onClick={() => setFormData({...formData, color})}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Horário de Almoço */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="lunchStart">
                          <Coffee className="h-4 w-4 inline mr-1" />
                          Início do Almoço
                        </Label>
                        <Select 
                          value={formData.lunchStart} 
                          onValueChange={(value) => setFormData({...formData, lunchStart: value})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {availableLunchTimes.map(time => (
                              <SelectItem key={time} value={time}>{time}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="lunchEnd">Fim do Almoço</Label>
                        <Select 
                          value={formData.lunchEnd} 
                          onValueChange={(value) => setFormData({...formData, lunchEnd: value})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {availableLunchTimes.map(time => (
                              <SelectItem key={time} value={time}>{time}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="active"
                        checked={formData.active}
                        onCheckedChange={(checked) => setFormData({...formData, active: checked})}
                      />
                      <Label htmlFor="active">Funcionário ativo</Label>
                    </div>
                    
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit">
                        {editingId ? 'Salvar' : 'Adicionar'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Lista de Funcionários */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {employees.map(employee => {
          const stats = getEmployeeStats(employee.id);
          return (
            <EmployeeCard 
              key={employee.id} 
              employee={employee} 
              onEdit={isManagerOrAdmin ? handleEdit : undefined}
              onDelete={isManagerOrAdmin ? handleRemove : undefined}
              weeklyStats={stats}
            />
          );
        })}
      </div>

      {employees.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum funcionário cadastrado</h3>
            <p className="text-muted-foreground text-center mb-4 max-w-md">
              Comece adicionando funcionários à sua equipe para poder criar escalas de trabalho. 
              É necessário pelo menos 4 funcionários ativos para gerar escalas automáticas.
            </p>
            <Button onClick={() => setIsDialogOpen(true)} disabled={!isManagerOrAdmin}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Primeiro Funcionário
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default FuncionariosPage;