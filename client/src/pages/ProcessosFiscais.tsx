import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  FileText,
  Plus,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Building2,
  Edit,
} from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const processTypes = [
  { value: "simples_nacional", label: "Simples Nacional", color: "bg-blue-500" },
  { value: "dctfweb", label: "DCTFWeb", color: "bg-purple-500" },
  { value: "fgts", label: "FGTS Digital", color: "bg-orange-500" },
  { value: "parcelamentos", label: "Parcelamentos", color: "bg-pink-500" },
  { value: "situacao_fiscal", label: "Situação Fiscal / CND", color: "bg-cyan-500" },
  { value: "caixas_postais", label: "Caixas Postais", color: "bg-yellow-500" },
  { value: "declaracoes", label: "Declarações (DEFIS/DIRF)", color: "bg-red-500" },
];

const statusOptions = [
  { value: "em_dia", label: "Em dia", color: "bg-green-500" },
  { value: "pendente", label: "Pendente", color: "bg-yellow-500" },
  { value: "atencao", label: "Atenção", color: "bg-red-500" },
];

interface FiscalProcessFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: any;
  isEdit?: boolean;
}

function FiscalProcessForm({ onSuccess, onCancel, initialData, isEdit }: FiscalProcessFormProps) {
  const [formData, setFormData] = useState({
    companyId: initialData?.companyId || "",
    processType: initialData?.processType || "simples_nacional",
    referenceMonth: initialData?.referenceMonth || new Date().getMonth() + 1,
    referenceYear: initialData?.referenceYear || new Date().getFullYear(),
    status: initialData?.status || "em_dia",
    notes: initialData?.notes || "",
  });

  const { data: companies } = trpc.companies.search.useQuery({});

  const createProcess = trpc.fiscalProcesses.create.useMutation({
    onSuccess: () => {
      toast.success("Processo criado com sucesso!");
      utils.fiscalProcesses.list.invalidate();
      utils.fiscalProcesses.getStats.invalidate();
      onSuccess();
    },
    onError: (error) => {
      toast.error("Erro ao criar processo: " + error.message);
    },
  });

  const updateProcess = trpc.fiscalProcesses.update.useMutation({
    onSuccess: () => {
      toast.success("Processo atualizado com sucesso!");
      onSuccess();
    },
    onError: (error) => {
      toast.error("Erro ao atualizar processo: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyId) {
      toast.error("Selecione um cliente");
      return;
    }

    if (isEdit) {
      updateProcess.mutate({ id: initialData.id, ...formData });
    } else {
      createProcess.mutate(formData as any);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label htmlFor="companyId">Cliente</Label>
        <Select
          disabled={isEdit}
          value={formData.companyId}
          onValueChange={(value) => setFormData({ ...formData, companyId: value })}
        >
          <SelectTrigger id="companyId">
            <SelectValue placeholder="Selecione um cliente" />
          </SelectTrigger>
          <SelectContent>
            {companies?.map((company) => (
              <SelectItem key={company.id} value={company.id}>
                {company.name} ({company.cnpj || company.cpf})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="processType">Tipo de Processo</Label>
          <Select
            value={formData.processType}
            onValueChange={(value) => setFormData({ ...formData, processType: value as any })}
          >
            <SelectTrigger id="processType">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {processTypes.map((pt) => (
                <SelectItem key={pt.value} value={pt.value}>
                  {pt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData({ ...formData, status: value as any })}
          >
            <SelectTrigger id="status">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="referenceMonth">Mês de Referência (Competência)</Label>
          <Input
            id="referenceMonth"
            type="number"
            min="1"
            max="12"
            value={formData.referenceMonth}
            onChange={(e) => setFormData({ ...formData, referenceMonth: parseInt(e.target.value) })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="referenceYear">Ano de Referência</Label>
          <Input
            id="referenceYear"
            type="number"
            value={formData.referenceYear}
            onChange={(e) => setFormData({ ...formData, referenceYear: parseInt(e.target.value) })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Observações</Label>
        <textarea
          id="notes"
          className="w-full min-h-[100px] p-3 rounded-md border border-input bg-background text-sm"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={createProcess.isPending || updateProcess.isPending}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          {createProcess.isPending || updateProcess.isPending ? "Salvando..." : "Salvar Processo"}
        </Button>
      </div>
    </form>
  );
}

export default function ProcessosFiscais() {
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState<string>("all");
  const [statusFiltro, setStatusFiltro] = useState<string>("all");
  const [anoFiltro, setAnoFiltro] = useState<string>(new Date().getFullYear().toString());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProcess, setSelectedProcess] = useState<any>(null);

  const { data: processos, isLoading, refetch: refetchList } = trpc.fiscalProcesses.list.useQuery(
    { processType: tipoFiltro }
  );

  const { data: statsData, refetch: refetchStats } = trpc.fiscalProcesses.getStats.useQuery();

  const handleRefresh = async () => {
    const promise = Promise.all([refetchList(), refetchStats()]);
    toast.promise(promise, {
      loading: 'Atualizando dados...',
      success: 'Dados atualizados!',
      error: 'Erro ao atualizar dados',
    });
  };

  const updateProcess = trpc.fiscalProcesses.update.useMutation({
    onSuccess: () => {
      toast.success("Processo atualizado com sucesso!");
      utils.fiscalProcesses.list.invalidate();
      utils.fiscalProcesses.getStats.invalidate();
      setDialogOpen(false);
    },
    onError: (error) => {
      toast.error("Erro ao atualizar: " + error.message);
    },
  });

  const getStatusBadge = (status: string) => {
    const option = statusOptions.find(s => s.value === status);
    return (
      <Badge className={`${option?.color || "bg-gray-500"} text-white`}>
        {option?.label || status}
      </Badge>
    );
  };

  const getProcessTypeLabel = (type: string) => {
    const pt = processTypes.find(p => p.value === type);
    return pt?.label || type;
  };

  const filteredProcessos = processos?.filter((p: any) => {
    if (statusFiltro !== "all" && p.process.status !== statusFiltro) return false;
    // Only filter by year if p.process.referenceYear exists; otherwise show it to avoid missing items
    if (anoFiltro && p.process.referenceYear != null && p.process.referenceYear.toString() !== anoFiltro) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      // Changed from client.razaoSocialNome and client.cnpjCpf to company.name and company.cnpj/cpf
      // Need to verify what 'p.client' structure is returned by router.
      // Based on server/db.ts getFiscalProcessesByType join, it returns { process: ..., company: ... }
      return (
        p.company.name?.toLowerCase().includes(search) || // Changed from client.razaoSocialNome
        (p.company.cnpj || p.company.cpf)?.toLowerCase().includes(search) // Changed from client.cnpjCpf
      );
    }
    return true;
  });

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Processos Fiscais</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie todos os processos fiscais dos seus clientes
            </p>
          </div>
          <Button onClick={() => {
            setSelectedProcess(null);
            setDialogOpen(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Processo
          </Button>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedProcess ? "Editar Processo" : "Novo Processo Fiscal"}</DialogTitle>
            </DialogHeader>
            <FiscalProcessForm
              onSuccess={() => {
                setDialogOpen(false);
              }}
              onCancel={() => setDialogOpen(false)}
              initialData={selectedProcess}
              isEdit={!!selectedProcess}
            />
          </DialogContent>
        </Dialog>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-4 gap-4">
          {statusOptions.map((status) => (
            <Card key={status.value}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{status.label}</p>
                    <p className="text-2xl font-bold">
                      {filteredProcessos?.filter((p: any) => p.process.status === status.value).length || 0}
                    </p>
                  </div>
                  <div className={`h-10 w-10 rounded-full ${status.color} bg-opacity-20 flex items-center justify-center`}>
                    {status.value === "em_dia" && <CheckCircle className="h-5 w-5 text-green-600" />}
                    {status.value === "pendente" && <Clock className="h-5 w-5 text-yellow-600" />}
                    {status.value === "atencao" && <AlertCircle className="h-5 w-5 text-red-600" />}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Nome ou CNPJ..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Tipo de Processo</Label>
                <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {processTypes.map((pt) => (
                      <SelectItem key={pt.value} value={pt.value}>
                        {pt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Status</Label>
                <Select value={statusFiltro} onValueChange={setStatusFiltro}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {statusOptions.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Ano</Label>
                <Select value={anoFiltro} onValueChange={setAnoFiltro}>
                  <SelectTrigger>
                    <SelectValue placeholder="2026" />
                  </SelectTrigger>
                  <SelectContent>
                    {[2026, 2025, 2024, 2023].map((ano) => (
                      <SelectItem key={ano} value={ano.toString()}>
                        {ano}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button variant="outline" className="w-full" onClick={handleRefresh}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Atualizar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Competência</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Observações</TableHead>
                  <TableHead className="w-24">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center">
                      <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                      <p className="text-muted-foreground mt-2">Carregando...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredProcessos?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center">
                      <Building2 className="h-12 w-12 mx-auto mb-4 opacity-30" />
                      <p className="text-muted-foreground">Nenhum processo encontrado</p>
                      <p className="text-sm text-muted-foreground">Selecione um tipo de processo ou ajuste os filtros</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProcessos?.map((item: any, index: number) => (
                    <TableRow key={item.process.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.company.name}</p>
                          {/* Changed from client.razaoSocialNome */}
                          <p className="text-xs text-muted-foreground">{item.company.cnpj || item.company.cpf}</p>
                          {/* Changed from client.cnpjCpf */}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getProcessTypeLabel(item.process.processType)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {item.process.referenceMonth != null ? (
                          <span>{item.process.referenceMonth.toString().padStart(2, "0")}/</span>
                        ) : (
                          <span>??/</span>
                        )}
                        {item.process.referenceYear || "????"}
                      </TableCell>
                      <TableCell>{getStatusBadge(item.process.status)}</TableCell>
                      <TableCell>
                        {item.process.dueDate ? (
                          new Date(item.process.dueDate).toLocaleDateString("pt-BR")
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {item.process.notes || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedProcess(item.process);
                              setDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
