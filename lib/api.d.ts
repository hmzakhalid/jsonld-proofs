/**
 * This file contains the API functions for working with JSON-LD proofs.
 * These functions provide functionality for key generation, signing and verification of Verifiable Credentials (VCs),
 * blind signing, unblinding, deriving proofs, and verifying proofs.
 * The functions utilize the @zkp-ld/rdf-proofs-wasm library for low-level cryptographic operations.
 * @packageDocumentation
 */
import { VerifyResult, KeyPair, BlindSignRequest } from '@zkp-ld/rdf-proofs-wasm';
import * as jsonld from 'jsonld';
import { DeriveProofOptions, DocumentLoader, VC, VCPair, VerifyProofOptions } from './types';
/**
 * Generates a key pair for signing and verification.
 * @returns A Promise that resolves to the generated key pair.
 */
export declare const keyGen: () => Promise<KeyPair>;
/**
 * Signs a Verifiable Credential (VC) using a given key pair and document loader.
 * @param vc The Verifiable Credential to sign.
 * @param keyPair The key pair used for signing.
 * @param documentLoader The document loader used for resolving JSON-LD documents.
 * @returns A Promise that resolves to the signed Verifiable Credential.
 */
export declare const sign: (vc: VC, keyPair: jsonld.JsonLdDocument, documentLoader: DocumentLoader) => Promise<VC>;
/**
 * Verifies the signature of a Verifiable Credential (VC) using a given public key and document loader.
 * @param vc The Verifiable Credential to verify.
 * @param publicKey The public key used for verification.
 * @param documentLoader The document loader used for resolving JSON-LD documents.
 * @returns A Promise that resolves to the verification result.
 */
export declare const verify: (vc: VC, publicKey: jsonld.JsonLdDocument, documentLoader: DocumentLoader) => Promise<VerifyResult>;
/**
 * Requests a blind signature for a given secret.
 * @param secret The secret to be blind signed.
 * @param challenge (Optional) The challenge string for the blind signature.
 * @param skipPok (Optional) Whether to skip the proof of knowledge (PoK) step.
 * @returns A Promise that resolves to the blind sign request.
 */
export declare const requestBlindSign: (secret: Uint8Array, challenge?: string, skipPok?: boolean) => Promise<BlindSignRequest>;
/**
 * Verifies a blind sign request.
 * @param commitment The commitment string from the blind sign request.
 * @param pokForCommitment The proof of knowledge (PoK) for the commitment.
 * @param challenge The challenge string used in the blind sign request.
 * @returns A Promise that resolves to the verification result.
 */
export declare const verifyBlindSignRequest: (commitment: string, pokForCommitment: string, challenge: string) => Promise<VerifyResult>;
/**
 * Performs blind signing of a Verifiable Credential (VC) using a given commitment, key pair, and document loader.
 * @param commitment The commitment string from the blind sign request.
 * @param vc The Verifiable Credential to blind sign.
 * @param keyPair The key pair used for blind signing.
 * @param documentLoader The document loader used for resolving JSON-LD documents.
 * @returns A Promise that resolves to the blind signed Verifiable Credential.
 */
export declare const blindSign: (commitment: string, vc: VC, keyPair: jsonld.JsonLdDocument, documentLoader: DocumentLoader) => Promise<VC>;
/**
 * Performs unblinding of a Verifiable Credential (VC) using a given blinding factor and document loader.
 * @param vc The Verifiable Credential to unblind.
 * @param blinding The blinding factor used for unblinding.
 * @param documentLoader The document loader used for resolving JSON-LD documents.
 * @returns A Promise that resolves to the unblinded Verifiable Credential.
 */
export declare const unblind: (vc: VC, blinding: string, documentLoader: DocumentLoader) => Promise<VC>;
/**
 * Verifies a blind signature of a Verifiable Credential (VC) using a given secret, public key, and document loader.
 * @param secret The secret used for blind verification.
 * @param vc The Verifiable Credential to blind verify.
 * @param publicKey The public key used for blind verification.
 * @param documentLoader The document loader used for resolving JSON-LD documents.
 * @returns A Promise that resolves to the verification result.
 */
export declare const blindVerify: (secret: Uint8Array, vc: VC, publicKey: jsonld.JsonLdDocument, documentLoader: DocumentLoader) => Promise<VerifyResult>;
/**
 * Derives a Verifiable Presentation (VP) from a set of Verifiable Credential (VC) pairs using a given set of public keys, context, and document loader.
 * @param vcPairs The array of Verifiable Credential (VC) pairs, where each pair is an array of two VCs: the original VC and the partially-anonymized VC.
 * @param publicKeys The public keys used for deriving the proof.
 * @param context The JSON-LD context definition.
 * @param documentLoader The document loader used for resolving JSON-LD documents.
 * @param options (Optional) Additional options for deriving the proof.
 * @returns A Promise that resolves to the derived proof as a JSON-LD document.
 */
export declare const deriveProof: (vcPairs: VCPair[], publicKeys: jsonld.JsonLdDocument, context: jsonld.ContextDefinition, documentLoader: DocumentLoader, options?: DeriveProofOptions) => Promise<jsonld.JsonLdDocument>;
/**
 * Verifies a Verifiable Presentation (VP) using a given set of public keys, document loader, and additional options.
 * @param vp The Verifiable Presentation (VP) to verify.
 * @param publicKeys The public keys used for verification.
 * @param documentLoader The document loader used for resolving JSON-LD documents.
 * @param options (Optional) Additional options for verifying the proof.
 * @returns A Promise that resolves to the verification result.
 */
export declare const verifyProof: (vp: jsonld.JsonLdDocument, publicKeys: jsonld.JsonLdDocument, documentLoader: DocumentLoader, options?: VerifyProofOptions) => Promise<VerifyResult>;
