/**
 * NF-e Access Key (Chave de Acesso) Service
 * Calculates the 44-digit NF-e access key according to SEFAZ specification
 *
 * Format: cUF(2) + AAAAMM(6) + CNPJ(14) + mod(2) + serie(3) + nNF(9) + tpEmis(1) + cNF(8) + cDV(1)
 */

/**
 * Calculates the mod-11 check digit for a 43-digit key string
 * @param {string} chave43 - 43-digit key string
 * @returns {number} Check digit (0-9)
 */
function calcularDigitoVerificador(chave43) {
  const digits = chave43.split('').reverse();
  const weights = [2, 3, 4, 5, 6, 7, 8, 9];

  let sum = 0;
  digits.forEach((digit, index) => {
    const weight = weights[index % weights.length];
    sum += parseInt(digit, 10) * weight;
  });

  const remainder = sum % 11;
  if (remainder < 2) return 0;
  return 11 - remainder;
}

/**
 * Calculates the NF-e access key (44 digits)
 *
 * @param {Object} params - NF-e identification data
 * @param {string|number} params.cUF - State code (2 digits, IBGE)
 * @param {string} params.dhEmi - Emission date/time (AAAA-MM-DDThh:mm:ssTZD)
 * @param {string} params.cnpj - Emitter CNPJ (14 digits, digits only)
 * @param {string|number} params.mod - Document model (55=NF-e, 65=NFC-e)
 * @param {string|number} params.serie - Series
 * @param {string|number} params.nNF - Document number
 * @param {string|number} params.tpEmis - Emission type (1=normal)
 * @param {string|number} [params.cNF] - Random 8-digit code (generated if omitted)
 * @returns {{ chaveAcesso: string, cNF: string, cDV: string }}
 */
function calcularChaveAcesso(params) {
  const { cUF, dhEmi, cnpj, mod, serie, nNF, tpEmis } = params;

  // Extract AAMM from emission datetime (e.g. "2024-01-15T10:00:00-03:00" -> "2401")
  // NF-e chave de acesso uses 2-digit year (YY) + 2-digit month (MM) = 4 chars total
  const aamm = dhEmi.substring(2, 4) + dhEmi.substring(5, 7);

  const cUFStr    = String(cUF).padStart(2, '0');
  const cnpjStr   = cnpj.replace(/\D/g, '').padStart(14, '0');
  const modStr    = String(mod).padStart(2, '0');
  const serieStr  = String(serie).padStart(3, '0');
  const nNFStr    = String(nNF).padStart(9, '0');
  const tpEmisStr = String(tpEmis).padStart(1, '0');

  // Generate or use provided cNF (random 8-digit numeric code)
  const cNFStr = params.cNF
    ? String(params.cNF).padStart(8, '0')
    : String(Math.floor(Math.random() * 99999999) + 1).padStart(8, '0');

  const chave43 = cUFStr + aamm + cnpjStr + modStr + serieStr + nNFStr + tpEmisStr + cNFStr;

  if (chave43.length !== 43) {
    throw new Error(`Chave base inválida: esperado 43 dígitos, obtido ${chave43.length}`);
  }

  const cDV = calcularDigitoVerificador(chave43);
  const chaveAcesso = chave43 + String(cDV);

  return {
    chaveAcesso,
    cNF: cNFStr,
    cDV: String(cDV),
  };
}

module.exports = {
  calcularChaveAcesso,
  calcularDigitoVerificador,
};
