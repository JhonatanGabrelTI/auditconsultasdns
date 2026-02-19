import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
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
  FileText,
  RefreshCw,
  Search,
  FileSpreadsheet,
  Info,
  Building2,
  FileCheck,
  Calendar,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

export default function Declaracoes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoFilter, setTipoFilter] = useState("all");
  const [anoFilter, setAnoFilter] = useState("2026");
  const [clientes, setClientes] = useState<any[]>([]);

  const { data: pgdasStats } = trpc.declarations.getStats.useQuery({ declarationType: "pgdas" });
  const { data: pgmeiStats } = trpc.declarations.getStats.useQuery({ declarationType: "pgmei" });
  const { data: dctfwebStats } = trpc.declarations.getStats.useQuery({ declarationType: "dctfweb" });
  const { data: defisStats } = trpc.declarations.getStats.useQuery({ declarationType: "defis" });
  const { data: dirfStats } = trpc.declarations.getStats.useQuery({ declarationType: "dirf" });
  const { data: fgtsStats } = trpc.declarations.getStats.useQuery({ declarationType: "fgts_digital" });

  // Estatísticas consolidadas
  const stats = {
    total: 0,
    declarados: 0,
    pendentes: 0,
    atrasados: 0,
    percentual: 0,
  };

  const declaracoes = [
    { label: "PGDAS", stats: pgdasStats, tipo: "mensal", cor: "bg-blue-500" },
    { label: "PGMEI", stats: pgmeiStats, tipo: "mensal", cor: "bg-green-500" },
    { label: "DCTFWeb", stats: dctfwebStats, tipo: "mensal", cor: "bg-purple-500" },
    { label: "FGTS Digital", stats: fgtsStats, tipo: "mensal", cor: "bg-orange-500" },
    { label: "DEFIS", stats: defisStats, tipo: "anual", cor: "bg-pink-500" },
    { label: "DIRF", stats: dirfStats, tipo: "anual", cor: "bg-yellow-500" },
  ];

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Declarações</span>
            </div>
            <h1 className="text-xl font-semibold text-foreground">Acompanhamento de declarações</h1>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Badge */}
            <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg border border-blue-200">
              <BarChart3 className="h-4 w-4" />
              <span className="text-sm font-medium">Visão consolidada</span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="flex gap-3">
          <Card className="flex-1">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Declarações</p>
                <p className="text-xl font-semibold">{stats.total}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="flex-1">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Declarados</p>
                <p className="text-xl font-semibold text-green-600">{stats.declarados}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="flex-1">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pendentes</p>
                <p className="text-xl font-semibold text-yellow-600">{stats.pendentes}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="flex-1">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Atrasados</p>
                <p className="text-xl font-semibold text-red-600">{stats.atrasados}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="flex-1">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Percentual</p>
                <p className="text-xl font-semibold text-blue-600">{stats.percentual}%</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cards de Declarações */}
        <div className="grid grid-cols-3 gap-4">
          {declaracoes.map((decl) => {
            const total = decl.stats?.total || 0;
            const declarados = decl.stats?.declared || 0;
            const percentual = total > 0 ? Math.round((declarados / total) * 100) : 0;
            
            return (
              <Card key={decl.label}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <FileCheck className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">{decl.label}</span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${decl.tipo === 'mensal' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                      {decl.tipo === 'mensal' ? 'Mensal' : 'Anual'}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className="font-medium">{declarados}/{total}</span>
                    </div>
                    <Progress value={percentual} className="h-2" />
                    <p className="text-xs text-muted-foreground text-right">{percentual}% concluído</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Alerta */}
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
          <p className="text-sm text-blue-800">
            Acompanhe o status de todas as declarações. As declarações <strong>mensais</strong> (PGDAS, PGMEI, DCTFWeb, FGTS) devem ser transmitidas até o dia 20. 
            As <strong>anuais</strong> (DEFIS, DIRF) têm prazos específicos conforme o calendário fiscal.
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
              <label className="text-xs text-muted-foreground mb-1 block">Tipo</label>
              <Select value={tipoFilter} onValueChange={setTipoFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pgdas">PGDAS</SelectItem>
                  <SelectItem value="pgmei">PGMEI</SelectItem>
                  <SelectItem value="dctfweb">DCTFWeb</SelectItem>
                  <SelectItem value="fgts">FGTS Digital</SelectItem>
                  <SelectItem value="defis">DEFIS</SelectItem>
                  <SelectItem value="dirf">DIRF</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Ano</label>
              <Select value={anoFilter} onValueChange={setAnoFilter}>
                <SelectTrigger className="w-28">
                  <SelectValue placeholder="2026" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2026">2026</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
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
            <Calendar className="h-4 w-4" />
            Calendário Fiscal
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
                  <TableHead className="font-medium">Tipo</TableHead>
                  <TableHead className="font-medium">Competência</TableHead>
                  <TableHead className="font-medium">Data Transmissão</TableHead>
                  <TableHead className="font-medium">Protocolo</TableHead>
                  <TableHead className="font-medium">CNPJ</TableHead>
                  <TableHead className="font-medium">Razão Social</TableHead>
                  <TableHead className="font-medium">Vencimento</TableHead>
                  <TableHead className="font-medium">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-32 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <Building2 className="h-12 w-12 mb-4 opacity-30" />
                        <p>Nenhuma declaração encontrada. Associe clientes aos processos fiscais.</p>
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
                      <TableCell>-</TableCell>
                      <TableCell>{cliente.cnpj}</TableCell>
                      <TableCell>{cliente.razaoSocial}</TableCell>
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
