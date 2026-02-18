/**
 * NFS-e Routes - São Paulo Municipality
 * Phase 2 - EnvioLoteRPSAsync (v01-1)
 */
const express = require('express');
const { authenticateApiKey } = require('../middleware/auth');
const nfseController = require('../controllers/nfse.controller');

const router = express.Router();

/**
 * POST /api/v1/nfse/emitir
 * Emitir lote de RPS (assíncrono)
 * 
 * Request body:
 * {
 *   "versao": "v01-1",
 *   "cabecalho": {
 *     "transacao": true,
 *     "dtInicio": "2024-01-01",
 *     "dtFim": "2024-01-31"
 *   },
 *   "rps": [
 *     {
 *       "chaveRps": {
 *         "inscricaoPrestador": "12345678",
 *         "serieRps": "A",
 *         "numeroRps": "1"
 *       },
 *       "dataEmissao": "2024-01-15",
 *       "tributacaoRps": "T",
 *       "valorServicos": "1000.00",
 *       "codigoServico": "1234",
 *       "aliquotaServicos": "0.05",
 *       "issRetido": false,
 *       "discriminacao": "Serviços de consultoria",
 *       ...
 *     }
 *   ]
 * }
 */
router.post('/emitir', authenticateApiKey, nfseController.emitir);

/**
 * POST /api/v1/nfse/teste
 * Test RPS batch (validation only - does not emit)
 */
router.post('/teste', authenticateApiKey, nfseController.teste);

module.exports = router;
