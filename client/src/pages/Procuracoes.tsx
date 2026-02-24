import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/lib/trpc";
import { FileText, CheckCircle, XCircle, Clock, MoreHorizontal, Trash2, Calendar, User, Shield, RefreshCw } from "lucide-react";
import { format, isAfter } from "date-fns";
import { toast } from "sonner";

export default function Procuracoes() {
  const utils = trpc.useUtils();
  const { data: procuracoes, isLoading, refetch } = trpc.procuracoes.listAll.useQuery();

  const deleteMutation = trpc.procuracoes.delete.useMutation({
    onSuccess: () => {
      toast.success("Procuração excluída com sucesso");
      utils.procuracoes.listAll.invalidate();
    },
    onError: (err) => {
      toast.error(`Erro ao excluir procuração: ${err.message}`);
    }
  });

  const getStatusBadge = (endDate: string | null, active: boolean) => {
    if (!active) return <Badge className="bg-rose-500/10 text-rose-500 border-none">Revogada</Badge>;
    if (!endDate) return <Badge className="bg-emerald-500/10 text-emerald-500 border-none">Ativa (Vigente)</Badge>;

    const date = new Date(endDate);
    const now = new Date();

    if (isAfter(now, date)) {
      return <Badge className="bg-amber-500/10 text-amber-500 border-none">Vencida</Badge>;
    }

    return <Badge className="bg-emerald-500/10 text-emerald-500 border-none">Ativa</Badge>;
  };

  const stats = {
    ativas: procuracoes?.filter(p => p.procuracao.active && (!p.procuracao.endDate || isAfter(new Date(p.procuracao.endDate), new Date()))).length || 0,
    vencidas: procuracoes?.filter(p => p.procuracao.active && p.procuracao.endDate && !isAfter(new Date(p.procuracao.endDate), new Date())).length || 0,
    revogadas: procuracoes?.filter(p => !p.procuracao.active).length || 0
  };

  return (
    <DashboardLayout>
      <div className="container py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              Procurações Digitais
            </h1>
            <p className="text-muted-foreground mt-1">
              Monitore os poderes e autorizações delegados pelos seus clientes
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="bg-card border-border hover:bg-slate-800"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-emerald-500/5 border-emerald-500/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ativas</CardTitle>
              <CheckCircle className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-500">{isLoading ? "..." : stats.ativas}</div>
              <p className="text-xs text-muted-foreground mt-1">Procurações válidas</p>
            </CardContent>
          </Card>

          <Card className="bg-amber-500/5 border-amber-500/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vencidas</CardTitle>
              <Clock className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-500">{isLoading ? "..." : stats.vencidas}</div>
              <p className="text-xs text-muted-foreground mt-1">Expiraram o prazo original</p>
            </CardContent>
          </Card>

          <Card className="bg-rose-500/5 border-rose-500/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revogadas</CardTitle>
              <XCircle className="h-4 w-4 text-rose-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-rose-500">{isLoading ? "..." : stats.revogadas}</div>
              <p className="text-xs text-muted-foreground mt-1">Canceladas manualmente</p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card/50 border-border">
          <CardHeader>
            <CardTitle>Lista de Procurações</CardTitle>
            <CardDescription>Visualização centralizada de todos os poderes outorgados</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">Carregando procurações...</div>
            ) : procuracoes && procuracoes.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Tipo / Representante</TableHead>
                    <TableHead>Validade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {procuracoes.map((item) => (
                    <TableRow key={item.procuracao.id} className="hover:bg-slate-800/50 transition-colors">
                      <TableCell>
                        <div className="font-medium text-foreground">{item.company.name}</div>
                        <div className="text-xs text-muted-foreground">{item.company.cnpj}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="capitalize font-medium text-sm">{item.procuracao.type.replace("_", " ")}</span>
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase">
                            <User className="h-3 w-3" />
                            {item.procuracao.nomeRepresentante}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {item.procuracao.startDate ? format(new Date(item.procuracao.startDate), "dd/MM/yyyy") : "Início N/A"}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            até {item.procuracao.endDate ? format(new Date(item.procuracao.endDate), "dd/MM/yyyy") : "Indeterminado"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(item.procuracao.endDate, item.procuracao.active)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="text-rose-500 focus:text-rose-500" onClick={() => {
                              if (confirm("Deseja realmente excluir esta procuração?")) {
                                deleteMutation.mutate({ id: item.procuracao.id });
                              }
                            }}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-16">
                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-20" />
                <p className="text-xl font-medium text-muted-foreground">Nenhuma procuração encontrada</p>
                <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
                  Acompanhe aqui todas as procurações enviadas ou detectadas nos portais e-CAC e Simples Nacional.
                </p>
                <Button variant="outline" className="mt-6" onClick={() => window.location.href = '/clientes'}>
                  Ver Clientes
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
