# 🚀 Como Iniciar o Módulo de Cobrança

## Opção 1: Script Automático (Recomendado)

Clique duplo no arquivo **`iniciar.bat`**

Ou execute no PowerShell:
```powershell
cd "c:\Users\flavi\Downloads\Downloads\IAudit01\Iauditconsultoria\modulo-cobranca"
.\iniciar.bat
```

## Opção 2: Comandos Manuais

### 1. Entrar na pasta
```powershell
cd "c:\Users\flavi\Downloads\Downloads\IAudit01\Iauditconsultoria\modulo-cobranca"
```

### 2. Instalar dependências (primeira vez)
```powershell
npm install express
npm install -D typescript ts-node @types/express @types/node
```

### 3. Iniciar servidor
```powershell
npx ts-node server-simples.ts
```

## 🌐 Acessar

Após iniciar, acesse no navegador:

**http://localhost:3001**

## ✅ Verificar se está funcionando

Abra o navegador e digite:
```
http://localhost:3001/health
```

Deve aparecer:
```json
{
  "status": "OK",
  "modulo": "Cobrança Bradesco",
  "versao": "1.0.0"
}
```

## 🐛 Problemas?

### "Cannot find module 'express'"
Execute:
```powershell
npm install express
```

### "Cannot find module 'typescript'"
Execute:
```powershell
npm install -D typescript ts-node
```

### Porta 3001 ocupada
Mude a porta no arquivo `server-simples.ts`:
```typescript
const PORT = 3002; // ou outra porta
```

### Página não abre
Verifique se o servidor está rodando:
1. Olhe o terminal - deve mostrar "MÓDULO DE COBRANÇA"
2. Tente acessar: http://127.0.0.1:3001 (em vez de localhost)
3. Verifique se não há erro no terminal

## 📁 Estrutura

```
modulo-cobranca/
├── server-simples.ts    ← Servidor (use este!)
├── public/
│   └── index.html       ← Página web
├── iniciar.bat          ← Script automático
└── package.json
```

## 🛑 Parar

No terminal, pressione `Ctrl + C`
