"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.jsonldVPFromRDF = exports.jsonldProofFromRDF = exports.vcToRDF = exports.getRDFAndDeanonMaps = exports.getPredicatesRDF = exports.jsonldToRDF = void 0;
const json_diff_1 = require("json-diff");
const jsonld = __importStar(require("jsonld"));
const PROOF = 'https://w3id.org/security#proof';
const DATA_INTEGRITY_CONTEXT = 'https://www.w3.org/ns/data-integrity/v1';
const SKOLEM_PREFIX = 'urn:bnid:';
const SKOLEM_REGEX = /[<"]urn:bnid:([^>"]+)[>"]/g;
const deskolemizeString = (s) => s.replace(SKOLEM_PREFIX, '_:');
const deskolemizeTerm = (t) => t.replace(SKOLEM_REGEX, '_:$1');
function nanoid(length = 10) {
    const characters = '1234567890abcdefghijklmnopqrstuvwxyz';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}
/**
 * Converts a JSON-LD document to RDF format.
 * @param jsonldDoc The JSON-LD document to convert.
 * @param documentLoader The document loader used to resolve external references.
 * @returns A Promise that resolves to the RDF representation of the JSON-LD document.
 */
const jsonldToRDF = async (jsonldDoc, documentLoader) => (await jsonld.toRDF(jsonldDoc, {
    format: 'application/n-quads',
    documentLoader,
    safe: true,
}));
exports.jsonldToRDF = jsonldToRDF;
const skolemizeJSONLD = (json, includeOmittedId) => {
    let newJson = JSON.parse(JSON.stringify(json)); // create a copy of the input JSON
    if (Array.isArray(newJson)) {
        newJson = newJson.map((item) => typeof item === 'object' && item != null
            ? skolemizeJSONLD(item, includeOmittedId)
            : item);
    }
    else if (typeof newJson === 'object' && newJson != null) {
        const obj = newJson;
        Object.keys(obj).forEach((key) => {
            if (key !== '@context' &&
                typeof obj[key] === 'object' &&
                obj[key] != null) {
                obj[key] = skolemizeJSONLD(obj[key], includeOmittedId);
            }
            else {
                const value = obj[key];
                if (typeof value === 'string' && value.startsWith('_:')) {
                    obj[key] = `${SKOLEM_PREFIX}${value.slice(2)}`;
                }
            }
        });
        if (includeOmittedId &&
            !('@value' in newJson || '@id' in newJson || '@list' in newJson)) {
            newJson['@id'] = `${SKOLEM_PREFIX}${nanoid()}`;
        }
    }
    return newJson; // Return the modified copy of the input JSON
};
const skolemizeExpandedVC = (expandedVC, includeOmittedId) => {
    const output = JSON.parse(JSON.stringify(expandedVC));
    const skolemizedOutput = skolemizeJSONLD(output, includeOmittedId === undefined ? true : includeOmittedId);
    return skolemizedOutput;
};
const skolemizeAndExpandVcPair = async (vcPair, documentLoader) => {
    const expandedOriginalVC = await jsonld.expand(vcPair.original, {
        documentLoader,
        safe: true,
    });
    const skolemizedAndExpandedOriginalVC = skolemizeExpandedVC(expandedOriginalVC);
    const expandedDisclosedVC = await jsonld.expand(vcPair.disclosed, {
        documentLoader,
        safe: true,
    });
    const skolemizedAndExpandedDisclosedVC = skolemizeExpandedVC(expandedDisclosedVC, false);
    return {
        original: skolemizedAndExpandedOriginalVC,
        disclosed: skolemizedAndExpandedDisclosedVC,
    };
};
const getPredicatesRDF = (predicates, documentLoader) => predicates.map(async (predicate) => {
    const expandedPredicate = await jsonld.expand(predicate, {
        documentLoader,
        safe: true,
    });
    const skolemizedAndExpandedPredicate = skolemizeExpandedVC(expandedPredicate);
    const skolemizedAndExpandedPredicateRDF = await (0, exports.jsonldToRDF)(skolemizedAndExpandedPredicate, documentLoader);
    return deskolemizeTerm(skolemizedAndExpandedPredicateRDF);
});
exports.getPredicatesRDF = getPredicatesRDF;
const diffJSONLD = (json, path, deanonMap, skolemIDMap, maskedLiteralPaths) => {
    if (Array.isArray(json)) {
        json.forEach((item, i) => {
            const updatedPath = path.concat([i]);
            if (!Array.isArray(item)) {
                throw new TypeError('json-diff error');
            }
            if (item[0] === '~') {
                diffJSONLD(item[1], updatedPath, deanonMap, skolemIDMap, maskedLiteralPaths);
            }
        });
    }
    else if (typeof json === 'object' && json != null) {
        Object.keys(json).forEach((key) => {
            if (key === '@id') {
                const oldAndNew = json[key];
                if (typeof oldAndNew === 'object' &&
                    oldAndNew !== null &&
                    '__old' in oldAndNew &&
                    '__new' in oldAndNew) {
                    // eslint-disable-next-line @typescript-eslint/dot-notation
                    const orig = oldAndNew['__old'];
                    // eslint-disable-next-line @typescript-eslint/dot-notation
                    const masked = oldAndNew['__new'];
                    if (!masked.startsWith(SKOLEM_PREFIX)) {
                        throw new TypeError(`json-diff error: replacement value \`${masked}\` must start with \`_:\``);
                    }
                    deanonMap.set(deskolemizeString(masked), `<${orig}>`);
                }
                else {
                    throw new TypeError('json-diff error: __old or __new do not exist');
                }
            }
            else if (key === '@value') {
                const oldAndNew = json[key];
                if (typeof oldAndNew === 'object' &&
                    oldAndNew != null &&
                    '__old' in oldAndNew &&
                    '__new' in oldAndNew) {
                    // eslint-disable-next-line @typescript-eslint/dot-notation
                    const orig = oldAndNew['__old'];
                    // eslint-disable-next-line @typescript-eslint/dot-notation
                    const masked = oldAndNew['__new'];
                    if (!masked.startsWith(SKOLEM_PREFIX)) {
                        throw new TypeError(`json-diff error: replacement value \`${masked}\` must start with \`_:\``);
                    }
                    maskedLiteralPaths.push(path);
                    deanonMap.set(deskolemizeString(masked), `"${orig}"`);
                }
                else {
                    throw new TypeError('json-diff error: __old or __new do not exist');
                }
            }
            else if (key === '@id__deleted') {
                const value = json[key];
                if (value.startsWith(SKOLEM_PREFIX)) {
                    skolemIDMap.set(path, value);
                }
                else {
                    const masked = nanoid();
                    skolemIDMap.set(path, `${SKOLEM_PREFIX}${masked}`);
                    deanonMap.set(`_:${masked}`, `<${value}>`);
                }
            }
            else if (!key.endsWith('__deleted')) {
                const updatedPath = path.concat([key]);
                const value = json[key];
                if (typeof value === 'object') {
                    diffJSONLD(value, updatedPath, deanonMap, skolemIDMap, maskedLiteralPaths);
                }
            }
        });
    }
    return {};
};
const diffVC = (vc, disclosed) => {
    const diffObj = (0, json_diff_1.diff)(vc, disclosed);
    const deanonMap = new Map();
    const skolemIDMap = new Map();
    const maskedLiteralPaths = [];
    diffJSONLD(diffObj, [], deanonMap, skolemIDMap, maskedLiteralPaths);
    return { deanonMap, skolemIDMap, maskedLiteralPaths };
};
const traverseJSON = (root, path) => {
    let node = root;
    path.forEach((pathItem) => {
        if (Array.isArray(node) && typeof pathItem === 'number') {
            node = node[pathItem];
        }
        else if (!Array.isArray(node) &&
            typeof node === 'object' &&
            node != null &&
            typeof pathItem === 'string') {
            node = node[pathItem];
        }
        else {
            throw new Error('internal error when processing disclosed VC');
        }
    });
    if (typeof node !== 'object' || node === null || Array.isArray(node)) {
        throw new Error('internal error when processing disclosed VC');
    }
    return node;
};
const expandedVCToRDF = async (vc, documentLoader) => {
    const clonedVC = JSON.parse(JSON.stringify(vc));
    if (!(PROOF in clonedVC[0]) ||
        !Array.isArray(clonedVC[0][PROOF]) ||
        typeof clonedVC[0][PROOF][0] !== 'object' ||
        clonedVC[0][PROOF][0] === null ||
        !('@graph' in clonedVC[0][PROOF][0]) ||
        !Array.isArray(clonedVC[0][PROOF][0]['@graph'])) {
        throw new TypeError('VC must have proof');
    }
    if (clonedVC[0][PROOF][0]['@graph'].length > 1) {
        throw new TypeError('VC must have single proof');
    }
    const proof = clonedVC[0][PROOF][0]['@graph'][0];
    if (typeof proof !== 'object' || proof === null || Array.isArray(proof)) {
        throw new TypeError('invalid VC');
    }
    delete clonedVC[0][PROOF];
    const documentRDF = await (0, exports.jsonldToRDF)(clonedVC, documentLoader);
    const proofRDF = await (0, exports.jsonldToRDF)(proof, documentLoader);
    return { documentRDF, proofRDF };
};
const aggregateLocalDeanonMaps = (diffObjs) => {
    const deanonMap = new Map();
    diffObjs.forEach(({ deanonMap: localDeanonMap }) => {
        localDeanonMap.forEach((value, key) => {
            if (deanonMap.has(key) && deanonMap.get(key) !== value) {
                throw new Error(`pseudonym \`${key}\` corresponds to multiple values: \`${JSON.stringify(value)}\` and \`${JSON.stringify(deanonMap.get(key))}\``);
            }
            deanonMap.set(key, value);
        });
    });
    return deanonMap;
};
/**
 * Retrieves RDF representations of VC pairs and generates a deanon map.
 * @param vcPairs - An array of VC pairs.
 * @param documentLoader - The document loader used for resolving JSON-LD documents.
 * @returns A promise that resolves to an object containing the RDF representations of VC pairs and the deanon map.
 */
const getRDFAndDeanonMaps = async (vcPairs, documentLoader) => {
    // skolemize and expand VCs
    const skolemizedAndExpandedVcPairs = await Promise.all(vcPairs.map((vcPair) => skolemizeAndExpandVcPair(vcPair, documentLoader)));
    // compare VC and disclosed VC to get local deanon map and skolem ID map
    const diffObjs = skolemizedAndExpandedVcPairs.map(({ original, disclosed }) => diffVC(original, disclosed));
    // aggregate local deanon maps
    const deanonMap = aggregateLocalDeanonMaps(diffObjs);
    // update disclosed VCs
    skolemizedAndExpandedVcPairs.forEach(({ disclosed }, i) => {
        // copy Skolem IDs from original VC into disclosed VC
        diffObjs[i].skolemIDMap.forEach((skolemID, path) => {
            const node = traverseJSON(disclosed, path);
            node['@id'] = skolemID;
        });
        // inject masked Literal into disclosed VC
        diffObjs[i].maskedLiteralPaths.forEach((path) => {
            const node = traverseJSON(disclosed, path);
            const value = node['@value'];
            if (typeof value !== 'string') {
                throw new TypeError('invalid disclosed VC'); // TODO: more detail message
            }
            const typ = node['@type'];
            // replace value node with id node
            node['@id'] = value;
            delete node['@type'];
            delete node['@value'];
            const deskolemizedValue = deskolemizeString(value);
            const deanonMapEntry = deanonMap.get(deskolemizedValue);
            if (deanonMapEntry === undefined) {
                throw new Error(`deanonMap[${value}] has no value`);
            }
            if (typeof typ === 'string') {
                deanonMap.set(deskolemizedValue, `${deanonMapEntry}^^<${typ}>`);
            }
            else if (typ === undefined) {
                deanonMap.set(deskolemizedValue, `${deanonMapEntry}`);
            }
            else {
                throw new TypeError('invalid disclosed VC'); // TODO: more detail message
            }
        });
    });
    const vcPairRDFs = await Promise.all(skolemizedAndExpandedVcPairs.map(async ({ original, disclosed }) => {
        // convert VC to N-Quads
        const { documentRDF: skolemizedDocumentRDF, proofRDF: skolemizedProofRDF, } = await expandedVCToRDF(original, documentLoader);
        // convert disclosed VC to N-Quads
        const { documentRDF: skolemizedDisclosedDocumentRDF, proofRDF: skolemizedDisclosedProofRDF, } = await expandedVCToRDF(disclosed, documentLoader);
        // deskolemize N-Quads
        const [originalDocument, originalProof, disclosedDocument, disclosedProof,] = [
            skolemizedDocumentRDF,
            skolemizedProofRDF,
            skolemizedDisclosedDocumentRDF,
            skolemizedDisclosedProofRDF,
        ].map(deskolemizeTerm);
        return {
            originalDocument,
            originalProof,
            disclosedDocument,
            disclosedProof,
        };
    }));
    return { vcPairRDFs, deanonMap };
};
exports.getRDFAndDeanonMaps = getRDFAndDeanonMaps;
/**
 * Converts a Verifiable Credential (VC) object to RDF format.
 * @param vc The Verifiable Credential object to convert.
 * @param documentLoader The document loader used to resolve external JSON-LD documents.
 * @returns A Promise that resolves to an object containing the original VC, its RDF representation, the proof object, and its RDF representation.
 */
const vcToRDF = async (vc, documentLoader) => {
    const clonedVC = JSON.parse(JSON.stringify(vc));
    const { proof } = clonedVC;
    const document = clonedVC;
    delete document.proof;
    if (!('@context' in proof)) {
        proof['@context'] = DATA_INTEGRITY_CONTEXT;
    }
    const documentRDF = await (0, exports.jsonldToRDF)(document, documentLoader);
    const proofRDF = await (0, exports.jsonldToRDF)(proof, documentLoader);
    return { document, documentRDF, proof, proofRDF };
};
exports.vcToRDF = vcToRDF;
/**
 * Converts a proof in RDF format to a JSON-LD proof object.
 * @param proofRDF The proof in RDF format.
 * @param documentLoader The document loader used for resolving external resources during JSON-LD processing.
 * @returns A Promise that resolves to the JSON-LD proof object.
 */
const jsonldProofFromRDF = async (proofRDF, documentLoader) => {
    const proofFrame = {
        '@context': DATA_INTEGRITY_CONTEXT,
        type: 'DataIntegrityProof',
    };
    const proofRDFObj = proofRDF;
    const expandedJsonld = await jsonld.fromRDF(proofRDFObj, {
        format: 'application/n-quads',
        safe: true,
    });
    const out = await jsonld.frame(expandedJsonld, proofFrame, {
        documentLoader,
        safe: true,
    });
    return out;
};
exports.jsonldProofFromRDF = jsonldProofFromRDF;
/**
 * Converts RDF data representing a Verifiable Presentation (VP) into a JSON-LD Node Object.
 * @param vpRDF The RDF data representing the Verifiable Presentation.
 * @param context The JSON-LD context definition.
 * @param documentLoader The document loader used for resolving external resources.
 * @returns A Promise that resolves to the JSON-LD Node Object representing the Verifiable Presentation.
 */
const jsonldVPFromRDF = async (vpRDF, context, documentLoader) => {
    const vpFrame = {
        type: 'VerifiablePresentation',
        proof: {},
        predicate: [
            {
                type: 'Predicate',
            },
        ],
        verifiableCredential: [
            {
                type: 'VerifiableCredential',
            },
        ],
    };
    vpFrame['@context'] = context;
    const vpRDFObj = vpRDF;
    const expandedJsonld = await jsonld.fromRDF(vpRDFObj, {
        format: 'application/n-quads',
        safe: true,
    });
    const out = await jsonld.frame(expandedJsonld, vpFrame, {
        documentLoader,
        omitDefault: true,
        safe: true,
    });
    return out;
};
exports.jsonldVPFromRDF = jsonldVPFromRDF;
//# sourceMappingURL=utils.js.map