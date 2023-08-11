import { sortBy } from 'lodash';
import v from 'voca';
// @ts-ignore
import { fetchEntities as getEntities } from "@/api/swagger/KnowledgeGraph";
import { Knowledge } from 'biominer-components/dist/esm/components/KnowledgeGraphEditor/index.t';
import { GraphEdge } from 'biominer-components/dist/esm/components/typings';

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
};

export type CachedData = Record<string, Array<Entity | string | OptionType>>;

export type OptionType = {
    order: number;
    label: string;
    value: string;
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

export const formatEntityTypeOptions = (items: EntityStat[]) => {
    let o: OptionType[] = [];
    let nodeTypes = new Set(
        items.map((item: EntityStat) => {
            return item.entity_type;
        }),
    );
    if (nodeTypes) {
        nodeTypes.forEach((element: string) => {
            o.push({
                order: 0,
                label: element,
                value: element,
            });
        });
        return (sortBy(o, 'label'));
    } else {
        return ([]);
    }
};

export const formatRelationTypeOptions = (items: RelationStat[], record: Knowledge) => {
    const sourceType = record.source_type;
    const targetType = record.target_type;
    if (!items || !sourceType || !targetType) {
        return ([{
            order: 0,
            label: "Unknown",
            value: "Unknown",
        }]);
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
    if (relationOptions.length == 0) {
        relationOptions = [{
            order: 0,
            label: "Unknown",
            value: "Unknown",
        }, {
            order: 1,
            label: record.relation_type,
            value: record.relation_type,
        }];
    }

    return relationOptions.filter((item: OptionType) => {
        return item.value && item.label
    });
};

export const formatLabelOption = (item: Entity): string => {
    if (item.label == "Gene") {
        // TODO: How to deal with multiple species in the future?
        if (item.taxid) {
            return `${item.name} | ${item.id} | ${item.taxid}`;
        } else {
            return `${item.name} | ${item.id} | Unknown`;
        }
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

export const formatEntityIdOptions = (entities: Entity[] | undefined): Options => {
    let options: Options = [];
    if (!entities) {
        options = [
            {
                order: 0,
                label: "Unknown",
                value: "Unknown",
            },
        ];
    } else {
        const formatedData = entities.map((item: Entity) => ({
            value: `${item["id"]}`,
            text: formatLabelOption(item),
        }));
        console.log("Get Entities: ", formatedData, entities);
        // const options = formatedData.map(d => <Option key={d.value}>{d.text}</Option>);
        options = formatedData.map((d: any) => {
            return { label: d.text, value: d.value, order: 0 };
        });

        options.push({
            order: 0,
            label: "Unknown",
            value: "Unknown",
        });
    }

    return options;
};

export function makeQueryKnowledgeStr(params: Partial<Knowledge>): string {
    let query: ComposeQueryItem = {} as ComposeQueryItem;

    let id_query_item = {} as QueryItem;
    let curator_query_item = {} as QueryItem;
    if (params.pmid && params.curator) {
        id_query_item = {
            operator: '=',
            field: 'pmid',
            value: params.pmid,
        };

        curator_query_item = {
            operator: '=',
            field: 'curator',
            value: params.curator,
        };

        query = {
            operator: 'and',
            items: [id_query_item, curator_query_item],
        };

        return JSON.stringify(query);
    } else {
        return "";
    }
}

export function makeQueryEntityStr(params: Partial<Entity>): string {
    let query: ComposeQueryItem = {} as ComposeQueryItem;

    let id_query_item = {} as QueryItem;
    if (params.id) {
        id_query_item = {
            operator: 'ilike',
            field: 'id',
            value: `%${params.id}%`,
        };
    }

    let name_query_item = {} as QueryItem;
    if (params.name) {
        name_query_item = {
            operator: 'ilike',
            field: 'name',
            value: `%${params.name}%`,
        };
    }

    let label_query_item = {} as QueryItem;
    if (params.label) {
        label_query_item = {
            operator: '=',
            field: 'label',
            value: params.label,
        };
    }

    if (id_query_item && name_query_item) {
        query = {
            operator: 'or',
            items: [id_query_item, name_query_item],
        };
    } else if (id_query_item) {
        query = {
            operator: 'and',
            items: [id_query_item],
        };
    } else if (name_query_item) {
        query = {
            operator: 'and',
            items: [name_query_item],
        };
    }

    if (query.operator == 'or') {
        query = {
            operator: 'and',
            items: [query, label_query_item],
        };
    } else {
        query = {
            operator: 'and',
            items: [...query.items, label_query_item],
        };
    }

    return JSON.stringify(query);
}

let timeout: ReturnType<typeof setTimeout> | null;

// This function is used to fetch the entities of the selected entity type.
// All the entities will be added to the options as a dropdown list.
export const fetchEntities = async (entityType: string, value: string, callback: (any: any) => void) => {
    if (timeout) {
        clearTimeout(timeout);
        timeout = null;
    }

    const fetchData = () => {
        console.log("fetchEntities: ", entityType, value)
        getEntities({
            query_str: makeQueryEntityStr({ id: value, name: value, label: entityType }),
            page: 1,
            page_size: 100,
        })
            .then((response: EntityRecordsResponse) => {
                const { records } = response;
                const formatedData = records.map((item: Entity) => ({
                    value: `${item['id']}`,
                    text: formatLabelOption(item),
                }));
                console.log('Get Entities: ', formatedData, records);
                // const options = formatedData.map(d => <Option key={d.value}>{d.text}</Option>);
                const options = formatedData.map((d: any) => {
                    return { label: d.text, value: d.value, order: 0 };
                });

                callback(sortBy(options, ['label']));
            })
            .catch((error: any) => {
                console.log('requestNodes Error: ', error);
                callback([]);
            });
    };

    timeout = setTimeout(fetchData, 300);
};