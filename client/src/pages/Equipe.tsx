import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Users,
    Search,
    Plus,
    Edit2,
    Trash2,
    MoreVertical,
    Shield,
    Briefcase,
    Mail,
    Phone,
    Upload,
    UserPlus
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

// Mock Data for Departments
const departments = [
    { id: 1, name: "Administrativo", manager: "Não informado", members: 3, color: "bg-red-500" },
    { id: 2, name: "Comercial", manager: "Não informado", members: 5, color: "bg-orange-500" },
    { id: 3, name: "Contábil", manager: "Não informado", members: 8, color: "bg-blue-500" },
    { id: 4, name: "Fiscal", manager: "Não informado", members: 6, color: "bg-green-500" },
    { id: 5, name: "Legalização", manager: "Não informado", members: 2, color: "bg-purple-500" },
    { id: 6, name: "Pessoal", manager: "Não informado", members: 4, color: "bg-yellow-500" },
];

export default function Equipe() {
    const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
    const [role, setRole] = useState("administrador");

    const handleCreateUser = (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreateUserOpen(false);
        toast.success("Usuário criado com sucesso!");
    };

    return (
        <DashboardLayout>
            <div className="container py-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Equipe</h1>
                        <p className="text-muted-foreground mt-1">
                            Gerencie sua equipe e departamentos
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline">
                            Histórico de Ações
                        </Button>
                        <Button onClick={() => setIsCreateUserOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
                            <UserPlus className="h-4 w-4 mr-2" />
                            Adicionar Colaborador
                        </Button>
                    </div>
                </div>

                {/* Main Content Tabs */}
                <Tabs defaultValue="equipe" className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="equipe">Minha equipe</TabsTrigger>
                        <TabsTrigger value="permissoes">Permissões</TabsTrigger>
                    </TabsList>

                    <TabsContent value="equipe" className="space-y-6">
                        {/* Sub-header / Filters */}
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="flex bg-muted/50 p-1 rounded-lg">
                                <Button variant="ghost" size="sm" className="bg-background shadow-sm">
                                    Departamentos
                                </Button>
                                <Button variant="ghost" size="sm" className="text-muted-foreground">
                                    Colaboradores
                                </Button>
                            </div>
                            <Button
                                variant="default"
                                className="bg-emerald-600 hover:bg-emerald-700"
                                onClick={() => toast.info("Funcionalidade em desenvolvimento: Adicionar Departamento")}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Adicionar departamento
                            </Button>
                        </div>

                        {/* Department List */}
                        <div className="grid gap-4">
                            {departments.map((dept) => (
                                <Card key={dept.id} className="hover:border-primary/50 transition-colors">
                                    <CardContent className="flex items-center justify-between p-4">
                                        <div className="flex items-center gap-4">
                                            <div className={`h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold ${dept.color}`}>
                                                {dept.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-foreground">{dept.name}</h3>
                                                <p className="text-sm text-muted-foreground">
                                                    Gestor: {dept.manager}
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => toast.info(`Editando departamento: ${dept.name}`)}
                                        >
                                            <Edit2 className="h-4 w-4 mr-2" />
                                            Editar departamento
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="permissoes">
                        <Card>
                            <CardHeader>
                                <CardTitle>Permissões do Sistema</CardTitle>
                                <CardDescription>
                                    Visualize as permissões disponíveis para os grupos de acesso (Geral e MonitorHub).
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-8">

                                {/* Geral Group */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 border-b pb-2">
                                        <Briefcase className="h-5 w-5 text-primary" />
                                        <h3 className="font-semibold text-lg">Geral</h3>
                                    </div>
                                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <div className="flex items-center space-x-2 border p-3 rounded-lg bg-muted/20">
                                            <Checkbox id="tab_whatsapp" disabled checked />
                                            <Label htmlFor="tab_whatsapp" className="font-medium">Integração WhatsApp</Label>
                                        </div>
                                        <div className="flex items-center space-x-2 border p-3 rounded-lg bg-muted/20">
                                            <Checkbox id="tab_email_disparo" disabled checked />
                                            <Label htmlFor="tab_email_disparo" className="font-medium">E-mail de Disparo</Label>
                                        </div>
                                        <div className="flex items-center space-x-2 border p-3 rounded-lg bg-muted/20">
                                            <Checkbox id="tab_certificado" disabled checked />
                                            <Label htmlFor="tab_certificado" className="font-medium">Certificado Digital</Label>
                                        </div>
                                        <div className="flex items-center space-x-2 border p-3 rounded-lg bg-muted/20">
                                            <Checkbox id="tab_senha_certificado" disabled checked />
                                            <Label htmlFor="tab_senha_certificado" className="font-medium">Baixar e copiar senha do Certificado</Label>
                                        </div>
                                        <div className="flex items-center space-x-2 border p-3 rounded-lg bg-muted/20">
                                            <Checkbox id="tab_banco_acessos" disabled checked />
                                            <Label htmlFor="tab_banco_acessos" className="font-medium">Banco de acessos</Label>
                                        </div>
                                    </div>
                                </div>

                                {/* MonitorHub Group */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 border-b pb-2">
                                        <Shield className="h-5 w-5 text-primary" />
                                        <h3 className="font-semibold text-lg">MonitorHub</h3>
                                    </div>
                                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <div className="flex items-center space-x-2 border p-3 rounded-lg bg-muted/20">
                                            <Checkbox id="tab_pgdas" disabled checked />
                                            <Label htmlFor="tab_pgdas" className="font-medium">Acesso a aba PGDAS</Label>
                                        </div>
                                        <div className="flex items-center space-x-2 border p-3 rounded-lg bg-muted/20">
                                            <Checkbox id="tab_pgmei" disabled checked />
                                            <Label htmlFor="tab_pgmei" className="font-medium">Acesso a aba PGMEI</Label>
                                        </div>
                                        <div className="flex items-center space-x-2 border p-3 rounded-lg bg-muted/20">
                                            <Checkbox id="tab_dctfweb" disabled checked />
                                            <Label htmlFor="tab_dctfweb" className="font-medium">Acesso a aba DCTFWeb</Label>
                                        </div>
                                        <div className="flex items-center space-x-2 border p-3 rounded-lg bg-muted/20">
                                            <Checkbox id="tab_parcelamentos" disabled checked />
                                            <Label htmlFor="tab_parcelamentos" className="font-medium">Acesso a aba Parcelamentos</Label>
                                        </div>
                                        <div className="flex items-center space-x-2 border p-3 rounded-lg bg-muted/20">
                                            <Checkbox id="tab_situacao_fiscal" disabled checked />
                                            <Label htmlFor="tab_situacao_fiscal" className="font-medium">Acesso a aba Situação Fiscal</Label>
                                        </div>
                                        <div className="flex items-center space-x-2 border p-3 rounded-lg bg-muted/20">
                                            <Checkbox id="tab_caixas_postais" disabled checked />
                                            <Label htmlFor="tab_caixas_postais" className="font-medium">Acesso a aba Caixas Postais</Label>
                                        </div>
                                        <div className="flex items-center space-x-2 border p-3 rounded-lg bg-muted/20">
                                            <Checkbox id="tab_fgts_digital" disabled checked />
                                            <Label htmlFor="tab_fgts_digital" className="font-medium">Acesso a aba FGTS Digital</Label>
                                        </div>
                                        <div className="flex items-center space-x-2 border p-3 rounded-lg bg-muted/20">
                                            <Checkbox id="tab_atualizacao_fiscal" disabled checked />
                                            <Label htmlFor="tab_atualizacao_fiscal" className="font-medium">Atualização de processos fiscais</Label>
                                        </div>
                                    </div>
                                </div>

                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
                    <DialogContent className="sm:max-w-7xl w-full max-h-[95vh] overflow-y-auto bg-[#0f172a] border-[#1e293b] text-slate-200">
                        <DialogHeader className="mb-4">
                            <DialogTitle className="text-xl text-blue-500 font-bold">Criar usuário</DialogTitle>
                            <DialogDescription className="text-slate-400">
                                Adicione um novo membro à sua equipe e configure suas permissões.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleCreateUser} className="space-y-0 py-0">

                            <div className="grid grid-cols-12 gap-8">
                                {/* Left Column: Basic Info (5 cols) */}
                                <div className="col-span-12 lg:col-span-5 space-y-6">
                                    <h3 className="text-lg font-semibold text-white">Informações principais</h3>

                                    <div className="space-y-5">
                                        <div className="space-y-2">
                                            <Label htmlFor="name" className="text-slate-400 text-xs uppercase font-bold tracking-wider">Nome do usuário</Label>
                                            <Input id="name" placeholder="Seu Nome" className="bg-[#1e293b] border-slate-700 text-white placeholder:text-slate-500" />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="email" className="text-slate-400 text-xs uppercase font-bold tracking-wider">E-mail corporativo do usuário</Label>
                                            <Input id="email" type="email" placeholder="email@empresa.com.br" className="bg-[#1e293b] border-slate-700 text-white placeholder:text-slate-500" />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="phone" className="text-slate-400 text-xs uppercase font-bold tracking-wider">Telefone corporativo do usuário</Label>
                                            <Input id="phone" placeholder="(00) 00000-0000" className="bg-[#1e293b] border-slate-700 text-white placeholder:text-slate-500" />
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-slate-400 text-xs uppercase font-bold tracking-wider">Foto do usuário</Label>
                                            <div className="flex items-center gap-4 bg-[#1e293b] p-3 rounded-lg border border-slate-700">
                                                <div className="h-14 w-14 bg-slate-800 rounded flex items-center justify-center">
                                                    <Users className="h-6 w-6 text-slate-500" />
                                                </div>
                                                <div className="flex flex-col gap-2 w-full">
                                                    <Button
                                                        variant="default"
                                                        size="sm"
                                                        type="button"
                                                        className="bg-emerald-500 hover:bg-emerald-600 text-white w-full h-8"
                                                        onClick={() => toast.info("Upload de foto em desenvolvimento")}
                                                    >
                                                        <Edit2 className="h-3 w-3 mr-2" />
                                                        Alterar
                                                    </Button>
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        type="button"
                                                        className="bg-slate-700 hover:bg-slate-600 text-slate-200 w-full h-8"
                                                        onClick={() => toast.info("Remover foto em desenvolvimento")}
                                                    >
                                                        Remover
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2 pt-2">
                                            <Label className="text-slate-400 text-xs uppercase font-bold tracking-wider">Cargo</Label>
                                            <div className="bg-[#1e293b] p-1 rounded-lg grid grid-cols-3 gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => setRole("administrador")}
                                                    className={`text-xs font-semibold py-2 px-3 rounded-md transition-all ${role === "administrador"
                                                        ? "bg-slate-600 text-white shadow-sm"
                                                        : "text-slate-400 hover:text-white hover:bg-slate-700"
                                                        }`}
                                                >
                                                    Administrador
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setRole("gestor")}
                                                    className={`text-xs font-semibold py-2 px-3 rounded-md transition-all ${role === "gestor"
                                                        ? "bg-slate-600 text-white shadow-sm"
                                                        : "text-slate-400 hover:text-white hover:bg-slate-700"
                                                        }`}
                                                >
                                                    Gestor
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setRole("colaborador")}
                                                    className={`text-xs font-semibold py-2 px-3 rounded-md transition-all ${role === "colaborador"
                                                        ? "bg-slate-600 text-white shadow-sm"
                                                        : "text-slate-400 hover:text-white hover:bg-slate-700"
                                                        }`}
                                                >
                                                    Colaborador
                                                </button>
                                            </div>
                                            <p className="text-[10px] text-slate-500 mt-1">
                                                Administradores têm todas as permissões sistema.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Permissions (7 cols) */}
                                <div className="col-span-12 lg:col-span-7 space-y-6">
                                    <h3 className="text-lg font-semibold text-white">Permissões</h3>

                                    <div className="space-y-6">
                                        {/* Geral Group */}
                                        <div className="bg-[#1e293b]/50 rounded-lg overflow-hidden border border-[#334155]">
                                            <div className="bg-[#1e293b] px-4 py-2 border-b border-[#334155]">
                                                <h4 className="font-bold text-sm text-white">Geral</h4>
                                            </div>
                                            <div className="p-4 grid grid-cols-2 gap-4">
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox id="whatsapp" className="border-slate-500 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500" />
                                                    <Label htmlFor="whatsapp" className="text-sm text-slate-300 font-normal cursor-pointer">Integração WhatsApp</Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox id="email_disparo" className="border-slate-500 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500" />
                                                    <Label htmlFor="email_disparo" className="text-sm text-slate-300 font-normal cursor-pointer">E-mail de Disparo</Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox id="certificado" className="border-slate-500 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500" />
                                                    <Label htmlFor="certificado" className="text-sm text-slate-300 font-normal cursor-pointer">Certificado Digital</Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox id="senha_certificado" className="border-slate-500 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500" />
                                                    <Label htmlFor="senha_certificado" className="text-sm text-slate-300 font-normal cursor-pointer">Baixar e copiar senha</Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox id="banco_acessos" className="border-slate-500 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500" />
                                                    <Label htmlFor="banco_acessos" className="text-sm text-slate-300 font-normal cursor-pointer">Banco de acessos</Label>
                                                </div>
                                            </div>
                                        </div>

                                        {/* MonitorHub Group */}
                                        <div className="bg-[#1e293b]/50 rounded-lg overflow-hidden border border-[#334155]">
                                            <div className="bg-[#1e293b] px-4 py-2 border-b border-[#334155] flex items-center gap-2">
                                                <Shield className="h-4 w-4 text-emerald-500" />
                                                <h4 className="font-bold text-sm text-white">MonitorHub</h4>
                                            </div>
                                            <div className="p-4 grid grid-cols-2 gap-4">
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox id="pgdas" className="border-slate-500 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500" />
                                                    <Label htmlFor="pgdas" className="text-sm text-slate-300 font-normal cursor-pointer">Acesso a aba PGDAS</Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox id="pgmei" className="border-slate-500 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500" />
                                                    <Label htmlFor="pgmei" className="text-sm text-slate-300 font-normal cursor-pointer">Acesso a aba PGMEI</Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox id="dctfweb" className="border-slate-500 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500" />
                                                    <Label htmlFor="dctfweb" className="text-sm text-slate-300 font-normal cursor-pointer">Acesso a aba DCTFWeb</Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox id="parcelamentos" className="border-slate-500 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500" />
                                                    <Label htmlFor="parcelamentos" className="text-sm text-slate-300 font-normal cursor-pointer">Acesso a aba Parcelamentos</Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox id="situacao_fiscal" className="border-slate-500 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500" />
                                                    <Label htmlFor="situacao_fiscal" className="text-sm text-slate-300 font-normal cursor-pointer">Acesso a aba Situação Fiscal</Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox id="caixas_postais" className="border-slate-500 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500" />
                                                    <Label htmlFor="caixas_postais" className="text-sm text-slate-300 font-normal cursor-pointer">Acesso a aba Caixas Postais</Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox id="fgts_digital" className="border-slate-500 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500" />
                                                    <Label htmlFor="fgts_digital" className="text-sm text-slate-300 font-normal cursor-pointer">Acesso a aba FGTS Digital</Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox id="atualizacao_fiscal" className="border-slate-500 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500" />
                                                    <Label htmlFor="atualizacao_fiscal" className="text-sm text-slate-300 font-normal cursor-pointer">Atualização de processos</Label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <DialogFooter className="pt-6 mt-6 border-t border-[#334155] flex justify-end gap-3">
                                <Button variant="outline" type="button" onClick={() => setIsCreateUserOpen(false)} className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white">
                                    Cancelar
                                </Button>
                                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-6">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Adicionar Colaborador
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout >
    );
}
