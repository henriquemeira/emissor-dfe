const express = require('express');
const router = express.Router();
const nfseSpController = require('../controllers/nfse-sp.controller');
const { authenticateApiKey } = require('../middleware/auth');

/**
 * Routes for São Paulo NFS-e operations (v01-1)
 * Base path: /api/v1/nfse/sp/sao-paulo
 */

/**
 * POST /envio-lote-rps
 * Sends a batch of RPS for NFS-e emission
 * 
 * Request body:
 * {
 *   "layoutVersion": "v01-1",
 *   "ambiente": "teste" | "producao",  // opcional, padrão: teste
 *   "lote": {
 *     "cabecalho": {
 *       "cpfCnpjRemetente": { "cnpj": "12345678901234" },
 *       "transacao": true,
 *       "dtInicio": "2024-01-01",
 *       "dtFim": "2024-01-31",
 *       "qtdRPS": 1,
 *       "valorTotalServicos": 1000.00,
 *       "valorTotalDeducoes": 0.00
 *     },
 *     "rps": [
 *       {
 *         "chaveRPS": {
 *           "inscricaoPrestador": 12345678,
 *           "serieRPS": "NF",
 *           "numeroRPS": 1
 *         },
 *         "tipoRPS": "RPS",
 *         "dataEmissao": "2024-01-15",
 *         "statusRPS": "N",
 *         "tributacaoRPS": "T",
 *         "valorServicos": 1000.00,
 *         "valorDeducoes": 0.00,
 *         "codigoServico": 1234,
 *         "aliquotaServicos": 0.05,
 *         "issRetido": false,
 *         "discriminacao": "Descrição dos serviços prestados",
 *         // ... outros campos opcionais
 *       }
 *     ]
 *   }
 * }
 */
router.post('/envio-lote-rps', authenticateApiKey, nfseSpController.enviarLoteRps);

/**
 * POST /teste-envio-lote-rps
 * Tests batch sending (validation only, doesn't generate NFS-e)
 * Same request body structure as /envio-lote-rps
 */
router.post('/teste-envio-lote-rps', authenticateApiKey, nfseSpController.testarEnvioLoteRps);

module.exports = router;
