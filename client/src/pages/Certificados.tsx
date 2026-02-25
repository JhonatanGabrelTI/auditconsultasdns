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
import { Shield, CheckCircle, AlertCircle, Clock, MoreHorizontal, Trash2, ShieldCheck, Calendar } from "lucide-react";
import { format, differenceInDays, isAfter } from "date-fns";
import { toast } from "sonner";

export default function Certificados() {
  const utils = trpc.useUtils();
  const { data: certificates, isLoading } = trpc.certificates.listAll.useQuery();

  const deleteCertificate = trpc.certificates.delete.useMutation({
    onSuccess: () => {
      toast.success("Certificado excluído com sucesso");
      utils.certificates.listAll.invalidate();
    },
    onError: (err) => {
      toast.error(`Erro ao excluir certificado: ${err.message}`);
    }
  });

  const getStatus = (validUntil: string | Date | null) => {
    if (!validUntil) return { label: "Sem data", color: "bg-slate-500/10 text-slate-500", icon: AlertCircle };
    const date = validUntil instanceof Date ? validUntil : new Date(validUntil);
    const now = new Date();
    const daysLeft = differenceInDays(date, now);

    if (!isAfter(date, now)) return { label: "Vencido", color: "bg-rose-500/10 text-rose-500", icon: AlertCircle };
    if (daysLeft <= 30) return { label: "Vencendo em breve", color: "bg-amber-500/10 text-amber-500", icon: Clock };
    return { label: "Válido", color: "bg-emerald-500/10 text-emerald-500", icon: CheckCircle };
  };

  const total = certificates?.length || 0;
  const valid = certificates?.filter(c => {
    const status = getStatus(c.certificate.validUntil);
    return status.label === "Válido";
  }).length || 0;
  const critical = certificates?.filter(c => {
    const status = getStatus(c.certificate.validUntil);
    return status.label === "Vencido" || status.label === "Vencendo em breve";
  }).length || 0;

  return (
    <DashboardLayout>
      <div className="container py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <ShieldCheck className="h-8 w-8 text-primary" />
              Certificados Digitais
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie e monitore a validade dos certificados integrados
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-emerald-500/5 border-emerald-500/10 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Válidos</CardTitle>
              <CheckCircle className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-500">{isLoading ? "..." : valid}</div>
              <p className="text-xs text-muted-foreground mt-1">{total} certificados no total</p>
            </CardContent>
          </Card>

          <Card className="bg-amber-500/5 border-amber-500/10 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">A Vencer (30 dias)</CardTitle>
              <Clock className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-500">{isLoading ? "..." : certificates?.filter(c => differenceInDays(new Date(c.certificate.validUntil!), new Date()) <= 30 && isAfter(new Date(c.certificate.validUntil!), new Date())).length || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Requer atenção em breve</p>
            </CardContent>
          </Card>

          <Card className="bg-rose-500/5 border-rose-500/10 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Críticos / Vencidos</CardTitle>
              <AlertCircle className="h-4 w-4 text-rose-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-rose-500">{isLoading ? "..." : certificates?.filter(c => !isAfter(new Date(c.certificate.validUntil!), new Date())).length || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Necessário renovação imediata</p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card/50 border-border">
          <CardHeader>
            <CardTitle>Lista de Certificados</CardTitle>
            <CardDescription>Visualização detalhada de todos os tokens e arquivos carregados</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">Carregando certificados...</div>
            ) : certificates && certificates.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Certificado / Nome</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {certificates.map((item) => {
                    const status = getStatus(item.certificate.validUntil);
                    const StatusIcon = status.icon;

                    return (
                      <TableRow key={item.certificate.id} className="hover:bg-slate-800/50 transition-colors">
                        <TableCell>
                          <div className="font-medium text-foreground">{item.company.name}</div>
                          <div className="text-xs text-muted-foreground">{item.company.cnpj}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-primary" />
                            <span>{item.certificate.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{item.certificate.validUntil ? format(new Date(item.certificate.validUntil), "dd/MM/yyyy") : "N/A"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${status.color} border-none font-medium flex items-center gap-1 w-fit`}>
                            <StatusIcon className="h-3 w-3" />
                            {status.label}
                          </Badge>
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
                                if (confirm("Deseja realmente excluir este certificado?")) {
                                  deleteCertificate.mutate({ id: item.certificate.id });
                                }
                              }}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-16">
                <ShieldCheck className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-20" />
                <p className="text-xl font-medium text-muted-foreground">Nenhum certificado encontrado</p>
                <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
                  Vá para a página de Clientes e adicione certificados digitais (A1/P12) para começar o monitoramento automático.
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
