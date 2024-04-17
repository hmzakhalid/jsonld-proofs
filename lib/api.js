"use strict";
/**
 * This file contains the API functions for working with JSON-LD proofs.
 * These functions provide functionality for key generation, signing and verification of Verifiable Credentials (VCs),
 * blind signing, unblinding, deriving proofs, and verifying proofs.
 * The functions utilize the @zkp-ld/rdf-proofs-wasm library for low-level cryptographic operations.
 * @packageDocumentation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyProof = exports.deriveProof = exports.blindVerify = exports.unblind = exports.blindSign = exports.verifyBlindSignRequest = exports.requestBlindSign = exports.verify = exports.sign = exports.keyGen = void 0;
const rdf_proofs_wasm_1 = require("@zkp-ld/rdf-proofs-wasm");
const utils_1 = require("./utils");
/**
 * Generates a key pair for signing and verification.
 * @returns A Promise that resolves to the generated key pair.
 */
const keyGen = async () => {
    await (0, rdf_proofs_wasm_1.initializeWasm)();
    const keypair = (0, rdf_proofs_wasm_1.keyGen)();
    return keypair;
};
exports.keyGen = keyGen;
/**
 * Signs a Verifiable Credential (VC) using a given key pair and document loader.
 * @param vc The Verifiable Credential to sign.
 * @param keyPair The key pair used for signing.
 * @param documentLoader The document loader used for resolving JSON-LD documents.
 * @returns A Promise that resolves to the signed Verifiable Credential.
 */
const sign = async (vc, keyPair, documentLoader) => {
    await (0, rdf_proofs_wasm_1.initializeWasm)();
    const { document, documentRDF, proofRDF } = await (0, utils_1.vcToRDF)(vc, documentLoader);
    const keyPairRDF = await (0, utils_1.jsonldToRDF)(keyPair, documentLoader);
    const signedProofRDF = (0, rdf_proofs_wasm_1.sign)(documentRDF, proofRDF, keyPairRDF);
    const proof = await (0, utils_1.jsonldProofFromRDF)(signedProofRDF, documentLoader);
    document.proof = proof;
    return document;
};
exports.sign = sign;
/**
 * Verifies the signature of a Verifiable Credential (VC) using a given public key and document loader.
 * @param vc The Verifiable Credential to verify.
 * @param publicKey The public key used for verification.
 * @param documentLoader The document loader used for resolving JSON-LD documents.
 * @returns A Promise that resolves to the verification result.
 */
const verify = async (vc, publicKey, documentLoader) => {
    await (0, rdf_proofs_wasm_1.initializeWasm)();
    const { documentRDF, proofRDF } = await (0, utils_1.vcToRDF)(vc, documentLoader);
    const publicKeyRDF = await (0, utils_1.jsonldToRDF)(publicKey, documentLoader);
    const verified = (0, rdf_proofs_wasm_1.verify)(documentRDF, proofRDF, publicKeyRDF);
    return verified;
};
exports.verify = verify;
/**
 * Requests a blind signature for a given secret.
 * @param secret The secret to be blind signed.
 * @param challenge (Optional) The challenge string for the blind signature.
 * @param skipPok (Optional) Whether to skip the proof of knowledge (PoK) step.
 * @returns A Promise that resolves to the blind sign request.
 */
const requestBlindSign = async (secret, challenge, skipPok) => {
    await (0, rdf_proofs_wasm_1.initializeWasm)();
    const request = (0, rdf_proofs_wasm_1.requestBlindSign)(secret, challenge, skipPok);
    return request;
};
exports.requestBlindSign = requestBlindSign;
/**
 * Verifies a blind sign request.
 * @param commitment The commitment string from the blind sign request.
 * @param pokForCommitment The proof of knowledge (PoK) for the commitment.
 * @param challenge The challenge string used in the blind sign request.
 * @returns A Promise that resolves to the verification result.
 */
const verifyBlindSignRequest = async (commitment, pokForCommitment, challenge) => {
    await (0, rdf_proofs_wasm_1.initializeWasm)();
    const verified = (0, rdf_proofs_wasm_1.verifyBlindSignRequest)(commitment, pokForCommitment, challenge);
    return verified;
};
exports.verifyBlindSignRequest = verifyBlindSignRequest;
/**
 * Performs blind signing of a Verifiable Credential (VC) using a given commitment, key pair, and document loader.
 * @param commitment The commitment string from the blind sign request.
 * @param vc The Verifiable Credential to blind sign.
 * @param keyPair The key pair used for blind signing.
 * @param documentLoader The document loader used for resolving JSON-LD documents.
 * @returns A Promise that resolves to the blind signed Verifiable Credential.
 */
const blindSign = async (commitment, vc, keyPair, documentLoader) => {
    await (0, rdf_proofs_wasm_1.initializeWasm)();
    const { document, documentRDF, proofRDF } = await (0, utils_1.vcToRDF)(vc, documentLoader);
    const keyPairRDF = await (0, utils_1.jsonldToRDF)(keyPair, documentLoader);
    const signedProofRDF = (0, rdf_proofs_wasm_1.blindSign)(commitment, documentRDF, proofRDF, keyPairRDF);
    const proof = await (0, utils_1.jsonldProofFromRDF)(signedProofRDF, documentLoader);
    document.proof = proof;
    return document;
};
exports.blindSign = blindSign;
/**
 * Performs unblinding of a Verifiable Credential (VC) using a given blinding factor and document loader.
 * @param vc The Verifiable Credential to unblind.
 * @param blinding The blinding factor used for unblinding.
 * @param documentLoader The document loader used for resolving JSON-LD documents.
 * @returns A Promise that resolves to the unblinded Verifiable Credential.
 */
const unblind = async (vc, blinding, documentLoader) => {
    await (0, rdf_proofs_wasm_1.initializeWasm)();
    const { document, documentRDF, proofRDF } = await (0, utils_1.vcToRDF)(vc, documentLoader);
    const unblindedProofRDF = (0, rdf_proofs_wasm_1.unblind)(documentRDF, proofRDF, blinding);
    const proof = await (0, utils_1.jsonldProofFromRDF)(unblindedProofRDF, documentLoader);
    document.proof = proof;
    return document;
};
exports.unblind = unblind;
/**
 * Verifies a blind signature of a Verifiable Credential (VC) using a given secret, public key, and document loader.
 * @param secret The secret used for blind verification.
 * @param vc The Verifiable Credential to blind verify.
 * @param publicKey The public key used for blind verification.
 * @param documentLoader The document loader used for resolving JSON-LD documents.
 * @returns A Promise that resolves to the verification result.
 */
const blindVerify = async (secret, vc, publicKey, documentLoader) => {
    await (0, rdf_proofs_wasm_1.initializeWasm)();
    const { documentRDF, proofRDF } = await (0, utils_1.vcToRDF)(vc, documentLoader);
    const publicKeyRDF = await (0, utils_1.jsonldToRDF)(publicKey, documentLoader);
    const verified = (0, rdf_proofs_wasm_1.blindVerify)(secret, documentRDF, proofRDF, publicKeyRDF);
    return verified;
};
exports.blindVerify = blindVerify;
/**
 * Derives a Verifiable Presentation (VP) from a set of Verifiable Credential (VC) pairs using a given set of public keys, context, and document loader.
 * @param vcPairs The array of Verifiable Credential (VC) pairs, where each pair is an array of two VCs: the original VC and the partially-anonymized VC.
 * @param publicKeys The public keys used for deriving the proof.
 * @param context The JSON-LD context definition.
 * @param documentLoader The document loader used for resolving JSON-LD documents.
 * @param options (Optional) Additional options for deriving the proof.
 * @returns A Promise that resolves to the derived proof as a JSON-LD document.
 */
const deriveProof = async (vcPairs, publicKeys, context, documentLoader, options) => {
    await (0, rdf_proofs_wasm_1.initializeWasm)();
    const { vcPairRDFs, deanonMap } = await (0, utils_1.getRDFAndDeanonMaps)(vcPairs, documentLoader);
    const publicKeysRDF = await (0, utils_1.jsonldToRDF)(publicKeys, documentLoader);
    const predicatesRDF = (options === null || options === void 0 ? void 0 : options.predicates)
        ? await Promise.all((0, utils_1.getPredicatesRDF)(options.predicates, documentLoader))
        : undefined;
    const vp = (0, rdf_proofs_wasm_1.deriveProof)({
        vcPairs: vcPairRDFs,
        deanonMap,
        keyGraph: publicKeysRDF,
        challenge: options === null || options === void 0 ? void 0 : options.challenge,
        domain: options === null || options === void 0 ? void 0 : options.domain,
        secret: options === null || options === void 0 ? void 0 : options.secret,
        blindSignRequest: options === null || options === void 0 ? void 0 : options.blindSignRequest,
        withPpid: options === null || options === void 0 ? void 0 : options.withPpid,
        predicates: predicatesRDF,
        circuits: options === null || options === void 0 ? void 0 : options.circuits,
    });
    const jsonldVP = await (0, utils_1.jsonldVPFromRDF)(vp, context, documentLoader);
    return jsonldVP;
};
exports.deriveProof = deriveProof;
/**
 * Verifies a Verifiable Presentation (VP) using a given set of public keys, document loader, and additional options.
 * @param vp The Verifiable Presentation (VP) to verify.
 * @param publicKeys The public keys used for verification.
 * @param documentLoader The document loader used for resolving JSON-LD documents.
 * @param options (Optional) Additional options for verifying the proof.
 * @returns A Promise that resolves to the verification result.
 */
const verifyProof = async (vp, publicKeys, documentLoader, options) => {
    await (0, rdf_proofs_wasm_1.initializeWasm)();
    const vpRDF = await (0, utils_1.jsonldToRDF)(vp, documentLoader);
    const publicKeysRDF = await (0, utils_1.jsonldToRDF)(publicKeys, documentLoader);
    const verified = (0, rdf_proofs_wasm_1.verifyProof)(Object.assign({ vp: vpRDF, keyGraph: publicKeysRDF }, options));
    return verified;
};
exports.verifyProof = verifyProof;
//# sourceMappingURL=api.js.map