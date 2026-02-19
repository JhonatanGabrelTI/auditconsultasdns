# Módulo de Cobrança - Bradesco API v1.7.1

Sistema completo de Gestão de Cobranças (Boletos) para integração com a API do Banco Bradesco.

## 🏗️ Arquitetura

```
modulo-cobranca/
├── src/
│   ├── config/           # Configurações (database, ambientes)
│   ├── controllers/      # Controllers REST
│   ├── entities/         # Entidades/Models
│   ├── jobs/            # Jobs agendados (cron)
│   ├── services/        # Regras de negócio + Integração Bradesco
│   ├── types/           # Tipos TypeScript
│   ├── utils/           # Utilitários (PDF, validações)
│   └── index.ts         # Ponto de entrada
├── tests/               # Testes unitários
└── package.json
```

## 📦 Instalação

```bash
cd modulo-cobranca
npm install
```

## 🔧 Configuração

### Variáveis de Ambiente

```env
# Database (será integrado ao Supabase)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cobranca
DB_USER=postgres
DB_PASSWORD=senha
DB_SSL=true

# Bradesco API
BRADESCO_CLIENT_ID=seu_client_id
BRADESCO_CLIENT_SECRET=seu_client_secret
BRADESCO_AMBIENTE=homologacao # ou producao
```

### Criar Tabelas no Banco

Execute o SQL em `src/config/database.ts` na função `SCHEMA_SQL`.

## 🚀 Uso

### Inicializar Módulo

```typescript
import { initModuloCobranca, BoletoService, BradescoIntegrationService } from './src';

initModuloCobranca();
```

### Emitir Boleto

```typescript
const boletoService = new BoletoService(config, boletoRepo, clienteRepo, historicoRepo);

const resultado = await boletoService.emitirBoleto({
  configuracaoId: 'uuid-config',
  clientePagadorId: 'uuid-cliente',
  seuNumero: 'DOC001',
  valor: 1500.00,
  dataVencimento: new Date('2024-12-31'),
  especieDocumento: '02', // DM - Duplicata Mercantil
}, 'usuario-id');

if (resultado.sucesso) {
  console.log('Boleto emitido:', resultado.boleto?.nossoNumero);
}
```

### Endpoints REST

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/boletos` | Emitir boleto |
| POST | `/boletos/lote` | Emitir lote |
| GET | `/boletos/:id` | Consultar boleto |
| GET | `/boletos` | Listar boletos |
| POST | `/boletos/:id/baixa` | Baixar boleto |
| POST | `/boletos/:id/protesto` | Protestar boleto |
| GET | `/boletos/:id/pdf` | Gerar PDF |
| POST | `/webhook/bradesco` | Webhook Bradesco |

### Jobs Agendados

| Job | Frequência | Descrição |
|-----|------------|-----------|
| `conciliacaoDiaria()` | 06:00 diário | Conciliação de liquidados |
| `notificarVencimentoProximo()` | 09:00 diário | Notificação D-3 |
| `alertarAtraso()` | 10:00 diário | Alerta D+1 |
| `avisoPreProtesto()` | 11:00 diário | Aviso D+2 |
| `protestoAutomatico()` | 14:00 diário | Protesto automático |

## 📋 Entidades

### ConfiguracaoCobranca
- Credenciais Bradesco (OAuth2)
- Dados da conta (agência, conta, carteira)
- Regras de negócio (juros, multa, descontos)
- Configurações de notificação

### ClientePagador
- Dados cadastrais (nome, CPF/CNPJ)
- Endereço completo (obrigatório Bradesco)
- Contato (telefone, email)

### Boleto
- Identificação (nosso_numero, seu_numero)
- Valores e datas
- Status e controle
- Payloads da API Bradesco

## 🔒 Segurança

- Tokens criptografados em repouso
- Logs de auditoria (LGPD)
- Validação de CPF/CNPJ
- Rate limiting na API Bradesco

## 📄 PDF do Boleto

Layout FEBRABAN completo:
- Recibo do Pagador
- Ficha de Compensação
- Código de barras
- Linha digitável

```typescript
const html = BoletoPDFGenerator.gerarHTML({ boleto, cliente, configuracao });
// Converter para PDF com Puppeteer ou similar
```

## 🔄 Status dos Boletos

| Código | Status | Descrição |
|--------|--------|-----------|
| 00 | Pendente | Aguardando registro |
| 01 | A vencer | Registrado, não vencido |
| 61 | Pago | Liquidado |
| 04 | Protesto solicitado | Em processo de protesto |
| 57 | Baixado | Baixado/cancelado |

## 🧪 Testes

```bash
npm test
npm run test:watch
```

## 📚 Documentação Bradesco

- API Cobrança v1.7.1
- Layout FEBRABAN 44 posições
- Códigos de erro CBTT

## 📝 Roadmap

- [ ] Integração com Supabase
- [ ] API WhatsApp Business
- [ ] Dashboard de métricas
- [ ] Importação CSV/Excel
- [ ] Split de pagamento

## 👨‍💻 Autor

Arquiteto de Software Sênior

## 📄 Licença

MIT
