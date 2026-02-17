/**
 * Utilitários para manipulação de datas e timestamps
 * 
 * IMPORTANTE: Esta aplicação armazena TODOS os timestamps em UTC (ISO 8601).
 * As funções neste arquivo servem apenas para formatação e conversão quando necessário,
 * mas NUNCA devem ser usadas para armazenar dados.
 * 
 * Ver docs/TIMESTAMP-BEST-PRACTICES.md para mais informações.
 */

/**
 * Formata uma data em horário de Brasília (America/Sao_Paulo)
 * Útil para logs e mensagens de debug (não para armazenamento)
 * 
 * @param {Date|string} date - Data a ser formatada (Date object ou ISO string)
 * @returns {string} Data formatada em pt-BR
 * 
 * @example
 * formatarHorarioBrasilia(new Date())
 * // => "17/02/2026, 11:30:00"
 */
function formatarHorarioBrasilia(date = new Date()) {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Formata uma data em formato curto para Brasil
 * 
 * @param {Date|string} date - Data a ser formatada
 * @returns {string} Data no formato DD/MM/YYYY
 * 
 * @example
 * formatarDataCurta('2026-02-17T10:00:00.000Z')
 * // => "17/02/2026"
 */
function formatarDataCurta(date) {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Converte data para UTC ISO string (USAR SEMPRE para armazenamento)
 * 
 * @param {Date} date - Data a ser convertida
 * @returns {string} ISO 8601 string em UTC
 * 
 * @example
 * paraISO(new Date())
 * // => "2026-02-17T14:30:00.000Z"
 */
function paraISO(date = new Date()) {
  return date.toISOString();
}

/**
 * Retorna o offset atual do timezone de Brasília em relação a UTC
 * 
 * @returns {string} Offset no formato "+HH:MM" ou "-HH:MM"
 * 
 * @example
 * getOffsetBrasilia()
 * // => "-03:00" (horário padrão) ou "-02:00" (horário de verão - histórico)
 */
function getOffsetBrasilia() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    timeZoneName: 'shortOffset',
  });
  
  const parts = formatter.formatToParts(now);
  const offsetPart = parts.find(part => part.type === 'timeZoneName');
  
  return offsetPart ? offsetPart.value : 'UTC-3';
}

/**
 * Valida se uma string é um timestamp ISO 8601 válido
 * 
 * @param {string} isoString - String a ser validada
 * @returns {boolean} true se válido, false caso contrário
 * 
 * @example
 * isValidISO('2026-02-17T14:30:00.000Z')
 * // => true
 * 
 * isValidISO('17/02/2026')
 * // => false
 */
function isValidISO(isoString) {
  if (typeof isoString !== 'string') return false;
  
  try {
    const date = new Date(isoString);
    // Check if date is valid and the ISO string matches
    return !isNaN(date.getTime()) && date.toISOString() === isoString;
  } catch {
    return false;
  }
}

module.exports = {
  formatarHorarioBrasilia,
  formatarDataCurta,
  paraISO,
  getOffsetBrasilia,
  isValidISO,
};
