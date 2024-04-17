import * as jsonld from 'jsonld';
import { DocumentLoader, VC, VCPair, VCPairsWithDeanonMap, VCRDF } from './types';
/**
 * Converts a JSON-LD document to RDF format.
 * @param jsonldDoc The JSON-LD document to convert.
 * @param documentLoader The document loader used to resolve external references.
 * @returns A Promise that resolves to the RDF representation of the JSON-LD document.
 */
export declare const jsonldToRDF: (jsonldDoc: jsonld.JsonLdDocument, documentLoader: DocumentLoader) => Promise<string>;
export declare const getPredicatesRDF: (predicates: jsonld.JsonLdDocument[], documentLoader: DocumentLoader) => Promise<string>[];
/**
 * Retrieves RDF representations of VC pairs and generates a deanon map.
 * @param vcPairs - An array of VC pairs.
 * @param documentLoader - The document loader used for resolving JSON-LD documents.
 * @returns A promise that resolves to an object containing the RDF representations of VC pairs and the deanon map.
 */
export declare const getRDFAndDeanonMaps: (vcPairs: VCPair[], documentLoader: DocumentLoader) => Promise<VCPairsWithDeanonMap>;
/**
 * Converts a Verifiable Credential (VC) object to RDF format.
 * @param vc The Verifiable Credential object to convert.
 * @param documentLoader The document loader used to resolve external JSON-LD documents.
 * @returns A Promise that resolves to an object containing the original VC, its RDF representation, the proof object, and its RDF representation.
 */
export declare const vcToRDF: (vc: VC, documentLoader: DocumentLoader) => Promise<VCRDF>;
/**
 * Converts a proof in RDF format to a JSON-LD proof object.
 * @param proofRDF The proof in RDF format.
 * @param documentLoader The document loader used for resolving external resources during JSON-LD processing.
 * @returns A Promise that resolves to the JSON-LD proof object.
 */
export declare const jsonldProofFromRDF: (proofRDF: string, documentLoader: DocumentLoader) => Promise<jsonld.NodeObject>;
/**
 * Converts RDF data representing a Verifiable Presentation (VP) into a JSON-LD Node Object.
 * @param vpRDF The RDF data representing the Verifiable Presentation.
 * @param context The JSON-LD context definition.
 * @param documentLoader The document loader used for resolving external resources.
 * @returns A Promise that resolves to the JSON-LD Node Object representing the Verifiable Presentation.
 */
export declare const jsonldVPFromRDF: (vpRDF: string, context: jsonld.ContextDefinition, documentLoader: DocumentLoader) => Promise<jsonld.NodeObject>;
