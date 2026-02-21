/**
 * NF-e XML Builder Service
 * Builds NF-e v4.00 XML according to leiauteNFe_v4.00.xsd and nfe_v4.00.xsd
 *
 * All mandatory fields are required in the JSON input.
 * Element ordering follows the sequence defined in the XSD.
 */

const NF_E_NAMESPACE = 'http://www.portalfiscal.inf.br/nfe';

/**
 * Escapes special XML characters in a string value
 * @param {*} value
 * @returns {string}
 */
function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Formats a number to a fixed number of decimal places
 * @param {number|string} value
 * @param {number} decimals
 * @returns {string}
 */
function fmt(value, decimals = 2) {
  return Number(value).toFixed(decimals);
}

// ---------------------------------------------------------------------------
// Internal section builders – each returns an XML fragment (no declaration)
// ---------------------------------------------------------------------------

function buildIde(ide) {
  let xml = '<ide>';
  xml += `<cUF>${esc(ide.cUF)}</cUF>`;
  xml += `<cNF>${esc(ide.cNF)}</cNF>`;
  xml += `<natOp>${esc(ide.natOp)}</natOp>`;
  xml += `<mod>${esc(ide.mod)}</mod>`;
  xml += `<serie>${esc(ide.serie)}</serie>`;
  xml += `<nNF>${esc(ide.nNF)}</nNF>`;
  xml += `<dhEmi>${esc(ide.dhEmi)}</dhEmi>`;
  if (ide.dhSaiEnt)      xml += `<dhSaiEnt>${esc(ide.dhSaiEnt)}</dhSaiEnt>`;
  if (ide.dPrevEntrega)  xml += `<dPrevEntrega>${esc(ide.dPrevEntrega)}</dPrevEntrega>`;
  xml += `<tpNF>${esc(ide.tpNF)}</tpNF>`;
  xml += `<idDest>${esc(ide.idDest)}</idDest>`;
  xml += `<cMunFG>${esc(ide.cMunFG)}</cMunFG>`;
  if (ide.cMunFGIBS)     xml += `<cMunFGIBS>${esc(ide.cMunFGIBS)}</cMunFGIBS>`;
  xml += `<tpImp>${esc(ide.tpImp)}</tpImp>`;
  xml += `<tpEmis>${esc(ide.tpEmis)}</tpEmis>`;
  xml += `<cDV>${esc(ide.cDV)}</cDV>`;
  xml += `<tpAmb>${esc(ide.tpAmb)}</tpAmb>`;
  xml += `<finNFe>${esc(ide.finNFe)}</finNFe>`;
  xml += `<indFinal>${esc(ide.indFinal)}</indFinal>`;
  xml += `<indPres>${esc(ide.indPres)}</indPres>`;
  if (ide.indIntermed !== undefined) xml += `<indIntermed>${esc(ide.indIntermed)}</indIntermed>`;
  xml += `<procEmi>${esc(ide.procEmi)}</procEmi>`;
  xml += `<verProc>${esc(ide.verProc)}</verProc>`;
  if (ide.dhCont)  xml += `<dhCont>${esc(ide.dhCont)}</dhCont>`;
  if (ide.xJust)   xml += `<xJust>${esc(ide.xJust)}</xJust>`;
  // NFref – references to other fiscal documents (optional, 0-500)
  if (Array.isArray(ide.NFref)) {
    for (const ref of ide.NFref) {
      xml += buildNFref(ref);
    }
  }
  xml += '</ide>';
  return xml;
}

function buildNFref(ref) {
  let xml = '<NFref>';
  if (ref.refNFe)    xml += `<refNFe>${esc(ref.refNFe)}</refNFe>`;
  if (ref.refNFeSig) xml += `<refNFeSig>${esc(ref.refNFeSig)}</refNFeSig>`;
  if (ref.refNF) {
    xml += '<refNF>';
    xml += `<cUF>${esc(ref.refNF.cUF)}</cUF>`;
    xml += `<AAMM>${esc(ref.refNF.AAMM)}</AAMM>`;
    xml += `<CNPJ>${esc(ref.refNF.CNPJ)}</CNPJ>`;
    xml += `<mod>${esc(ref.refNF.mod)}</mod>`;
    xml += `<serie>${esc(ref.refNF.serie)}</serie>`;
    xml += `<nNF>${esc(ref.refNF.nNF)}</nNF>`;
    xml += '</refNF>';
  }
  if (ref.refCTe) xml += `<refCTe>${esc(ref.refCTe)}</refCTe>`;
  xml += '</NFref>';
  return xml;
}

function buildEndereco(tag, end) {
  let xml = `<${tag}>`;
  if (end.xLgr)            xml += `<xLgr>${esc(end.xLgr)}</xLgr>`;
  if (end.nro)             xml += `<nro>${esc(end.nro)}</nro>`;
  if (end.xCpl)            xml += `<xCpl>${esc(end.xCpl)}</xCpl>`;
  if (end.xBairro)         xml += `<xBairro>${esc(end.xBairro)}</xBairro>`;
  if (end.cMun)            xml += `<cMun>${esc(end.cMun)}</cMun>`;
  if (end.xMun)            xml += `<xMun>${esc(end.xMun)}</xMun>`;
  if (end.UF)              xml += `<UF>${esc(end.UF)}</UF>`;
  if (end.CEP)             xml += `<CEP>${esc(end.CEP).replace(/\D/g, '')}</CEP>`;
  if (end.cPais)           xml += `<cPais>${esc(end.cPais)}</cPais>`;
  if (end.xPais)           xml += `<xPais>${esc(end.xPais)}</xPais>`;
  if (end.fone)            xml += `<fone>${esc(end.fone).replace(/\D/g, '')}</fone>`;
  xml += `</${tag}>`;
  return xml;
}

function buildEmit(emit) {
  let xml = '<emit>';
  if (emit.CNPJ) xml += `<CNPJ>${esc(emit.CNPJ.replace(/\D/g, ''))}</CNPJ>`;
  else if (emit.CPF) xml += `<CPF>${esc(emit.CPF.replace(/\D/g, ''))}</CPF>`;
  xml += `<xNome>${esc(emit.xNome)}</xNome>`;
  if (emit.xFant) xml += `<xFant>${esc(emit.xFant)}</xFant>`;
  if (emit.enderEmit) xml += buildEndereco('enderEmit', emit.enderEmit);
  if (emit.IE)   xml += `<IE>${esc(emit.IE)}</IE>`;
  if (emit.IEST) xml += `<IEST>${esc(emit.IEST)}</IEST>`;
  if (emit.IM)   xml += `<IM>${esc(emit.IM)}</IM>`;
  if (emit.CNAE) xml += `<CNAE>${esc(emit.CNAE)}</CNAE>`;
  xml += `<CRT>${esc(emit.CRT)}</CRT>`;
  xml += '</emit>';
  return xml;
}

function buildDest(dest) {
  let xml = '<dest>';
  if (dest.CNPJ)           xml += `<CNPJ>${esc(dest.CNPJ.replace(/\D/g, ''))}</CNPJ>`;
  else if (dest.CPF)       xml += `<CPF>${esc(dest.CPF.replace(/\D/g, ''))}</CPF>`;
  else if (dest.idEstrangeiro) xml += `<idEstrangeiro>${esc(dest.idEstrangeiro)}</idEstrangeiro>`;
  if (dest.xNome)          xml += `<xNome>${esc(dest.xNome)}</xNome>`;
  if (dest.enderDest)      xml += buildEndereco('enderDest', dest.enderDest);
  xml += `<indIEDest>${esc(dest.indIEDest)}</indIEDest>`;
  if (dest.IE)             xml += `<IE>${esc(dest.IE)}</IE>`;
  if (dest.ISUF)           xml += `<ISUF>${esc(dest.ISUF)}</ISUF>`;
  if (dest.IM)             xml += `<IM>${esc(dest.IM)}</IM>`;
  if (dest.email)          xml += `<email>${esc(dest.email)}</email>`;
  xml += '</dest>';
  return xml;
}

function buildProd(prod) {
  let xml = '<prod>';
  xml += `<cProd>${esc(prod.cProd)}</cProd>`;
  xml += `<cEAN>${esc(prod.cEAN || 'SEM GTIN')}</cEAN>`;
  xml += `<xProd>${esc(prod.xProd)}</xProd>`;
  xml += `<NCM>${esc(prod.NCM)}</NCM>`;
  if (prod.NVE)            xml += `<NVE>${esc(prod.NVE)}</NVE>`;
  if (prod.CEST)           xml += `<CEST>${esc(prod.CEST)}</CEST>`;
  if (prod.indEscala)      xml += `<indEscala>${esc(prod.indEscala)}</indEscala>`;
  if (prod.CNPJFab)        xml += `<CNPJFab>${esc(prod.CNPJFab.replace(/\D/g, ''))}</CNPJFab>`;
  if (prod.cBenef)         xml += `<cBenef>${esc(prod.cBenef)}</cBenef>`;
  if (prod.EXTIPI)         xml += `<EXTIPI>${esc(prod.EXTIPI)}</EXTIPI>`;
  xml += `<CFOP>${esc(prod.CFOP)}</CFOP>`;
  xml += `<uCom>${esc(prod.uCom)}</uCom>`;
  xml += `<qCom>${fmt(prod.qCom, 4)}</qCom>`;
  xml += `<vUnCom>${fmt(prod.vUnCom, 10)}</vUnCom>`;
  xml += `<vProd>${fmt(prod.vProd)}</vProd>`;
  xml += `<cEANTrib>${esc(prod.cEANTrib || 'SEM GTIN')}</cEANTrib>`;
  xml += `<uTrib>${esc(prod.uTrib || prod.uCom)}</uTrib>`;
  xml += `<qTrib>${fmt(prod.qTrib !== undefined ? prod.qTrib : prod.qCom, 4)}</qTrib>`;
  xml += `<vUnTrib>${fmt(prod.vUnTrib !== undefined ? prod.vUnTrib : prod.vUnCom, 10)}</vUnTrib>`;
  if (prod.vFrete !== undefined) xml += `<vFrete>${fmt(prod.vFrete)}</vFrete>`;
  if (prod.vSeg !== undefined)   xml += `<vSeg>${fmt(prod.vSeg)}</vSeg>`;
  if (prod.vDesc !== undefined)  xml += `<vDesc>${fmt(prod.vDesc)}</vDesc>`;
  if (prod.vOutro !== undefined) xml += `<vOutro>${fmt(prod.vOutro)}</vOutro>`;
  xml += `<indTot>${esc(prod.indTot !== undefined ? prod.indTot : 1)}</indTot>`;
  if (prod.xPed)           xml += `<xPed>${esc(prod.xPed)}</xPed>`;
  if (prod.nItemPed)       xml += `<nItemPed>${esc(prod.nItemPed)}</nItemPed>`;
  if (prod.nFCI)           xml += `<nFCI>${esc(prod.nFCI)}</nFCI>`;
  // rastro (optional batch/lot tracking array)
  if (Array.isArray(prod.rastro)) {
    for (const rastro of prod.rastro) {
      xml += '<rastro>';
      xml += `<nLote>${esc(rastro.nLote)}</nLote>`;
      xml += `<qLote>${fmt(rastro.qLote, 3)}</qLote>`;
      xml += `<dFab>${esc(rastro.dFab)}</dFab>`;
      if (rastro.dVal) xml += `<dVal>${esc(rastro.dVal)}</dVal>`;
      xml += `<cAgreg>${esc(rastro.cAgreg)}</cAgreg>`;
      xml += '</rastro>';
    }
  }
  xml += '</prod>';
  return xml;
}

function buildIcmsTrib(icms) {
  // Accepts a single key like ICMS00, ICMS10, ICMSSN101, etc.
  const key = Object.keys(icms)[0];
  const data = icms[key];
  let xml = `<${key}>`;

  const fields = [
    'orig','CST','CSOSN','modBC','vBC','pRedBC','pICMS','vICMS',
    'vBCFCPUFDest','pFCPUFDest','pICMSUFDest','pICMSInter','pICMSInterPart',
    'vFCPUFDest','vICMSUFDest','vICMSUFRemet',
    'modBCST','pMVAST','pRedBCST','vBCST','pICMSST','vICMSST',
    'vBCFCPST','pFCPST','vFCPST',
    'vICMSDeson','motDesICMS','pRedBCEfet','vBCEfet','pICMSEfet','vICMSEfet',
    'vICMSOp','vICMSDif',
    'vBCSTRet','pST','vICMSSTRet','vBCFCPSTRet','pFCPSTRet','vFCPSTRet',
    'pRedBCSTRet','vBCSTDest','vICMSSTDest','vICMSSTDesonerado','motDesICMSST',
    'vBCFCPDif','pFCPDif','vFCPDif','vFCPEfet',
    'indSomaST',
  ];

  for (const f of fields) {
    if (data[f] !== undefined) {
      xml += `<${f}>${esc(data[f])}</${f}>`;
    }
  }

  xml += `</${key}>`;
  return xml;
}

function buildPisCofins(tag, data) {
  const key = Object.keys(data)[0]; // PISAliq, PISQtde, PISNT, PISOutr, etc.
  const d = data[key];
  let xml = `<${tag}><${key}>`;

  const fields = ['CST','vBC','pPIS','pCOFINS','qBCProd','vAliqProd','vPIS','vCOFINS'];
  for (const f of fields) {
    if (d[f] !== undefined) xml += `<${f}>${esc(d[f])}</${f}>`;
  }

  xml += `</${key}></${tag}>`;
  return xml;
}

function buildImposto(imposto) {
  let xml = '<imposto>';
  if (imposto.vTotTrib !== undefined) xml += `<vTotTrib>${fmt(imposto.vTotTrib)}</vTotTrib>`;

  if (imposto.ICMS) {
    xml += '<ICMS>';
    xml += buildIcmsTrib(imposto.ICMS);
    xml += '</ICMS>';
  }
  if (imposto.ISSQN) {
    xml += '<ISSQN>';
    const iss = imposto.ISSQN;
    xml += `<vBC>${fmt(iss.vBC)}</vBC>`;
    xml += `<vAliq>${fmt(iss.vAliq, 4)}</vAliq>`;
    xml += `<vISSQN>${fmt(iss.vISSQN)}</vISSQN>`;
    xml += `<cMunFG>${esc(iss.cMunFG)}</cMunFG>`;
    xml += `<cListServ>${esc(iss.cListServ)}</cListServ>`;
    if (iss.vDeducao !== undefined)  xml += `<vDeducao>${fmt(iss.vDeducao)}</vDeducao>`;
    if (iss.vOutro !== undefined)    xml += `<vOutro>${fmt(iss.vOutro)}</vOutro>`;
    if (iss.vDescIncond !== undefined) xml += `<vDescIncond>${fmt(iss.vDescIncond)}</vDescIncond>`;
    if (iss.vDescCond !== undefined) xml += `<vDescCond>${fmt(iss.vDescCond)}</vDescCond>`;
    if (iss.vISSRet !== undefined)   xml += `<vISSRet>${fmt(iss.vISSRet)}</vISSRet>`;
    xml += `<indISS>${esc(iss.indISS)}</indISS>`;
    if (iss.cServico)  xml += `<cServico>${esc(iss.cServico)}</cServico>`;
    if (iss.cMun)      xml += `<cMun>${esc(iss.cMun)}</cMun>`;
    if (iss.cPais)     xml += `<cPais>${esc(iss.cPais)}</cPais>`;
    if (iss.nProcesso) xml += `<nProcesso>${esc(iss.nProcesso)}</nProcesso>`;
    xml += `<indIncentivo>${esc(iss.indIncentivo)}</indIncentivo>`;
    xml += '</ISSQN>';
  }
  if (imposto.IPI) {
    xml += '<IPI>';
    const ipi = imposto.IPI;
    if (ipi.clEnq)  xml += `<clEnq>${esc(ipi.clEnq)}</clEnq>`;
    if (ipi.CNPJProd) xml += `<CNPJProd>${esc(ipi.CNPJProd.replace(/\D/g, ''))}</CNPJProd>`;
    if (ipi.cSelo)  xml += `<cSelo>${esc(ipi.cSelo)}</cSelo>`;
    if (ipi.qSelo !== undefined) xml += `<qSelo>${esc(ipi.qSelo)}</qSelo>`;
    if (ipi.cEnq)   xml += `<cEnq>${esc(ipi.cEnq)}</cEnq>`;
    const ipiTrib = ipi.IPITrib || ipi.IPINT;
    const ipiTag  = ipi.IPITrib ? 'IPITrib' : 'IPINT';
    if (ipiTrib) {
      xml += `<${ipiTag}>`;
      if (ipiTrib.CST !== undefined) xml += `<CST>${esc(ipiTrib.CST)}</CST>`;
      if (ipiTrib.vBC !== undefined) xml += `<vBC>${fmt(ipiTrib.vBC)}</vBC>`;
      if (ipiTrib.pIPI !== undefined) xml += `<pIPI>${fmt(ipiTrib.pIPI, 4)}</pIPI>`;
      if (ipiTrib.qUnid !== undefined) xml += `<qUnid>${fmt(ipiTrib.qUnid, 4)}</qUnid>`;
      if (ipiTrib.vUnid !== undefined) xml += `<vUnid>${fmt(ipiTrib.vUnid, 4)}</vUnid>`;
      if (ipiTrib.vIPI !== undefined) xml += `<vIPI>${fmt(ipiTrib.vIPI)}</vIPI>`;
      xml += `</${ipiTag}>`;
    }
    xml += '</IPI>';
  }
  if (imposto.II) {
    xml += '<II>';
    xml += `<vBC>${fmt(imposto.II.vBC)}</vBC>`;
    xml += `<vDespAdu>${fmt(imposto.II.vDespAdu)}</vDespAdu>`;
    xml += `<vII>${fmt(imposto.II.vII)}</vII>`;
    xml += `<vIOF>${fmt(imposto.II.vIOF)}</vIOF>`;
    xml += '</II>';
  }
  if (imposto.PIS)      xml += buildPisCofins('PIS', imposto.PIS);
  if (imposto.PISST) {
    xml += '<PISST>';
    const ps = imposto.PISST;
    if (ps.vBC !== undefined)     xml += `<vBC>${fmt(ps.vBC)}</vBC>`;
    if (ps.pPIS !== undefined)    xml += `<pPIS>${fmt(ps.pPIS, 4)}</pPIS>`;
    if (ps.qBCProd !== undefined) xml += `<qBCProd>${fmt(ps.qBCProd, 4)}</qBCProd>`;
    if (ps.vAliqProd !== undefined) xml += `<vAliqProd>${fmt(ps.vAliqProd, 4)}</vAliqProd>`;
    xml += `<vPIS>${fmt(ps.vPIS)}</vPIS>`;
    if (ps.indSomaPISST !== undefined) xml += `<indSomaPISST>${esc(ps.indSomaPISST)}</indSomaPISST>`;
    xml += '</PISST>';
  }
  if (imposto.COFINS)   xml += buildPisCofins('COFINS', imposto.COFINS);
  if (imposto.COFINSST) {
    xml += '<COFINSST>';
    const cs = imposto.COFINSST;
    if (cs.vBC !== undefined)     xml += `<vBC>${fmt(cs.vBC)}</vBC>`;
    if (cs.pCOFINS !== undefined) xml += `<pCOFINS>${fmt(cs.pCOFINS, 4)}</pCOFINS>`;
    if (cs.qBCProd !== undefined) xml += `<qBCProd>${fmt(cs.qBCProd, 4)}</qBCProd>`;
    if (cs.vAliqProd !== undefined) xml += `<vAliqProd>${fmt(cs.vAliqProd, 4)}</vAliqProd>`;
    xml += `<vCOFINS>${fmt(cs.vCOFINS)}</vCOFINS>`;
    if (cs.indSomaCOFINSST !== undefined) xml += `<indSomaCOFINSST>${esc(cs.indSomaCOFINSST)}</indSomaCOFINSST>`;
    xml += '</COFINSST>';
  }

  xml += '</imposto>';
  return xml;
}

function buildDet(det) {
  let xml = `<det nItem="${esc(det.nItem)}">`;
  xml += buildProd(det.prod);
  if (det.imposto) xml += buildImposto(det.imposto);
  if (det.impostoDevol) {
    xml += '<impostoDevol>';
    xml += `<pDevol>${fmt(det.impostoDevol.pDevol, 2)}</pDevol>`;
    xml += '<IPI><vIPIDevol>' + fmt(det.impostoDevol.IPI.vIPIDevol) + '</vIPIDevol></IPI>';
    xml += '</impostoDevol>';
  }
  if (det.infAdProd) xml += `<infAdProd>${esc(det.infAdProd)}</infAdProd>`;
  xml += '</det>';
  return xml;
}

function buildTotal(total) {
  let xml = '<total>';
  if (total.ICMSTot) {
    const t = total.ICMSTot;
    xml += '<ICMSTot>';
    xml += `<vBC>${fmt(t.vBC)}</vBC>`;
    xml += `<vICMS>${fmt(t.vICMS)}</vICMS>`;
    xml += `<vICMSDeson>${fmt(t.vICMSDeson !== undefined ? t.vICMSDeson : 0)}</vICMSDeson>`;
    if (t.vFCPUFDest !== undefined)    xml += `<vFCPUFDest>${fmt(t.vFCPUFDest)}</vFCPUFDest>`;
    if (t.vICMSUFDest !== undefined)   xml += `<vICMSUFDest>${fmt(t.vICMSUFDest)}</vICMSUFDest>`;
    if (t.vICMSUFRemet !== undefined)  xml += `<vICMSUFRemet>${fmt(t.vICMSUFRemet)}</vICMSUFRemet>`;
    xml += `<vFCP>${fmt(t.vFCP !== undefined ? t.vFCP : 0)}</vFCP>`;
    xml += `<vBCST>${fmt(t.vBCST !== undefined ? t.vBCST : 0)}</vBCST>`;
    xml += `<vST>${fmt(t.vST !== undefined ? t.vST : 0)}</vST>`;
    xml += `<vFCPST>${fmt(t.vFCPST !== undefined ? t.vFCPST : 0)}</vFCPST>`;
    xml += `<vFCPSTRet>${fmt(t.vFCPSTRet !== undefined ? t.vFCPSTRet : 0)}</vFCPSTRet>`;
    if (t.qBCMono !== undefined)       xml += `<qBCMono>${fmt(t.qBCMono, 4)}</qBCMono>`;
    if (t.vICMSMono !== undefined)     xml += `<vICMSMono>${fmt(t.vICMSMono)}</vICMSMono>`;
    if (t.qBCMonoReten !== undefined)  xml += `<qBCMonoReten>${fmt(t.qBCMonoReten, 4)}</qBCMonoReten>`;
    if (t.vICMSMonoReten !== undefined) xml += `<vICMSMonoReten>${fmt(t.vICMSMonoReten)}</vICMSMonoReten>`;
    if (t.qBCMonoRet !== undefined)    xml += `<qBCMonoRet>${fmt(t.qBCMonoRet, 4)}</qBCMonoRet>`;
    if (t.vICMSMonoRet !== undefined)  xml += `<vICMSMonoRet>${fmt(t.vICMSMonoRet)}</vICMSMonoRet>`;
    xml += `<vProd>${fmt(t.vProd)}</vProd>`;
    xml += `<vFrete>${fmt(t.vFrete !== undefined ? t.vFrete : 0)}</vFrete>`;
    xml += `<vSeg>${fmt(t.vSeg !== undefined ? t.vSeg : 0)}</vSeg>`;
    xml += `<vDesc>${fmt(t.vDesc !== undefined ? t.vDesc : 0)}</vDesc>`;
    xml += `<vII>${fmt(t.vII !== undefined ? t.vII : 0)}</vII>`;
    xml += `<vIPI>${fmt(t.vIPI !== undefined ? t.vIPI : 0)}</vIPI>`;
    xml += `<vIPIDevol>${fmt(t.vIPIDevol !== undefined ? t.vIPIDevol : 0)}</vIPIDevol>`;
    xml += `<vPIS>${fmt(t.vPIS !== undefined ? t.vPIS : 0)}</vPIS>`;
    xml += `<vCOFINS>${fmt(t.vCOFINS !== undefined ? t.vCOFINS : 0)}</vCOFINS>`;
    xml += `<vOutro>${fmt(t.vOutro !== undefined ? t.vOutro : 0)}</vOutro>`;
    xml += `<vNF>${fmt(t.vNF)}</vNF>`;
    if (t.vTotTrib !== undefined) xml += `<vTotTrib>${fmt(t.vTotTrib)}</vTotTrib>`;
    xml += '</ICMSTot>';
  }
  if (total.ISSQNtot) {
    const t = total.ISSQNtot;
    xml += '<ISSQNtot>';
    if (t.vServ !== undefined)       xml += `<vServ>${fmt(t.vServ)}</vServ>`;
    if (t.vBC !== undefined)         xml += `<vBC>${fmt(t.vBC)}</vBC>`;
    if (t.vISS !== undefined)        xml += `<vISS>${fmt(t.vISS)}</vISS>`;
    if (t.vPIS !== undefined)        xml += `<vPIS>${fmt(t.vPIS)}</vPIS>`;
    if (t.vCOFINS !== undefined)     xml += `<vCOFINS>${fmt(t.vCOFINS)}</vCOFINS>`;
    if (t.dCompet)                   xml += `<dCompet>${esc(t.dCompet)}</dCompet>`;
    if (t.vDeducao !== undefined)    xml += `<vDeducao>${fmt(t.vDeducao)}</vDeducao>`;
    if (t.vOutro !== undefined)      xml += `<vOutro>${fmt(t.vOutro)}</vOutro>`;
    if (t.vDescIncond !== undefined) xml += `<vDescIncond>${fmt(t.vDescIncond)}</vDescIncond>`;
    if (t.vDescCond !== undefined)   xml += `<vDescCond>${fmt(t.vDescCond)}</vDescCond>`;
    if (t.vISSRet !== undefined)     xml += `<vISSRet>${fmt(t.vISSRet)}</vISSRet>`;
    if (t.cRegTrib !== undefined)    xml += `<cRegTrib>${esc(t.cRegTrib)}</cRegTrib>`;
    xml += '</ISSQNtot>';
  }
  xml += '</total>';
  return xml;
}

function buildTransp(transp) {
  let xml = '<transp>';
  xml += `<modFrete>${esc(transp.modFrete)}</modFrete>`;
  if (transp.transporta) {
    xml += '<transporta>';
    const t = transp.transporta;
    if (t.CNPJ) xml += `<CNPJ>${esc(t.CNPJ.replace(/\D/g, ''))}</CNPJ>`;
    else if (t.CPF) xml += `<CPF>${esc(t.CPF.replace(/\D/g, ''))}</CPF>`;
    if (t.xNome)   xml += `<xNome>${esc(t.xNome)}</xNome>`;
    if (t.IE)      xml += `<IE>${esc(t.IE)}</IE>`;
    if (t.xEnder)  xml += `<xEnder>${esc(t.xEnder)}</xEnder>`;
    if (t.xMun)    xml += `<xMun>${esc(t.xMun)}</xMun>`;
    if (t.UF)      xml += `<UF>${esc(t.UF)}</UF>`;
    xml += '</transporta>';
  }
  if (transp.retTransp) {
    xml += '<retTransp>';
    xml += `<vServ>${fmt(transp.retTransp.vServ)}</vServ>`;
    xml += `<vBCRet>${fmt(transp.retTransp.vBCRet)}</vBCRet>`;
    xml += `<pICMSRet>${fmt(transp.retTransp.pICMSRet, 4)}</pICMSRet>`;
    xml += `<vICMSRet>${fmt(transp.retTransp.vICMSRet)}</vICMSRet>`;
    xml += `<CFOP>${esc(transp.retTransp.CFOP)}</CFOP>`;
    xml += `<cMunFG>${esc(transp.retTransp.cMunFG)}</cMunFG>`;
    xml += '</retTransp>';
  }
  if (transp.vol) {
    const vols = Array.isArray(transp.vol) ? transp.vol : [transp.vol];
    for (const vol of vols) {
      xml += '<vol>';
      if (vol.qVol !== undefined)   xml += `<qVol>${esc(vol.qVol)}</qVol>`;
      if (vol.esp)                  xml += `<esp>${esc(vol.esp)}</esp>`;
      if (vol.marca)                xml += `<marca>${esc(vol.marca)}</marca>`;
      if (vol.nVol)                 xml += `<nVol>${esc(vol.nVol)}</nVol>`;
      if (vol.pesoL !== undefined)  xml += `<pesoL>${fmt(vol.pesoL, 3)}</pesoL>`;
      if (vol.pesoB !== undefined)  xml += `<pesoB>${fmt(vol.pesoB, 3)}</pesoB>`;
      xml += '</vol>';
    }
  }
  xml += '</transp>';
  return xml;
}

function buildCobr(cobr) {
  let xml = '<cobr>';
  if (cobr.fat) {
    xml += '<fat>';
    if (cobr.fat.nFat)              xml += `<nFat>${esc(cobr.fat.nFat)}</nFat>`;
    if (cobr.fat.vOrig !== undefined) xml += `<vOrig>${fmt(cobr.fat.vOrig)}</vOrig>`;
    if (cobr.fat.vDesc !== undefined) xml += `<vDesc>${fmt(cobr.fat.vDesc)}</vDesc>`;
    if (cobr.fat.vLiq !== undefined)  xml += `<vLiq>${fmt(cobr.fat.vLiq)}</vLiq>`;
    xml += '</fat>';
  }
  if (Array.isArray(cobr.dup)) {
    for (const dup of cobr.dup) {
      xml += '<dup>';
      if (dup.nDup)  xml += `<nDup>${esc(dup.nDup)}</nDup>`;
      if (dup.dVenc) xml += `<dVenc>${esc(dup.dVenc)}</dVenc>`;
      xml += `<vDup>${fmt(dup.vDup)}</vDup>`;
      xml += '</dup>';
    }
  }
  xml += '</cobr>';
  return xml;
}

function buildPag(pag) {
  let xml = '<pag>';
  const detPags = Array.isArray(pag.detPag) ? pag.detPag : [pag.detPag];
  for (const det of detPags) {
    xml += '<detPag>';
    if (det.indPag !== undefined) xml += `<indPag>${esc(det.indPag)}</indPag>`;
    xml += `<tPag>${esc(det.tPag)}</tPag>`;
    xml += `<vPag>${fmt(det.vPag)}</vPag>`;
    if (det.dEmi)    xml += `<dEmi>${esc(det.dEmi)}</dEmi>`;
    if (det.CNPJ)    xml += `<CNPJ>${esc(det.CNPJ.replace(/\D/g, ''))}</CNPJ>`;
    if (det.tBand)   xml += `<tBand>${esc(det.tBand)}</tBand>`;
    if (det.cAut)    xml += `<cAut>${esc(det.cAut)}</cAut>`;
    if (det.card) {
      xml += '<card>';
      if (det.card.CNPJ)   xml += `<CNPJ>${esc(det.card.CNPJ.replace(/\D/g, ''))}</CNPJ>`;
      if (det.card.tBand)  xml += `<tBand>${esc(det.card.tBand)}</tBand>`;
      if (det.card.cAut)   xml += `<cAut>${esc(det.card.cAut)}</cAut>`;
      xml += '</card>';
    }
    xml += '</detPag>';
  }
  if (pag.vTroco !== undefined) xml += `<vTroco>${fmt(pag.vTroco)}</vTroco>`;
  xml += '</pag>';
  return xml;
}

// ---------------------------------------------------------------------------
// Public builders
// ---------------------------------------------------------------------------

/**
 * Builds the NFe XML element (without XML declaration).
 * The infNFe element is given the provided chaveAcesso as its Id attribute.
 * The Signature element is added by the signature service after calling this.
 *
 * @param {Object} nfe - NF-e data object (mirrors the JSON request body)
 * @param {string} chaveAcesso - 44-digit access key
 * @param {string} [versao='4.00'] - NF-e version
 * @returns {string} NFe XML string (ready to be signed)
 */
function buildNFe(nfe, chaveAcesso, versao = '4.00') {
  let xml = `<NFe xmlns="${NF_E_NAMESPACE}">`;
  xml += `<infNFe versao="${esc(versao)}" Id="NFe${esc(chaveAcesso)}">`;

  xml += buildIde(nfe.ide);
  xml += buildEmit(nfe.emit);
  if (nfe.avulsa) {
    xml += '<avulsa>';
    xml += `<CNPJ>${esc(nfe.avulsa.CNPJ.replace(/\D/g, ''))}</CNPJ>`;
    xml += `<xOrgao>${esc(nfe.avulsa.xOrgao)}</xOrgao>`;
    xml += `<matr>${esc(nfe.avulsa.matr)}</matr>`;
    xml += `<xAgente>${esc(nfe.avulsa.xAgente)}</xAgente>`;
    if (nfe.avulsa.fone) xml += `<fone>${esc(nfe.avulsa.fone)}</fone>`;
    xml += `<UF>${esc(nfe.avulsa.UF)}</UF>`;
    if (nfe.avulsa.nDAR) xml += `<nDAR>${esc(nfe.avulsa.nDAR)}</nDAR>`;
    if (nfe.avulsa.dEmi) xml += `<dEmi>${esc(nfe.avulsa.dEmi)}</dEmi>`;
    if (nfe.avulsa.vDAR !== undefined) xml += `<vDAR>${fmt(nfe.avulsa.vDAR)}</vDAR>`;
    xml += `<repEmi>${esc(nfe.avulsa.repEmi)}</repEmi>`;
    if (nfe.avulsa.dPag) xml += `<dPag>${esc(nfe.avulsa.dPag)}</dPag>`;
    xml += '</avulsa>';
  }
  if (nfe.dest) xml += buildDest(nfe.dest);
  if (nfe.retirada) xml += buildEndereco('retirada', nfe.retirada);
  if (nfe.entrega)  xml += buildEndereco('entrega', nfe.entrega);

  if (Array.isArray(nfe.autXML)) {
    for (const a of nfe.autXML) {
      xml += '<autXML>';
      if (a.CNPJ) xml += `<CNPJ>${esc(a.CNPJ.replace(/\D/g, ''))}</CNPJ>`;
      else if (a.CPF) xml += `<CPF>${esc(a.CPF.replace(/\D/g, ''))}</CPF>`;
      xml += '</autXML>';
    }
  }

  const dets = Array.isArray(nfe.det) ? nfe.det : [nfe.det];
  for (const det of dets) {
    xml += buildDet(det);
  }

  xml += buildTotal(nfe.total);
  xml += buildTransp(nfe.transp);
  if (nfe.cobr) xml += buildCobr(nfe.cobr);
  if (nfe.pag)  xml += buildPag(nfe.pag);

  if (nfe.infIntermed) {
    xml += '<infIntermed>';
    xml += `<CNPJ>${esc(nfe.infIntermed.CNPJ.replace(/\D/g, ''))}</CNPJ>`;
    if (nfe.infIntermed.idCadIntTran) xml += `<idCadIntTran>${esc(nfe.infIntermed.idCadIntTran)}</idCadIntTran>`;
    xml += '</infIntermed>';
  }
  if (nfe.infAdic) {
    xml += '<infAdic>';
    if (nfe.infAdic.infAdFisco) xml += `<infAdFisco>${esc(nfe.infAdic.infAdFisco)}</infAdFisco>`;
    if (nfe.infAdic.infCpl)     xml += `<infCpl>${esc(nfe.infAdic.infCpl)}</infCpl>`;
    xml += '</infAdic>';
  }
  if (nfe.exporta) {
    xml += '<exporta>';
    xml += `<UFSaidaPais>${esc(nfe.exporta.UFSaidaPais)}</UFSaidaPais>`;
    if (nfe.exporta.xLocExporta) xml += `<xLocExporta>${esc(nfe.exporta.xLocExporta)}</xLocExporta>`;
    if (nfe.exporta.xLocDespacho) xml += `<xLocDespacho>${esc(nfe.exporta.xLocDespacho)}</xLocDespacho>`;
    xml += '</exporta>';
  }
  if (nfe.infRespTec) {
    xml += '<infRespTec>';
    xml += `<CNPJ>${esc(nfe.infRespTec.CNPJ.replace(/\D/g, ''))}</CNPJ>`;
    xml += `<xContato>${esc(nfe.infRespTec.xContato)}</xContato>`;
    xml += `<email>${esc(nfe.infRespTec.email)}</email>`;
    xml += `<fone>${esc(nfe.infRespTec.fone.replace(/\D/g, ''))}</fone>`;
    if (nfe.infRespTec.idCSRT) {
      xml += `<idCSRT>${esc(nfe.infRespTec.idCSRT)}</idCSRT>`;
      xml += `<hashCSRT>${esc(nfe.infRespTec.hashCSRT)}</hashCSRT>`;
    }
    xml += '</infRespTec>';
  }

  xml += '</infNFe>';
  xml += '</NFe>';
  return xml;
}

/**
 * Wraps a signed NFe XML in an enviNFe envelope
 * @param {string} nfeXml - Signed NFe XML string (without declaration)
 * @param {string|number} idLote - Batch identifier
 * @param {0|1} indSinc - 0=asynchronous, 1=synchronous
 * @param {string} [versao='4.00'] - NF-e version
 * @returns {string} enviNFe XML string
 */
function buildEnviNFe(nfeXml, idLote, indSinc = 1, versao = '4.00') {
  return (
    `<enviNFe versao="${esc(versao)}" xmlns="${NF_E_NAMESPACE}">` +
    `<idLote>${esc(idLote)}</idLote>` +
    `<indSinc>${esc(indSinc)}</indSinc>` +
    nfeXml +
    '</enviNFe>'
  );
}

/**
 * Builds the consSitNFe XML (query NF-e by access key)
 * @param {string} chNFe - 44-digit access key
 * @param {1|2} tpAmb - 1=production, 2=homologação
 * @returns {string} XML string
 */
function buildConsSitNFe(chNFe, tpAmb) {
  return (
    `<consSitNFe versao="4.00" xmlns="${NF_E_NAMESPACE}">` +
    `<tpAmb>${esc(tpAmb)}</tpAmb>` +
    '<xServ>CONSULTAR</xServ>' +
    `<chNFe>${esc(chNFe)}</chNFe>` +
    '</consSitNFe>'
  );
}

/**
 * Builds the consStatServ XML (service status check)
 * @param {string|number} cUF - UF code
 * @param {1|2} tpAmb - 1=production, 2=homologação
 * @returns {string} XML string
 */
function buildConsStatServ(cUF, tpAmb) {
  return (
    `<consStatServ versao="4.00" xmlns="${NF_E_NAMESPACE}">` +
    `<tpAmb>${esc(tpAmb)}</tpAmb>` +
    `<cUF>${esc(cUF)}</cUF>` +
    '<xServ>STATUS</xServ>' +
    '</consStatServ>'
  );
}

/**
 * Builds the inutNFe XML for inutilization of a NF-e number range
 * The caller must sign this XML with refUri="#ID{...}"
 *
 * @param {Object} data
 * @param {string|number} data.cUF - UF code
 * @param {1|2} data.tpAmb - 1=production, 2=homologação
 * @param {string} data.CNPJ - Emitter CNPJ
 * @param {string|number} data.mod - Document model (55 or 65)
 * @param {string|number} data.serie - Series
 * @param {string|number} data.nNFIni - Starting NF-e number
 * @param {string|number} data.nNFFin - Ending NF-e number
 * @param {string} data.xJust - Justification (min 15 chars)
 * @param {string|number} [data.ano] - 4-digit year of the NF-e range (defaults to current year)
 * @returns {{ xml: string, id: string }}
 */
function buildInutNFe(data) {
  const aaaa = data.ano ? String(data.ano) : String(new Date().getFullYear());
  const cnpjClean = data.CNPJ.replace(/\D/g, '');
  const id = `ID${esc(data.cUF)}${aaaa}${cnpjClean}${String(data.mod).padStart(2, '0')}` +
    `${String(data.serie).padStart(3, '0')}${String(data.nNFIni).padStart(9, '0')}` +
    `${String(data.nNFFin).padStart(9, '0')}`;

  const xml =
    `<inutNFe versao="4.00" xmlns="${NF_E_NAMESPACE}">` +
    `<infInut Id="${id}">` +
    `<tpAmb>${esc(data.tpAmb)}</tpAmb>` +
    '<xServ>INUTILIZAR</xServ>' +
    `<cUF>${esc(data.cUF)}</cUF>` +
    `<ano>${aaaa}</ano>` +
    `<CNPJ>${cnpjClean}</CNPJ>` +
    `<mod>${esc(data.mod)}</mod>` +
    `<serie>${String(data.serie).padStart(3, '0')}</serie>` +
    `<nNFIni>${String(data.nNFIni).padStart(9, '0')}</nNFIni>` +
    `<nNFFin>${String(data.nNFFin).padStart(9, '0')}</nNFFin>` +
    `<xJust>${esc(data.xJust)}</xJust>` +
    '</infInut>' +
    '</inutNFe>';

  return { xml, id: `#${id}` };
}

/**
 * Builds the envEvento XML for NF-e cancellation (tpEvento=110111)
 * The caller must sign the inner `evento` element with refUri="#ID{...}"
 *
 * @param {Object} data
 * @param {string|number} data.cUF - UF code (or 91 for AN)
 * @param {1|2} data.tpAmb - 1=production, 2=homologação
 * @param {string} data.CNPJ - Author CNPJ
 * @param {string} data.chNFe - 44-digit NF-e access key
 * @param {string} data.dhEvento - Event datetime (AAAA-MM-DDThh:mm:ssTZD)
 * @param {number} [data.nSeqEvento=1] - Event sequence number
 * @param {string} data.nProt - Authorization protocol number
 * @param {string} data.xJust - Cancellation justification (min 15 chars)
 * @param {string|number} [data.idLote=1] - Lot identifier
 * @returns {{ xml: string, id: string }}
 */
function buildCancNFe(data) {
  const nSeqEvento = data.nSeqEvento || 1;
  const idLote = data.idLote || 1;
  const chave = data.chNFe;
  const cnpjClean = data.CNPJ.replace(/\D/g, '');

  // ID format: ID + tpEvento(6) + chNFe(44) + nSeqEvento(2)
  const id = `ID110111${chave}${String(nSeqEvento).padStart(2, '0')}`;

  const eventoXml =
    `<evento versao="1.00" xmlns="${NF_E_NAMESPACE}">` +
    `<infEvento Id="${id}">` +
    `<cOrgao>${esc(data.cUF)}</cOrgao>` +
    `<tpAmb>${esc(data.tpAmb)}</tpAmb>` +
    `<CNPJ>${cnpjClean}</CNPJ>` +
    `<chNFe>${chave}</chNFe>` +
    `<dhEvento>${esc(data.dhEvento)}</dhEvento>` +
    '<tpEvento>110111</tpEvento>' +
    `<nSeqEvento>${nSeqEvento}</nSeqEvento>` +
    '<verEvento>1.00</verEvento>' +
    '<detEvento versao="1.00">' +
    '<descEvento>Cancelamento</descEvento>' +
    `<nProt>${esc(data.nProt)}</nProt>` +
    `<xJust>${esc(data.xJust)}</xJust>` +
    '</detEvento>' +
    '</infEvento>' +
    '</evento>';

  const envEvento =
    `<envEvento versao="1.00" xmlns="${NF_E_NAMESPACE}">` +
    `<idLote>${esc(idLote)}</idLote>` +
    eventoXml +
    '</envEvento>';

  return { xml: envEvento, eventoXml, id: `#${id}` };
}

module.exports = {
  buildNFe,
  buildEnviNFe,
  buildConsSitNFe,
  buildConsStatServ,
  buildInutNFe,
  buildCancNFe,
};
