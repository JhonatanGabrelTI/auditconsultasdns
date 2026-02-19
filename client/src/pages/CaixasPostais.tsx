import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
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
  Users,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Link,
  RefreshCw,
  Search,
  FileSpreadsheet,
  Info,
  Building2,
  Mail,
  MailOpen,
  FileWarning,
  Bell,
  MessageSquare,
  Eye,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

export default function CaixasPostais() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tipoFilter, setTipoFilter] = useState("all");
  const [associarDialogOpen, setAssociarDialogOpen] = useState(false);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [consultingClientId, setConsultingClientId] = useState<string | null>(null);

  const { data: ecacMessages, refetch: refetchMessages } = trpc.ecacMessages.list.useQuery();
  const { data: companies } = trpc.companies.list.useQuery();
  const consultarCaixaPostal = trpc.apiConsultas.consultarCaixaPostalECAC.useMutation({
    onSuccess: (data) => {
      toast.success("Consulta realizada", {
        description: `${data.totalMensagens} mensagens encontradas (${data.mensagensNaoLidas} não lidas)`,
      });
      refetchMessages();
      setConsultingClientId(null);
    },
    onError: (error) => {
      toast.error("Erro na consulta", {
        description: error.message,
      });
      setConsultingClientId(null);
    },
  });

  // Filtrar empresas
  const filteredCompanies = companies?.filter(company => {
    const searchLower = searchTerm.toLowerCase();
    return (
      company.name.toLowerCase().includes(searchLower) ||
      (company.cnpj && company.cnpj.includes(searchTerm))
    );
  }) || [];

  // Estatísticas
  const stats = {
    total: companies?.length || 0,
    lidas: ecacMessages?.filter(m => m.message.read).length || 0,
    naoLidas: ecacMessages?.filter(m => !m.message.read).length || 0,
    atencao: ecacMessages?.filter(m => 
      m.message.subject?.toLowerCase().includes('intima') ||
      m.message.subject?.toLowerCase().includes('auto')
    ).length || 0,
    intimacoes: ecacMessages?.filter(m => 
      m.message.subject?.toLowerCase().includes('intima')
    ).length || 0,
    autos: ecacMessages?.filter(m => 
      m.message.subject?.toLowerCase().includes('auto')
    ).length || 0,
    avisos: ecacMessages?.filter(m => 
      m.message.subject?.toLowerCase().includes('aviso')
    ).length || 0,
  };

  // Mensagens filtradas
  const filteredMessages = ecacMessages?.filter(item => {
    const msg = item.message;
    const company = item.company;
    
    // Filtro de busca
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        msg.subject?.toLowerCase().includes(searchLower) ||
        msg.content?.toLowerCase().includes(searchLower) ||
        company.name.toLowerCase().includes(searchLower) ||
        (company.cnpj && company.cnpj.includes(searchTerm));
      if (!matchesSearch) return false;
    }
    
    // Filtro de status
    if (statusFilter === "lidas" && msg.read) return true;
    if (statusFilter === "nao_lidas" && !msg.read) return true;
    if (statusFilter === "all") return true;
    
    return false;
  }) || [];

  const handleConsultarCliente = async (companyId: string) => {
    setConsultingClientId(companyId);
    await consultarCaixaPostal.mutateAsync({ companyId });
  };

  const handleConsultarSelecionados = async () => {
    if (selectedClients.length === 0) {
      toast.error("Nenhum cliente selecionado", {
        description: "Selecione pelo menos um cliente para consultar",
      });
      return;
    }
    
    for (const companyId of selectedClients) {
      await handleConsultarCliente(companyId);
    }
    
    setSelectedClients([]);
    setAssociarDialogOpen(false);
    
    toast.success("Consultas finalizadas", {
      description: `${selectedClients.length} cliente(s) consultado(s)`,
    });
  };

  const toggleClientSelection = (companyId: string) => {
    setSelectedClients(prev => 
      prev.includes(companyId) 
        ? prev.filter(id => id !== companyId)
        : [...prev, companyId]
    );
  };

  const getTipoBadge = (subject: string) => {
    const lower = subject.toLowerCase();
    if (lower.includes("intima")) return { label: "Intimação", color: "bg-purple-100 text-purple-700 border-purple-200" };
    if (lower.includes("auto")) return { label: "Auto", color: "bg-orange-100 text-orange-700 border-orange-200" };
    if (lower.includes("aviso")) return { label: "Aviso", color: "bg-blue-100 text-blue-700 border-blue-200" };
    return { label: "Mensagem", color: "bg-gray-100 text-gray-700 border-gray-200" };
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Caixas Postais</span>
            </div>
            <h1 className="text-xl font-semibold text-foreground">e-CAC Receita Federal</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg border border-blue-200">
              <Mail className="h-4 w-4" />
              <span className="text-sm font-medium">Monitoramento 24h</span>
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
                <p className="text-xs text-muted-foreground">Total Clientes</p>
                <p className="text-xl font-semibold">{stats.total}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="flex-1 min-w-[140px]">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <MailOpen className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Lidas</p>
                <p className="text-xl font-semibold text-green-600">{stats.lidas}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="flex-1 min-w-[140px] bg-red-50 border-red-200">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                <Bell className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-red-600 font-medium">Não Lidas</p>
                <p className="text-xl font-semibold text-red-600">{stats.naoLidas}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="flex-1 min-w-[140px] bg-yellow-50 border-yellow-200">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-yellow-600 font-medium">Atenção</p>
                <p className="text-xl font-semibold text-yellow-600">{stats.atencao}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="flex-1 min-w-[140px] bg-purple-50 border-purple-200">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <FileWarning className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-purple-600 font-medium">Intimações</p>
                <p className="text-xl font-semibold text-purple-600">{stats.intimacoes}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="flex-1 min-w-[140px] bg-orange-50 border-orange-200">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-orange-600 font-medium">Autos</p>
                <p className="text-xl font-semibold text-orange-600">{stats.autos}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="flex-1 min-w-[140px] bg-blue-50 border-blue-200">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-blue-600 font-medium">Avisos</p>
                <p className="text-xl font-semibold text-blue-600">{stats.avisos}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerta */}
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
          <p className="text-sm text-blue-800">
            O sistema consulta automaticamente as caixas postais do e-CAC da Receita Federal via API InfoSimples. 
            <strong> Intimações e autos de infração</strong> são priorizados e geram alertas imediatos.
          </p>
        </div>

        {/* Filtros e Ações */}
        <div className="flex items-end justify-between gap-4">
          <div className="flex-1 max-w-xl">
            <label className="text-sm font-medium mb-2 block">Pesquise mensagens</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filtre por título, conteúdo ou CNPJ..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex items-end gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="lidas">Lidas</SelectItem>
                  <SelectItem value="nao_lidas">Não Lidas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Tipo</label>
              <Select value={tipoFilter} onValueChange={setTipoFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="intimacao">Intimação</SelectItem>
                  <SelectItem value="auto">Auto de Infração</SelectItem>
                  <SelectItem value="aviso">Aviso</SelectItem>
                  <SelectItem value="comunicacao">Comunicação</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" className="gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" className="gap-2" onClick={() => refetchMessages()}>
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
          
          <Dialog open={associarDialogOpen} onOpenChange={setAssociarDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="default" className="gap-2 bg-slate-800 hover:bg-slate-900">
                <Link className="h-4 w-4" />
                Consultar Clientes
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh]">
              <DialogHeader>
                <DialogTitle>Consultar Caixa Postal e-CAC</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Selecione os clientes para consultar suas caixas postais no e-CAC. 
                  Custo: R$ 0,25 por consulta.
                </p>
                
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar cliente por nome ou CNPJ..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <ScrollArea className="h-[400px] border rounded-md">
                  <div className="p-4 space-y-2">
                    {filteredCompanies.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        Nenhum cliente encontrado
                      </p>
                    ) : (
                      filteredCompanies.map((company) => (
                        <div
                          key={company.id}
                          className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                          onClick={() => toggleClientSelection(company.id)}
                        >
                          <Checkbox
                            checked={selectedClients.includes(company.id)}
                            onCheckedChange={() => toggleClientSelection(company.id)}
                          />
                          <div className="flex-1">
                            <p className="font-medium">{company.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {company.cnpj ? `CNPJ: ${company.cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")}` : "Sem CNPJ"}
                            </p>
                          </div>
                          {consultingClientId === company.id && (
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>

                <div className="flex justify-between items-center pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    {selectedClients.length} cliente(s) selecionado(s)
                    {selectedClients.length > 0 && (
                      <span className="text-foreground"> • Custo total: R$ {(selectedClients.length * 0.25).toFixed(2)}</span>
                    )}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setAssociarDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleConsultarSelecionados}
                      disabled={selectedClients.length === 0 || consultarCaixaPostal.isPending}
                    >
                      {consultarCaixaPostal.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Consultando...
                        </>
                      ) : (
                        `Consultar ${selectedClients.length > 0 ? `(${selectedClients.length})` : ""}`
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-24 font-medium">Status</TableHead>
                  <TableHead className="w-28 font-medium">Tipo</TableHead>
                  <TableHead className="font-medium">Título</TableHead>
                  <TableHead className="font-medium max-w-md">Conteúdo</TableHead>
                  <TableHead className="font-medium">CNPJ</TableHead>
                  <TableHead className="font-medium">Razão Social</TableHead>
                  <TableHead className="font-medium">Data</TableHead>
                  <TableHead className="w-20 font-medium">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMessages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <Building2 className="h-12 w-12 mb-4 opacity-30" />
                        <p>Nenhuma mensagem encontrada.</p>
                        <p className="text-sm">Clique em "Consultar Clientes" para buscar mensagens do e-CAC.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMessages.map((item) => {
                    const msg = item.message;
                    const company = item.company;
                    const tipo = getTipoBadge(msg.subject || "");
                    
                    return (
                      <TableRow key={msg.id}>
                        <TableCell>
                          {msg.read ? (
                            <Badge variant="outline" className="gap-1 bg-green-50 text-green-700 border-green-200">
                              <MailOpen className="h-3 w-3" />
                              Lida
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="gap-1 bg-red-50 text-red-700 border-red-200">
                              <Mail className="h-3 w-3" />
                              Nova
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={tipo.color}>
                            {tipo.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium max-w-xs truncate">
                          {msg.subject}
                        </TableCell>
                        <TableCell className="max-w-md truncate text-muted-foreground">
                          {msg.content || "-"}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {company.cnpj ? company.cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5") : "-"}
                        </TableCell>
                        <TableCell>{company.name}</TableCell>
                        <TableCell className="text-sm">
                          {msg.messageDate ? new Date(msg.messageDate).toLocaleDateString("pt-BR") : "-"}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
