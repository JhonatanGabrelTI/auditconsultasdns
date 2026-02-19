/**
 * Entidade: ClientePagador (Sacado)
 * Dados do pagador do boleto
 */
export interface ClientePagador {
  id: string;
  
  // Dados cadastrais
  nome: string;
  cpfCnpj: string; // Sem máscara
  tipoPessoa: 'F' | 'J'; // F=Física, J=Jurídica
  
  // Endereço completo (obrigatório Bradesco)
  endereco: {
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    uf: string; // 2 caracteres
    cep: string; // 8 dígitos sem traço
  };
  
  // Contato
  telefone?: string;
  email?: string;
  
  // Campos adicionais
  codigoCliente?: string; // Código interno do cliente
  
  // Auditoria
  createdAt: Date;
  updatedAt: Date;
}
