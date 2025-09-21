import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useSchedule } from "@/hooks/useSchedule";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { 
  Shuffle,
  Settings,
  Clock,
  Users,
  Target,
  AlertCircle,
  CheckCircle2,
  Play
} from "lucide-react";

export function AutoCompletarPage() {
  const { employees, autoComplete, clearSchedule } = useSchedule();
  const { toast } = useToast();
  
  const [config, setConfig] = useState({
    turnoDuracao: [4], // Duração dos turnos em horas
    balanceamento: true, // Balancear horas entre funcionários
    respeitarAlmoco: true, // Respeitar horário de almoço
    rotacaoCanais: true, // Rotacionar entre livechat e ligação
    coberturaAlmoco: [50], // % de cobertura no almoço
  });

  const activeEmployees = employees.filter(emp => emp.active);

  const handleAutoComplete = () => {
    autoComplete();
    toast({
      title: "Escala gerada com sucesso!",
      description: `Distribuição automática criada com turnos de ${config.turnoDuracao[0]}h e balanceamento ativo.`,
    });
  };

  const handleClearAndGenerate = () => {
    clearSchedule();
    setTimeout(() => {
      autoComplete();
      toast({
        title: "Nova escala gerada!",
        description: "Escala anterior limpa e nova distribuição criada.",
      });
    }, 500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shuffle className="h-5 w-5" />
            Auto-Completar Escala
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Configure e gere automaticamente a distribuição dos turnos para todos os funcionários ativos.
          </p>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configurações */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Parâmetros de Distribuição
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Duração dos Turnos */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Duração dos Turnos: {config.turnoDuracao[0]} horas
                </Label>
                <Slider
                  value={config.turnoDuracao}
                  onValueChange={(value) => setConfig({...config, turnoDuracao: value})}
                  max={8}
                  min={2}
                  step={1}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Define quantas horas consecutivas cada funcionário trabalhará por turno.
                </p>
              </div>

              {/* Cobertura no Almoço */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Cobertura no Almoço: {config.coberturaAlmoco[0]}%
                </Label>
                <Slider
                  value={config.coberturaAlmoco}
                  onValueChange={(value) => setConfig({...config, coberturaAlmoco: value})}
                  max={100}
                  min={25}
                  step={25}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Percentual da equipe que continuará trabalhando durante o período de almoço (11:30-15:00).
                </p>
              </div>

              {/* Opções Avançadas */}
              <div className="space-y-4">
                <h4 className="font-medium">Opções Avançadas</h4>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm">Balanceamento de Horas</Label>
                    <p className="text-xs text-muted-foreground">
                      Distribui as horas igualmente entre todos os funcionários
                    </p>
                  </div>
                  <Switch
                    checked={config.balanceamento}
                    onCheckedChange={(checked) => setConfig({...config, balanceamento: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm">Rotação entre Canais</Label>
                    <p className="text-xs text-muted-foreground">
                      Alterna funcionários entre livechat e ligação
                    </p>
                  </div>
                  <Switch
                    checked={config.rotacaoCanais}
                    onCheckedChange={(checked) => setConfig({...config, rotacaoCanais: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm">Respeitar Almoço</Label>
                    <p className="text-xs text-muted-foreground">
                      Mantém cobertura reduzida no horário de almoço
                    </p>
                  </div>
                  <Switch
                    checked={config.respeitarAlmoco}
                    onCheckedChange={(checked) => setConfig({...config, respeitarAlmoco: checked})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ações */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Executar Distribuição
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Button 
                  onClick={handleAutoComplete}
                  disabled={activeEmployees.length < 4}
                  className="flex items-center gap-2"
                >
                  <Shuffle className="h-4 w-4" />
                  Gerar Escala
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={handleClearAndGenerate}
                  disabled={activeEmployees.length < 4}
                  className="flex items-center gap-2"
                >
                  <Target className="h-4 w-4" />
                  Limpar e Gerar Nova
                </Button>
              </div>
              
              {activeEmployees.length < 4 && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  Mínimo de 4 funcionários ativos necessário
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Status e Informações */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Status da Equipe
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Funcionários Ativos</span>
                  <Badge variant={activeEmployees.length >= 4 ? "default" : "destructive"}>
                    {activeEmployees.length}
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Mínimo Necessário</span>
                  <Badge variant="outline">4</Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Cobertura</span>
                  <Badge variant={activeEmployees.length >= 4 ? "default" : "secondary"}>
                    {activeEmployees.length >= 4 ? "Completa" : "Insuficiente"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Previsão de Distribuição
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Livechat por turno:</span>
                  <span className="font-medium">1 pessoa</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ligação por turno:</span>
                  <span className="font-medium">3 pessoas</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duração do turno:</span>
                  <span className="font-medium">{config.turnoDuracao[0]}h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Turnos por dia:</span>
                  <span className="font-medium">{Math.ceil(10 / config.turnoDuracao[0])}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Algoritmo de Distribuição</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  <span>Turnos consecutivos de {config.turnoDuracao[0]}h</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  <span>Rotação automática entre canais</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  <span>Balanceamento de carga de trabalho</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  <span>Cobertura otimizada no almoço</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}