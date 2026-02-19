import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import {
  Plus,
  Search,
  Users,
  Building2,
  User,
  Shield,
  FileText,
  FileCheck,
  Download,
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle,
  Clock,
  MoreHorizontal,
  Edit2,
  Trash2
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function Clientes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [regimeFilter, setRegimeFilter] = useState<string>("all");
  const [personTypeFilter, setPersonTypeFilter] = useState<string>("all");
  const [certificateFilter, setCertificateFilter] = useState<string>("all");
  const [procuracaoFilter, setProcuracaoFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [consultaDialogOpen, setConsultaDialogOpen] = useState(false);
  const [consultaResult, setConsultaResult] = useState<any>(null);
  const [certificateDialogOpen, setCertificateDialogOpen] = useState(false);
  const [selectedClientForCertificate, setSelectedClientForCertificate] = useState<any>(null);

  const consultarCNDFederal = trpc.apiConsultas.consultarCNDFederal.useMutation({
    onSuccess: (data) => {
      setConsultaResult({ tipo: "CND Federal", ...data });
      setConsultaDialogOpen(true);
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao consultar CND Federal: " + error.message);
    },
  });

  const consultarCNDEstadual = trpc.apiConsultas.consultarCNDEstadual.useMutation({
    onSuccess: (data) => {
      setConsultaResult({ tipo: "CND Estadual PR", ...data });
      setConsultaDialogOpen(true);
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao consultar CND Estadual: " + error.message);
    },
  });

  const consultarFGTS = trpc.apiConsultas.consultarRegularidadeFGTS.useMutation({
    onSuccess: (data) => {
      setConsultaResult({ tipo: "Regularidade FGTS", ...data });
      setConsultaDialogOpen(true);
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao consultar Regularidade FGTS: " + error.message);
    },
  });

  const handleConsultarCNDFederal = (companyId: string) => {
    if (confirm("Deseja consultar a CND Federal deste cliente?")) {
      consultarCNDFederal.mutate({ companyId });
    }
  };

  const handleConsultarCNDEstadual = (companyId: string) => {
    if (confirm("Deseja consultar a CND Estadual deste cliente?")) {
      consultarCNDEstadual.mutate({ companyId });
    }
  };

  const handleConsultarFGTS = (companyId: string) => {
    if (confirm("Deseja consultar a Regularidade FGTS deste cliente?")) {
      consultarFGTS.mutate({ companyId });
    }
  };

  const handleOpenCertificateDialog = (client: any) => {
    setSelectedClientForCertificate(client);
    setCertificateDialogOpen(true);
  };

  const { data: clients, isLoading, refetch } = trpc.companies.search.useQuery({
    searchTerm: searchTerm || undefined,
    taxRegime: regimeFilter !== "all" ? regimeFilter : undefined,
    personType: personTypeFilter !== "all" ? personTypeFilter : undefined,
  });

  const createClient = trpc.companies.create.useMutation({
    onSuccess: () => {
      toast.success("Cliente cadastrado com sucesso!");
      setDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao cadastrar cliente: " + error.message);
    },
  });

  const [formData, setFormData] = useState<{
    personType: "juridica" | "fisica";
    cnpjCpf: string;
    razaoSocialNome: string;
    regimeTributario?: "simples_nacional" | "lucro_presumido" | "lucro_real" | "mei" | "isento";
    inscricaoEstadual?: string;
    emails?: string;
    whatsapps?: string;
  }>({
    personType: "juridica",
    cnpjCpf: "",
    razaoSocialNome: "",
    regimeTributario: undefined,
    inscricaoEstadual: "",
    emails: "",
    whatsapps: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Converter emails e whatsapps para array JSON
    const emailsArray = formData.emails
      ? formData.emails.split(",").map(e => e.trim()).filter(e => e)
      : [];

    const whatsappsArray = formData.whatsapps
      ? formData.whatsapps.split(",").map(w => w.trim()).filter(w => w)
      : [];

    createClient.mutate({
      personType: formData.personType as "juridica" | "fisica",
      name: formData.razaoSocialNome,
      cnpj: formData.personType === "juridica" ? formData.cnpjCpf : undefined,
      cpf: formData.personType === "fisica" ? formData.cnpjCpf : undefined,
      taxRegime: formData.regimeTributario,
      inscricaoEstadual: formData.inscricaoEstadual,
      emails: emailsArray,
      whatsapps: whatsappsArray,
    });
  };

  const totalClients = clients?.length || 0;
  const activeClients = clients?.filter(c => c.active).length || 0;

  // Placeholder stats matching the reference image's logic (would be dynamic in real app)
  // Placeholder stats matching the reference image's logic (would be dynamic in real app)
  const stats = [
    { label: "Total", value: totalClients || "0", icon: Users, color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-100 dark:bg-slate-800/50", border: "border-slate-200 dark:border-slate-700" },
    { label: "Ativo", value: activeClients || "0", icon: CheckCircle, color: "text-emerald-600 dark:text-emerald-500", bg: "bg-emerald-100 dark:bg-emerald-950/30", border: "border-emerald-200 dark:border-emerald-900/50" },
    { label: "Sem certificado", value: "0", icon: FileText, color: "text-blue-600 dark:text-blue-500", bg: "bg-blue-100 dark:bg-blue-950/30", border: "border-blue-200 dark:border-blue-900/50" },
    { label: "Em breve", value: "0", icon: Clock, color: "text-amber-600 dark:text-amber-500", bg: "bg-amber-100 dark:bg-amber-950/30", border: "border-amber-200 dark:border-amber-900/50" },
    { label: "Vencidos/Inválidos", value: "0", icon: AlertTriangle, color: "text-rose-600 dark:text-rose-500", bg: "bg-rose-100 dark:bg-rose-950/30", border: "border-rose-200 dark:border-rose-900/50" },
  ];

  return (
    <DashboardLayout>
      <div className="container py-6 space-y-8 max-w-[1600px]">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row gap-6">

          {/* Certificados Digitais Dashboard */}
          <div className="flex-1 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Certificados digitais</h2>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {stats.map((stat, index) => (
                <Card key={index} className={`border ${stat.border} bg-card/50`}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-xs font-medium uppercase">{stat.label}</p>
                      <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    </div>
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${stat.bg}`}>
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Ações Actions */}
          <div className="w-full md:w-80 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Ações</h2>
            <div className="flex flex-col gap-3">
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full justify-center bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar um cliente
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Adicionar Cliente</DialogTitle>
                    <DialogDescription>
                      Adicione um novo cliente à sua base
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <Tabs
                      value={formData.personType}
                      onValueChange={(value) =>
                        setFormData({ ...formData, personType: value as "juridica" | "fisica" })
                      }
                    >
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="juridica">
                          <Building2 className="h-4 w-4 mr-2" />
                          Pessoa Jurídica
                        </TabsTrigger>
                        <TabsTrigger value="fisica">
                          <User className="h-4 w-4 mr-2" />
                          Pessoa Física
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="cnpjCpf">
                            {formData.personType === "juridica" ? "CNPJ" : "CPF"}
                          </Label>
                          <Input
                            id="cnpjCpf"
                            placeholder={formData.personType === "juridica" ? "00.000.000/0000-00" : "000.000.000-00"}
                            value={formData.cnpjCpf}
                            onChange={(e) => setFormData({ ...formData, cnpjCpf: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="razaoSocialNome">
                            {formData.personType === "juridica" ? "Razão Social" : "Nome Completo"}
                          </Label>
                          <Input
                            id="razaoSocialNome"
                            placeholder={formData.personType === "juridica" ? "EMPRESA LTDA" : "Nome Completo"}
                            value={formData.razaoSocialNome}
                            onChange={(e) => setFormData({ ...formData, razaoSocialNome: e.target.value })}
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="regimeTributario">Regime Tributário</Label>
                        <Select
                          value={formData.regimeTributario}
                          onValueChange={(value) => setFormData({ ...formData, regimeTributario: value as any })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um regime" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="simples_nacional">Simples Nacional</SelectItem>
                            <SelectItem value="lucro_presumido">Lucro Presumido</SelectItem>
                            <SelectItem value="lucro_real">Lucro Real</SelectItem>
                            <SelectItem value="mei">MEI</SelectItem>
                            <SelectItem value="isento">Isento</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {formData.personType === "juridica" && (
                        <div>
                          <Label htmlFor="inscricaoEstadual">Inscrição Estadual</Label>
                          <Input
                            id="inscricaoEstadual"
                            placeholder="000.000.000.000"
                            value={formData.inscricaoEstadual}
                            onChange={(e) => setFormData({ ...formData, inscricaoEstadual: e.target.value })}
                          />
                        </div>
                      )}

                      <div>
                        <Label htmlFor="emails">E-mails (separados por vírgula)</Label>
                        <Input
                          id="emails"
                          placeholder="email1@example.com, email2@example.com"
                          value={formData.emails}
                          onChange={(e) => setFormData({ ...formData, emails: e.target.value })}
                        />
                      </div>

                      <div>
                        <Label htmlFor="whatsapps">WhatsApp (separados por vírgula)</Label>
                        <Input
                          id="whatsapps"
                          placeholder="(11) 99999-9999, (11) 98888-8888"
                          value={formData.whatsapps}
                          onChange={(e) => setFormData({ ...formData, whatsapps: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t">
                      <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={createClient.isPending} className="bg-emerald-600 hover:bg-emerald-700">
                        {createClient.isPending ? "Salvando..." : "Salvar Cliente"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              <Button className="w-full justify-center bg-slate-200 hover:bg-slate-300 text-slate-700 shadow-sm" onClick={() => toast.info("Funcionalidade em desenvolvimento")}>
                <Upload className="h-4 w-4 mr-2" />
                Adicionar vários clientes
              </Button>

              <Button className="w-full justify-center bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => toast.info("Funcionalidade em desenvolvimento")}>
                <Download className="h-4 w-4 mr-2" />
                Baixar guias em lote
              </Button>
            </div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Pesquise clientes</p>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span>Certificado Digital</span>
              <span>Procuração</span>
              <span>Regime Tributário</span>
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filtre por nome, CNPJ, CPF ou ID..."
                className="pl-9 bg-card border-border"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={certificateFilter} onValueChange={setCertificateFilter}>
                <SelectTrigger className="w-[180px] bg-card border-border">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="integrated">Integrado</SelectItem>
                  <SelectItem value="not_integrated">Não Integrado</SelectItem>
                  <SelectItem value="expired">Vencido</SelectItem>
                </SelectContent>
              </Select>

              <Select value={procuracaoFilter} onValueChange={setProcuracaoFilter}>
                <SelectTrigger className="w-[180px] bg-card border-border">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="active">Ativa</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                </SelectContent>
              </Select>

              <Select value={regimeFilter} onValueChange={setRegimeFilter}>
                <SelectTrigger className="w-[180px] bg-card border-border">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="simples_nacional">Simples Nacional</SelectItem>
                  <SelectItem value="lucro_presumido">Lucro Presumido</SelectItem>
                  <SelectItem value="lucro_real">Lucro Real</SelectItem>
                  <SelectItem value="mei">MEI</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" className="bg-card border-border hover:bg-slate-800">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Exportar Planilha
              </Button>
            </div>
          </div>
        </div>

        {/* Clients Table */}
        <Card className="bg-card border-border">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-slate-800/50">
                <TableHead className="w-[200px]">Certificado Digital</TableHead>
                <TableHead className="w-[200px]">Procuração e-CAC</TableHead>
                <TableHead>Razão Social | Nome</TableHead>
                <TableHead>CNPJ | CPF</TableHead>
                <TableHead>Regime Tributário</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : clients && clients.length > 0 ? (
                clients.map((client) => (
                  <TableRow key={client.id} className="border-border hover:bg-slate-800/50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                          Não Integrado
                        </Badge>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                          onClick={() => handleOpenCertificateDialog(client)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-200 dark:bg-yellow-950/30 dark:text-yellow-500 dark:border-yellow-900/50">
                        Aguardando sincronização
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {client.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {client.cnpj || client.cpf}
                    </TableCell>
                    <TableCell>
                      {client.taxRegime ? (
                        <span className="text-sm text-foreground">
                          {client.taxRegime.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-slate-800">
                          <Edit2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-slate-800">
                              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleConsultarCNDFederal(client.id)}>
                              Consultar CND Federal
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleConsultarCNDEstadual(client.id)}>
                              Consultar CND Estadual
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleConsultarFGTS(client.id)}>
                              Consultar FGTS
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-500 focus:text-red-500">
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum cliente encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>

        {/* Modal de Resultado de Consulta (Mantido) */}
        <Dialog open={consultaDialogOpen} onOpenChange={setConsultaDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Resultado da Consulta</DialogTitle>
              <DialogDescription>
                {consultaResult?.tipo}
              </DialogDescription>
            </DialogHeader>
            {consultaResult && (
              <div className="space-y-4">
                {consultaResult.sucesso ? (
                  <>
                    <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                      <p className="font-semibold text-green-600">✓ Consulta realizada com sucesso</p>
                    </div>

                    {consultaResult.situacao && (
                      <div>
                        <Label>Situação</Label>
                        <p className="text-lg font-semibold">{consultaResult.situacao}</p>
                      </div>
                    )}

                    {consultaResult.numeroCertidao && (
                      <div>
                        <Label>Número da Certidão</Label>
                        <p className="font-mono">{consultaResult.numeroCertidao}</p>
                      </div>
                    )}

                    {consultaResult.dataEmissao && (
                      <div>
                        <Label>Data de Emissão</Label>
                        <p>{consultaResult.dataEmissao}</p>
                      </div>
                    )}

                    {consultaResult.dataValidade && (
                      <div>
                        <Label>Data de Validade</Label>
                        <p>{consultaResult.dataValidade}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                    <p className="font-semibold text-red-600">✗ Erro na consulta</p>
                    <p className="text-sm mt-2">{consultaResult.mensagem}</p>
                  </div>
                )}

                <Button onClick={() => setConsultaDialogOpen(false)} className="w-full">
                  Fechar
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={certificateDialogOpen} onOpenChange={setCertificateDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Adicionar Certificado Digital</DialogTitle>
              <DialogDescription>
                Insira o certificado digital em formato .pfx ou .p12 do cliente.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-8 text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-slate-400" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Arraste e solte o certificado digital</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Seu arquivo será adicionado automaticamente</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cert-password">Senha do certificado digital</Label>
                <Input id="cert-password" type="password" placeholder="Digite a senha do certificado digital" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCertificateDialogOpen(false)}>Cancelar</Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">Verificar e Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
