# Arquitetura do Módulo de Cobrança

## Visão Geral

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTE (FRONTEND)                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API REST (Express)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │   Boleto     │  │   Webhook    │  │   Configuracao       │   │
│  │  Controller  │  │  Controller  │  │   Controller         │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        SERVICES                                   │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐   │
│  │ BoletoService    │  │BradescoIntegration│  │Cobranca      │   │
│  │                  │  │    Service       │  │  Scheduler   │   │
│  └──────────────────┘  └──────────────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      REPOSITÓRIOS                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────┐   │
│  │ Boleto   │  │ Cliente  │  │ Historico│  │   Webhook      │   │
│  │  Repo    │  │  Repo    │  │   Repo   │  │    Repo        │   │
│  └──────────┘  └──────────┘  └──────────┘  └────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              BANCO DE DADOS (PostgreSQL / Supabase)              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │   boletos    │  │   clientes_  │  │   webhooks_          │   │
│  │              │  │  pagadores   │  │   recebidos          │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │ configuracoes│  │   historico_ │  │   lotes_             │   │
│  │  _cobranca   │  │   status     │  │   processamento      │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              API BRADESCO (Integração Externa)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │   Registro   │  │   Consulta   │  │      Baixa           │   │
│  │    POST      │  │    POST      │  │     POST             │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │   Protesto   │  │   Alteração  │  │      Split           │   │
│  │    POST      │  │     PUT      │  │     POST             │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Fluxos de Trabalho

### 1. Emissão de Boleto (Individual)

```
┌─────────┐    ┌─────────────┐    ┌──────────────┐    ┌──────────────┐
│ Cliente │───▶│   POST      │───▶│   Boleto     │───▶│   Validar    │
│         │    │  /boletos   │    │  Controller  │    │    Dados     │
└─────────┘    └─────────────┘    └──────────────┘    └──────────────┘
                                                               │
                                                               ▼
┌─────────┐    ┌─────────────┐    ┌──────────────┐    ┌──────────────┐
│   OK    │◀───│   Salvar    │◀───│   Resposta   │◀───│  Chamar API  │
│  200    │    │    no BD    │    │   Bradesco   │    │   Bradesco   │
└─────────┘    └─────────────┘    └──────────────┘    └──────────────┘
```

### 2. Conciliação Diária (Job)

```
┌──────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Cron    │───▶│    Job       │───▶│   Consultar  │───▶│   Atualizar  │
│  06:00   │    │   Scheduler  │    │   Liquidados │    │   Status BD  │
└──────────┘    └──────────────┘    └──────────────┘    └──────────────┘
                                                               │
                                                               ▼
┌──────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Fim    │◀───│   Próxima    │◀───│   Mais Págs? │◀───│   Notificar  │
│          │    │   Página     │    │   (paginação)│    │   Clientes   │
└──────────┘    └──────────────┘    └──────────────┘    └──────────────┘
```

### 3. Recebimento Webhook

```
┌──────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Bradesco │───▶│   POST       │───▶│   Salvar     │───▶│   Processar  │
│          │    │  /webhook    │    │   Log        │    │   Assíncrono │
└──────────┘    └──────────────┘    └──────────────┘    └──────────────┘
              Retorna 200 OK                                    │
                                                                ▼
                                        ┌──────────────┐    ┌──────────────┐
                                        │   Notificar  │◀───│   Atualizar  │
                                        │   Cliente    │    │   Status     │
                                        └──────────────┘    └──────────────┘
```

## Camadas da Arquitetura

### 1. Controllers
Responsabilidade:
- Receber requisições HTTP
- Validar entrada (DTOs)
- Chamar services
- Retornar respostas HTTP

### 2. Services
Responsabilidade:
- Regras de negócio
- Orquestração de operações
- Integração com APIs externas
- Transações

### 3. Repositories
Responsabilidade:
- Acesso ao banco de dados
- Queries
- Abstração da persistência

### 4. Entities
Responsabilidade:
- Definição dos modelos de dados
- Tipos TypeScript
- Validações

## Segurança

```
┌────────────────────────────────────────────────────────────────┐
│                     CAMADAS DE SEGURANÇA                        │
├────────────────────────────────────────────────────────────────┤
│ 1. HTTPS/TLS (transporte)                                       │
│ 2. Autenticação OAuth2 (Bradesco)                              │
│ 3. Criptografia de tokens em repouso                           │
│ 4. Validação de CPF/CNPJ                                       │
│ 5. Rate Limiting (API Bradesco)                                │
│ 6. Logs de auditoria (LGPD)                                    │
└────────────────────────────────────────────────────────────────┘
```

## Jobs Agendados

| Horário | Job | Descrição |
|---------|-----|-----------|
| 06:00 | conciliacaoDiaria | Atualiza status de pagos |
| 09:00 | notificarVencimentoProximo | Alerta D-3 |
| 10:00 | alertarAtraso | Alerta D+1 com juros |
| 11:00 | avisoPreProtesto | Último aviso D+2 |
| 14:00 | protestoAutomatico | Protesta vencidos 3+ dias |

## Estrutura de Pastas

```
modulo-cobranca/
├── src/
│   ├── config/          # Configurações
│   ├── controllers/     # Controllers REST
│   ├── entities/        # Entidades (6 arquivos)
│   ├── jobs/           # Jobs agendados
│   ├── services/       # Regras de negócio
│   ├── types/          # Tipos TypeScript
│   ├── utils/          # Utilitários
│   └── index.ts        # Exportações
├── examples/           # Exemplos de uso
├── tests/             # Testes unitários
└── README.md          # Documentação
```
