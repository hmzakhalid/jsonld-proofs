import {
  sign as signWasm,
  verify as verifyWasm,
  initializeWasm,
  VerifyResult,
} from '@zkp-ld/rdf-proofs-wasm';
import { JsonLdDocument } from 'jsonld';
import { vc2rdf } from './utils';

export interface VcWithDisclosed {
  readonly vc: JsonLdDocument;
  readonly disclosed: JsonLdDocument;
}

export const sign = async (
  vc: JsonLdDocument,
  documentLoader: JsonLdDocument,
): Promise<JsonLdDocument> => {
  await initializeWasm();

  const rdf = await vc2rdf(vc, documentLoader);
  if ('error' in rdf) {
    return { error: rdf.error };
  }
  const { document, documentRDF, proof, proofRDF, documentLoaderRDF } = rdf;
  console.log(documentRDF);

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

  const rdf = await vc2rdf(vc, documentLoader);
  if ('error' in rdf) {
    return { verified: false, error: rdf.error };
  }
  const { documentRDF, proofRDF, documentLoaderRDF } = rdf;

  const verified = verifyWasm(documentRDF, proofRDF, documentLoaderRDF);

  return verified;
};

// export const deriveProof = async (
//   vcWithDisclosedPairs: VcWithDisclosed[],
//   deanonMap: Record<string, string>,
//   nonce: string,
//   documentLoader: JsonLdDocument,
// ): Promise<JsonLdDocument> => {
//   await initializeWasm();

//   for (const { vc, disclosed } of vcWithDisclosedPairs) {
//     const deanonMap = vcDiff(vc, disclosed);
//     if ('error' in deanonMap) {
//       return { error: deanonMap.error };
//     }

//     const rdf = await vc2rdf(vc, documentLoader);
//     if ('error' in rdf) {
//       return { error: rdf.error };
//     }

//     const disclosedRDF = await vc2rdf(disclosed, documentLoader);
//     if ('error' in disclosedRDF) {
//       return { error: rdf.error };
//     }

//     const { documentRDF, proofRDF, documentLoaderRDF } = rdf;
//     const { documentRDF: disclosedDocumentRDF, proofRDF: disclosedProofRDF } =
//       disclosedRDF;
//   }
// };