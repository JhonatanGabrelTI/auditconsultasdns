/**
 * Utilitário: BoletoPDFGenerator
 * Gera PDF de boleto no layout FEBRABAN 44 posições
 * 
 * Layout: Recibo do Pagador + Ficha de Compensação
 */

import { Boleto } from '../entities/Boleto';
import { ClientePagador } from '../entities/ClientePagador';
import { ConfiguracaoCobranca } from '../entities/ConfiguracaoCobranca';

export interface DadosBoletoPDF {
  boleto: Boleto;
  cliente: ClientePagador;
  configuracao: ConfiguracaoCobranca;
}

export class BoletoPDFGenerator {
  /**
   * Gera HTML do boleto para conversão em PDF
   * Layout padrão FEBRABAN
   */
  static gerarHTML(dados: DadosBoletoPDF): string {
    const { boleto, cliente, configuracao } = dados;
    
    const valorFormatado = boleto.valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });

    const vencimentoFormatado = new Date(boleto.dataVencimento).toLocaleDateString('pt-BR');
    const emissaoFormatada = new Date(boleto.dataEmissao).toLocaleDateString('pt-BR');

    // Formata CPF/CNPJ
    const docFormatado = cliente.cpfCnpj.length === 11
      ? cliente.cpfCnpj.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
      : cliente.cpfCnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');

    // Formata CEP
    const cepFormatado = cliente.endereco.cep.replace(/(\d{5})(\d{3})/, '$1-$2');

    // Código de barras em formato imagem (representação textual)
    const codigoBarras = boleto.codigoBarras || '';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Boleto ${boleto.nossoNumero}</title>
  <style>
    @page { size: A4; margin: 0; }
    body { 
      font-family: Arial, Helvetica, sans-serif; 
      font-size: 10px; 
      margin: 0;
      padding: 10px;
    }
    .boleto { width: 100%; max-width: 800px; margin: 0 auto; }
    
    /* Linha de corte */
    .linha-corte { 
      border-top: 1px dashed #000; 
      margin: 10px 0;
      text-align: right;
      font-size: 8px;
    }
    
    /* Tabelas */
    table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
    td, th { 
      border: 1px solid #000; 
      padding: 3px 5px;
      vertical-align: top;
    }
    th { background: #f0f0f0; font-weight: bold; text-align: left; }
    .sem-borda { border: none; }
    .borda-esquerda { border-left: 1px solid #000; }
    
    /* Campos específicos */
    .campo { display: block; font-size: 8px; color: #666; margin-bottom: 2px; }
    .valor { display: block; font-size: 10px; font-weight: bold; }
    .valor-grande { font-size: 14px; }
    
    /* Código de barras */
    .codigo-barras {
      height: 50px;
      background: repeating-linear-gradient(
        90deg,
        #000 0px,
        #000 2px,
        #fff 2px,
        #fff 4px
      );
      margin: 10px 0;
    }
    
    /* Linha digitável */
    .linha-digitavel {
      font-family: 'Courier New', monospace;
      font-size: 14px;
      font-weight: bold;
      text-align: center;
      letter-spacing: 2px;
      margin: 10px 0;
    }
    
    /* Logotipo placeholder */
    .logo-banco {
      width: 30px;
      height: 30px;
      background: #c00;
      color: white;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 12px;
      margin-right: 10px;
    }
    
    /* Recibo do pagador */
    .recibo { margin-bottom: 20px; }
    .recibo-titulo { font-size: 12px; font-weight: bold; margin-bottom: 10px; }
    
    /* Ficha de compensação */
    .ficha-compensacao { page-break-before: always; }
    
    /* Autenticação mecânica */
    .autenticacao {
      border: 1px solid #000;
      padding: 5px;
      margin-top: 10px;
      font-size: 8px;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="boleto">
    
    <!-- RECIBO DO PAGADOR -->
    <div class="recibo">
      <div class="recibo-titulo">RECIBO DO PAGADOR</div>
      
      <table>
        <tr>
          <td colspan="4">
            <span class="campo">Beneficiário</span>
            <span class="valor">${configuracao.nomeBeneficiario} - CNPJ: ${configuracao.cpfCnpjBeneficiario}</span>
          </td>
          <td>
            <span class="campo">Vencimento</span>
            <span class="valor valor-grande">${vencimentoFormatado}</span>
          </td>
        </tr>
        <tr>
          <td colspan="4">
            <span class="campo">Pagador</span>
            <span class="valor">${cliente.nome} - ${docFormatado}</span>
            <span style="font-size: 9px;">${cliente.endereco.logradouro}, ${cliente.endereco.numero} ${cliente.endereco.complemento || ''} - ${cliente.endereco.bairro} - ${cliente.endereco.cidade}/${cliente.endereco.uf} - CEP: ${cepFormatado}</span>
          </td>
          <td>
            <span class="campo">Valor Documento</span>
            <span class="valor valor-grande">${valorFormatado}</span>
          </td>
        </tr>
        <tr>
          <td>
            <span class="campo">Nosso Número</span>
            <span class="valor">${boleto.nossoNumero}</span>
          </td>
          <td>
            <span class="campo">Nº Documento</span>
            <span class="valor">${boleto.seuNumero}</span>
          </td>
          <td>
            <span class="campo">Data Processamento</span>
            <span class="valor">${emissaoFormatada}</span>
          </td>
          <td>
            <span class="campo">Carteira</span>
            <span class="valor">${configuracao.carteira}</span>
          </td>
          <td rowspan="2">
            <span class="campo">(=) Valor Cobrado</span>
            <span class="valor valor-grande">${valorFormatado}</span>
          </td>
        </tr>
      </table>
      
      <div style="font-size: 8px; margin-top: 5px;">
        Reconheço que li e concordo com as condições do documento.
        <br>Data: ____/____/______ Assinatura: _____________________________
      </div>
    </div>
    
    <div class="linha-corte">Corte na linha pontilhada</div>
    
    <!-- FICHA DE COMPENSAÇÃO -->
    <div class="ficha-compensacao">
      <table>
        <tr>
          <td width="40">
            <div class="logo-banco">237</div>
          </td>
          <td width="80">
            <span class="valor" style="font-size: 16px;">237-2</span>
          </td>
          <td colspan="5">
            <div class="linha-digitavel">${boleto.linhaDigitavel || '00000.00000 00000.000000 00000.000000 0 00000000000000'}</div>
          </td>
        </tr>
      </table>
      
      <table>
        <tr>
          <td colspan="7">
            <span class="campo">Local de pagamento</span>
            <span class="valor">Pagável preferencialmente na Rede Bradesco ou Bradesco Expresso</span>
          </td>
          <td>
            <span class="campo">Vencimento</span>
            <span class="valor valor-grande">${vencimentoFormatado}</span>
          </td>
        </tr>
        <tr>
          <td colspan="7">
            <span class="campo">Beneficiário</span>
            <span class="valor">${configuracao.nomeBeneficiario} - CNPJ: ${configuracao.cpfCnpjBeneficiario}</span>
            <span style="font-size: 8px;">Agência: ${configuracao.agencia} / Conta: ${configuracao.conta} - Carteira: ${configuracao.carteira}</span>
          </td>
          <td>
            <span class="campo">Agência/Código Beneficiário</span>
            <span class="valor">${configuracao.agencia}/${configuracao.conta}</span>
          </td>
        </tr>
        <tr>
          <td colspan="3">
            <span class="campo">Data do documento</span>
            <span class="valor">${emissaoFormatada}</span>
          </td>
          <td colspan="2">
            <span class="campo">Nº documento</span>
            <span class="valor">${boleto.seuNumero}</span>
          </td>
          <td>
            <span class="campo">Espécie doc</span>
            <span class="valor">${this.mapearEspecie(boleto.especieDocumento)}</span>
          </td>
          <td>
            <span class="campo">Aceite</span>
            <span class="valor">${boleto.aceite === 'A' ? 'Sim' : 'Não'}</span>
          </td>
          <td>
            <span class="campo">Data processamento</span>
            <span class="valor">${emissaoFormatada}</span>
          </td>
        </tr>
        <tr>
          <td colspan="3">
            <span class="campo">Nosso número</span>
            <span class="valor">${boleto.nossoNumero}</span>
          </td>
          <td>
            <span class="campo">Carteira</span>
            <span class="valor">${configuracao.carteira}</span>
          </td>
          <td>
            <span class="campo">Espécie</span>
            <span class="valor">R$</span>
          </td>
          <td>
            <span class="campo">Quantidade</span>
            <span class="valor"></span>
          </td>
          <td>
            <span class="campo">Valor</span>
            <span class="valor"></span>
          </td>
          <td>
            <span class="campo">(=) Valor documento</span>
            <span class="valor valor-grande">${valorFormatado}</span>
          </td>
        </tr>
        <tr>
          <td colspan="7" rowspan="6">
            <span class="campo">Instruções (Texto de responsabilidade do beneficiário)</span>
            <div style="font-size: 9px; margin-top: 5px;">
              ${(boleto.instrucoes || []).map(i => `<div>${i}</div>`).join('')}
              ${this.gerarInstrucoesPadrao(boleto, configuracao)}
            </div>
          </td>
          <td>
            <span class="campo">(-) Desconto / Abatimento</span>
            <span class="valor"></span>
          </td>
        </tr>
        <tr>
          <td>
            <span class="campo">(-) Outras deduções</span>
            <span class="valor"></span>
          </td>
        </tr>
        <tr>
          <td>
            <span class="campo">(+) Mora / Multa</span>
            <span class="valor"></span>
          </td>
        </tr>
        <tr>
          <td>
            <span class="campo">(+) Outros acréscimos</span>
            <span class="valor"></span>
          </td>
        </tr>
        <tr>
          <td>
            <span class="campo">(=) Valor cobrado</span>
            <span class="valor"></span>
          </td>
        </tr>
        <tr>
          <td>
            <span class="campo"></span>
            <span class="valor"></span>
          </td>
        </tr>
        <tr>
          <td colspan="8">
            <span class="campo">Pagador</span>
            <span class="valor">${cliente.nome} - ${docFormatado}</span>
            <span style="font-size: 9px;">${cliente.endereco.logradouro}, ${cliente.endereco.numero} ${cliente.endereco.complemento || ''} - ${cliente.endereco.bairro} - ${cliente.endereco.cidade}/${cliente.endereco.uf} - CEP: ${cepFormatado}</span>
            ${cliente.telefone ? `<span style="font-size: 8px;">Tel: ${cliente.telefone}</span>` : ''}
          </td>
        </tr>
        <tr>
          <td colspan="2">
            <span class="campo">Sacador/Avalista</span>
            <span class="valor"></span>
          </td>
          <td colspan="6">
            <span class="campo">Código de baixa</span>
            <span class="valor"></span>
          </td>
        </tr>
      </table>
      
      <!-- Código de Barras -->
      <div style="margin-top: 10px;">
        <div style="display: flex; align-items: center;">
          <div style="flex: 1;">
            <svg width="400" height="50" style="border: 1px solid #000;">
              <!-- Representação simplificada do código de barras -->
              <rect x="10" y="5" width="380" height="40" fill="none" stroke="#000" stroke-width="1"/>
              <text x="200" y="30" text-anchor="middle" font-family="monospace" font-size="12">${codigoBarras}</text>
            </svg>
          </div>
          <div style="width: 200px; padding-left: 10px; font-size: 8px;">
            Autenticação mecânica - Ficha de Compensação
          </div>
        </div>
      </div>
      
      <div class="autenticacao">
        SAC Bradesco: 0800 701 3924 | Ouvidoria: 0800 727 9933 | www.bradesco.com.br
      </div>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Gera instruções padrão do boleto
   */
  private static gerarInstrucoesPadrao(boleto: Boleto, config: ConfiguracaoCobranca): string {
    const instrucoes: string[] = [];
    
    // Juros
    if (config.percentualJurosDia > 0) {
      instrucoes.push(`APÓS VENCIMENTO COBRAR ${config.percentualJurosDia.toFixed(4)}% DE JUROS AO DIA`);
    }
    
    // Multa
    if (config.percentualMulta > 0) {
      instrucoes.push(`APÓS VENCIMENTO COBRAR MULTA DE ${config.percentualMulta.toFixed(2)}%`);
    }
    
    // Protesto
    if (boleto.protestoAutomatico && boleto.diasProtesto) {
      instrucoes.push(`PROTESTAR APÓS ${boleto.diasProtesto} DIAS DO VENCIMENTO`);
    }
    
    // Descontos
    if (config.desconto1) {
      const dataLimite = new Date(boleto.dataVencimento);
      dataLimite.setDate(dataLimite.getDate() - config.desconto1.dias);
      instrucoes.push(`DESCONTO DE ${config.desconto1.percentual}% ATÉ ${dataLimite.toLocaleDateString('pt-BR')}`);
    }
    
    return instrucoes.map(i => `<div>${i}</div>`).join('');
  }

  /**
   * Mapeia código de espécie para descrição
   */
  private static mapearEspecie(codigo: string): string {
    const mapa: Record<string, string> = {
      '02': 'DM',
      '04': 'DS',
      '07': 'LC',
      '12': 'NP',
      '17': 'NS',
      '19': 'RC',
      '26': 'CC',
      '31': 'CC', // Cartão de crédito
    };
    return mapa[codigo] || 'OU';
  }

  /**
   * Calcula linha digitável a partir do código de barras
   * Algoritmo FEBRABAN 44 posições
   */
  static calcularLinhaDigitavel(codigoBarras: string): string {
    if (codigoBarras.length !== 44) {
      throw new Error('Código de barras deve ter 44 posições');
    }

    // Identificação do produto (3 posições)
    const produto = codigoBarras.substring(0, 3);
    // Identificação do segmento (1 posição)
    const segmento = codigoBarras.substring(3, 4);
    // Fator de vencimento (4 posições)
    const fatorVencimento = codigoBarras.substring(19, 23);
    // Valor (10 posições)
    const valor = codigoBarras.substring(23, 33);
    // Identificação da empresa/órgão (8 posições)
    const identificacao = codigoBarras.substring(33, 44);

    // Campo 1: Produto + Segmento + Fator real ou dados + DV
    const campo1 = produto + segmento + fatorVencimento.substring(0, 3);
    const dv1 = this.calcularDVModulo10(campo1);

    // Campo 2: Restante do fator + parte do valor + DV
    const campo2 = fatorVencimento.substring(3) + valor.substring(0, 7);
    const dv2 = this.calcularDVModulo10(campo2);

    // Campo 3: Restante do valor + parte da identificação + DV
    const campo3 = valor.substring(7) + identificacao.substring(0, 7);
    const dv3 = this.calcularDVModulo10(campo3);

    // Campo 4: Dígito verificador geral (posição 4 do código de barras)
    const dvGeral = codigoBarras.substring(4, 5);

    // Campo 5: Fator de vencimento + Valor
    const campo5 = fatorVencimento + valor;

    // Formata com espaços
    return `${campo1}${dv1} ${campo2}${dv2} ${campo3}${dv3} ${dvGeral} ${campo5}`;
  }

  /**
   * Calcula dígito verificador Módulo 10
   */
  private static calcularDVModulo10(campo: string): number {
    let soma = 0;
    let multiplicador = 2;

    for (let i = campo.length - 1; i >= 0; i--) {
      let produto = parseInt(campo[i]) * multiplicador;
      
      if (produto > 9) {
        produto = Math.floor(produto / 10) + (produto % 10);
      }
      
      soma += produto;
      multiplicador = multiplicador === 2 ? 1 : 2;
    }

    const resto = soma % 10;
    return resto === 0 ? 0 : 10 - resto;
  }
}
