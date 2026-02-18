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
 * Sends a batch of RPS for NFS-e emission (supports both synchronous and asynchronous modes)
 * 
 * Request body:
 * {
 *   "layoutVersion": "v01-1",
 *   "ambiente": "teste" | "producao",  // opcional, padrão: teste
 *   "metodo": "sincrono" | "assincrono",  // opcional, padrão: assincrono
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
 * 
 * Notes:
 * - metodo "sincrono": Transmite apenas 1 RPS por vez e retorna o resultado imediatamente
 * - metodo "assincrono": Transmite lote de RPS e retorna protocolo para consulta posterior
 * - Se metodo="sincrono", apenas 1 RPS é permitido no array
 */
router.post('/envio-lote-rps', authenticateApiKey, nfseSpController.enviarLoteRps);

/**
 * POST /teste-envio-lote-rps
 * Tests batch sending (validation only, doesn't generate NFS-e)
 * Same request body structure as /envio-lote-rps
 */
router.post('/teste-envio-lote-rps', authenticateApiKey, nfseSpController.testarEnvioLoteRps);

/**
 * POST /consulta-situacao-lote
 * Consults batch status using protocol number
 * 
 * Request body:
 * {
 *   "layoutVersion": "v01-1",
 *   "ambiente": "teste" | "producao",  // opcional, padrão: teste
 *   "cpfCnpjRemetente": {
 *     "cnpj": "12345678901234"  // ou "cpf": "12345678901"
 *   },
 *   "numeroProtocolo": "ce511ff737bb48a897309ad41e0642f3"
 * }
 */
router.post('/consulta-situacao-lote', authenticateApiKey, nfseSpController.consultarSituacaoLote);

module.exports = router;
