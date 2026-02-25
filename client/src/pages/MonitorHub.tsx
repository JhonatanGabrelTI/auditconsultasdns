import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import {
  Activity,
  RefreshCw,
  TrendingUp,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Bell,
  MoreHorizontal,
  Mail,
  AlertTriangle,
  ExternalLink
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useLocation } from "wouter";

export default function MonitorHub() {
  const [location] = useLocation();
  const defaultTab = location === "/monitor/lucro-real" ? "lucro_real" :
    location === "/monitor/lucro-presumido" ? "lucro_presumido" : "dashboard";

  const { data: processStats, isLoading: loadingStats, refetch } = trpc.fiscalProcesses.getStats.useQuery();
  const { data: notifications } = trpc.notifications.list.useQuery();
  const { data: rbt12Data } = trpc.rbt12.list.useQuery({ limit: 10 });

  // Queries for Specific Tabs
  const { data: simplesProcesses } = trpc.fiscalProcesses.listByType.useQuery({ processType: "simples_nacional" });
  const { data: dctfwebDeclarations } = trpc.declarations.listByType.useQuery({ declarationType: "dctfweb" });
  const { data: fgtsProcesses } = trpc.fiscalProcesses.listByType.useQuery({ processType: "fgts" });
  const { data: parcelamentosProcesses } = trpc.fiscalProcesses.listByType.useQuery({ processType: "parcelamentos" });
  const { data: ecacMsgs } = trpc.ecacMessages.list.useQuery();
  const { data: allPendencies } = trpc.pendencies.listAll.useQuery();
  const { data: minhasConsultas } = trpc.apiConsultas.minhasConsultas.useQuery();

  // New Regime-specific data
  const { data: lucroRealProcesses } = trpc.fiscalProcesses.listByRegime.useQuery({ taxRegime: "lucro_real" });
  const { data: lucroPresumidoProcesses } = trpc.fiscalProcesses.listByRegime.useQuery({ taxRegime: "lucro_presumido" });
  const { data: lucroRealDeclarations } = trpc.declarations.listByRegime.useQuery({ taxRegime: "lucro_real" });
  const { data: lucroPresumidoDeclarations } = trpc.declarations.listByRegime.useQuery({ taxRegime: "lucro_presumido" });

  const lastUpdate = new Date().toLocaleString("pt-BR");
  const unreadNotifications = notifications?.filter(n => !n.read).length || 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "em_dia":
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Em Dia</Badge>;
      case "pendente":
        return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">Pendente</Badge>;
      case "atencao":
        return <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20">Atenção</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatCurrency = (value: string | number | null) => {
    if (value === null || value === undefined) return "R$ 0,00";
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value));
  };

  return (
    <DashboardLayout>
      <div className="container py-6 space-y-6 max-w-[1600px]">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Activity className="h-8 w-8 text-primary" />
              IAudit
            </h1>
            <p className="text-muted-foreground mt-1">
              Bem-vindo de volta! Confira abaixo a dashboard dos seus processos.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Última atualização</p>
              <p className="text-sm font-medium">{lastUpdate}</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Top Menu / Tabs */}
        <Tabs defaultValue={defaultTab} className="space-y-6">
          <div className="border-b">
            <TabsList className="h-auto p-0 bg-transparent space-x-6 justify-start w-full overflow-x-auto">
              {["Dashboard", "Simples", "Lucro_Presumido", "Lucro_Real", "DCTFWeb", "FGTS", "Parcelamentos", "Situacao_Fiscal", "Caixas_Postais"].map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab.toLowerCase()}
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3 px-1 font-medium text-muted-foreground data-[state=active]:text-foreground capitalize"
                >
                  {tab.replace("_", " ")}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Dashboard Tab Content */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Pendências Fiscais */}
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle>Pendências Fiscais</CardTitle>
                <CardDescription>
                  Visão geral do monitoramento fiscal por status e processo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="geral">
                  <TabsList className="bg-slate-100 dark:bg-slate-800">
                    <TabsTrigger value="geral">Geral</TabsTrigger>
                    <TabsTrigger value="por-processo">Por Processo</TabsTrigger>
                  </TabsList>

                  <TabsContent value="geral" className="space-y-4 pt-4">
                    <div className="grid gap-4 md:grid-cols-3">
                      <Card className="bg-emerald-500/5 border-emerald-500/10">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Em Dia</CardTitle>
                          <CheckCircle className="h-4 w-4 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-emerald-500">
                            {loadingStats ? "..." : processStats?.emDia || 0}
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-amber-500/5 border-amber-500/10">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
                          <Clock className="h-4 w-4 text-amber-500" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-amber-500">
                            {loadingStats ? "..." : processStats?.pendente || 0}
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-rose-500/5 border-rose-500/10">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Atenção</CardTitle>
                          <AlertCircle className="h-4 w-4 text-rose-500" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-rose-500">
                            {loadingStats ? "..." : processStats?.atencao || 0}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="por-processo" className="space-y-3 pt-4">
                    {[
                      { label: "Simples Nacional", value: "simples_nacional", dbType: "simples_nacional" },
                      { label: "Lucro Presumido", value: "lucro_presumido", dbType: "lucro_presumido" },
                      { label: "Lucro Real", value: "lucro_real", dbType: "lucro_real" },
                      { label: "DCTFWeb", value: "dctfweb", dbType: "dctfweb" },
                      { label: "FGTS Digital", value: "fgts", dbType: "regularidade_fgts" },
                      { label: "Parcelamentos", value: "parcelamentos", dbType: "parcelamentos" },
                      { label: "Situação Fiscal (Federal)", value: "situacao_fiscal", dbType: "cnd_federal" },
                    ].map((process) => {
                      const relevant = minhasConsultas?.filter(c => c.tipoConsulta === process.dbType) || [];
                      const emDia = relevant.filter(c => c.sucesso && (c.situacao === "REGULAR" || c.situacao === "SEM PENDÊNCIAS")).length;
                      const atencao = relevant.filter(c => !c.sucesso || (c.situacao !== "REGULAR" && c.situacao !== "SEM PENDÊNCIAS" && c.situacao !== "PENDENTE")).length;
                      const pendentes = relevant.filter(c => c.situacao === "PENDENTE").length;

                      return (
                        <div
                          key={process.value}
                          className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/50 hover:bg-card transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-primary" />
                            <span className="font-medium">{process.label}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-sm font-medium text-emerald-500">Em dia: {emDia}</span>
                            <span className="text-sm font-medium text-amber-500">Pendentes: {pendentes}</span>
                            <span className="text-sm font-medium text-rose-500">Atenção: {atencao}</span>
                          </div>
                        </div>
                      );
                    })}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              <Card className="bg-card/50 border-border">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Atividades do Robô</span>
                    <Badge variant="outline" className="font-normal">Últimas 24h</Badge>
                  </CardTitle>
                  <CardDescription>
                    Logs recentes de execuções automatizadas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 text-center py-8">
                    <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-sm text-muted-foreground">Nenhuma atividade recente</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border">
                <CardHeader>
                  <CardTitle>Limite RBT12 - Próximo do Sublimite</CardTitle>
                  <CardDescription>Clientes que atingiram 80% ou mais do sublimite</CardDescription>
                </CardHeader>
                <CardContent>
                  {rbt12Data && rbt12Data.length > 0 ? (
                    <div className="space-y-3">
                      {rbt12Data.map((item) => (
                        <div key={item.sublimit.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                          <div>
                            <p className="font-medium text-sm">{item.company.name}</p>
                            <p className="text-xs text-muted-foreground">{item.company.cnpj}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-amber-600">{formatCurrency(item.sublimit.rbt12Value)}</p>
                            <p className="text-[10px] uppercase text-muted-foreground">Valor RBT12</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <p className="text-sm text-muted-foreground">Nenhum cliente próximo ao limite</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Individual Tabs */}
          <TabsContent value="simples">
            <Card className="bg-card">
              <CardHeader>
                <CardTitle>Simples Nacional / MEI</CardTitle>
                <CardDescription>Monitoramento de guias DAS e obrigações do Simples</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>CNPJ</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Última Verificação</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {simplesProcesses && simplesProcesses.length > 0 ? (
                      simplesProcesses.map((p: any) => (
                        <TableRow key={p.process.id}>
                          <TableCell className="font-medium">{p.company.name}</TableCell>
                          <TableCell>{p.company.cnpj}</TableCell>
                          <TableCell>{getStatusBadge(p.process.status)}</TableCell>
                          <TableCell>{p.process.lastCheck ? format(new Date(p.process.lastCheck), "dd/MM/yyyy HH:mm") : "-"}</TableCell>
                          <TableCell className="text-right">
                            <Button size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow><TableCell colSpan={5} className="text-center py-8">Nenhum processo encontrado</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lucro_presumido">
            <Card className="bg-card">
              <CardHeader>
                <CardTitle>Lucro Presumido</CardTitle>
                <CardDescription>Acompanhamento de obrigações para empresas do Lucro Presumido</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>CNPJ</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Processo</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lucroPresumidoProcesses && lucroPresumidoProcesses.length > 0 ? (
                      lucroPresumidoProcesses.map((p: any) => (
                        <TableRow key={p.process.id}>
                          <TableCell className="font-medium">{p.company.name}</TableCell>
                          <TableCell>{p.company.cnpj}</TableCell>
                          <TableCell>{getStatusBadge(p.process.status)}</TableCell>
                          <TableCell className="capitalize">{p.process.processType.replace("_", " ")}</TableCell>
                          <TableCell className="text-right">
                            <Button size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow><TableCell colSpan={5} className="text-center py-8">Nenhum processo em Lucro Presumido</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lucro_real">
            <Card className="bg-card">
              <CardHeader>
                <CardTitle>Lucro Real</CardTitle>
                <CardDescription>Acompanhamento de obrigações para empresas do Lucro Real</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>CNPJ</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Processo</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lucroRealProcesses && lucroRealProcesses.length > 0 ? (
                      lucroRealProcesses.map((p: any) => (
                        <TableRow key={p.process.id}>
                          <TableCell className="font-medium">{p.company.name}</TableCell>
                          <TableCell>{p.company.cnpj}</TableCell>
                          <TableCell>{getStatusBadge(p.process.status)}</TableCell>
                          <TableCell className="capitalize">{p.process.processType.replace("_", " ")}</TableCell>
                          <TableCell className="text-right">
                            <Button size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow><TableCell colSpan={5} className="text-center py-8">Nenhum processo em Lucro Real</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dctfweb">
            <Card className="bg-card">
              <CardHeader>
                <CardTitle>DCTFWeb</CardTitle>
                <CardDescription>Acompanhamento de declarações DCTFWeb</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Competência</TableHead>
                      <TableHead>Declarado</TableHead>
                      <TableHead>Data Transmissão</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dctfwebDeclarations && dctfwebDeclarations.length > 0 ? (
                      dctfwebDeclarations.map((d: any) => (
                        <TableRow key={d.declaration.id}>
                          <TableCell className="font-medium">{d.company.name}</TableCell>
                          <TableCell>{d.declaration.period}</TableCell>
                          <TableCell>
                            {d.declaration.declared ?
                              <Badge className="bg-emerald-500/10 text-emerald-500">Sim</Badge> :
                              <Badge variant="outline">Não</Badge>
                            }
                          </TableCell>
                          <TableCell>{d.declaration.declarationDate ? format(new Date(d.declaration.declarationDate), "dd/MM/yyyy") : "-"}</TableCell>
                          <TableCell className="text-right">
                            <Button size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow><TableCell colSpan={5} className="text-center py-8">Nenhuma declaração encontrada</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fgts">
            <Card className="bg-card">
              <CardHeader>
                <CardTitle>FGTS Digital</CardTitle>
                <CardDescription>Monitoramento de regularidade e guias FGTS</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Vencimento Próxima Guia</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fgtsProcesses && fgtsProcesses.length > 0 ? (
                      fgtsProcesses.map((p: any) => (
                        <TableRow key={p.process.id}>
                          <TableCell className="font-medium">{p.company.name}</TableCell>
                          <TableCell>{getStatusBadge(p.process.status)}</TableCell>
                          <TableCell>{p.process.nextCheck ? format(new Date(p.process.nextCheck), "dd/MM/yyyy") : "-"}</TableCell>
                          <TableCell className="text-right">
                            <Button size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow><TableCell colSpan={4} className="text-center py-8">Nenhum processo encontrado</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="parcelamentos">
            <Card className="bg-card">
              <CardHeader>
                <CardTitle>Parcelamentos</CardTitle>
                <CardDescription>Status de parcelamentos ativos (Federal/Estadual)</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Observações</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parcelamentosProcesses && parcelamentosProcesses.length > 0 ? (
                      parcelamentosProcesses.map((p: any) => (
                        <TableRow key={p.process.id}>
                          <TableCell className="font-medium">{p.company.name}</TableCell>
                          <TableCell>{getStatusBadge(p.process.status)}</TableCell>
                          <TableCell className="max-w-xs truncate">{p.process.details || "Sem detalhes"}</TableCell>
                          <TableCell className="text-right">
                            <Button size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow><TableCell colSpan={4} className="text-center py-8">Nenhum parcelamento encontrado</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="situacao_fiscal">
            <Card className="bg-card">
              <CardHeader>
                <CardTitle>Situação Fiscal</CardTitle>
                <CardDescription>Pendências detectadas em órgãos governamentais</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Origem</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Detectado em</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allPendencies && allPendencies.length > 0 ? (
                      allPendencies.map((p: any) => (
                        <TableRow key={p.pendency.id}>
                          <TableCell className="font-medium">{p.company.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="uppercase">{p.pendency.source}</Badge>
                          </TableCell>
                          <TableCell>{p.pendency.description}</TableCell>
                          <TableCell className="font-bold text-rose-500">{formatCurrency(p.pendency.amount)}</TableCell>
                          <TableCell>{p.pendency.detectedAt ? format(new Date(p.pendency.detectedAt), "dd/MM/yyyy") : "-"}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow><TableCell colSpan={5} className="text-center py-8">Nenhuma pendência encontrada</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="caixas_postais">
            <Card className="bg-card">
              <CardHeader>
                <CardTitle>Caixas Postais</CardTitle>
                <CardDescription>Mensagens do e-CAC e Simples Nacional</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {ecacMsgs && ecacMsgs.length > 0 ? (
                    ecacMsgs.map((m: any) => (
                      <div key={m.message.id} className={`p-4 rounded-lg border flex items-start gap-4 transition-colors ${m.message.read ? "bg-card border-border opacity-70" : "bg-primary/5 border-primary/20 shadow-sm"}`}>
                        <div className={`mt-1 h-8 w-8 rounded-full flex items-center justify-center ${m.message.read ? "bg-slate-200" : "bg-primary/10 text-primary"}`}>
                          <Mail className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-sm">{m.message.subject}</h4>
                            <span className="text-[10px] text-muted-foreground">{format(new Date(m.message.messageDate), "dd/MM/yyyy HH:mm")}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 font-medium">{m.company.name} ({m.company.cnpj})</p>
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{m.message.content}</p>
                        </div>
                        <Button size="sm" variant="ghost" className="h-8">Ver</Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <p className="text-sm text-muted-foreground">Nenhuma mensagem encontrada</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
