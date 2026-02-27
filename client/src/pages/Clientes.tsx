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
  RefreshCw,
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
import { useTransition, useRef } from "react";

interface ClientFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: any;
  isEdit?: boolean;
}

function ClientForm({ onSuccess, onCancel, initialData, isEdit }: ClientFormProps) {
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState<{
    personType: "juridica" | "fisica";
    cnpjCpf: string;
    name: string;
    taxRegime?: "simples_nacional" | "lucro_presumido" | "lucro_real" | "mei" | "isento";
    inscricaoEstadual?: string;
    emails?: string;
    whatsapps?: string;
    uf?: string;
  }>({
    personType: initialData?.personType || "juridica",
    cnpjCpf: (initialData?.cnpj || initialData?.cpf) || "",
    name: initialData?.name || "",
    taxRegime: initialData?.taxRegime || undefined,
    inscricaoEstadual: initialData?.inscricaoEstadual || "",
    emails: Array.isArray(initialData?.emails) ? initialData.emails.join(", ") : "",
    whatsapps: Array.isArray(initialData?.whatsapps) ? initialData.whatsapps.join(", ") : "",
    uf: initialData?.uf || "PR",
  });

  const createClient = trpc.companies.create.useMutation({
    onSuccess: () => {
      toast.success("Cliente cadastrado com sucesso!");
      onSuccess();
    },
    onError: (error) => {
      const cleanMessage = error.message.includes("]: ")
        ? error.message.split("]: ").pop()
        : error.message;
      toast.error(cleanMessage);
    },
  });

  const updateClient = trpc.companies.update.useMutation({
    onSuccess: () => {
      toast.success("Cliente atualizado com sucesso!");
      onSuccess();
    },
    onError: (error) => {
      const cleanMessage = error.message.includes("]: ")
        ? error.message.split("]: ").pop()
        : error.message;
      toast.error(cleanMessage);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const emailsArray = formData.emails
      ? formData.emails.split(",").map(e => e.trim()).filter(e => e)
      : [];

    const whatsappsArray = formData.whatsapps
      ? formData.whatsapps.split(",").map(w => w.trim()).filter(w => w)
      : [];

    const payload: any = {
      name: formData.name,
      personType: formData.personType,
      taxRegime: formData.taxRegime,
      inscricaoEstadual: formData.inscricaoEstadual,
      uf: formData.uf,
      emails: emailsArray,
      whatsapps: whatsappsArray,
    };

    if (formData.personType === "juridica") {
      payload.cnpj = formData.cnpjCpf;
    } else {
      payload.cpf = formData.cnpjCpf;
    }

    if (isEdit) {
      updateClient.mutate({ id: initialData.id, ...payload });
    } else {
      createClient.mutate(payload);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
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
          <div className="space-y-2">
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
          <div className="space-y-2">
            <Label htmlFor="name">
              {formData.personType === "juridica" ? "Razão Social" : "Nome Completo"}
            </Label>
            <Input
              id="name"
              placeholder={formData.personType === "juridica" ? "EMPRESA LTDA" : "Nome Completo"}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="taxRegime">Regime Tributário</Label>
          <Select
            value={formData.taxRegime}
            onValueChange={(value) => {
              // Wrap in setTimeout and useTransition to allow Radix UI and React 19 to coordinate cleanup
              setTimeout(() => {
                startTransition(() => {
                  setFormData(prev => ({ ...prev, taxRegime: value as any }));
                });
              }, 0);
            }}
          >
            <SelectTrigger id="taxRegime">
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="inscricaoEstadual">Inscrição Estadual</Label>
              <Input
                id="inscricaoEstadual"
                placeholder="000.000.000.000"
                value={formData.inscricaoEstadual}
                onChange={(e) => setFormData({ ...formData, inscricaoEstadual: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="uf">UF (Estado)</Label>
              <Select
                value={formData.uf}
                onValueChange={(value) => setFormData({ ...formData, uf: value })}
              >
                <SelectTrigger id="uf">
                  <SelectValue placeholder="UF" />
                </SelectTrigger>
                <SelectContent>
                  {["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"].map(uf => (
                    <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="emails">E-mails (separados por vírgula)</Label>
          <Input
            id="emails"
            placeholder="email1@example.com, email2@example.com"
            value={formData.emails}
            onChange={(e) => setFormData({ ...formData, emails: e.target.value })}
          />
        </div>

        <div className="space-y-2">
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
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={createClient.isPending || updateClient.isPending}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          {createClient.isPending || updateClient.isPending ? "Salvando..." : "Salvar Cliente"}
        </Button>
      </div>
    </form>
  );
}

interface BulkImportDialogProps {
  onSuccess: () => void;
  onCancel: () => void;
}

function BulkImportDialog({ onSuccess, onCancel }: BulkImportDialogProps) {
  const [csvData, setCsvData] = useState("");
  const bulkCreate = trpc.companies.bulkCreate.useMutation({
    onSuccess: () => {
      toast.success("Importação concluída com sucesso!");
      onSuccess();
    },
    onError: (error) => {
      toast.error("Erro na importação: " + error.message);
    },
  });

  const handleImport = () => {
    if (!csvData.trim()) {
      toast.error("Insira os dados em formato CSV.");
      return;
    }

    try {
      const lines = csvData.split("\n").filter(l => l.trim());
      const headers = lines[0].split(",").map(h => h.trim().toLowerCase());

      const items = lines.slice(1).map(line => {
        const values = line.split(",").map(v => v.trim());
        const obj: any = {};
        headers.forEach((h, i) => {
          if (h === "emails" || h === "whatsapps") {
            obj[h] = values[i] ? values[i].split(";").map(v => v.trim()) : [];
          } else {
            obj[h] = values[i];
          }
        });

        // Ensure standard fields and flexible mapping
        return {
          name: obj.nome || obj.name || obj.razao_social || obj["razao social"] || obj["razão social"],
          personType: (obj.tipo || obj.persontype || obj.type)?.toLowerCase()?.includes("fisica") ? "fisica" : "juridica",
          cnpj: obj.cnpj,
          cpf: obj.cpf,
          taxRegime: obj.regime || obj.taxregime || obj["regime tributario"] || obj["regime tributário"],
          inscricaoEstadual: obj.inscricaoestadual || obj.ie || obj["inscrição estadual"],
          uf: (obj.uf || obj.estado || obj.state || "PR").toUpperCase().substring(0, 2),
          emails: obj.emails || [],
          whatsapps: obj.whatsapps || [],
        };
      });

      bulkCreate.mutate(items);
    } catch (e) {
      toast.error("Erro ao processar CSV. Verifique o formato.");
    }
  };

  const downloadTemplate = () => {
    const template = "nome,cnpj,persontype,regime,emails,whatsapps\nExemplo Empresa,12345678000199,juridica,simples_nacional,email@test.com,11999999999";
    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template_clientes.csv";
    a.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvData(content);
      toast.success("Arquivo carregado com sucesso!");
    };
    reader.onerror = () => {
      toast.error("Erro ao ler o arquivo.");
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4 pt-4">
      <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm space-y-2">
        <p className="font-semibold">Instruções:</p>
        <ul className="list-disc pl-4 space-y-1">
          <li>Use vírgula para separar colunas.</li>
          <li>A primeira linha deve conter os cabeçalhos.</li>
          <li>Principais colunas: <b>cnpj, nome</b> (ou razao_social), <b>tipo</b> (juridica/fisica), <b>regime</b>.</li>
          <li>Outras: <b>emails, whatsapps, inscricao_estadual</b>.</li>
          <li>Para múltiplos e-mails ou whatsapps, use ponto e vírgula (;).</li>
        </ul>
        <Button variant="link" size="sm" className="p-0 h-auto" onClick={downloadTemplate}>
          Baixar modelo CSV
        </Button>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Carregar arquivo CSV</Label>
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-slate-50 dark:bg-slate-800/50 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-3 text-slate-400" />
                <p className="mb-2 text-sm text-slate-500 dark:text-slate-400">
                  <span className="font-semibold">Clique para selecionar</span> ou arraste o arquivo
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Apenas arquivos .csv ou .txt
                </p>
              </div>
              <input type="file" className="hidden" accept=".csv,.txt" onChange={handleFileChange} />
            </label>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-slate-200 dark:border-slate-800" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Ou cole os dados abaixo</span>
          </div>
        </div>

        <div className="space-y-2">
          <textarea
            className="w-full h-40 p-3 rounded-md border border-input bg-background font-mono text-sm"
            placeholder="nome,cnpj,persontype,regime&#10;Empresa A,00...00,juridica,simples_nacional"
            value={csvData}
            onChange={(e) => setCsvData(e.target.value)}
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button
          className="bg-blue-600 hover:bg-blue-700"
          onClick={handleImport}
          disabled={bulkCreate.isPending}
        >
          {bulkCreate.isPending ? "Importando..." : "Importar Agora"}
        </Button>
      </div>
    </div>
  );
}

export default function Clientes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [regimeFilter, setRegimeFilter] = useState<string>("all");
  const [personTypeFilter, setPersonTypeFilter] = useState<string>("all");
  const [procuracaoFilter, setProcuracaoFilter] = useState<string>("all");
  const [certificateFilter, setCertificateFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [consultaDialogOpen, setConsultaDialogOpen] = useState(false);
  const [consultaResult, setConsultaResult] = useState<any>(null);
  const [certificateDialogOpen, setCertificateDialogOpen] = useState(false);
  const [selectedClientForCertificate, setSelectedClientForCertificate] = useState<any>(null);
  const [certPassword, setCertPassword] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const createCertificate = trpc.certificates.create.useMutation({
    onSuccess: (data) => {
      toast.success("Certificado adicionado com sucesso!");
      setCertificateDialogOpen(false);
      setCertPassword("");
      setSelectedFile(null);
      refetch();

      // Automático: Iniciar primeira consulta federal após integrar certificado
      if (selectedClientForCertificate?.id) {
        toast.info("Iniciando consulta automática da CND Federal...");
        consultarCNDFederal.mutate({ companyId: selectedClientForCertificate.id });
      }
    },
    onError: (error) => {
      toast.error(`Erro ao adicionar certificado: ${error.message}`);
    }
  });

  const handleSaveCertificate = () => {
    if (!selectedClientForCertificate) return;
    if (!certPassword) {
      toast.error("Por favor, digite a senha do certificado");
      return;
    }

    if (!selectedFile) {
      toast.error("Por favor, selecione um arquivo de certificado");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      // Extract only the base64 part if it has the data: URI prefix
      const base64Content = base64.includes(",") ? base64.split(",")[1] : base64;

      createCertificate.mutate({
        companyId: selectedClientForCertificate.id,
        passwordHash: certPassword,
        path: base64Content, // Store content in path field for now
        active: true,
        name: selectedFile.name || "Certificado A1",
      });
    };

    reader.onerror = () => {
      toast.error("Erro ao ler arquivo de certificado");
    };

    reader.readAsDataURL(selectedFile);
  };
  const [isPending, startTransition] = useTransition();

  const handleFormSuccess = () => {
    setDialogOpen(false);
    setEditDialogOpen(false);
    // Give time for the dialog to unmount before refetching
    setTimeout(() => {
      refetch();
    }, 100);
  };

  const { data: clients, isLoading, refetch } = trpc.companies.search.useQuery({
    searchTerm: searchTerm || undefined,
    taxRegime: regimeFilter !== "all" ? regimeFilter : undefined,
    personType: personTypeFilter !== "all" ? personTypeFilter : undefined,
  }, {
    // Prevent flickering by keeping old data while fetching
    placeholderData: (previousData) => previousData,
  });

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

  const deleteClient = trpc.companies.delete.useMutation({
    onSuccess: () => {
      toast.success("Cliente excluído com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao excluir cliente: " + error.message);
    },
  });

  const handleConsultarCNDFederal = (companyId: string) => {
    consultarCNDFederal.mutate({ companyId });
  };

  const handleConsultarCNDEstadual = (companyId: string) => {
    consultarCNDEstadual.mutate({ companyId });
  };

  const handleConsultarFGTS = (companyId: string) => {
    consultarFGTS.mutate({ companyId });
  };

  const handleOpenCertificateDialog = (client: any) => {
    setSelectedClientForCertificate(client);
    setCertificateDialogOpen(true);
  };

  const totalClients = clients?.length || 0;
  const activeClients = clients?.filter(c => c.active).length || 0;
  const clientsWithoutCertificate = clients?.filter(c => !c.certificatePath).length || 0;

  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(now.getDate() + 30);

  const expiredCertificates = clients?.filter(c => {
    if (!c.certificateExpiresAt) return false;
    return new Date(c.certificateExpiresAt) < now;
  }).length || 0;

  const expiringSoon = clients?.filter(c => {
    if (!c.certificateExpiresAt) return false;
    const expiresAt = new Date(c.certificateExpiresAt);
    return expiresAt > now && expiresAt < thirtyDaysFromNow;
  }).length || 0;

  const stats = [
    { label: "Total Clientes", value: totalClients, icon: Users, color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-100 dark:bg-slate-800/50", border: "border-slate-200 dark:border-slate-700" },
    { label: "Ativos", value: activeClients, icon: CheckCircle, color: "text-emerald-600 dark:text-emerald-500", bg: "bg-emerald-100 dark:bg-emerald-950/30", border: "border-emerald-200 dark:border-emerald-900/50" },
    { label: "Sem Certificado", value: clientsWithoutCertificate, icon: FileText, color: "text-blue-600 dark:text-blue-500", bg: "bg-blue-100 dark:bg-blue-950/30", border: "border-blue-200 dark:border-blue-900/50" },
    { label: "Vence em 30 dias", value: expiringSoon, icon: Clock, color: "text-amber-600 dark:text-amber-500", bg: "bg-amber-100 dark:bg-amber-950/30", border: "border-amber-200 dark:border-amber-900/50" },
    { label: "Vencidos", value: expiredCertificates, icon: AlertTriangle, color: "text-rose-600 dark:text-rose-500", bg: "bg-rose-100 dark:bg-rose-950/30", border: "border-rose-200 dark:border-rose-900/50" },
  ];

  const handleBulkDownload = () => {
    if (!clients || clients.length === 0) {
      toast.error("Não há clientes para exportar.");
      return;
    }

    const headers = ["ID", "Nome", "Tipo", "CNPJ/CPF", "Regime", "Email", "WhatsApp", "Certificado"];
    const rows = clients.map(c => [
      c.id,
      c.name,
      c.personType,
      c.cnpj || c.cpf,
      c.taxRegime || "-",
      Array.isArray(c.emails) ? c.emails.join(";") : "",
      Array.isArray(c.whatsapps) ? c.whatsapps.join(";") : "",
      c.certificatePath ? "Sim" : "Não"
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "lista_clientes_guias.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Download em lote concluído!");
  };

  return (
    <DashboardLayout>
      <div className="container py-6 space-y-8 max-w-[1600px]">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row gap-6">
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
                  <ClientForm
                    onSuccess={handleFormSuccess}
                    onCancel={() => setDialogOpen(false)}
                  />
                </DialogContent>
              </Dialog>

              <Dialog open={bulkImportOpen} onOpenChange={setBulkImportOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full justify-center bg-slate-200 hover:bg-slate-300 text-slate-700 shadow-sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Adicionar vários clientes
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Importar Clientes em Lote</DialogTitle>
                    <DialogDescription>
                      Cole seus dados CSV para importar múltiplos clientes.
                    </DialogDescription>
                  </DialogHeader>
                  <BulkImportDialog
                    onSuccess={() => { setBulkImportOpen(false); refetch(); }}
                    onCancel={() => setBulkImportOpen(false)}
                  />
                </DialogContent>
              </Dialog>

              <Button
                className="w-full justify-center bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={handleBulkDownload}
              >
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
              <Select value={certificateFilter} onValueChange={(value) => {
                setTimeout(() => {
                  setCertificateFilter(value);
                }, 0);
              }}>
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

              <Select value={procuracaoFilter} onValueChange={(value) => {
                setTimeout(() => {
                  setProcuracaoFilter(value);
                }, 0);
              }}>
                <SelectTrigger className="w-[180px] bg-card border-border">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="active">Ativa</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                </SelectContent>
              </Select>

              <Select value={regimeFilter} onValueChange={(value) => {
                setTimeout(() => {
                  setRegimeFilter(value);
                }, 0);
              }}>
                <SelectTrigger className="w-[180px] bg-card border-border">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="simples_nacional">Simples Nacional</SelectItem>
                  <SelectItem value="lucro_presumido">Lucro Presumido</SelectItem>
                  <SelectItem value="lucro_real">Lucro Real</SelectItem>
                  <SelectItem value="mei">MEI</SelectItem>
                  <SelectItem value="isento">Isento</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                className="bg-card border-border hover:bg-slate-800"
                onClick={() => refetch()}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>

              <Button
                variant="outline"
                className="bg-card border-border hover:bg-slate-800"
                onClick={handleBulkDownload}
              >
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
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="w-[200px]">Certificado Digital</TableHead>
                <TableHead className="w-[200px]">Procuração e-CAC</TableHead>
                <TableHead>Razão Social | Nome</TableHead>
                <TableHead>CNPJ | CPF</TableHead>
                <TableHead>Regime Tributário</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && !clients ? (
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
                        {client.certificatePath ? (
                          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-500 dark:border-emerald-900/50">
                            Integrado
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                            Não Integrado
                          </Badge>
                        )}
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
                      {client.hasProcuracao ? (
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-500 dark:border-emerald-900/50">
                          Integrado
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-200 dark:bg-yellow-950/30 dark:text-yellow-500 dark:border-yellow-900/50">
                          Aguardando sincronização
                        </Badge>
                      )}
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
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 hover:bg-slate-800"
                          onClick={() => {
                            setSelectedClient(client);
                            setEditDialogOpen(true);
                          }}
                        >
                          <Edit2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-slate-800">
                              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => handleConsultarCNDFederal(client.id)}>
                              Consultar CND Federal
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleConsultarCNDEstadual(client.id)}>
                              Consultar CND Estadual
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleConsultarFGTS(client.id)}>
                              Consultar FGTS
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-500 focus:text-red-500"
                              onClick={() => {
                                if (confirm(`Deseja realmente excluir o cliente ${client.name}?`)) {
                                  deleteClient.mutate({ id: client.id });
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
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

        {/* Modal de Resultado de Consulta */}
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
                      <div className="space-y-1">
                        <Label>Situação</Label>
                        <div>
                          <Badge
                            variant={
                              consultaResult.situacao.toLowerCase().includes("regular") ||
                                consultaResult.situacao.toLowerCase().includes("consta") ||
                                consultaResult.situacao.toLowerCase().includes("negativa")
                                ? "default" : "destructive"
                            }
                            className="text-base px-3 py-1"
                          >
                            {consultaResult.situacao}
                          </Badge>
                        </div>
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
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                      <p className="font-semibold text-red-600">✗ Erro na consulta</p>
                      <p className="text-sm mt-2">{consultaResult.mensagem}</p>
                    </div>

                    {consultaResult.respostaCompleta && (
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground uppercase">Detalhes técnicos</Label>
                        <div className="p-2 rounded bg-slate-900 border border-slate-800 overflow-x-auto max-h-40">
                          <pre className="text-[10px] font-mono text-slate-400 whitespace-pre-wrap break-all">
                            {(() => {
                              try {
                                return JSON.stringify(JSON.parse(consultaResult.respostaCompleta), null, 2);
                              } catch (e) {
                                return consultaResult.respostaCompleta;
                              }
                            })()}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {consultaResult.sucesso && consultaResult.siteReceipt && (
                  <Button
                    variant="default"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => window.open(consultaResult.siteReceipt, "_blank")}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Baixar Certidão
                  </Button>
                )}

                <Button onClick={() => setConsultaDialogOpen(false)} className="w-full">
                  Fechar
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal de Certificado Digital */}
        <Dialog open={certificateDialogOpen} onOpenChange={setCertificateDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Adicionar Certificado Digital</DialogTitle>
              <DialogDescription>
                Insira o certificado digital em formato .pfx ou .p12 do cliente.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div
                className={`border-2 border-dashed ${selectedFile ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10' : 'border-slate-300 dark:border-slate-700'} rounded-lg p-8 text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors`}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="flex flex-col items-center gap-2">
                  <Upload className={`h-8 w-8 ${selectedFile ? 'text-emerald-500' : 'text-slate-400'}`} />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {selectedFile ? selectedFile.name : "Arraste e solte o certificado digital"}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedFile ? "Arquivo selecionado" : "Seu arquivo será adicionado automaticamente"}
                  </span>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".pfx,.p12"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cert-password">Senha do certificado digital</Label>
                <Input
                  id="cert-password"
                  type="password"
                  placeholder="Digite a senha do certificado digital"
                  value={certPassword}
                  onChange={(e) => setCertPassword(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCertificateDialogOpen(false)}>Cancelar</Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={handleSaveCertificate}
                disabled={createCertificate.isPending}
              >
                {createCertificate.isPending ? "Salvando..." : "Verificar e Salvar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Editar Cliente */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Cliente</DialogTitle>
              <DialogDescription>
                Atualize as informações do cliente
              </DialogDescription>
            </DialogHeader>
            {selectedClient && (
              <ClientForm
                isEdit
                initialData={selectedClient}
                onSuccess={handleFormSuccess}
                onCancel={() => setEditDialogOpen(false)}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
