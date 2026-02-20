/**
 * NF-e Routes
 * Base path: /api/v1/nfe
 * All routes require API key authentication.
 */
const express = require('express');
const router = express.Router();
const nfeController = require('../controllers/nfe.controller');
const { authenticateApiKey } = require('../middleware/auth');

/**
 * POST /emitir
 * Emits a NF-e (JSON → XML → sign → transmit to SEFAZ NFeAutorizacao4)
 *
 * Required body fields:
 *   ambiente  - "homologacao" | "producao"
 *   nfe       - Full NF-e data object (ide, emit, dest, det[], total, transp, pag)
 *
 * Optional body fields:
 *   idLote          - Batch identifier (default: 1)
 *   indSinc         - 0=async, 1=sync (default: 1)
 *   includeSoap     - Include raw SOAP request/response (default: false)
 *   endpointOverride - Custom SEFAZ webservice URL
 */
router.post('/emitir', authenticateApiKey, nfeController.emitir);

/**
 * POST /consultar
 * Queries a NF-e by its 44-digit access key (NfeConsultaProtocolo4)
 *
 * Required body fields:
 *   ambiente  - "homologacao" | "producao"
 *   chNFe     - 44-digit NF-e access key
 *
 * Optional body fields:
 *   cUF             - UF code (derived from chNFe if omitted)
 *   includeSoap     - Include raw SOAP (default: false)
 *   endpointOverride - Custom SEFAZ webservice URL
 */
router.post('/consultar', authenticateApiKey, nfeController.consultar);

/**
 * POST /cancelar
 * Cancels an authorized NF-e via cancellation event (NFeRecepcaoEvento4, tpEvento=110111)
 *
 * Required body fields:
 *   ambiente  - "homologacao" | "producao"
 *   chNFe     - 44-digit NF-e access key
 *   nProt     - Authorization protocol number
 *   xJust     - Cancellation justification (min 15 chars)
 *   CNPJ      - Emitter CNPJ (digits only)
 *
 * Optional body fields:
 *   dhEvento        - Event datetime (defaults to current UTC time)
 *   nSeqEvento      - Event sequence number (default: 1)
 *   cUF             - UF code (derived from chNFe if omitted)
 *   idLote          - Lot identifier (default: 1)
 *   includeSoap     - Include raw SOAP (default: false)
 *   endpointOverride - Custom SEFAZ webservice URL
 */
router.post('/cancelar', authenticateApiKey, nfeController.cancelar);

/**
 * POST /inutilizar
 * Inutilizes a range of NF-e numbers (NfeInutilizacao4)
 *
 * Required body fields:
 *   ambiente  - "homologacao" | "producao"
 *   cUF       - UF code
 *   CNPJ      - Emitter CNPJ (digits only)
 *   mod       - Document model (55=NF-e, 65=NFC-e)
 *   serie     - Series
 *   nNFIni    - Starting NF-e number
 *   nNFFin    - Ending NF-e number
 *   xJust     - Justification (min 15 chars)
 *   ano       - 4-digit year of the NF-e range (optional, defaults to current year)
 *
 * Optional body fields:
 *   includeSoap     - Include raw SOAP (default: false)
 *   endpointOverride - Custom SEFAZ webservice URL
 */
router.post('/inutilizar', authenticateApiKey, nfeController.inutilizar);

module.exports = router;
