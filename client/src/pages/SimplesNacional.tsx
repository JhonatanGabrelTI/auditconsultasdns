import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
  Clock,
  AlertTriangle,
  AlertCircle,
  Send,
  Download,
  Plus,
  Link,
  RefreshCw,
  Calendar,
  Search,
  FileSpreadsheet,
  Info,
  Building2,
  TrendingUp,
  Calculator,
  FileCheck,
} from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

export default function SimplesNacional() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [regimeFilter, setRegimeFilter] = useState("all");
  const [clientes, setClientes] = useState<any[]>([]);

  const { data: pgdasStats } = trpc.declarations.getStats.useQuery({ declarationType: "pgdas" });
  const { data: pgmeiStats } = trpc.declarations.getStats.useQuery({ declarationType: "pgmei" });
  const { data: rbt12Data } = trpc.rbt12.list.useQuery({ limit: 10 });

  // Estatísticas
  const stats = {
    total: 0,
    emDia: 0,
    processando: 0,
    pendencias: 0,
    atencao: 0,
    enviados: 0,
    totalEnviar: 0,
    baixados: 0,
    totalBaixar: 0,
    proximosSublimite: rbt12Data?.filter(i => i.sublimit.status === "proximo").length || 0,
    excedidos: rbt12Data?.filter(i => i.sublimit.status === "excedido").length || 0,
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Simples Nacional | MEI</span>
            </div>
            <h1 className="text-xl font-semibold text-foreground">Clientes monitorados</h1>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Agendamento */}
            <div className="flex items-center gap-2 bg-background border rounded-lg px-3 py-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Todo dia 20</span>
              <span className="h-2 w-2 bg-green-500 rounded-full"></span>
            </div>

            {/* Badge Automatizado */}
            <div className="flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2 rounded-lg border border-amber-200">
              <Zap className="h-4 w-4" />
              <span className="text-sm font-medium">Automatizado</span>
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
                <p className="text-xs text-muted-foreground">Em dia</p>
                <p className="text-xl font-semibold text-green-600">{stats.emDia}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="flex-1 min-w-[140px]">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <RefreshCw className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Processando</p>
                <p className="text-xl font-semibold text-blue-600">{stats.processando}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="flex-1 min-w-[140px]">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pendências</p>
                <p className="text-xl font-semibold text-yellow-600">{stats.pendencias}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="flex-1 min-w-[140px]">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Atenção</p>
                <p className="text-xl font-semibold text-red-600">{stats.atencao}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="flex-1 min-w-[140px] bg-orange-50 border-orange-200">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-orange-600 font-medium">Próx. Sublimite</p>
                <p className="text-xl font-semibold text-orange-600">{stats.proximosSublimite}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="flex-1 min-w-[140px] bg-purple-50 border-purple-200">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Calculator className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-purple-600 font-medium">Excedidos</p>
                <p className="text-xl font-semibold text-purple-600">{stats.excedidos}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Declarações Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <FileCheck className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">PGDAS</p>
                    <p className="text-xs text-muted-foreground">Simples Nacional</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold">{pgdasStats?.declared || 0}/{pgdasStats?.total || 0}</p>
                  <p className="text-xs text-muted-foreground">Declarados</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <FileCheck className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">PGMEI</p>
                    <p className="text-xs text-muted-foreground">MEI</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold">{pgmeiStats?.declared || 0}/{pgmeiStats?.total || 0}</p>
                  <p className="text-xs text-muted-foreground">Declarados</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerta */}
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
          <p className="text-sm text-blue-800">
            Atenção: O PGDAS deve ser transmitido até o <strong>dia 20</strong> de cada mês. O PGMEI até o <strong>dia 20</strong> também.
          </p>
        </div>

        {/* Filtros e Ações */}
        <div className="flex items-end justify-between gap-4">
          <div className="flex-1 max-w-xl">
            <label className="text-sm font-medium mb-2 block">Pesquise clientes</label>
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
              <label className="text-xs text-muted-foreground mb-1 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="em_dia">Em dia</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="atrasado">Atrasado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Regime</label>
              <Select value={regimeFilter} onValueChange={setRegimeFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="simples_nacional">Simples Nacional</SelectItem>
                  <SelectItem value="mei">MEI</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" className="gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Exportar Planilha
            </Button>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            Adicionar um cliente
          </Button>
          <Button variant="default" className="gap-2 bg-slate-800 hover:bg-slate-900">
            <Link className="h-4 w-4" />
            Associar clientes
          </Button>
          <Button variant="default" className="gap-2 bg-emerald-600 hover:bg-emerald-700">
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-24 font-medium">Situação</TableHead>
                  <TableHead className="font-medium">Declaração</TableHead>
                  <TableHead className="font-medium">RBT12</TableHead>
                  <TableHead className="font-medium">Alíquota</TableHead>
                  <TableHead className="text-center font-medium">
                    <div className="flex items-center justify-center gap-2">
                      Enviar
                      <Switch className="scale-75" />
                    </div>
                  </TableHead>
                  <TableHead className="font-medium">CNPJ</TableHead>
                  <TableHead className="font-medium">Razão Social</TableHead>
                  <TableHead className="font-medium">Competência</TableHead>
                  <TableHead className="font-medium">Vencimento</TableHead>
                  <TableHead className="font-medium">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="h-32 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <Building2 className="h-12 w-12 mb-4 opacity-30" />
                        <p>Nenhum cliente cadastrado neste processo. Clique em &apos;Associar clientes&apos; para começar.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  clientes.map((cliente) => (
                    <TableRow key={cliente.id}>
                      <TableCell>-</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell className="text-center">
                        <Switch />
                      </TableCell>
                      <TableCell>{cliente.cnpj}</TableCell>
                      <TableCell>{cliente.razaoSocial}</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>-</TableCell>
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

function Zap({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}
