import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Settings,
  Clock,
  Users,
  Palette,
  Save,
  RotateCcw,
  AlertCircle,
  Building,
  Mail,
  Phone,
  MapPin
} from "lucide-react";

interface AppSettings {
  empresa: {
    nome: string;
    logo: string;
    endereco: string;
    telefone: string;
    email: string;
  };
  horarios: {
    inicioTrabalho: string;
    fimTrabalho: string;
    inicioAlmoco: string;
    fimAlmoco: string;
    intervaloDuracao: number;
  };
  notificacoes: {
    emailAlertas: boolean;
    lembreteTurnos: boolean;
    relatorioSemanal: boolean;
  };
  interface: {
    tema: 'light' | 'dark' | 'auto';
    compacto: boolean;
    animacoes: boolean;
  };
  escalas: {
    duracaoMinimaTurno: number;
    coberturaMinima: number;
    alertaConflitos: boolean;
    autoSalvar: boolean;
    almocoTipo: 'fixo' | 'aleatorio';
    almocoFixoInicio: string;
    almocoFixoFim: string;
  };
}

export function ConfiguracoesPage() {
  const { toast } = useToast();
  
  const [settings, setSettings] = useState<AppSettings>({
    empresa: {
      nome: "Sua Empresa",
      logo: "",
      endereco: "Rua Example, 123 - São Paulo, SP",
      telefone: "(11) 99999-9999",
      email: "contato@empresa.com"
    },
    horarios: {
      inicioTrabalho: "08:00",
      fimTrabalho: "18:00",
      inicioAlmoco: "11:30",
      fimAlmoco: "15:00",
      intervaloDuracao: 30
    },
    notificacoes: {
      emailAlertas: true,
      lembreteTurnos: false,
      relatorioSemanal: true
    },
    interface: {
      tema: 'light',
      compacto: false,
      animacoes: true
    },
    escalas: {
      duracaoMinimaTurno: 2,
      coberturaMinima: 75,
      alertaConflitos: true,
      autoSalvar: true,
      almocoTipo: 'aleatorio',
      almocoFixoInicio: '12:00',
      almocoFixoFim: '13:00'
    }
  });

  const [hasChanges, setHasChanges] = useState(false);

  const updateSettings = (section: keyof AppSettings, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    localStorage.setItem('app-settings', JSON.stringify(settings));
    setHasChanges(false);
    
    // Notificar outros componentes sobre mudança nas configurações
    window.dispatchEvent(new Event('storage'));
    
    toast({
      title: "Configurações salvas!",
      description: "Todas as alterações foram aplicadas com sucesso.",
    });
  };

  const handleReset = () => {
    // Reset para configurações padrão
    setHasChanges(true);
    toast({
      title: "Configurações resetadas",
      description: "Valores padrão restaurados. Clique em salvar para aplicar.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configurações do Sistema
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Personalize o sistema de acordo com suas necessidades.
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleReset}
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Resetar
              </Button>
              <Button 
                onClick={handleSave}
                disabled={!hasChanges}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Salvar Alterações
              </Button>
            </div>
          </div>
          
          {hasChanges && (
            <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg mt-4">
              <AlertCircle className="h-4 w-4" />
              Você tem alterações não salvas
            </div>
          )}
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Informações da Empresa */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Informações da Empresa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="nome-empresa">Nome da Empresa</Label>
              <Input
                id="nome-empresa"
                value={settings.empresa.nome}
                onChange={(e) => updateSettings('empresa', 'nome', e.target.value)}
                placeholder="Digite o nome da empresa"
              />
            </div>
            
            <div>
              <Label htmlFor="endereco">Endereço</Label>
              <Input
                id="endereco"
                value={settings.empresa.endereco}
                onChange={(e) => updateSettings('empresa', 'endereco', e.target.value)}
                placeholder="Endereço completo"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={settings.empresa.telefone}
                  onChange={(e) => updateSettings('empresa', 'telefone', e.target.value)}
                  placeholder="(11) 99999-9999"
                />
              </div>
              
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={settings.empresa.email}
                  onChange={(e) => updateSettings('empresa', 'email', e.target.value)}
                  placeholder="contato@empresa.com"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configurações de Horário */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Horários de Funcionamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="inicio-trabalho">Início do Expediente</Label>
                <Input
                  id="inicio-trabalho"
                  type="time"
                  value={settings.horarios.inicioTrabalho}
                  onChange={(e) => updateSettings('horarios', 'inicioTrabalho', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="fim-trabalho">Fim do Expediente</Label>
                <Input
                  id="fim-trabalho"
                  type="time"
                  value={settings.horarios.fimTrabalho}
                  onChange={(e) => updateSettings('horarios', 'fimTrabalho', e.target.value)}
                />
              </div>
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="inicio-almoco">Início do Almoço</Label>
                <Input
                  id="inicio-almoco"
                  type="time"
                  value={settings.horarios.inicioAlmoco}
                  onChange={(e) => updateSettings('horarios', 'inicioAlmoco', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="fim-almoco">Fim do Almoço</Label>
                <Input
                  id="fim-almoco"
                  type="time"
                  value={settings.horarios.fimAlmoco}
                  onChange={(e) => updateSettings('horarios', 'fimAlmoco', e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <Label>Duração dos Intervalos: {settings.horarios.intervaloDuracao} minutos</Label>
              <Slider
                value={[settings.horarios.intervaloDuracao]}
                onValueChange={(value) => updateSettings('horarios', 'intervaloDuracao', value[0])}
                max={60}
                min={15}
                step={15}
                className="mt-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* Configurações de Escala */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Configurações de Escala
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Duração Mínima do Turno: {settings.escalas.duracaoMinimaTurno} horas</Label>
              <Slider
                value={[settings.escalas.duracaoMinimaTurno]}
                onValueChange={(value) => updateSettings('escalas', 'duracaoMinimaTurno', value[0])}
                max={8}
                min={1}
                step={1}
                className="mt-2"
              />
            </div>
            
            <div>
              <Label>Cobertura Mínima: {settings.escalas.coberturaMinima}%</Label>
              <Slider
                value={[settings.escalas.coberturaMinima]}
                onValueChange={(value) => updateSettings('escalas', 'coberturaMinima', value[0])}
                max={100}
                min={25}
                step={25}
                className="mt-2"
              />
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Alertar Conflitos</Label>
                  <p className="text-xs text-muted-foreground">Notificar quando houver sobreposição de turnos</p>
                </div>
                <Switch
                  checked={settings.escalas.alertaConflitos}
                  onCheckedChange={(checked) => updateSettings('escalas', 'alertaConflitos', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Auto-salvar</Label>
                  <p className="text-xs text-muted-foreground">Salvar alterações automaticamente</p>
                </div>
                <Switch
                  checked={settings.escalas.autoSalvar}
                  onCheckedChange={(checked) => updateSettings('escalas', 'autoSalvar', checked)}
                />
              </div>
            </div>
            
            <Separator />
            
            {/* Configurações de Almoço */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Horário de Almoço</Label>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Horário Fixo</Label>
                  <p className="text-xs text-muted-foreground">Todos funcionários almoçam no mesmo horário</p>
                </div>
                <Switch
                  checked={settings.escalas.almocoTipo === 'fixo'}
                  onCheckedChange={(checked) => updateSettings('escalas', 'almocoTipo', checked ? 'fixo' : 'aleatorio')}
                />
              </div>
              
              {settings.escalas.almocoTipo === 'fixo' && (
                <div className="grid grid-cols-2 gap-4 pl-4 border-l-2 border-muted">
                  <div>
                    <Label htmlFor="almoco-fixo-inicio" className="text-xs">Início</Label>
                    <Input
                      id="almoco-fixo-inicio"
                      type="time"
                      value={settings.escalas.almocoFixoInicio}
                      onChange={(e) => updateSettings('escalas', 'almocoFixoInicio', e.target.value)}
                      className="text-xs"
                    />
                  </div>
                  <div>
                    <Label htmlFor="almoco-fixo-fim" className="text-xs">Fim</Label>
                    <Input
                      id="almoco-fixo-fim"
                      type="time"
                      value={settings.escalas.almocoFixoFim}
                      onChange={(e) => updateSettings('escalas', 'almocoFixoFim', e.target.value)}
                      className="text-xs"
                    />
                  </div>
                </div>
              )}
              
              {settings.escalas.almocoTipo === 'aleatorio' && (
                <div className="text-xs text-muted-foreground pl-4 border-l-2 border-muted">
                  Os horários de almoço serão distribuídos aleatoriamente entre 11:30 e 15:00, respeitando o horário individual de cada funcionário.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notificações */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Notificações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm">Alertas por E-mail</Label>
                <p className="text-xs text-muted-foreground">Receber notificações importantes por e-mail</p>
              </div>
              <Switch
                checked={settings.notificacoes.emailAlertas}
                onCheckedChange={(checked) => updateSettings('notificacoes', 'emailAlertas', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm">Lembrete de Turnos</Label>
                <p className="text-xs text-muted-foreground">Notificar funcionários sobre próximos turnos</p>
              </div>
              <Switch
                checked={settings.notificacoes.lembreteTurnos}
                onCheckedChange={(checked) => updateSettings('notificacoes', 'lembreteTurnos', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm">Relatório Semanal</Label>
                <p className="text-xs text-muted-foreground">Receber resumo semanal da escala</p>
              </div>
              <Switch
                checked={settings.notificacoes.relatorioSemanal}
                onCheckedChange={(checked) => updateSettings('notificacoes', 'relatorioSemanal', checked)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status das Configurações */}
      <Card>
        <CardHeader>
          <CardTitle>Status das Configurações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Badge variant="default">Empresa</Badge>
              <span className="text-sm text-muted-foreground">Configurada</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default">Horários</Badge>
              <span className="text-sm text-muted-foreground">
                {settings.horarios.inicioTrabalho} - {settings.horarios.fimTrabalho}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default">Almoço</Badge>
              <span className="text-sm text-muted-foreground">
                {settings.horarios.inicioAlmoco} - {settings.horarios.fimAlmoco}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}