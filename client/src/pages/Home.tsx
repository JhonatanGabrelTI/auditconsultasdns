import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  FileText,
  Users,
  Shield,
  Activity,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw
} from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { data: clients, isLoading: loadingClients } = trpc.companies.list.useQuery();
  const { data: processStats, isLoading: loadingStats } = trpc.fiscalProcesses.getStats.useQuery();
  const { data: notifications, isLoading: loadingNotifications } = trpc.notifications.list.useQuery();
  const { data: settings } = trpc.settings.get.useQuery();
  const { data: schedules } = trpc.schedules.list.useQuery();

  const totalClients = clients?.length || 0;
  const unreadNotifications = notifications?.filter(n => !n.read).length || 0;

  return (
    <DashboardLayout>
      <div className="container py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard Geral</h1>
            <p className="text-muted-foreground mt-1">
              Bem-vindo ao MonitorHub - Sistema de Monitoramento de Declarações Fiscais
            </p>
          </div>
          <Button size="sm" variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Processos</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loadingStats ? "..." : (processStats?.emDia || 0) + (processStats?.pendente || 0) + (processStats?.atencao || 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Processos fiscais cadastrados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Em Dia</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">
                {loadingStats ? "..." : processStats?.emDia || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Processos em conformidade
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">
                {loadingStats ? "..." : processStats?.pendente || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Aguardando processamento
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Atenção</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">
                {loadingStats ? "..." : processStats?.atencao || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Requerem atenção imediata
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Processos Fiscais */}
          <Card>
            <CardHeader>
              <CardTitle>Processos Fiscais</CardTitle>
              <CardDescription>Acompanhe seus processos fiscais</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/monitor?type=pgdas">
                <a className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent transition-colors">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-primary" />
                    <span className="font-medium">PGDAS</span>
                  </div>
                  <span className="text-sm text-muted-foreground">→</span>
                </a>
              </Link>

              <Link href="/monitor?type=pgmei">
                <a className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent transition-colors">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-primary" />
                    <span className="font-medium">PGMEI</span>
                  </div>
                  <span className="text-sm text-muted-foreground">→</span>
                </a>
              </Link>

              <Link href="/monitor?type=dctfweb">
                <a className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent transition-colors">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-primary" />
                    <span className="font-medium">DCTFWeb</span>
                  </div>
                  <span className="text-sm text-muted-foreground">→</span>
                </a>
              </Link>

              <Link href="/monitor?type=fgts_digital">
                <a className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent transition-colors">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-primary" />
                    <span className="font-medium">FGTS Digital</span>
                  </div>
                  <span className="text-sm text-muted-foreground">→</span>
                </a>
              </Link>

              <Link href="/monitor">
                <a className="block">
                  <Button variant="outline" className="w-full mt-2">
                    Ver todos os processos
                  </Button>
                </a>
              </Link>
            </CardContent>
          </Card>

          {/* Clientes */}
          <Card>
            <CardHeader>
              <CardTitle>Clientes</CardTitle>
              <CardDescription>Gerencie sua base de clientes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Users className="h-8 w-8 text-primary" />
                    <div>
                      <p className="text-2xl font-bold">{totalClients}</p>
                      <p className="text-sm text-muted-foreground">Clientes cadastrados</p>
                    </div>
                  </div>
                </div>

                <Link href="/clientes">
                  <a className="block">
                    <Button className="w-full">
                      Gerenciar clientes
                    </Button>
                  </a>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Certificados Digitais */}
          <Card>
            <CardHeader>
              <CardTitle>Certificados Digitais</CardTitle>
              <CardDescription>Monitore certificados digitais</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <p className="text-2xl font-bold text-green-500">0</p>
                    <p className="text-xs text-muted-foreground mt-1">Integrados</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                    <p className="text-2xl font-bold text-yellow-500">0</p>
                    <p className="text-xs text-muted-foreground mt-1">A vencer</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <p className="text-2xl font-bold text-red-500">0</p>
                    <p className="text-xs text-muted-foreground mt-1">Atenção</p>
                  </div>
                </div>

                <Link href="/certificados">
                  <a className="block">
                    <Button variant="outline" className="w-full">
                      <Shield className="h-4 w-4 mr-2" />
                      Gerenciar certificados
                    </Button>
                  </a>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Agendamentos */}
          <Card>
            <CardHeader>
              <CardTitle>Agendamentos</CardTitle>
              <CardDescription>Datas configuradas para automações</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {schedules && schedules.length > 0 ? (
                  schedules.map((schedule) => (
                    <div key={schedule.id} className="flex items-center justify-between p-2 rounded-lg border border-border">
                      <span className="text-sm font-medium capitalize">
                        {schedule.processType?.replace(/_/g, " ") || "Automação"}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        Dia {schedule.dayOfMonth}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum agendamento configurado
                  </p>
                )}

                <Link href="/agendamentos">
                  <a className="block">
                    <Button variant="outline" className="w-full mt-2">
                      Configurar agendamentos
                    </Button>
                  </a>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notificações Recentes */}
        {notifications && notifications.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Notificações Recentes</CardTitle>
              <CardDescription>
                {unreadNotifications > 0 && (
                  <span className="text-yellow-500">
                    {unreadNotifications} não lida{unreadNotifications > 1 ? "s" : ""}
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {notifications.slice(0, 5).map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg border ${notification.read ? "border-border" : "border-primary bg-primary/5"
                      }`}
                  >
                    <p className="font-medium text-sm">{notification.title}</p>
                    {notification.description && (
                      <p className="text-xs text-muted-foreground mt-1">{notification.description}</p>
                    )}
                  </div>
                ))}
              </div>
              <Link href="/notificacoes">
                <a className="block">
                  <Button variant="outline" className="w-full mt-4">
                    Ver todas as notificações
                  </Button>
                </a>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
