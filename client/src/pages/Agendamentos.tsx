import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { 
  Calendar, 
  Plus, 
  Trash2, 
  Clock, 
  Bell, 
  CheckCircle, 
  AlertCircle,
  Play,
  Pause,
  RotateCcw,
  History,
  Settings,
  Mail,
  MessageSquare,
  Zap,
  ChevronRight
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const scheduleTypeLabels: Record<string, string> = {
  das_simples: "DAS - Simples Nacional",
  das_mei: "DAS - MEI",
  parcelamentos: "Parcelamentos",
  dctfweb: "DCTFWeb",
  declaracoes: "Declarações",
};

const scheduleTypeDescriptions: Record<string, string> = {
  das_simples: "Emissão e envio do DAS do Simples Nacional",
  das_mei: "Emissão e envio do DAS do MEI",
  parcelamentos: "Geração de DAS de parcelamentos federais",
  dctfweb: "Transmissão da DCTFWeb e geração de DARF",
  declaracoes: "Transmissão de declarações obrigatórias",
};

const scheduleTypeColors: Record<string, string> = {
  das_simples: "bg-blue-500",
  das_mei: "bg-green-500",
  parcelamentos: "bg-pink-500",
  dctfweb: "bg-purple-500",
  declaracoes: "bg-orange-500",
};

// Mock de histórico de execuções
const mockExecutionHistory = [
  { id: 1, type: "das_simples", date: "2026-02-20", status: "success", count: 45 },
  { id: 2, type: "dctfweb", date: "2026-02-10", status: "success", count: 38 },
  { id: 3, type: "das_mei", date: "2026-02-20", status: "partial", count: 12 },
  { id: 4, type: "parcelamentos", date: "2026-02-15", status: "failed", count: 0 },
];

export default function Agendamentos() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);
  const { data: schedules, isLoading, refetch } = trpc.schedules.list.useQuery();

  const createSchedule = trpc.schedules.create.useMutation({
    onSuccess: () => {
      toast.success("Agendamento criado com sucesso!");
      setDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao criar agendamento: " + error.message);
    },
  });

  const updateSchedule = trpc.schedules.update.useMutation({
    onSuccess: () => {
      toast.success("Agendamento atualizado!");
      refetch();
    },
  });

  const deleteSchedule = trpc.schedules.delete.useMutation({
    onSuccess: () => {
      toast.success("Agendamento excluído!");
      refetch();
    },
  });

  const [formData, setFormData] = useState({
    scheduleType: "" as any,
    dayOfMonth: 1,
    hour: 8,
    active: true,
    notifyEmail: true,
    notifyWhatsApp: false,
    autoSend: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.scheduleType) {
      toast.error("Selecione um tipo de agendamento");
      return;
    }
    createSchedule.mutate({
      scheduleType: formData.scheduleType,
      dayOfMonth: formData.dayOfMonth,
      active: formData.active,
    });
  };

  const activeCount = schedules?.filter(s => s.active).length || 0;
  const inactiveCount = (schedules?.length || 0) - activeCount;

  const getNextExecution = (dayOfMonth: number) => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    let nextDate = new Date(currentYear, currentMonth, dayOfMonth);
    if (nextDate < today) {
      nextDate = new Date(currentYear, currentMonth + 1, dayOfMonth);
    }
    return nextDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Agendamentos Automáticos</h1>
            <p className="text-muted-foreground mt-1">
              Configure automações para processos fiscais recorrentes
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="px-3 py-1">
              <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
              {activeCount} Ativos
            </Badge>
            <Badge variant="outline" className="px-3 py-1">
              <Pause className="h-3 w-3 mr-1 text-yellow-500" />
              {inactiveCount} Inativos
            </Badge>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Agendamento
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-amber-500" />
                    Criar Agendamento
                  </DialogTitle>
                  <DialogDescription>
                    Configure uma nova automação para execução periódica
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="scheduleType">Tipo de Automação</Label>
                    <Select
                      value={formData.scheduleType}
                      onValueChange={(value) => setFormData({ ...formData, scheduleType: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(scheduleTypeLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex flex-col">
                              <span>{label}</span>
                              <span className="text-xs text-muted-foreground">
                                {scheduleTypeDescriptions[key]}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="dayOfMonth">Dia do Mês</Label>
                      <Input
                        id="dayOfMonth"
                        type="number"
                        min="1"
                        max="31"
                        value={formData.dayOfMonth}
                        onChange={(e) => setFormData({ ...formData, dayOfMonth: parseInt(e.target.value) })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="hour">Horário</Label>
                      <Select
                        value={formData.hour.toString()}
                        onValueChange={(value) => setFormData({ ...formData, hour: parseInt(value) })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Horário" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 24 }, (_, i) => (
                            <SelectItem key={i} value={i.toString()}>
                              {i.toString().padStart(2, "0")}:00
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Notificações</Label>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="notifyEmail"
                        checked={formData.notifyEmail}
                        onCheckedChange={(checked) => 
                          setFormData({ ...formData, notifyEmail: checked as boolean })
                        }
                      />
                      <Label htmlFor="notifyEmail" className="text-sm font-normal flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Enviar por e-mail
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="notifyWhatsApp"
                        checked={formData.notifyWhatsApp}
                        onCheckedChange={(checked) => 
                          setFormData({ ...formData, notifyWhatsApp: checked as boolean })
                        }
                      />
                      <Label htmlFor="notifyWhatsApp" className="text-sm font-normal flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Enviar por WhatsApp
                      </Label>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="autoSend" className="text-sm font-medium">Envio Automático</Label>
                      <p className="text-xs text-muted-foreground">
                        Enviar guias diretamente para os clientes
                      </p>
                    </div>
                    <Switch
                      id="autoSend"
                      checked={formData.autoSend}
                      onCheckedChange={(checked) => setFormData({ ...formData, autoSend: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <Label htmlFor="active" className="text-sm font-medium">Ativar agendamento</Label>
                    <Switch
                      id="active"
                      checked={formData.active}
                      onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={createSchedule.isPending}>
                      {createSchedule.isPending ? "Criando..." : "Criar Agendamento"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Agendamentos</p>
                  <p className="text-2xl font-bold">{schedules?.length || 0}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ativos</p>
                  <p className="text-2xl font-bold text-green-600">{activeCount}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <Play className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Execuções Hoje</p>
                  <p className="text-2xl font-bold text-purple-600">0</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Taxa Sucesso</p>
                  <p className="text-2xl font-bold text-blue-600">98%</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Agendamentos Configurados */}
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Agendamentos Configurados
                </CardTitle>
                <CardDescription>
                  {schedules?.length || 0} agendamento{schedules?.length !== 1 ? "s" : ""} configurado{schedules?.length !== 1 ? "s" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">
                    <RotateCcw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                    <p className="text-muted-foreground mt-2">Carregando...</p>
                  </div>
                ) : schedules && schedules.length > 0 ? (
                  <div className="space-y-3">
                    {schedules.map((schedule) => (
                      <div
                        key={schedule.id}
                        className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedSchedule(schedule);
                          setDetailsOpen(true);
                        }}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`h-10 w-10 rounded-lg ${scheduleTypeColors[schedule.processType]} bg-opacity-20 flex items-center justify-center`}>
                            <Calendar className={`h-5 w-5 ${scheduleTypeColors[schedule.processType].replace("bg-", "text-")}`} />
                          </div>
                          <div>
                            <p className="font-medium">
                              {scheduleTypeLabels[schedule.processType] || schedule.processType}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Dia {schedule.dayOfMonth} de cada mês • Próxima: {getNextExecution(schedule.dayOfMonth)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={schedule.active ? "default" : "secondary"}>
                            {schedule.active ? "Ativo" : "Inativo"}
                          </Badge>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Nenhum agendamento configurado
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Crie seu primeiro agendamento para automações
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => setDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Criar agendamento
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Histórico de Execuções */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <History className="h-5 w-5" />
                  Histórico de Execuções
                </CardTitle>
                <CardDescription>
                  Últimas execuções automáticas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockExecutionHistory.map((exec) => (
                    <div key={exec.id} className="flex items-start gap-3 p-3 rounded-lg border border-border">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                        exec.status === "success" ? "bg-green-100" :
                        exec.status === "partial" ? "bg-yellow-100" : "bg-red-100"
                      }`}>
                        {exec.status === "success" ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : exec.status === "partial" ? (
                          <AlertCircle className="h-4 w-4 text-yellow-600" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {scheduleTypeLabels[exec.type]}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(exec.date).toLocaleDateString("pt-BR")}
                        </p>
                        <Badge 
                          variant="outline" 
                          className={`mt-1 text-xs ${
                            exec.status === "success" ? "border-green-200 text-green-700" :
                            exec.status === "partial" ? "border-yellow-200 text-yellow-700" :
                            "border-red-200 text-red-700"
                          }`}
                        >
                          {exec.count} processados
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="ghost" className="w-full mt-4 text-sm">
                  Ver histórico completo
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Dialog de Detalhes */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Detalhes do Agendamento</DialogTitle>
            </DialogHeader>
            {selectedSchedule && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-lg ${scheduleTypeColors[selectedSchedule.scheduleType]} bg-opacity-20 flex items-center justify-center`}>
                    <Calendar className={`h-6 w-6 ${scheduleTypeColors[selectedSchedule.scheduleType].replace("bg-", "text-")}`} />
                  </div>
                  <div>
                    <p className="font-semibold">{scheduleTypeLabels[selectedSchedule.scheduleType]}</p>
                    <p className="text-sm text-muted-foreground">
                      Criado em {new Date(selectedSchedule.createdAt).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Dia do Mês</p>
                    <p className="text-lg font-medium">{selectedSchedule.dayOfMonth}</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Horário</p>
                    <p className="text-lg font-medium">08:00</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Status</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{selectedSchedule.active ? "Ativo" : "Inativo"}</span>
                    <Switch
                      checked={selectedSchedule.active}
                      onCheckedChange={(checked) =>
                        updateSchedule.mutate({ id: selectedSchedule.id, active: checked })
                      }
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (confirm("Deseja realmente excluir este agendamento?")) {
                        deleteSchedule.mutate({ id: selectedSchedule.id });
                        setDetailsOpen(false);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </Button>
                  <Button variant="outline" onClick={() => setDetailsOpen(false)}>
                    Fechar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
