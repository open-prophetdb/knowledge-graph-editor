import { sortBy } from 'lodash';
import v from 'voca';
// @ts-ignore
import { fetchEntities as getEntities } from "@/api/swagger/KnowledgeGraph";
import { Knowledge } from 'biominer-components/dist/esm/components/KnowledgeGraphEditor/index.t';
import { makeQueryEntityStr } from 'biominer-components/dist/esm/components/utils';

export const commonOptions = [
    {
        order: 0,
        label: "Unknown",
        value: "Unknown",
    }
]

export type QueryItem = {
    operator: string;
    field: string;
    value: string | number | boolean | string[] | number[] | boolean[];
};

export type ComposeQueryItem = {
    operator: string; // AND, OR, NOT
    items: (QueryItem | ComposeQueryItem)[];
};

export type EntityRecordsResponse = {
    /** Total number of records. */
    total: number;
    /** List of records. */
    records: Entity[];
    /** Page number. */
    page: number;
    /** Num of items per page. */
    page_size: number;
};

export type Entity = {
    idx: number;
    id: string;
    name: string;
    label: string;
    resource: string;
    taxid: string;
    description?: string;
    synonyms?: string;
    xrefs?: string;
};

export type CachedData = Record<string, Array<Entity | string | OptionType>>;

export type OptionType = {
    order: number;
    label: string;
    value: string;
    disabled?: boolean;
    metadata?: Entity;
};

export type GroupOptionType = { label: string, options: OptionType[] }

export type Options = OptionType[];
export type GroupOptions = GroupOptionType[];

export type EntityStat = {
    id: number;
    resource: string;
    entity_type: string;
    entity_count: number;
};

export type RelationStat = {
    id: number;
    resource: string;
    relation_type: string;
    relation_count: number;
    start_entity_type: string;
    end_entity_type: string;
};

export type StatisticsResponse = {
    entity_stat: EntityStat[];
    relation_stat: RelationStat[];
};

// More details on the following papers:
export const RelationTypeDict: Record<string, string> = {
    AdG: 'Anatomy-downregulates-Gene',
    AeG: 'Anatomy-expresses-Gene',
    AuG: 'Anatomy-upregulates-Gene',
    CbG: 'Compound-binds-Gene',
    CcSE: 'Compound-causes-Side Effect',
    CdG: 'Compound-downregulates-Gene',
    CpD: 'Compound-palliates-Disease',
    CrC: 'Compound-resembles-Compound',
    CtD: 'Compound-treats-Disease',
    CuG: 'Compound-upregulates-Gene',
    DaG: 'Disease-associates-Gene',
    DdG: 'Disease-downregulates-Gene',
    DlA: 'Disease-localizes-Anatomy',
    DpS: 'Disease-presents-Symptom',
    DrD: 'Disease-resembles-Disease',
    DuG: 'Disease-upregulates-Gene',
    GcG: 'Gene-covaries-Gene',
    GiG: 'Gene-interacts-Gene',
    GpBP: 'Gene-participates-Biological Process',
    GpCC: 'Gene-participates-Cellular Component',
    GpMF: 'Gene-participates-Molecular Function',
    GpPW: 'Gene-participates-Pathway',
    'Gr>G': 'Gene-regulates-Gene',
    PCiC: 'Pharmacologic Class-includes-Compound',
    AGONIST: 'Agonist',
    'PARTIAL AGONIST': 'Partial Agonist',
    INHIBITOR: 'Inhibitor',
    ACTIVATOR: 'Activator',
    ANTAGONIST: 'Antagonist',
    BINDER: 'Binder',
    'CHANNEL BLOCKER': 'Channel Blocker',
    BLOCKER: 'Blocker',
    'POSITIVE ALLOSTERIC MODULATOR': 'Positive Allosteric Modulator',
    'ALLOSTERIC MODULATOR': 'Allosteric Modulator',
    MODULATOR: 'Modulator',
    OTHER: 'Other',
    ANTIBODY: 'Antibody',
    enzyme: 'enzyme',
    target: 'target',
    'x-atc': 'x-atc',
    treats: 'treats',
    carrier: 'carrier',
    'PROTEIN CLEAVAGE': 'Protein Cleavage',
    'PHYSICAL ASSOCIATION': 'Physical Association',
    ASSOCIATION: 'Association',
    'DIRECT INTERACTION': 'Direct Interaction',
    COLOCALIZATION: 'Colocalization',
    'DEPHOSPHORYLATION REACTION': 'Dephosphorylation Reaction',
    'CLEAVAGE REACTION': 'Cleavage Reaction',
    'PHOSPHORYLATION REACTION': 'Phosphorylation Reaction',
    'ADP RIBOSYLATION REACTION': 'Adp Ribosylation Reaction',
    'UBIQUITINATION REACTION': 'Ubiquitination Reaction',
    PTMOD: 'Ptmod',
    BINDING: 'Binding',
    ACTIVATION: 'Activation',
    REACTION: 'Reaction',
    CATALYSIS: 'Catalysis',
    INHIBITION: 'Inhibition',
    EXPRESSION: 'Expression',
    DrugVirGen: 'DrugVirGen',
    HumGenHumGen: 'HumGenHumGen',
    Coronavirus_ass_host_gene: 'Coronavirus_ass_host_gene',
    VirGenHumGen: 'VirGenHumGen',
    Covid2_acc_host_gene: 'Covid2_acc_host_gene',
    DrugHumGen: 'DrugHumGen',
    'A+': 'agonism, activation',
    'A-': 'antagonism, blocking',
    B: 'binding, ligand (esp. receptors)',
    'E+': 'increases expression/production',
    'E-': 'decreases expression/production',
    E: 'affects expression/production (neutral)',
    N: 'inhibits',
    O: 'transport, channels',
    K: 'metabolism, pharmacokinetics',
    Z: 'enzyme activity',
    T: 'treatment/therapy (including investigatory)',
    C: 'inhibits cell growth (esp. cancers)',
    Sa: 'side effect/adverse event',
    Pr: 'prevents, suppresses',
    Pa: 'alleviates, reduces',
    J: 'role in disease pathogenesis',
    Mp: 'biomarkers (of disease progression)',
    U: 'causal mutations',
    Ud: 'mutations affecting disease course',
    D: 'drug targets',
    Te: 'possible therapeutic effect',
    Y: 'polymorphisms alter risk',
    G: 'promotes progression',
    Md: 'biomarkers (diagnostic)',
    X: 'overexpression in disease',
    L: 'improper regulation linked to disease',
    W: 'enhances response',
    'V+': 'activates, stimulates',
    I: 'signaling pathway',
    H: 'same protein or complex',
    Rg: 'regulation',
    Q: 'production by cell population',
};

export type RelationType = { source: string; relationType: string; fullRelationType: string };

export const formatEntityTypeOptions = (items: EntityStat[]): GroupOptions => {
    let o: OptionType[] = [];
    let nodeTypes = new Set(
        items.map((item: EntityStat) => {
            return item.entity_type;
        }),
    );

    console.log("formatEntityTypeOptions: ", items, nodeTypes);
    if (nodeTypes) {
        nodeTypes.forEach((element: string) => {
            o.push({
                order: 0,
                label: element,
                value: element,
            });
        });
        o = sortBy(o, 'label');
    } else {
        o = [];
    }

    if (o.length > 0) {
        return [
            {
                label: 'Common',
                options: commonOptions,
            },
            {
                label: 'Search Results',
                options: o,
            },
        ];
    } else {
        return [
            {
                label: 'Common',
                options: commonOptions,
            },
        ];
    }
};

export const formatRelationTypeOptions = (items: RelationStat[], record: Knowledge): Options => {
    const sourceType = record.source_type;
    const targetType = record.target_type;
    if (!items || !sourceType || !targetType) {
        return commonOptions;
    };

    const filtered = items.filter((item: RelationStat) => {
        return (
            (item.start_entity_type == sourceType && item.end_entity_type == targetType) ||
            (item.start_entity_type == targetType && item.end_entity_type == sourceType)
        );
    });

    const relationshipTypes = filtered.map((item: RelationStat) => {
        // relation_type is in the format of "resource::relation_type::source_type:target_type", such as DGIDB::MODULATOR::Gene:Compound
        return {
            fullRelationType: item.relation_type,
            source: item.relation_type.split('::')[0],
            relationType: item.relation_type
                .replace(/^[a-zA-Z0-9]+::/g, '')
                .replace(`::${item.start_entity_type}:${item.end_entity_type}`, ''),
        };
    });

    const formatRelType = (item: RelationType) => {
        const r = RelationTypeDict[item.relationType]
            ? RelationTypeDict[item.relationType]
            : item.relationType;
        return v.titleCase(`${r}`) + ` [${item.source}]`;
    };

    let relationOptions = sortBy(
        relationshipTypes.map((item: RelationType) => {
            return {
                order: 0,
                label: formatRelType(item),
                value: item.fullRelationType,
            };
        }),
        ['label'],
    );

    console.log("formatRelationTypeOptions: ", relationOptions, record);
    relationOptions.filter((item: OptionType) => {
        return item.value && item.label
    });

    let mergedCommonOptions = commonOptions;

    if (record.relation_type) {
        mergedCommonOptions = [
            ...commonOptions,
            {
                order: 1,
                label: record.relation_type,
                value: record.relation_type,
            },
        ]
    }

    return [
        ...mergedCommonOptions,
        ...relationOptions
    ]
};

export const formatSpecies = (taxid: string): string => {
    const speciesDict: Record<string, string> = {
        "9606": "Human",
        "10090": "Mouse",
        "10116": "Rat"
    };

    if (taxid in speciesDict) {
        return speciesDict[taxid];
    } else {
        return "Unknown";
    }
}

export const formatLabelOption = (item: Entity): string => {
    if (item.label == "Gene") {
        // TODO: How to deal with multiple species in the future?
        return `${item.name} | ${item.id} | ${formatSpecies(item.taxid)}`;
    } else {
        return `${item.name} | ${item.id}`;
    }
};

export const formatKeySentenceOptions = (
    keySentences: string[] | undefined
): Options => {
    if (keySentences) {
        return keySentences.map((item: string) => ({
            order: 0,
            label: item,
            value: item,
        }));
    } else {
        return [];
    }
};

export const formatEntityIdOptions = (entities: Entity[] | undefined): GroupOptions => {
    let options: Options = [];
    if (entities && entities.length >= 1) {
        const formatedData = entities.map((item: Entity) => ({
            value: `${item["id"]}`,
            text: formatLabelOption(item),
        }));
        console.log("Get Entities: ", formatedData, entities);
        // const options = formatedData.map(d => <Option key={d.value}>{d.text}</Option>);
        options = formatedData.map((d: any) => {
            return { label: d.text, value: d.value, order: 0 };
        });
    }

    const entityIdCommonOptions = [
        // For keeping the compatibility with the id format
        {
            order: 0,
            label: "Unknown",
            value: "Unknown:Unknown",
        }
    ];

    if (options.length > 0) {
        return [
            {
                label: "Common",
                options: entityIdCommonOptions,
            },
            {
                label: "Search Results",
                options: options,
            }
        ]
    } else {
        return [
            {
                label: "Common",
                options: entityIdCommonOptions
            }
        ]
    }
};

export function makeQueryKnowledgeStr(params: Partial<Knowledge>): string {
    let query: ComposeQueryItem = {} as ComposeQueryItem;

    let items = [];
    if (params.pmid) {
        items.push({
            operator: '=',
            field: 'pmid',
            value: params.pmid,
        });
    }

    if (params.curator) {
        items.push({
            operator: '=',
            field: 'curator',
            value: params.curator,
        })
    }

    if (items.length > 0) {
        query = {
            operator: 'and',
            items: items,
        };

        return JSON.stringify(query);
    } else {
        return "";
    }
}

export const checkNodeId = (nodeType: string, nodeId: string): Promise<string> => {
    // We need to keep all Unknown nodes for learning how many nodes are not in our database.
    if (nodeId == "Unknown:Unknown") {
        return Promise.resolve(nodeId);
    }

    return new Promise((resolve, reject) => {
        const queryStr = {
            operator: 'and',
            items: [
                {
                    operator: '=',
                    field: 'id',
                    value: nodeId,
                },
                {
                    operator: '=',
                    field: 'label',
                    value: nodeType,
                },
            ],
        }

        getEntities({
            query_str: JSON.stringify(queryStr),
            page: 1,
            page_size: 10,
        }).then((response: EntityRecordsResponse) => {
            const { records } = response;
            if (records.length == 1) {
                resolve(records[0].id);
            } else {
                reject("Id and node type do not match.");
            }
        }).catch((error: any) => {
            console.log("checkNodeId Error: ", error);
            reject(error);
        });
    });
}

let timeout: ReturnType<typeof setTimeout> | null;

// This function is used to fetch the entities of the selected entity type.
// All the entities will be added to the options as a dropdown list.
export const fetchEntities = async (entityType: string, value: string, callback: (options: Options) => void) => {
    // We might not get good results when the value is short than 3 characters.
    if (value.length < 3) {
        callback([]);
        return;
    }

    if (timeout) {
        clearTimeout(timeout);
        timeout = null;
    }

    // TODO: Check if the value is a valid id.

    let queryMap = {};
    let order: string[] = [];
    // If the value is a number, then maybe it is an id or xref but not for name or synonyms.
    if (value && !isNaN(Number(value))) {
        queryMap = { id: value, xrefs: value, label: entityType };
        order = ['id', 'xrefs'];
    } else {
        queryMap = { name: value, synonyms: value, xrefs: value, id: value, label: entityType };
        order = ['name', 'synonyms', 'xrefs', 'id'];
    }

    const fetchData = () => {
        getEntities({
            query_str: makeQueryEntityStr(queryMap, order),
            page: 1,
            page_size: 50,
        })
            .then((response: EntityRecordsResponse) => {
                const { records } = response;
                const formatedData = records.map((item: Entity) => ({
                    value: `${item['id']}`,
                    text: formatLabelOption(item),
                    metadata: item,
                }));
                console.log('Get Entities: ', formatedData, records);
                // const options = formatedData.map(d => <Option key={d.value}>{d.text}</Option>);
                const options = formatedData.map((d: any) => {
                    return { label: d.text, value: d.value, order: 0, metadata: d.metadata, disabled: false };
                });

                callback(options);
            })
            .catch((error: any) => {
                console.log('requestNodes Error: ', error);
                callback([]);
            });
    };

    timeout = setTimeout(fetchData, 300);
};