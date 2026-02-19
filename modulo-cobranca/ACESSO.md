# 🌐 Como Acessar o Módulo

## Endereço Local

O módulo de cobrança roda em **porta diferente** do sistema principal:

| Sistema | URL | Porta |
|---------|-----|-------|
| Sistema Principal | http://localhost:3000 | 3000 |
| **Módulo Cobrança** | **http://localhost:3001** | **3001** |

## 🚀 Iniciar o Servidor

### 1. Instalar dependências (primeira vez)

```bash
cd modulo-cobranca
npm install
```

### 2. Iniciar em modo desenvolvimento

```bash
npm run dev
```

### 3. Acessar no navegador

Abra: **http://localhost:3001**

Você verá uma página HTML com:
- Status do sistema
- Lista de endpoints
- Botão para testar a API

## 📡 Endpoints API

### Health Check
```bash
curl http://localhost:3001/health
```

### Emitir Boleto
```bash
curl -X POST http://localhost:3001/boletos \
  -H "Content-Type: application/json" \
  -d '{
    "seuNumero": "DOC001",
    "valor": 1500.00,
    "dataVencimento": "2024-12-31"
  }'
```

### Listar Boletos
```bash
curl http://localhost:3001/boletos
```

## 🔄 Rodando os Dois Sistemas

Você pode rodar os dois sistemas **simultaneamente**:

### Terminal 1 - Sistema Principal
```bash
cd c:\Users\flavi\Downloads\Downloads\IAudit01\Iauditconsultoria
npm run dev
# http://localhost:3000
```

### Terminal 2 - Módulo Cobrança
```bash
cd c:\Users\flavi\Downloads\Downloads\IAudit01\Iauditconsultoria\modulo-cobranca
npm run dev
# http://localhost:3001
```

## 🛑 Parar o Servidor

Pressione `Ctrl + C` no terminal onde o servidor está rodando.

## 🐛 Problemas Comuns

### "Porta 3001 já em uso"

```bash
# Ver o que está usando a porta
netstat -ano | findstr :3001

# Matar o processo (substitua <PID> pelo número do processo)
taskkill /PID <PID> /F
```

### "Erro: Cannot find module"

```bash
# Reinstalar dependências
npm install
```

### "TypeScript errors"

```bash
# Verificar erros de tipo
npm run typecheck
```

## 📁 Arquivos Importantes

| Arquivo | Descrição |
|---------|-----------|
| `server.ts` | Servidor Express (entry point) |
| `public/index.html` | Interface web para testes |
| `src/services/BradescoIntegrationService.ts` | Integração com API Bradesco |
| `.env` | Configurações (criar do .env.example) |

## ✅ Próximos Passos

1. ✅ Servidor rodando em http://localhost:3001
2. ⬜ Configurar credenciais Bradesco no `.env`
3. ⬜ Criar tabelas no banco (SQL em `src/config/database.ts`)
4. ⬜ Implementar repositories reais
5. ⬜ Testar integração com API Bradesco

## 💡 Dica

A interface web em `public/index.html` é só para testes. Em produção, você pode:
- Criar um frontend React/Vue separado
- Integrar este módulo ao sistema principal via API
- Usar apenas os endpoints REST

## 📞 Suporte

Em caso de problemas, verifique:
1. Se a porta 3001 está livre
2. Se todas dependências estão instaladas (`npm install`)
3. Se o arquivo `.env` existe
4. Logs do terminal para erros
