# Integração APIs InfoSimples - TODO

## Configuração
- [x] Adicionar token InfoSimples como variável de ambiente segura
- [x] Criar serviço base de integração com InfoSimples

## Implementação das APIs
- [x] Implementar consulta CND Federal (PGFN)
- [x] Implementar consulta CND Estadual PR (SEFAZ)
- [x] Implementar consulta Regularidade FGTS (Caixa)

## Backend
- [x] Criar endpoints tRPC para cada tipo de consulta
- [x] Implementar sistema de cache para evitar consultas duplicadas
- [x] Adicionar logs de consultas realizadas
- [x] Salvar resultados no banco de dados

## Frontend
- [x] Adicionar botões de consulta na página de Clientes
- [x] Criar modal para exibir resultados das consultas
- [x] Mostrar status de regularidade (positivo/negativo)
- [x] Adicionar indicadores visuais de status

## Testes
- [x] Testar consulta CND Federal
- [x] Testar consulta CND Estadual
- [x] Testar consulta FGTS
- [x] Validar tratamento de erros

## Finalização
- [ ] Criar checkpoint com integração completa


## Correções de Parâmetros das APIs
- [x] Corrigir URL e parâmetros da API FGTS (Caixa)
- [x] Corrigir URL e parâmetros da API CND Federal (PGFN)
- [x] Corrigir URL e parâmetros da API CND Estadual (SEFAZ PR)
- [x] Adicionar suporte para CPF na consulta PGFN
- [x] Adicionar campo de data de nascimento para CPF
- [ ] Testar correções com dados reais
