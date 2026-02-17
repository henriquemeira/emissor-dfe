const { generateApiKey } = require('../utils/apiKey');
const { validateCertificateFile } = require('../utils/validators');
const certificateService = require('../services/certificate.service');
const cryptoService = require('../services/crypto.service');
const storageService = require('../services/storage.service');

/**
 * POST /api/v1/account/setup
 * Creates a new account with certificate
 */
async function setup(req, res, next) {
  try {
    // Validate file upload
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELD',
          message: 'Certificado digital não fornecido',
        },
      });
    }
    
    // Validate certificate file
    const fileValidation = validateCertificateFile(req.file);
    if (!fileValidation.valid) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: fileValidation.error,
        },
      });
    }
    
    // Validate password
    const { senha } = req.body;
    if (!senha) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELD',
          message: 'Senha do certificado não fornecida',
        },
      });
    }
    
    // Validate certificate and extract information
    const certInfo = certificateService.validateCertificate(req.file.buffer, senha);
    
    // Check if account with this CNPJ already exists
    const existingKeys = await storageService.listApiKeys();
    for (const key of existingKeys) {
      const account = await storageService.loadAccount(key);
      if (account.metadata.cnpj === certInfo.cnpj) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'ACCOUNT_ALREADY_EXISTS',
            message: 'Já existe uma conta cadastrada com este CNPJ',
          },
        });
      }
    }
    
    // Generate new API key
    const apiKey = generateApiKey();
    
    // Encrypt certificate and password
    const encryptedCertificate = cryptoService.encryptFile(req.file.buffer);
    const encryptedPassword = cryptoService.encrypt(senha);
    
    // Prepare account data
    const accountData = {
      apiKey,
      certificado: encryptedCertificate,
      senha: encryptedPassword,
      metadata: {
        cnpj: certInfo.cnpj,
        razaoSocial: certInfo.razaoSocial,
        validade: certInfo.validade,
        issuer: certInfo.issuer,
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString(),
      },
    };
    
    // Save to disk
    await storageService.saveAccount(apiKey, accountData);
    
    // Return success response
    res.status(201).json({
      success: true,
      message: 'Conta criada com sucesso',
      data: {
        apiKey,
        certificado: {
          cnpj: certificateService.formatCNPJ(certInfo.cnpj),
          razaoSocial: certInfo.razaoSocial,
          validade: certInfo.validade,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/account/status
 * Returns account status and certificate information
 */
async function getStatus(req, res, next) {
  try {
    const { apiKey } = req;
    
    // Load account data
    const accountData = await storageService.loadAccount(apiKey);
    
    // Return certificate metadata (no sensitive data)
    res.json({
      success: true,
      message: 'Status da conta recuperado com sucesso',
      data: {
        certificado: {
          cnpj: certificateService.formatCNPJ(accountData.metadata.cnpj),
          razaoSocial: accountData.metadata.razaoSocial,
          validade: accountData.metadata.validade,
          issuer: accountData.metadata.issuer,
        },
        conta: {
          criadaEm: accountData.metadata.criadoEm,
          atualizadaEm: accountData.metadata.atualizadoEm,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/v1/account/certificate
 * Updates the certificate for an existing account
 */
async function updateCertificate(req, res, next) {
  try {
    const { apiKey } = req;
    
    // Validate file upload
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELD',
          message: 'Certificado digital não fornecido',
        },
      });
    }
    
    // Validate certificate file
    const fileValidation = validateCertificateFile(req.file);
    if (!fileValidation.valid) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: fileValidation.error,
        },
      });
    }
    
    // Validate password
    const { senha } = req.body;
    if (!senha) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELD',
          message: 'Senha do certificado não fornecida',
        },
      });
    }
    
    // Load existing account
    const accountData = await storageService.loadAccount(apiKey);
    
    // Validate new certificate
    const certInfo = certificateService.validateCertificate(req.file.buffer, senha);
    
    // Encrypt new certificate and password
    const encryptedCertificate = cryptoService.encryptFile(req.file.buffer);
    const encryptedPassword = cryptoService.encrypt(senha);
    
    // Update account data
    accountData.certificado = encryptedCertificate;
    accountData.senha = encryptedPassword;
    accountData.metadata.cnpj = certInfo.cnpj;
    accountData.metadata.razaoSocial = certInfo.razaoSocial;
    accountData.metadata.validade = certInfo.validade;
    accountData.metadata.issuer = certInfo.issuer;
    accountData.metadata.atualizadoEm = new Date().toISOString();
    
    // Save updated data
    await storageService.saveAccount(apiKey, accountData);
    
    // Return success response
    res.json({
      success: true,
      message: 'Certificado atualizado com sucesso',
      data: {
        certificado: {
          cnpj: certificateService.formatCNPJ(certInfo.cnpj),
          razaoSocial: certInfo.razaoSocial,
          validade: certInfo.validade,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/v1/account
 * Deletes an account and all associated data
 */
async function deleteAccount(req, res, next) {
  try {
    const { apiKey } = req;
    
    // Delete account from disk
    await storageService.deleteAccount(apiKey);
    
    res.json({
      success: true,
      message: 'Conta deletada com sucesso',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  setup,
  getStatus,
  updateCertificate,
  deleteAccount,
};
