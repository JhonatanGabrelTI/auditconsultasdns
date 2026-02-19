# 🚀 Quick Start - Módulo de Cobrança

Guia rápido para rodar o módulo de cobrança em localhost.

## ⚠️ IMPORTANTE

Este módulo roda em **PORTA DIFERENTE** do sistema principal:
- Sistema principal: `http://localhost:3000`
- Módulo de cobrança: `http://localhost:3001`

## 📦 Instalação

### 1. Instalar dependências

```bash
cd modulo-cobranca
npm install
```

### 2. Configurar ambiente

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais.

### 3. Iniciar servidor

```bash
# Modo desenvolvimento (com reload automático)
npm run dev

# Ou modo produção
npm run build
npm start
```

### 4. Acessar

Abra no navegador: **http://localhost:3001**

## ✅ Testar Endpoints

### Health Check
```bash
curl http://localhost:3001/health
```

### Emitir Boleto (Mock)
```bash
curl -X POST http://localhost:3001/boletos \
  -H "Content-Type: application/json" \
  -d '{
    "configuracaoId": "uuid-config",
    "clientePagadorId": "uuid-cliente",
    "seuNumero": "DOC001",
    "valor": 1500.00,
    "dataVencimento": "2024-12-31",
    "especieDocumento": "02"
  }'
```

### Listar Boletos
```bash
curl http://localhost:3001/boletos
```

### Consultar Boleto
```bash
curl http://localhost:3001/boletos/uuid-do-boleto
```

## 🔧 Integração com Supabase

### 1. Criar tabelas

Execute o SQL em `src/config/database.ts` no seu Supabase.

### 2. Atualizar `.env`

```env
DB_HOST=aws-0-sa-east-1.pooler.supabase.com
DB_PORT=6543
DB_NAME=postgres
DB_USER=postgres.prcglfqhoqcjqveobsit
DB_PASSWORD=sua_senha
DB_SSL=true
```

## 🏗️ Estrutura de Arquivos

```
modulo-cobranca/
├── server.ts          # Servidor Express (porta 3001)
├── src/              # Código fonte
├── package.json
├── .env              # Configurações
└── README.md
```

## 🐛 Debug

### Ver logs
```bash
npm run dev
```

### Porta ocupada?
```bash
# Ver processos na porta 3001
lsof -i :3001

# Matar processo
kill -9 <PID>
```

## 📚 Próximos Passos

1. Implementar repositories reais (conexão com banco)
2. Configurar credenciais Bradesco
3. Testar integração com API Bradesco
4. Criar frontend para o módulo

## 💡 Dicas

- O servidor usa **ts-node** para não precisar compilar
- Em produção, use `npm run build` + `npm start`
- O CORS está habilitado para permitir chamadas do frontend
