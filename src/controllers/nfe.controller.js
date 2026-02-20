/**
 * NF-e Controller
 * Handles HTTP requests for NF-e emission, query, cancellation and inutilization.
 */

const nfeService = require('../services/nfe.service');

/**
 * POST /api/v1/nfe/emitir
 * Emits a NF-e: converts JSON to XML, signs and transmits to SEFAZ.
 *
 * Request body:
 * {
 *   "ambiente": "homologacao" | "producao",
 *   "idLote": 1,          // optional, default 1
 *   "indSinc": 1,         // optional, 0=async 1=sync (default 1)
 *   "includeSoap": false, // optional
 *   "endpointOverride": "", // optional custom SEFAZ URL
 *   "nfe": {
 *     "ide": { ... },
 *     "emit": { ... },
 *     "dest": { ... },
 *     "det": [ { "nItem": 1, "prod": { ... }, "imposto": { ... } } ],
 *     "total": { "ICMSTot": { ... } },
 *     "transp": { "modFrete": 9 },
 *     "pag": { "detPag": [ { "tPag": "01", "vPag": 100.00 } ] }
 *   }
 * }
 */
async function emitir(req, res, next) {
  try {
    const apiKey = req.apiKey;
    const { ambiente, nfe, idLote, indSinc, includeSoap, endpointOverride } = req.body;

    if (!ambiente) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_AMBIENTE', message: 'Campo ambiente é obrigatório (homologacao | producao)' },
      });
    }

    if (!nfe) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_NFE', message: 'Campo nfe é obrigatório' },
      });
    }

    const result = await nfeService.emitir(
      { ambiente, nfe, idLote, indSinc, includeSoap, endpointOverride },
      apiKey
    );

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/nfe/consultar
 * Queries a NF-e status by access key.
 *
 * Request body:
 * {
 *   "ambiente": "homologacao" | "producao",
 *   "chNFe": "44-digit access key",
 *   "cUF": 35,          // optional, derived from chNFe if omitted
 *   "includeSoap": false,
 *   "endpointOverride": ""
 * }
 */
async function consultar(req, res, next) {
  try {
    const apiKey = req.apiKey;
    const { ambiente, chNFe, cUF, includeSoap, endpointOverride } = req.body;

    if (!ambiente) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_AMBIENTE', message: 'Campo ambiente é obrigatório (homologacao | producao)' },
      });
    }

    if (!chNFe) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_CHNFE', message: 'Campo chNFe (chave de acesso) é obrigatório' },
      });
    }

    const result = await nfeService.consultar(
      { ambiente, chNFe, cUF, includeSoap, endpointOverride },
      apiKey
    );

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/nfe/cancelar
 * Cancels an authorized NF-e.
 *
 * Request body:
 * {
 *   "ambiente": "homologacao" | "producao",
 *   "chNFe": "44-digit access key",
 *   "nProt": "authorization protocol number",
 *   "xJust": "Cancellation justification (min 15 chars)",
 *   "CNPJ": "emitter CNPJ (digits only)",
 *   "dhEvento": "2024-01-15T10:00:00-03:00",  // optional, defaults to now
 *   "nSeqEvento": 1,   // optional, default 1
 *   "cUF": 35,         // optional, derived from chNFe if omitted
 *   "includeSoap": false,
 *   "endpointOverride": ""
 * }
 */
async function cancelar(req, res, next) {
  try {
    const apiKey = req.apiKey;
    const { ambiente, chNFe, nProt, xJust, CNPJ, dhEvento, nSeqEvento, cUF, idLote, includeSoap, endpointOverride } = req.body;

    if (!ambiente) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_AMBIENTE', message: 'Campo ambiente é obrigatório (homologacao | producao)' },
      });
    }

    if (!chNFe) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_CHNFE', message: 'Campo chNFe é obrigatório' },
      });
    }

    if (!nProt) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_NPROT', message: 'Campo nProt (protocolo de autorização) é obrigatório' },
      });
    }

    if (!xJust) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_XJUST', message: 'Campo xJust (justificativa) é obrigatório' },
      });
    }

    if (!CNPJ) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_CNPJ', message: 'Campo CNPJ do emitente é obrigatório' },
      });
    }

    const result = await nfeService.cancelar(
      { ambiente, chNFe, nProt, xJust, CNPJ, dhEvento, nSeqEvento, cUF, idLote, includeSoap, endpointOverride },
      apiKey
    );

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/nfe/inutilizar
 * Inutilizes a range of NF-e numbers.
 *
 * Request body:
 * {
 *   "ambiente": "homologacao" | "producao",
 *   "cUF": 35,
 *   "CNPJ": "emitter CNPJ (digits only)",
 *   "mod": 55,
 *   "serie": 1,
 *   "nNFIni": 100,
 *   "nNFFin": 110,
 *   "xJust": "Justification for inutilization (min 15 chars)",
 *   "includeSoap": false,
 *   "endpointOverride": ""
 * }
 */
async function inutilizar(req, res, next) {
  try {
    const apiKey = req.apiKey;
    const { ano, ambiente, cUF, CNPJ, mod, serie, nNFIni, nNFFin, xJust, includeSoap, endpointOverride } = req.body;

    if (!ambiente) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_AMBIENTE', message: 'Campo ambiente é obrigatório (homologacao | producao)' },
      });
    }

    if (!cUF) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_CUF', message: 'Campo cUF é obrigatório' },
      });
    }

    if (!CNPJ) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_CNPJ', message: 'Campo CNPJ é obrigatório' },
      });
    }

    if (!mod) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_MOD', message: 'Campo mod (modelo do documento) é obrigatório' },
      });
    }

    if (serie === undefined || serie === null) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_SERIE', message: 'Campo serie é obrigatório' },
      });
    }

    if (!nNFIni) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_NNFINI', message: 'Campo nNFIni (número inicial) é obrigatório' },
      });
    }

    if (!nNFFin) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_NNFFIN', message: 'Campo nNFFin (número final) é obrigatório' },
      });
    }

    if (!xJust) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_XJUST', message: 'Campo xJust (justificativa) é obrigatório' },
      });
    }

    const result = await nfeService.inutilizar(
      { ano, ambiente, cUF, CNPJ, mod, serie, nNFIni, nNFFin, xJust, includeSoap, endpointOverride },
      apiKey
    );

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  emitir,
  consultar,
  cancelar,
  inutilizar,
};
