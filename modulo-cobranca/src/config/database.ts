/**
 * Configuração: Database
 * Configuração de conexão com o banco de dados
 * 
 * Este arquivo será integrado ao Supabase posteriormente
 */

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean;
}

export const databaseConfig: DatabaseConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'cobranca',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  ssl: process.env.DB_SSL === 'true',
};

// SQL para criação das tabelas (será executado na integração com Supabase)
export const SCHEMA_SQL = `
-- Tabela: configuracoes_cobranca
CREATE TABLE IF NOT EXISTS configuracoes_cobranca (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cpf_cnpj_beneficiario VARCHAR(14) NOT NULL,
  nome_beneficiario VARCHAR(255) NOT NULL,
  agencia VARCHAR(4) NOT NULL,
  conta VARCHAR(7) NOT NULL,
  carteira VARCHAR(2) NOT NULL,
  negociacao VARCHAR(10) NOT NULL,
  client_id VARCHAR(255) NOT NULL,
  client_secret TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP,
  prazo_protesto_dias INTEGER DEFAULT 3,
  percentual_juros_dia DECIMAL(10,4) DEFAULT 0.0333,
  percentual_multa DECIMAL(10,2) DEFAULT 2.00,
  desconto1_dias INTEGER,
  desconto1_percentual DECIMAL(10,2),
  desconto2_dias INTEGER,
  desconto2_percentual DECIMAL(10,2),
  desconto3_dias INTEGER,
  desconto3_percentual DECIMAL(10,2),
  email_remetente VARCHAR(255),
  smtp_config JSONB,
  whatsapp_api_key VARCHAR(255),
  ativo BOOLEAN DEFAULT true,
  ambiente VARCHAR(20) DEFAULT 'homologacao',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  criado_por UUID NOT NULL
);

-- Tabela: clientes_pagadores
CREATE TABLE IF NOT EXISTS clientes_pagadores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  cpf_cnpj VARCHAR(14) NOT NULL UNIQUE,
  tipo_pessoa CHAR(1) NOT NULL CHECK (tipo_pessoa IN ('F', 'J')),
  endereco_logradouro VARCHAR(255) NOT NULL,
  endereco_numero VARCHAR(20) NOT NULL,
  endereco_complemento VARCHAR(50),
  endereco_bairro VARCHAR(100) NOT NULL,
  endereco_cidade VARCHAR(100) NOT NULL,
  endereco_uf CHAR(2) NOT NULL,
  endereco_cep VARCHAR(8) NOT NULL,
  telefone VARCHAR(20),
  email VARCHAR(255),
  codigo_cliente VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela: boletos
CREATE TABLE IF NOT EXISTS boletos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  configuracao_id UUID NOT NULL REFERENCES configuracoes_cobranca(id),
  cliente_pagador_id UUID NOT NULL REFERENCES clientes_pagadores(id),
  nosso_numero VARCHAR(11),
  seu_numero VARCHAR(25) NOT NULL,
  valor DECIMAL(15,2) NOT NULL,
  valor_abatimento DECIMAL(15,2) DEFAULT 0,
  valor_juros DECIMAL(15,2) DEFAULT 0,
  valor_multa DECIMAL(15,2) DEFAULT 0,
  valor_desconto DECIMAL(15,2) DEFAULT 0,
  valor_pago DECIMAL(15,2),
  data_emissao DATE NOT NULL,
  data_vencimento DATE NOT NULL,
  data_limite_desconto1 DATE,
  data_limite_desconto2 DATE,
  data_limite_desconto3 DATE,
  data_pagamento DATE,
  especie_documento VARCHAR(2) NOT NULL,
  aceite CHAR(1) NOT NULL DEFAULT 'N',
  instrucoes TEXT[],
  mensagens TEXT[],
  tipo_juros CHAR(1) DEFAULT '2',
  percentual_juros DECIMAL(10,4),
  tipo_multa CHAR(1) DEFAULT '2',
  percentual_multa DECIMAL(10,2),
  tipo_desconto CHAR(1) DEFAULT '0',
  protesto_automatico BOOLEAN DEFAULT false,
  dias_protesto INTEGER,
  baixa_devolucao_automatica BOOLEAN DEFAULT true,
  dias_baixa_devolucao INTEGER DEFAULT 30,
  payload_registro JSONB,
  payload_consulta JSONB,
  linha_digitavel VARCHAR(54),
  codigo_barras VARCHAR(44),
  url_pdf TEXT,
  status VARCHAR(2) DEFAULT '00',
  situacao_pagamento VARCHAR(2),
  registrado BOOLEAN DEFAULT false,
  notificado_vencimento BOOLEAN DEFAULT false,
  notificado_atraso BOOLEAN DEFAULT false,
  protesto_solicitado BOOLEAN DEFAULT false,
  baixado BOOLEAN DEFAULT false,
  permite_pagamento_parcial BOOLEAN DEFAULT false,
  quantidade_pagamentos_parciais INTEGER,
  split_credito JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  emitido_por UUID NOT NULL
);

-- Tabela: lotes_processamento
CREATE TABLE IF NOT EXISTS lotes_processamento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  configuracao_id UUID NOT NULL REFERENCES configuracoes_cobranca(id),
  nome VARCHAR(255) NOT NULL,
  status VARCHAR(30) DEFAULT 'pendente',
  total_registros INTEGER DEFAULT 0,
  processados INTEGER DEFAULT 0,
  sucessos INTEGER DEFAULT 0,
  erros INTEGER DEFAULT 0,
  detalhes_erros JSONB DEFAULT '[]',
  iniciado_em TIMESTAMP,
  concluido_em TIMESTAMP,
  delay_entre_chamadas_ms INTEGER DEFAULT 1000,
  nome_arquivo VARCHAR(255),
  tipo_arquivo VARCHAR(10),
  boletos_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  criado_por UUID NOT NULL
);

-- Tabela: webhooks_recebidos
CREATE TABLE IF NOT EXISTS webhooks_recebidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_evento VARCHAR(50) NOT NULL,
  nosso_numero VARCHAR(11),
  seu_numero VARCHAR(25),
  payload JSONB NOT NULL,
  valor_pago DECIMAL(15,2),
  data_pagamento DATE,
  data_credito DATE,
  processado BOOLEAN DEFAULT false,
  processado_em TIMESTAMP,
  erro_processamento TEXT,
  http_status_retornado INTEGER,
  ip_origem VARCHAR(45),
  headers JSONB,
  recebido_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela: historico_status
CREATE TABLE IF NOT EXISTS historico_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boleto_id UUID NOT NULL REFERENCES boletos(id) ON DELETE CASCADE,
  status_anterior VARCHAR(2),
  status_novo VARCHAR(2) NOT NULL,
  tipo_alteracao VARCHAR(50) NOT NULL,
  dados_adicionais JSONB,
  valor_anterior DECIMAL(15,2),
  valor_novo DECIMAL(15,2),
  origem VARCHAR(20) NOT NULL,
  alterado_por UUID,
  ip_origem VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_boletos_nosso_numero ON boletos(nosso_numero);
CREATE INDEX IF NOT EXISTS idx_boletos_status ON boletos(status);
CREATE INDEX IF NOT EXISTS idx_boletos_vencimento ON boletos(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_webhooks_processado ON webhooks_recebidos(processado);
CREATE INDEX IF NOT EXISTS idx_historico_boleto ON historico_status(boleto_id);
`;
