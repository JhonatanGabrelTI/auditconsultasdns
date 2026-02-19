import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Shield,
  FileCheck,
  Building2,
  Play,
  RotateCcw,
  Search,
  CheckCircle,
  XCircle,
  Download,
  Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const tiposConsulta = [
  {
    value: "cnd_federal",
    label: "CND Federal",
    icon: Shield,
    description: "Certidão Negativa de Débitos - Receita Federal",
    color: "text-green-600",
    bgColor: "bg-green-50"
  },
  {
    value: "cnd_estadual",
    label: "CND Estadual",
    icon: FileCheck,
    description: "Certidão Negativa de Débitos - SEFAZ (PR)",
    color: "text-blue-600",
    bgColor: "bg-blue-50"
  },
  {
    value: "regularidade_fgts",
    label: "Regularidade FGTS",
    icon: Building2,
    description: "Certidão Regularidade FGTS - Caixa Econômica",
    color: "text-orange-600",
    bgColor: "bg-orange-50"
  },
];

export default function ConsultasMassa() {
  const [tipoConsulta, setTipoConsulta] = useState<string>("cnd_federal");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]); // Changed to string UUIDs
  const [isConsulting, setIsConsulting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [regimeFilter, setRegimeFilter] = useState<string>("all");

  const { data: companies, isLoading } = trpc.companies.list.useQuery(); // Changed from clients.list
  const { data: consultasAnteriores } = trpc.apiConsultas.minhasConsultas.useQuery();

  const consultarCNDFederal = trpc.apiConsultas.consultarCNDFederal.useMutation();
  const consultarCNDEstadual = trpc.apiConsultas.consultarCNDEstadual.useMutation();
  const consultarFGTS = trpc.apiConsultas.consultarRegularidadeFGTS.useMutation();

  const filteredCompanies = companies?.filter((company) => {
    if (regimeFilter !== "all" && company.taxRegime !== regimeFilter) return false; // taxRegime
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        company.name?.toLowerCase().includes(search) || // name
        (company.cnpj || company.cpf)?.toLowerCase().includes(search) // cnpj/cpf
      );
    }
    return true;
  });

  const toggleCompany = (companyId: string) => {
    setSelectedCompanies((prev) =>
      prev.includes(companyId)
        ? prev.filter((id) => id !== companyId)
        : [...prev, companyId]
    );
  };

  const selectAll = () => {
    if (selectedCompanies.length === filteredCompanies?.length) {
      setSelectedCompanies([]);
    } else {
      setSelectedCompanies(filteredCompanies?.map((c) => c.id) || []);
    }
  };

  const executarConsulta = async () => {
    if (selectedCompanies.length === 0) {
      toast.error("Selecione pelo menos um cliente");
      return;
    }

    setIsConsulting(true);
    setProgress(0);
    setResults([]);
    setShowResults(true);

    const selectedCompaniesData = companies?.filter((c) => selectedCompanies.includes(c.id));
    const newResults: any[] = [];

    for (let i = 0; i < selectedCompaniesData!.length; i++) {
      const company = selectedCompaniesData![i];
      const currentProgress = ((i + 1) / selectedCompaniesData!.length) * 100;
      setProgress(currentProgress);

      try {
        let result;
        if (tipoConsulta === "cnd_federal") {
          result = await consultarCNDFederal.mutateAsync({ companyId: company.id });
        } else if (tipoConsulta === "cnd_estadual") {
          if (!company.inscricaoEstadual) {
            newResults.push({
              companyId: company.id,
              company,
              sucesso: false,
              situacao: "Erro",
              mensagem: "Inscrição Estadual não cadastrada",
            });
            continue;
          }
          result = await consultarCNDEstadual.mutateAsync({ companyId: company.id });
        } else if (tipoConsulta === "regularidade_fgts") {
          if (company.personType !== "juridica") {
            newResults.push({
              companyId: company.id,
              company,
              sucesso: false,
              situacao: "Erro",
              mensagem: "Apenas para Pessoa Jurídica",
            });
            continue;
          }
          result = await consultarFGTS.mutateAsync({ companyId: company.id });
        }

        newResults.push({
          companyId: company.id,
          company,
          sucesso: result?.sucesso,
          situacao: result?.situacao || "-",
          numeroCertidao: result?.numeroCertidao,
          dataEmissao: result?.dataEmissao,
          dataValidade: result?.dataValidade,
          validadeFim: result?.validadeFim,
          siteReceipt: result?.siteReceipt,
          mensagem: result?.mensagem,
        });
      } catch (error: any) {
        newResults.push({
          companyId: company.id,
          company,
          sucesso: false,
          situacao: "Erro",
          mensagem: error.message,
        });
      }
    }

    setResults(newResults);
    setIsConsulting(false);
    setProgress(100);
    toast.success("Consulta em massa concluída!");
  };

  const exportarResultados = () => {
    const csvContent = [
      ["CNPJ/CPF", "Razão Social", "Situação", "Nº Certidão", "Data Emissão", "Data Validade", "Status"].join(";"),
      ...results.map((r) => [
        r.company.cnpj || r.company.cpf,
        r.company.name,
        r.situacao,
        r.numeroCertidao || "-",
        r.dataEmissao || "-",
        r.dataValidade || "-",
        r.sucesso ? "Sucesso" : "Erro",
      ].join(";")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `consulta-${tipoConsulta}-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const tipoAtual = tiposConsulta.find((t) => t.value === tipoConsulta);
  const Icon = tipoAtual?.icon || Shield;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Consultas em Massa</h1>
            <p className="text-muted-foreground mt-1">
              Realize consultas de CND e Regularidade FGTS para múltiplos clientes
            </p>
          </div>
        </div>

        {/* Cards de Tipo de Consulta */}
        <div className="grid grid-cols-3 gap-4">
          {tiposConsulta.map((tipo) => {
            const TipoIcon = tipo.icon;
            return (
              <Card
                key={tipo.value}
                className={`cursor-pointer transition-all ${tipoConsulta === tipo.value
                  ? "ring-2 ring-primary border-primary"
                  : "hover:border-muted-foreground"
                  }`}
                onClick={() => setTipoConsulta(tipo.value)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`h-12 w-12 rounded-lg ${tipo.bgColor} flex items-center justify-center`}>
                      <TipoIcon className={`h-6 w-6 ${tipo.color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{tipo.label}</h3>
                      <p className="text-sm text-muted-foreground">{tipo.description}</p>
                    </div>
                    {tipoConsulta === tipo.value && (
                      <CheckCircle className="h-5 w-5 text-primary" />
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Filtros e Seleção */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Selecionar Clientes</span>
              <Badge variant="secondary">
                {selectedCompanies.length} selecionados
              </Badge>
            </CardTitle>
            <CardDescription>
              Selecione os clientes para realizar a consulta de {tipoAtual?.label}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filtros */}
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome ou CNPJ..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <Select value={regimeFilter} onValueChange={setRegimeFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Todos os regimes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os regimes</SelectItem>
                  <SelectItem value="simples_nacional">Simples Nacional</SelectItem>
                  <SelectItem value="lucro_presumido">Lucro Presumido</SelectItem>
                  <SelectItem value="lucro_real">Lucro Real</SelectItem>
                  <SelectItem value="mei">MEI</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={selectAll}>
                {selectedCompanies.length === filteredCompanies?.length ? "Desmarcar Todos" : "Selecionar Todos"}
              </Button>
            </div>

            {/* Botão Executar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isConsulting ? (
                  <Button disabled variant="default">
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Consultando...
                  </Button>
                ) : (
                  <Button
                    onClick={executarConsulta}
                    disabled={selectedCompanies.length === 0}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Iniciar Consulta em Massa
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedCompanies([]);
                    setResults([]);
                    setShowResults(false);
                  }}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Limpar
                </Button>
              </div>
              {results.length > 0 && (
                <Button variant="outline" onClick={exportarResultados}>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar CSV
                </Button>
              )}
            </div>

            {/* Progresso */}
            {isConsulting && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progresso</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            {/* Lista de Clientes */}
            <div className="border rounded-lg max-h-96 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={
                          filteredCompanies &&
                          filteredCompanies.length > 0 &&
                          selectedCompanies.length === filteredCompanies.length
                        }
                        onCheckedChange={selectAll}
                      />
                    </TableHead>
                    <TableHead>CNPJ/CPF</TableHead>
                    <TableHead>Razão Social / Nome</TableHead>
                    <TableHead>Regime</TableHead>
                    <TableHead>Situação</TableHead>
                    <TableHead>Validade</TableHead>
                    <TableHead className="w-24 text-center">Recibo</TableHead>
                    <TableHead>Última Consulta</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-32 text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ) : filteredCompanies?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                        Nenhum cliente encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCompanies?.map((company) => {
                      const ultimaConsulta = consultasAnteriores?.find(
                        (c) => c.companyId === company.id && c.tipoConsulta === tipoConsulta
                      );
                      return (
                        <TableRow key={company.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedCompanies.includes(company.id)}
                              onCheckedChange={() => toggleCompany(company.id)}
                            />
                          </TableCell>
                          <TableCell>{company.cnpj || company.cpf}</TableCell>
                          <TableCell>{company.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {company.taxRegime?.replace(/_/g, " ") || "-"}
                            </Badge>
                          </TableCell>

                          <TableCell>
                            {ultimaConsulta?.situacao ? (
                              <Badge
                                variant={
                                  ultimaConsulta.situacao?.toLowerCase().includes("regular")
                                    ? "default"
                                    : "destructive"
                                }
                              >
                                {ultimaConsulta.situacao}
                              </Badge>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </TableCell>

                          <TableCell>
                            {ultimaConsulta?.validadeFim || (ultimaConsulta?.dataValidade
                              ? new Date(ultimaConsulta.dataValidade).toLocaleDateString("pt-BR")
                              : "-")}
                          </TableCell>

                          <TableCell className="text-center">
                            {ultimaConsulta?.siteReceipt ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => window.open(ultimaConsulta.siteReceipt, "_blank")}
                                title="Baixar Recibo"
                              >
                                <Download className="h-4 w-4 text-blue-600" />
                              </Button>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </TableCell>

                          <TableCell>
                            {ultimaConsulta ? (
                              <div className="flex items-center gap-2">
                                {ultimaConsulta.sucesso ? (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-500" />
                                )}
                                <span className="text-sm">
                                  {new Date(ultimaConsulta.createdAt).toLocaleDateString("pt-BR")}
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Resultados */}
        {showResults && results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Resultados da Consulta</span>
                <div className="flex gap-2">
                  <Badge className="bg-green-100 text-green-800">
                    {results.filter((r) => r.sucesso).length} Sucesso
                  </Badge>
                  <Badge className="bg-red-100 text-red-800">
                    {results.filter((r) => !r.sucesso).length} Erros
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg max-h-96 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>CNPJ/CPF</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Situação</TableHead>
                      <TableHead>Nº Certidão</TableHead>
                      <TableHead>Validade</TableHead>
                      <TableHead className="w-24 text-center">Recibo</TableHead>
                      <TableHead>Mensagem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((result, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {result.sucesso ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                        </TableCell>
                        <TableCell>{result.company.cnpj || result.company.cpf}</TableCell>
                        <TableCell>{result.company.name}</TableCell>
                        <TableCell>
                          <Badge
                            variant={result.situacao?.toLowerCase() === "regular" ? "default" : "destructive"}
                          >
                            {result.situacao}
                          </Badge>
                        </TableCell>
                        <TableCell>{result.numeroCertidao || "-"}</TableCell>
                        <TableCell>
                          {result.validadeFim || (result.dataValidade
                            ? new Date(result.dataValidade).toLocaleDateString("pt-BR")
                            : "-")}
                        </TableCell>
                        <TableCell className="text-center">
                          {result.siteReceipt ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => window.open(result.siteReceipt, "_blank")}
                              title="Baixar Recibo"
                            >
                              <Download className="h-4 w-4 text-blue-600" />
                            </Button>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{result.mensagem}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )
        }
      </div >
    </DashboardLayout >
  );
}
