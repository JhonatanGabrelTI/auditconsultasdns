import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Settings as SettingsIcon, Save, Sun, Moon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/contexts/ThemeContext";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function Configuracoes() {
  const { theme, toggleTheme } = useTheme();
  const { data: settings, isLoading } = trpc.settings.get.useQuery();
  const upsertSettings = trpc.settings.upsert.useMutation({
    onSuccess: () => {
      toast.success("Configurações salvas com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao salvar configurações: " + error.message);
    },
  });

  const [formData, setFormData] = useState({
    numeroDisparo: "",
    emailDisparo: "",
    certificadoDigitalId: undefined as number | undefined,
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        numeroDisparo: settings.numeroDisparo || "",
        emailDisparo: settings.emailDisparo || "",
        certificadoDigitalId: settings.certificadoDigitalId || undefined,
      });
    }
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    upsertSettings.mutate(formData);
  };

  return (
    <DashboardLayout>
      <div className="container py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
          <p className="text-muted-foreground mt-1">
            Configure as parametrizações do sistema
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Parametrizações</CardTitle>
            <CardDescription>
              Configure os parâmetros para automações e disparos
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Carregando configurações...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="numeroDisparo">Número de Disparo</Label>
                    <Input
                      id="numeroDisparo"
                      placeholder="(11) 99999-9999"
                      value={formData.numeroDisparo}
                      onChange={(e) => setFormData({ ...formData, numeroDisparo: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Número de WhatsApp para disparos automáticos
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emailDisparo">E-mail de Disparo</Label>
                    <Input
                      id="emailDisparo"
                      type="email"
                      placeholder="contato@escritorio.com.br"
                      value={formData.emailDisparo}
                      onChange={(e) => setFormData({ ...formData, emailDisparo: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      E-mail para envio de notificações automáticas
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="certificadoDigitalId">Certificado Digital para Automações</Label>
                    <Input
                      id="certificadoDigitalId"
                      type="number"
                      placeholder="ID do certificado"
                      value={formData.certificadoDigitalId || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          certificadoDigitalId: e.target.value ? parseInt(e.target.value) : undefined,
                        })
                      }
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      ID do certificado digital a ser usado nas automações
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="submit" disabled={upsertSettings.isPending}>
                    <Save className="h-4 w-4 mr-2" />
                    {upsertSettings.isPending ? "Salvando..." : "Salvar Configurações"}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aparência</CardTitle>
            <CardDescription>
              Personalize a aparência do sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Tema Escuro</Label>
                <p className="text-sm text-muted-foreground">
                  Ativar ou desativar o modo escuro
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Sun className="h-4 w-4 text-muted-foreground" />
                <Switch
                  checked={theme === "dark"}
                  onCheckedChange={toggleTheme}
                />
                <Moon className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informações do Sistema</CardTitle>
            <CardDescription>
              Detalhes sobre a aplicação MonitorHub
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm font-medium">Versão</span>
                <span className="text-sm text-muted-foreground">1.0.0</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm font-medium">Ambiente</span>
                <span className="text-sm text-muted-foreground">Produção</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm font-medium">Última Atualização</span>
                <span className="text-sm text-muted-foreground">
                  {new Date().toLocaleDateString("pt-BR")}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
