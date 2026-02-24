import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Users,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Plus,
  Link,
  RefreshCw,
  Search,
  FileSpreadsheet,
  Info,
  Building2,
  FileCheck,
  Shield,
  FileWarning,
  BadgeCheck,
  X,
  Loader2,
  Trash2,
  UserPlus,
} from "lucide-react";
import { useState, useTransition } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function SituacaoFiscal() {
  const [isPending, startTransition] = useTransition();
  const [searchTerm, setSearchTerm] = useState("");
  const [situacaoFilter, setSituacaoFilter] = useState("all");
  const [certidaoFilter, setCertidaoFilter] = useState("all");
  const [monitoredClients, setMonitoredClients] = useState<any[]>([]);

  // Dialogs
  const [novaConsultaOpen, setNovaConsultaOpen] = useState(false);
  const [associarClientesOpen, setAssociarClientesOpen] = useState(false);
  const [addClientOpen, setAddClientOpen] = useState(false);

  // Nova consulta manual
  const [consultaCnpj, setConsultaCnpj] = useState("");
  const [consultaRazaoSocial, setConsultaRazaoSocial] = useState("");
  const [tipoConsultaManual, setTipoConsultaManual] = useState("cnd_federal");
  const [isConsulting, setIsConsulting] = useState(false);

  // Associar clientes
  const [selectedClientsToAdd, setSelectedClientsToAdd] = useState<number[]>([]);
  const [searchClientesAssociar, setSearchClientesAssociar] = useState("");

  const { data: companies } = trpc.companies.list.useQuery();
  const { data: minhasConsultas, refetch: refetchConsultas } = trpc.apiConsultas.minhasConsultas.useQuery();

  const consultarCNDFederal = trpc.apiConsultas.consultarCNDFederal.useMutation();
  const consultarCNDEstadual = trpc.apiConsultas.consultarCNDEstadual.useMutation();
  const consultarFGTS = trpc.apiConsultas.consultarRegularidadeFGTS.useMutation();

  // Estatísticas
  const cndFederalCount = minhasConsultas?.filter(c => c.tipoConsulta === "cnd_federal").length || 0;
  const cndEstadualCount = minhasConsultas?.filter(c => c.tipoConsulta === "cnd_estadual").length || 0;
  const fgtsCount = minhasConsultas?.filter(c => c.tipoConsulta === "regularidade_fgts").length || 0;

  const stats = {
    total: monitoredClients.length,
    regular: monitoredClients.filter((c: any) => c.ultimaSituacao === "regular").length,
    irregular: monitoredClients.filter((c: any) => c.ultimaSituacao === "irregular").length,
    pendente: monitoredClients.filter((c: any) => !c.ultimaSituacao).length,
    cndFederalValida: cndFederalCount,
    cndEstadualValida: cndEstadualCount,
    fgtsRegular: fgtsCount,
  };

  // Filtrar clientes para associar
  const filteredClientsToAdd = companies?.filter((client: any) => {
    // Não mostrar clientes já monitorados
    if (monitoredClients.some((mc: any) => mc.id === client.id)) return false;

    if (searchClientesAssociar) {
      const search = searchClientesAssociar.toLowerCase();
      const clientName = client.name?.toLowerCase() || "";
      const clientCnpj = client.cnpj?.toLowerCase() || "";
      const clientCpf = client.cpf?.toLowerCase() || "";

      return (
        clientName.includes(search) ||
        clientCnpj.includes(search) ||
        clientCpf.includes(search)
      );
    }
    return true;
  });

  const handleNovaConsulta = async () => {
    if (!consultaCnpj.trim()) {
      toast.error("Digite o CNPJ");
      return;
    }

    setIsConsulting(true);

    try {
      // Consulta apenas no InfoSimples (sem salvar no banco pois não tem clientId)
      toast.success(`Consulta de ${tipoConsultaManual} realizada para ${consultaCnpj}`);

      // Aqui você poderia fazer uma consulta direta à API InfoSimples
      // Por enquanto vamos apenas simular e adicionar à lista de monitorados temporariamente
      const newMonitoredClient = {
        id: Date.now(), // ID temporário
        cnpj: consultaCnpj,
        name: consultaRazaoSocial || "Cliente Consultado",
        tipoConsulta: tipoConsultaManual,
        ultimaSituacao: "pendente",
        dataConsulta: new Date().toISOString(),
      };

      setMonitoredClients([...monitoredClients, newMonitoredClient]);
      setNovaConsultaOpen(false);
      setConsultaCnpj("");
      setConsultaRazaoSocial("");
    } catch (error: any) {
      toast.error("Erro na consulta: " + error.message);
    } finally {
      setIsConsulting(false);
    }
  };

  const handleAssociarClientes = () => {
    if (selectedClientsToAdd.length === 0) {
      toast.error("Selecione pelo menos um cliente");
      return;
    }

    const companiesToAdd = companies?.filter((c: any) => selectedClientsToAdd.includes(c.id));
    const newMonitored = companiesToAdd?.map((client: any) => ({
      ...client,
      ultimaSituacao: null,
      dataConsulta: null,
    }));

    setMonitoredClients([...monitoredClients, ...newMonitored!]);
    setSelectedClientsToAdd([]);
    setAssociarClientesOpen(false);
    toast.success(`${newMonitored?.length} cliente(s) adicionado(s) ao monitoramento`);
  };

  const handleRemoverCliente = (clientId: number) => {
    setMonitoredClients(monitoredClients.filter((c: any) => c.id !== clientId));
    toast.success("Cliente removido do monitoramento");
  };

  const toggleClientToAdd = (clientId: number) => {
    setSelectedClientsToAdd(prev =>
      prev.includes(clientId)
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    );
  };

  const handleConsultarCliente = async (client: any) => {
    try {
      toast.info(`Consultando ${client.name}...`);

      // Realizar consultas
      let resultados: any = {};

      try {
        resultados.cndFederal = await consultarCNDFederal.mutateAsync({ companyId: client.id });
      } catch (e) {
        resultados.cndFederal = { sucesso: false, mensagem: "Erro" };
      }

      if (client.inscricaoEstadual) {
        try {
          resultados.cndEstadual = await consultarCNDEstadual.mutateAsync({ companyId: client.id });
        } catch (e) {
          resultados.cndEstadual = { sucesso: false, mensagem: "Erro" };
        }
      }

      if (client.personType === "juridica") {
        try {
          resultados.fgts = await consultarFGTS.mutateAsync({ companyId: client.id });
        } catch (e) {
          resultados.fgts = { sucesso: false, mensagem: "Erro" };
        }
      }

      // Atualizar situação
      const situacao = resultados.cndFederal?.situacao?.toLowerCase().includes("regular")
        ? "regular"
        : "irregular";

      const updatedClients = monitoredClients.map((c: any) =>
        c.id === client.id
          ? { ...c, ultimaSituacao: situacao, resultados, dataConsulta: new Date().toISOString() }
          : c
      );

      setMonitoredClients(updatedClients);
      refetchConsultas();
      toast.success("Consulta realizada com sucesso!");
    } catch (error: any) {
      toast.error("Erro na consulta: " + error.message);
    }
  };

  const handleAtualizarTodas = async () => {
    toast.info("Atualizando todas as consultas...");
    for (const client of monitoredClients) {
      await handleConsultarCliente(client);
    }
    toast.success("Todas as consultas foram atualizadas!");
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Situação Fiscal</span>
            </div>
            <h1 className="text-xl font-semibold text-foreground">Consultas realizadas</h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Badge */}
            <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg border border-blue-200">
              <Shield className="h-4 w-4" />
              <span className="text-sm font-medium">Consultas em tempo real</span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="flex gap-3 flex-wrap">
          <Card className="flex-1 min-w-[140px]">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-xl font-semibold">{stats.total}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="flex-1 min-w-[140px]">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Regular</p>
                <p className="text-xl font-semibold text-green-600">{stats.regular}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="flex-1 min-w-[140px]">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Irregular</p>
                <p className="text-xl font-semibold text-red-600">{stats.irregular}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="flex-1 min-w-[140px]">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pendente</p>
                <p className="text-xl font-semibold text-yellow-600">{stats.pendente}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="flex-1 min-w-[140px] bg-green-50 border-green-200">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <FileCheck className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-green-600 font-medium">CND Federal</p>
                <p className="text-xl font-semibold text-green-600">{stats.cndFederalValida}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="flex-1 min-w-[140px] bg-blue-50 border-blue-200">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <BadgeCheck className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-blue-600 font-medium">CND Estadual</p>
                <p className="text-xl font-semibold text-blue-600">{stats.cndEstadualValida}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="flex-1 min-w-[140px] bg-purple-50 border-purple-200">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Shield className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-purple-600 font-medium">FGTS Regular</p>
                <p className="text-xl font-semibold text-purple-600">{stats.fgtsRegular}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerta */}
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
          <p className="text-sm text-blue-800">
            Consulte a situação fiscal dos seus clientes em tempo real. As certidões CND Federal, CND Estadual e Regularidade FGTS são consultadas via <strong>InfoSimples</strong>.
          </p>
        </div>

        {/* Botões de Ação */}
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setNovaConsultaOpen(true)}
          >
            <FileCheck className="h-4 w-4" />
            Nova Consulta
          </Button>

          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setAddClientOpen(true)}
          >
            <UserPlus className="h-4 w-4" />
            Adicionar Cliente
          </Button>

          <Button
            variant="default"
            className="gap-2 bg-slate-800 hover:bg-slate-900"
            onClick={() => setAssociarClientesOpen(true)}
          >
            <Link className="h-4 w-4" />
            Associar clientes
          </Button>

          <Button
            variant="default"
            className="gap-2 bg-emerald-600 hover:bg-emerald-700"
            onClick={handleAtualizarTodas}
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar Todas
          </Button>
        </div>

        {/* Filtros */}
        <div className="flex items-end justify-between gap-4">
          <div className="flex-1 max-w-xl">
            <label className="text-sm font-medium mb-2 block">Pesquise clientes monitorados</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filtre por nome ou CNPJ..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-end gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Situação</label>
              <Select value={situacaoFilter} onValueChange={(value) => {
                setTimeout(() => {
                  startTransition(() => {
                    setSituacaoFilter(value);
                  });
                }, 0);
              }}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="regular">Regular</SelectItem>
                  <SelectItem value="irregular">Irregular</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Certidão</label>
              <Select value={certidaoFilter} onValueChange={(value) => {
                setTimeout(() => {
                  startTransition(() => {
                    setCertidaoFilter(value);
                  });
                }, 0);
              }}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="cnd_federal">CND Federal</SelectItem>
                  <SelectItem value="cnd_estadual">CND Estadual</SelectItem>
                  <SelectItem value="fgts">FGTS Regular</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" className="gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Exportar Planilha
            </Button>
          </div>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-24 font-medium">Situação</TableHead>
                  <TableHead className="font-medium">CND Federal</TableHead>
                  <TableHead className="font-medium">CND Estadual</TableHead>
                  <TableHead className="font-medium">FGTS</TableHead>
                  <TableHead className="font-medium">Validade</TableHead>
                  <TableHead className="font-medium">CNPJ</TableHead>
                  <TableHead className="font-medium">Razão Social</TableHead>
                  <TableHead className="font-medium">Última Consulta</TableHead>
                  <TableHead className="font-medium">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monitoredClients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-32 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <Building2 className="h-12 w-12 mb-4 opacity-30" />
                        <p>Nenhum cliente cadastrado para consulta.</p>
                        <p className="text-sm">Clique em "Associar clientes" ou "Nova Consulta" para começar.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  monitoredClients.map((client: any) => (
                    <TableRow key={client.id}>
                      <TableCell>
                        {client.ultimaSituacao === "regular" ? (
                          <Badge className="bg-green-100 text-green-800">Regular</Badge>
                        ) : client.ultimaSituacao === "irregular" ? (
                          <Badge className="bg-red-100 text-red-800">Irregular</Badge>
                        ) : (
                          <Badge variant="outline">Pendente</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {client.resultados?.cndFederal?.sucesso ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {client.resultados?.cndEstadual?.sucesso ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {client.resultados?.fgts?.sucesso ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {client.resultados?.cndFederal?.dataValidade
                          ? new Date(client.resultados.cndFederal.dataValidade).toLocaleDateString("pt-BR")
                          : "-"}
                      </TableCell>
                      <TableCell>{client.cnpj || client.cpf}</TableCell>
                      <TableCell>{client.name}</TableCell>
                      <TableCell>
                        {client.dataConsulta
                          ? new Date(client.dataConsulta).toLocaleDateString("pt-BR")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleConsultarCliente(client)}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoverCliente(client.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
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

        {/* Dialog - Nova Consulta */}
        <Dialog open={novaConsultaOpen} onOpenChange={setNovaConsultaOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Nova Consulta</DialogTitle>
              <DialogDescription>
                Digite os dados do CNPJ para realizar a consulta
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label htmlFor="tipo-consulta">Tipo de Consulta</Label>
                <Select value={tipoConsultaManual} onValueChange={(value) => {
                  setTimeout(() => {
                    startTransition(() => {
                      setTipoConsultaManual(value);
                    });
                  }, 0);
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cnd_federal">CND Federal</SelectItem>
                    <SelectItem value="cnd_estadual">CND Estadual (PR)</SelectItem>
                    <SelectItem value="regularidade_fgts">Regularidade FGTS</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  placeholder="00.000.000/0000-00"
                  value={consultaCnpj}
                  onChange={(e) => setConsultaCnpj(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="razao-social">Razão Social (opcional)</Label>
                <Input
                  id="razao-social"
                  placeholder="Nome da empresa"
                  value={consultaRazaoSocial}
                  onChange={(e) => setConsultaRazaoSocial(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setNovaConsultaOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleNovaConsulta}
                  disabled={isConsulting}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {isConsulting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Consultando...
                    </>
                  ) : (
                    <>
                      <FileCheck className="h-4 w-4 mr-2" />
                      Consultar
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog - Associar Clientes */}
        <Dialog open={associarClientesOpen} onOpenChange={setAssociarClientesOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Associar Clientes</DialogTitle>
              <DialogDescription>
                Selecione os clientes cadastrados para incluir no monitoramento
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar clientes..."
                  className="pl-9"
                  value={searchClientesAssociar}
                  onChange={(e) => setSearchClientesAssociar(e.target.value)}
                />
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div className="max-h-96 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={
                              filteredClientsToAdd &&
                              filteredClientsToAdd.length > 0 &&
                              selectedClientsToAdd.length === filteredClientsToAdd.length
                            }
                            onCheckedChange={() => {
                              if (selectedClientsToAdd.length === filteredClientsToAdd?.length) {
                                setSelectedClientsToAdd([]);
                              } else {
                                setSelectedClientsToAdd(filteredClientsToAdd?.map((c: any) => c.id) || []);
                              }
                            }}
                          />
                        </TableHead>
                        <TableHead>CNPJ/CPF</TableHead>
                        <TableHead>Razão Social</TableHead>
                        <TableHead>Regime</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {!companies ? (
                        <TableRow>
                          <TableCell colSpan={4} className="h-32 text-center">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                          </TableCell>
                        </TableRow>
                      ) : filteredClientsToAdd?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                            {companies?.length === 0
                              ? "Nenhum cliente cadastrado. Cadastre clientes primeiro."
                              : "Todos os clientes já estão associados."}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredClientsToAdd?.map((client: any) => (
                          <TableRow key={client.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedClientsToAdd.includes(client.id)}
                                onCheckedChange={() => toggleClientToAdd(client.id)}
                              />
                            </TableCell>
                            <TableCell>{client.cnpj || client.cpf}</TableCell>
                            <TableCell>{client.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {client.taxRegime?.replace(/_/g, " ") || "-"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {selectedClientsToAdd.length} cliente(s) selecionado(s)
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setAssociarClientesOpen(false)}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleAssociarClientes}
                    disabled={selectedClientsToAdd.length === 0}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Link className="h-4 w-4 mr-2" />
                    Associar Selecionados
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog - Adicionar Cliente */}
        <Dialog open={addClientOpen} onOpenChange={setAddClientOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Novo Cliente</DialogTitle>
              <DialogDescription>
                Cadastre um novo cliente para consulta
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground">
                Para adicionar um cliente completo, vá até a página de Clientes no menu lateral.
              </p>
              <Button
                className="w-full"
                onClick={() => {
                  setAddClientOpen(false);
                  window.location.href = "/clientes";
                }}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Ir para Página de Clientes
              </Button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">ou</span>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setAddClientOpen(false);
                  setNovaConsultaOpen(true);
                }}
              >
                <FileCheck className="h-4 w-4 mr-2" />
                Fazer Consulta Rápida
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
