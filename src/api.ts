import {
  sign as signWasm,
  verify as verifyWasm,
  deriveProof as deriveProofWasm,
  initializeWasm,
  VerifyResult,
} from '@zkp-ld/rdf-proofs-wasm';
import { JsonLdDocument } from 'jsonld';
import {
  deskolemizeNQuads,
  jsonldToRDF,
  replaceMaskWithSkolemID,
  vcToRDF,
  vcDiff,
  skolemizeJSONLD,
} from './utils';

export interface VcWithDisclosed {
  readonly vc: JsonLdDocument;
  readonly disclosed: JsonLdDocument;
}

export const sign = async (
  vc: JsonLdDocument,
  documentLoader: JsonLdDocument,
): Promise<JsonLdDocument> => {
  await initializeWasm();

  const rdf = await vcToRDF(vc);
  if ('error' in rdf) {
    return { error: rdf.error };
  }
  const { document, documentRDF, proof, proofRDF } = rdf;

  const documentLoaderRDF = await jsonldToRDF(documentLoader);

  const signature = signWasm(documentRDF, proofRDF, documentLoaderRDF);

  proof.proofValue = signature;
  document.proof = proof;

  return document;
};

export const verify = async (
  vc: JsonLdDocument,
  documentLoader: JsonLdDocument,
): Promise<VerifyResult> => {
  await initializeWasm();

  const rdf = await vcToRDF(vc);
  if ('error' in rdf) {
    return { verified: false, error: rdf.error };
  }
  const { documentRDF, proofRDF } = rdf;

  const documentLoaderRDF = await jsonldToRDF(documentLoader);

  const verified = verifyWasm(documentRDF, proofRDF, documentLoaderRDF);

  return verified;
};

export const deriveProof = async (
  vcWithDisclosedPairs: VcWithDisclosed[],
  nonce: string,
  documentLoader: JsonLdDocument,
): Promise<JsonLdDocument> => {
  await initializeWasm();

  const vcWithDisclosed = [];
  const deanonMap = new Map<string, string>();
  const documentLoaderRDF = await jsonldToRDF(documentLoader);

  for (const { vc, disclosed } of vcWithDisclosedPairs) {
    // deep copy disclosed VC
    const disclosedVC = JSON.parse(JSON.stringify(disclosed)) as Record<
      string,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      any
    >;

    // skolemize VC
    const skolemizedVC = skolemizeJSONLD(vc);

    // compare VC and disclosed VC to get local deanon map and skolem ID map
    const vcDiffResult = vcDiff(skolemizedVC, disclosedVC);
    if ('error' in vcDiffResult) {
      return { error: vcDiffResult.error };
    }
    const { deanonMap: localDeanonMap, skolemIDMap } = vcDiffResult;

    console.log('skolemIDMap:');
    console.log(skolemIDMap);

    // update global deanonMap
    for (const [k, v] of localDeanonMap.entries()) {
      if (deanonMap.has(k) && deanonMap.get(k) !== v) {
        return {
          error: `pseudonym \`${k}\` corresponds to multiple values: \`${v}\` and \`${deanonMap.get(
            k,
          )}\``,
        };
      }
      deanonMap.set(k, v);
    }

    // copy Skolem IDs from original VC to disclosed VC
    for (const [path, skolemID] of skolemIDMap) {
      let node = disclosedVC;
      for (const item of path) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        node = node[item];
      }
      node['@id'] = skolemID;
    }

    console.log(`disclosed VC: ${JSON.stringify(disclosedVC, null, 2)}`);

    // replace user-defined mask values with Skolem IDs like `urn:bnid:*`
    const skolemizedDisclosedVC = replaceMaskWithSkolemID(
      disclosedVC,
      localDeanonMap,
    );

    // convert VC to N-Quads
    const skolemizedRDF = await vcToRDF(skolemizedVC);
    if ('error' in skolemizedRDF) {
      return { error: skolemizedRDF.error };
    }
    const { documentRDF: skolemizedDocumentRDF, proofRDF: skolemizedProofRDF } =
      skolemizedRDF;

    const skolemizedDisclosedRDF = await vcToRDF(skolemizedDisclosedVC);
    if ('error' in skolemizedDisclosedRDF) {
      return { error: skolemizedDisclosedRDF.error };
    }
    const {
      documentRDF: skolemizedDisclosedDocumentRDF,
      proofRDF: skolemizedDisclosedProofRDF,
    } = skolemizedDisclosedRDF;

    const [documentRDF, proofRDF, disclosedDocumentRDF, disclosedProofRDF] = [
      skolemizedDocumentRDF,
      skolemizedProofRDF,
      skolemizedDisclosedDocumentRDF,
      skolemizedDisclosedProofRDF,
    ].map(deskolemizeNQuads);

    vcWithDisclosed.push({
      vcDocument: documentRDF,
      vcProof: proofRDF,
      disclosedDocument: disclosedDocumentRDF,
      disclosedProof: disclosedProofRDF,
    });
  }

  console.log('vcWithDisclosed:');
  for (const {
    vcDocument,
    vcProof,
    disclosedDocument,
    disclosedProof,
  } of vcWithDisclosed) {
    console.log('vcDocument:');
    console.log(vcDocument);
    console.log('vcProof:');
    console.log(vcProof);
    console.log('disclosedDocument:');
    console.log(disclosedDocument);
    console.log('disclosedProof:');
    console.log(disclosedProof);
  }
  console.log(deanonMap);

  const vp = deriveProofWasm({
    vcWithDisclosed,
    deanonMap,
    nonce,
    documentLoader: documentLoaderRDF,
  });

  console.log(`vp (N-Quads): ${vp}`);

  // TODO: dummy
  return {};
};
