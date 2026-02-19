import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import {
  Activity,
  RefreshCw,
  TrendingUp,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Bell
} from "lucide-react";

export default function MonitorHub() {
  const { data: processStats, isLoading: loadingStats, refetch } = trpc.fiscalProcesses.getStats.useQuery();
  const { data: pgdasStats } = trpc.declarations.getStats.useQuery({ declarationType: "pgdas" });
  const { data: pgmeiStats } = trpc.declarations.getStats.useQuery({ declarationType: "pgmei" });
  const { data: dctfwebStats } = trpc.declarations.getStats.useQuery({ declarationType: "dctfweb" });
  const { data: fgtsStats } = trpc.declarations.getStats.useQuery({ declarationType: "fgts_digital" });
  const { data: defisStats } = trpc.declarations.getStats.useQuery({ declarationType: "defis" });
  const { data: dirfStats } = trpc.declarations.getStats.useQuery({ declarationType: "dirf" });
  const { data: notifications } = trpc.notifications.list.useQuery();
  const { data: rbt12Data } = trpc.rbt12.list.useQuery({ limit: 10 });

  const lastUpdate = new Date().toLocaleString("pt-BR");
  const unreadNotifications = notifications?.filter(n => !n.read).length || 0;

  return (
    <DashboardLayout>
      <div className="container py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Activity className="h-8 w-8 text-primary" />
              Audit
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
        <Tabs defaultValue="dashboard" className="space-y-6">
          <div className="border-b">
            <TabsList className="h-auto p-0 bg-transparent space-x-6 justify-start w-full overflow-x-auto">
              <TabsTrigger
                value="dashboard"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3 px-1 font-medium text-muted-foreground data-[state=active]:text-foreground"
              >
                Dashboard
              </TabsTrigger>
              <TabsTrigger
                value="simples"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3 px-1 font-medium text-muted-foreground data-[state=active]:text-foreground"
              >
                Simples Nacional / MEI
              </TabsTrigger>
              <TabsTrigger
                value="dctfweb"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3 px-1 font-medium text-muted-foreground data-[state=active]:text-foreground"
              >
                DCTFWeb
              </TabsTrigger>
              <TabsTrigger
                value="fgts"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3 px-1 font-medium text-muted-foreground data-[state=active]:text-foreground"
              >
                FGTS Digital
              </TabsTrigger>
              <TabsTrigger
                value="parcelamentos"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3 px-1 font-medium text-muted-foreground data-[state=active]:text-foreground"
              >
                Parcelamentos
              </TabsTrigger>
              <TabsTrigger
                value="situacao_fiscal"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3 px-1 font-medium text-muted-foreground data-[state=active]:text-foreground"
              >
                Situação Fiscal
              </TabsTrigger>
              <TabsTrigger
                value="caixas_postais"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3 px-1 font-medium text-muted-foreground data-[state=active]:text-foreground"
              >
                Caixas Postais
              </TabsTrigger>
              <TabsTrigger
                value="declaracoes"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3 px-1 font-medium text-muted-foreground data-[state=active]:text-foreground"
              >
                Declarações
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Dashboard Tab Content */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Pendências Fiscais */}
            <Card>
              <CardHeader>
                <CardTitle>Pendências Fiscais</CardTitle>
                <CardDescription>
                  Acompanhe seu monitoramento fiscal, tendo uma visão geral e uma visão por processo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="geral">
                  <TabsList>
                    <TabsTrigger value="geral">Geral</TabsTrigger>
                    <TabsTrigger value="por-processo">Por Processo</TabsTrigger>
                  </TabsList>

                  <TabsContent value="geral" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Em Dia</CardTitle>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-green-500">
                            {loadingStats ? "..." : processStats?.emDia || 0}
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
                          <Clock className="h-4 w-4 text-yellow-500" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-yellow-500">
                            {loadingStats ? "..." : processStats?.pendente || 0}
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Atenção</CardTitle>
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-red-500">
                            {loadingStats ? "..." : processStats?.atencao || 0}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="por-processo" className="space-y-3">
                    {[
                      { label: "PGDAS", value: "pgdas" },
                      { label: "PGMEI", value: "pgmei" },
                      { label: "DCTFWeb", value: "dctfweb" },
                      { label: "FGTS Digital", value: "fgts_digital" },
                      { label: "Parcelamentos", value: "parcelamentos" },
                      { label: "Certidões", value: "certidoes" },
                      { label: "Caixas Postais", value: "caixas_postais" },
                    ].map((process) => (
                      <div
                        key={process.value}
                        className="flex items-center justify-between p-3 rounded-lg border border-border"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-primary" />
                          <span className="font-medium">{process.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm px-2 py-1 rounded-md bg-green-500/10 text-green-500">
                            0 em dia
                          </span>
                          <span className="text-sm px-2 py-1 rounded-md bg-yellow-500/10 text-yellow-500">
                            0 pendentes
                          </span>
                          <span className="text-sm px-2 py-1 rounded-md bg-red-500/10 text-red-500">
                            0 atenção
                          </span>
                        </div>
                      </div>
                    ))}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Grid de Cards */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Notificações */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Notificações</span>
                    {unreadNotifications > 0 && (
                      <span className="text-sm px-2 py-1 rounded-md bg-primary/10 text-primary">
                        {unreadNotifications} nova{unreadNotifications > 1 ? "s" : ""}
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Confira as notificações do seu monitoramento fiscal
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {notifications && notifications.length > 0 ? (
                    <div className="space-y-2">
                      {notifications.slice(0, 5).map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-3 rounded-lg border ${notification.read ? "border-border" : "border-primary bg-primary/5"
                            }`}
                        >
                          <p className="font-medium text-sm">{notification.title}</p>
                          {notification.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {notification.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-sm text-muted-foreground">
                        Não há notificações no seu MonitorHub
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Suas notificações aparecerão aqui
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Sublimites do Simples */}
              <Card>
                <CardHeader>
                  <CardTitle>Sublimites do Simples</CardTitle>
                  <CardDescription>
                    Acompanhe os sublimites RBT12 dos seus 10 maiores clientes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {rbt12Data && rbt12Data.length > 0 ? (
                    <div className="space-y-2">
                      {rbt12Data.map((item, index) => (
                        <div
                          key={item.sublimit.id}
                          className="flex items-center justify-between p-3 rounded-lg border border-border"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-muted-foreground">
                              #{index + 1}
                            </span>
                            <span className="font-medium">{item.company.name}</span>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              R$ {item.sublimit.rbt12Value ? parseFloat(item.sublimit.rbt12Value).toLocaleString("pt-BR") : "0,00"}
                            </p>
                            <p className="text-xs text-muted-foreground">RBT12</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-sm text-muted-foreground">
                        Nenhum dado disponível no momento
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Assim que processarmos seus clientes do Simples, os resultados aparecerão aqui
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Placeholder contents for other tabs */}
          <TabsContent value="simples">
            <Card>
              <CardHeader>
                <CardTitle>Simples Nacional / MEI</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Conteúdo em desenvolvimento.</p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="dctfweb">
            <Card>
              <CardHeader>
                <CardTitle>DCTFWeb</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Conteúdo em desenvolvimento.</p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="fgts">
            <Card>
              <CardHeader>
                <CardTitle>FGTS Digital</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Conteúdo em desenvolvimento.</p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="parcelamentos">
            <Card>
              <CardHeader>
                <CardTitle>Parcelamentos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Conteúdo em desenvolvimento.</p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="situacao_fiscal">
            <Card>
              <CardHeader>
                <CardTitle>Situação Fiscal</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Conteúdo em desenvolvimento.</p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="caixas_postais">
            <Card>
              <CardHeader>
                <CardTitle>Caixas Postais</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Conteúdo em desenvolvimento.</p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="declaracoes">
            <Card>
              <CardHeader>
                <CardTitle>Declarações</CardTitle>
                <CardDescription>
                  Acompanhe as declarações realizadas de cada processo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  {[
                    { label: "PGDAS", stats: pgdasStats },
                    { label: "DCTFWeb", stats: dctfwebStats },
                    { label: "FGTS Digital", stats: fgtsStats },
                    { label: "DEFIS", stats: defisStats },
                    { label: "DIRF", stats: dirfStats },
                    { label: "PGMEI", stats: pgmeiStats },
                  ].map((declaration) => (
                    <div
                      key={declaration.label}
                      className="p-4 rounded-lg border border-border"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{declaration.label}</span>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{
                              width: declaration.stats?.total
                                ? `${(declaration.stats.declared / declaration.stats.total) * 100}%`
                                : "0%",
                            }}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {declaration.stats?.declared || 0} / {declaration.stats?.total || 0} declarados
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
