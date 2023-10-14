import React, { useEffect, useState } from "react";
import {
  Table,
  Row,
  Tag,
  Space,
  message,
  Popover,
  Button,
  Select,
  Form,
  Input,
  Empty,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import type {
  GraphEdge,
  GraphTableData,
  DeleteKnowledgeByIdFn,
} from "biominer-components/dist/esm/components/KnowledgeGraphEditor/index.t";
import {
  deleteCuratedKnowledge,
  putCuratedKnowledge,
  postCuratedKnowledge,
  // @ts-ignore
} from "@/api/swagger/KnowledgeGraph";
import type {
  Options,
  GroupOptions,
  GroupOptionType,
  OptionType,
  RelationStat,
  EntityStat,
  Entity,
  CachedData,
} from "./utils";
import {
  formatEntityTypeOptions,
  fetchEntities,
  checkNodeId,
  formatKeySentenceOptions,
  formatRelationTypeOptions,
  makeQueryKnowledgeStr,
  formatEntityIdOptions,
} from "./utils";

import "./index.less";
import { uniq, uniqBy, isEqual, sortBy } from "lodash";
import { fetchCuratedKnowledges } from "../../../api/swagger/KnowledgeGraph";

const TextArea = Input.TextArea;

export const exampleData: GraphEdge[] = [
  {
    source_name: "Test",
    source_id: "",
    source_type: "Gene",
    target_name: "Test",
    target_id: "",
    target_type: "Gene",
    relation_type: "relation_type",
    key_sentence: "key_sentence",
    pmid: 123456,
  },
];

type Pagination = {
  current?: number;
  pageSize?: number;
};

type GraphTableProps = {
  data: GraphTableData;
  keySentences: string[];
  relationStat: RelationStat[];
  entityStat: EntityStat[];
  matchedEntities?: Array<Entity>;
  onChange?: (pagination: Pagination) => void;
  height?: number | string;
};

interface EditableCellProps extends React.HTMLAttributes<HTMLElement> {
  editing: boolean;
  dataIndex: string;
  title: any;
  inputType: "select" | "text";
  record: GraphEdge;
  index: number;
  children: React.ReactNode;
  placeholder?: string;
  options?: GroupOptions;
  onSearch?: (
    entityType: string,
    value: string,
    callback: (any: any) => void
  ) => void;
  entityType?: string;
  updateEntityType?: (entityType?: string) => string;
  updateCachedDataItem?: (
    key: string,
    item: Entity | string | OptionType
  ) => void;
  dynamicCheckRule?: {
    validator: (rule: any, value: any) => Promise<void>;
    message?: string;
  };
  parentId?: string;
}

const EditableCell: React.FC<EditableCellProps> = ({
  editing,
  dataIndex,
  title,
  inputType,
  record,
  index,
  children,
  placeholder,
  entityType,
  updateEntityType,
  options,
  parentId,
  onSearch,
  dynamicCheckRule,
  updateCachedDataItem,
  ...restProps
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [selectOptions, setSelectOptions] = useState<GroupOptions>(
    options || []
  );

  // console.log(
  //   "EditableCell: ",
  //   options,
  //   selectOptions,
  //   loading,
  //   onSearch,
  //   record
  // );

  const isGroupOptions = (
    options: Options | GroupOptions | undefined
  ): boolean => {
    if (!options) {
      return false;
    }

    return options.length > 0 && options[0].hasOwnProperty("options");
  };

  const mergeGroupOptions = (groupOptions: GroupOptions): GroupOptions => {
    const labels = groupOptions.map((groupOption) => groupOption.label);
    const uniqLabels = uniq(labels);
    const mergedOptions: GroupOptions = [];
    uniqLabels.forEach((label) => {
      const mergedOption: GroupOptionType = {
        label: label,
        options: [],
      };
      groupOptions.forEach((groupOption) => {
        if (groupOption.label === label) {
          mergedOption.options = mergedOption.options.concat(
            groupOption.options
          );
        }
      });
      mergedOptions.push(mergedOption);
    });

    return mergedOptions;
  };

  const uniqGroupOptions = (groupOptions: GroupOptions): GroupOptions => {
    const uniqOptions: GroupOptions = [];
    groupOptions.forEach((groupOption) => {
      const uniqOption: GroupOptionType = {
        label: groupOption.label,
        options: [],
      };
      uniqOption.options = uniqBy(groupOption.options, "value");
      uniqOptions.push(uniqOption);
    });

    return uniqOptions;
  };

  const sortByLabel = (options: GroupOptions): GroupOptions => {
    return sortBy(options, "label");
  };

  const removeItemsFromOptions = (
    options: Options,
    items: Options
  ): Options => {
    if (items.length === 0) {
      return options;
    }

    if (options.length === 0) {
      return [];
    }

    const itemValues = items.map((item) => item.value);
    return options.filter((option) => !itemValues.includes(option.value));
  };

  // Only for selecting entity id
  const mergeOptions = (
    historyOptions: OptionType[],
    newOptions: GroupOptions
  ) => {
    // Common - History - Search Results
    const mergedOptions = [
      {
        label: "History",
        options: historyOptions,
      },
      ...newOptions,
      ...selectOptions,
      {
        label: "Search Results",
        options: [],
      },
      {
        label: "Common",
        options: [],
      },
    ];

    let options = sortByLabel(
      uniqGroupOptions(mergeGroupOptions(mergedOptions))
    );
    // Remote all items in history from search results, otherwise it will cause disordered options
    let newSearchOptions = removeItemsFromOptions(
      options[2].options,
      options[1].options
    );

    if (options[2].options) {
      options[2].options = newSearchOptions;
    }

    setSelectOptions(options);
  };

  const loadOptions = () => {
    const cachedData =
      window.localStorage.getItem("cached-kg-editor-data") || "{}";
    if (cachedData) {
      const parsedData = JSON.parse(cachedData);
      if (parsedData.entityOptions) {
        return parsedData.entityOptions;
      }
    }

    return [];
  };

  const EntityCard = (metadata: Entity | undefined) => {
    if (!metadata) {
      return (
        <div>
          No metadata found!
        </div>
      );
    } else {
      return (
        <div>
          <p style={{ marginBottom: "5px" }}>
            <span style={{ fontWeight: "bold" }}>Synonyms: </span>
            {metadata.synonyms || "No synonyms found!"}
          </p>
          <p style={{ marginBottom: "5px" }}>
            <span style={{ fontWeight: "bold" }}>Xrefs: </span>
            {metadata.xrefs || "No xrefs found!"}
          </p>
          <p style={{ marginBottom: "5px" }}>
            <span style={{ fontWeight: "bold" }}>Description: </span>
            {metadata.description || "No description found!"}
          </p>
          <p style={{ marginBottom: "5px" }}>
            <span style={{ fontWeight: "bold" }}>ID: </span>
            {metadata.id}
          </p>
          <p style={{ marginBottom: "5px" }}>
            <span style={{ fontWeight: "bold" }}>Name: </span>
            {metadata.name}
          </p>
          <p style={{ marginBottom: "5px" }}>
            <span style={{ fontWeight: "bold" }}>Label: </span>
            {metadata.label}
          </p>
        </div>
      );
    }
  }

  const inputNode =
    inputType === "text" ? (
      <TextArea rows={8} placeholder="Please input key sentence!" />
    ) : (
      <Select
        showSearch
        allowClear
        defaultActiveFirstOption={false}
        placeholder={placeholder}
        // @ts-ignore
        // options={selectOptions}
        filterOption={false}
        loading={loading}
        onSearch={(value) => {
          entityType = updateEntityType ? updateEntityType(entityType) : entityType;
          if (onSearch && entityType && value) {
            setSelectOptions(options || []);
            setLoading(true);
            onSearch(entityType, value, (data: Options) => {
              setLoading(false);

              mergeOptions(loadOptions(), [
                {
                  label: "Search Results",
                  options: data,
                },
              ]);
            });
          }
        }}
        onFocus={() => {
          if (entityType) {
            mergeOptions(loadOptions(), options || []);
          } else {
            if (isGroupOptions(options)) {
              // Don't worry about this warning, the options is always GroupOptions
              // @ts-ignore
              setSelectOptions(uniqGroupOptions(options) || []);
            } else {
              setSelectOptions(uniqBy(options, "value") || []);
            }
          }
        }}
        onSelect={(value, option) => {
          if (
            updateCachedDataItem &&
            entityType &&
            option.label !== "Unknown"
          ) {
            console.log("onSelect: ", value, option);
            // Keep the selected entity in cache for future use
            updateCachedDataItem("entityOptions", {
              label: option.key,
              value: value,
              order: 0,
            });
          }
        }}
        notFoundContent={
          <Empty description={options ? placeholder : "Not Found"} />
        }
      >
        {
          isGroupOptions(selectOptions) ? selectOptions.map((groupOption) => {
            console.log("Group Option: ", groupOption);
            return (
              groupOption.options && groupOption.options.length > 0 &&
              <Select.OptGroup label={groupOption.label} key={groupOption.label}>
                {groupOption.options.map((option) => {
                  return (
                    <Select.Option
                      key={option.label}
                      value={option.value}
                      disabled={option.disabled}
                    >
                      {option.metadata ? (
                        <Popover placement="rightTop" title={option.label} content={EntityCard(option.metadata)}
                          trigger="hover" getPopupContainer={(triggeredNode) => (parentId && document.getElementById(parentId)) || triggeredNode} overlayClassName="entity-id-popover" autoAdjustOverflow={false}
                        >
                          {option.label}
                        </Popover>
                      ) : (
                        option.label
                      )}
                    </Select.Option>
                  );
                })}
              </Select.OptGroup>
            );
          }) : selectOptions.map((option) => {
            // Some options may not be a group option, so we need to wrap it with a Select.Option directly.
            return (
              <Select.Option
                key={option.label}
                // @ts-ignore
                value={option.value}
                // @ts-ignore
                disabled={option.disabled}
              >
                {option.label}
              </Select.Option>
            );
          })
        }
      </Select>
    );

  return (
    <td {...restProps}>
      {editing ? (
        <Form.Item
          name={dataIndex}
          style={{ margin: 0 }}
          rules={[
            {
              required: true,
              message: placeholder,
            },
            dynamicCheckRule ? dynamicCheckRule : {},
          ]}
        >
          {inputNode}
        </Form.Item>
      ) : (
        children
      )}
    </td>
  );
};

const GraphTable: React.FC<GraphTableProps> = (props) => {
  const [form] = Form.useForm();
  const [data, setData] = useState<GraphEdge[]>(props.data.data || []);
  const [cachedData, setCachedData] = useState<CachedData>({});
  const [page, setPage] = useState<number>(props.data.page || 1);
  const [pageSize, setPageSize] = useState<number>(props.data.pageSize || 10);
  const [total, setTotal] = useState<number>(props.data.total || 0);
  const [entityTypeOptions, setEntityTypeOptions] = useState<GroupOptions>([]);

  useEffect(() => {
    const cachedData = loadCachedData();
    setCachedData(cachedData);

    setEntityTypeOptions(formatEntityTypeOptions(props.entityStat));

    const pmids = uniq(data.map((item) => item.pmid));
    const curators = uniq(data.map((item) => item.curator));

    if (pmids && pmids.length == 1 && curators && curators.length == 1) {
      fetchCuratedKnowledges({
        page: page,
        page_size: pageSize,
        query_str: makeQueryKnowledgeStr({
          pmid: pmids[0],
          curator: curators[0],
        }),
      })
        .then((response: any) => {
          console.log("Fetch curated knowledges: ", response);
          // Merge the data from database and the data from the table
          // If the data from the table is not same with the data from the database, we will use the data from the database, otherwise we will use the data from the table.
          const records = response.records;
          setTotal(response.total);
          const newData = [...data];
          records.forEach((record: GraphEdge) => {
            const index = newData.findIndex(
              (item) => genRowKey(item) === genRowKey(record)
            );
            if (index > -1) {
              const item = newData[index];
              newData.splice(index, 1, {
                ...item,
                ...record,
              });
            } else {
              newData.push(record);
            }
          });

          setData(newData);
          message.success("Fetch curated knowledges successfully!");
        })
        .catch((error: any) => {
          console.log("Fetch curated knowledges error: ", error);
          message.error(
            "Cannot fetch curated knowledges, please contact your administrator or try again later!"
          );
        });
    } else {
      console.log("Cannot fetch curated knowledges: ", pmids, curators);
      message.error(
        "Cannot fetch curated knowledges, there are multiple pmids or curators!"
      );
    }
  }, [page, pageSize]);

  const [editingKey, setEditingKey] = useState("");

  const genRowKey = (record: GraphEdge) => {
    return `${record.source_name}:${record.target_name}`;
  };

  const loadCachedData = () => {
    const cachedData = JSON.parse(
      window.localStorage.getItem("cached-kg-editor-data") || "{}"
    );
    return cachedData;
  };

  const getCachedDataItem = (key: string) => {
    if (cachedData[key]) {
      return cachedData[key];
    } else {
      return [];
    }
  };

  const updateCachedDataItem = (key: string, item: Entity | string) => {
    if (cachedData[key]) {
      cachedData[key].push(item);
      cachedData[key] = uniqBy(cachedData[key], "value");
    } else {
      cachedData[key] = [item];
    }
    window.localStorage.setItem(
      "cached-kg-editor-data",
      JSON.stringify(cachedData)
    );
  };

  const isEditing = (record: GraphEdge) => genRowKey(record) === editingKey;

  const edit = (record: GraphEdge) => {
    form.setFieldsValue({ ...record });
    setEditingKey(genRowKey(record));
  };

  const cancel = () => {
    setEditingKey("");
  };

  const columns: ColumnsType<GraphEdge> = [
    {
      title: "Source Name",
      dataIndex: "source_name",
      key: "source_name",
      align: "left",
      fixed: "left",
      width: 150,
    },
    {
      title: "Source Type",
      dataIndex: "source_type",
      align: "center",
      key: "source_type",
      fixed: "left",
      width: 150,
    },
    {
      title: "Source ID",
      dataIndex: "source_id",
      align: "center",
      key: "source_id",
      width: 180,
    },
    {
      title: "Target Name",
      dataIndex: "target_name",
      align: "center",
      key: "target_name",
      // fixed: "left",
      width: 150,
    },
    {
      title: "Target Type",
      dataIndex: "target_type",
      align: "center",
      key: "target_type",
      // fixed: "left",
      width: 150,
    },
    {
      title: "Target ID",
      dataIndex: "target_id",
      align: "center",
      key: "target_id",
      width: 180,
    },
    {
      title: "Relation Type",
      key: "relation_type",
      align: "center",
      dataIndex: "relation_type",
      width: 240,
    },
    {
      title: "Key Sentence",
      dataIndex: "key_sentence",
      align: "center",
      key: "key_sentence",
      width: 150,
      ellipsis: true,
    },
    // {
    //   title: "Created Time",
    //   key: "created_at",
    //   align: "center",
    //   dataIndex: "created_at",
    //   render: (text) => {
    //     return new Date(text).toLocaleString();
    //   },
    //   width: 200,
    // },
    {
      title: "PMID",
      dataIndex: "pmid",
      align: "center",
      key: "pmid",
      render: (text) => {
        return (
          <a
            target="_blank"
            href={`https://pubmed.ncbi.nlm.nih.gov/?term=${text}`}
          >
            {text}
          </a>
        );
      },
      fixed: "right",
      width: 100,
    },
    {
      title: "Actions",
      key: "actions",
      align: "center",
      fixed: "right",
      width: 220,
      render: (text, record) => {
        return (
          <Space>
            <div>
              <Button
                size="small"
                onClick={() => {
                  if (editingKey == "") {
                    edit(record);
                  } else {
                    cancel();
                  }
                }}
              >
                {isEditing(record) ? "Cancel" : "Edit"}
              </Button>
            </div>
            <div>
              <Button
                size="small"
                onClick={() => {
                  editKnowledge(record);
                }}
              >
                Update
              </Button>
            </div>
            <div>
              <Popover
                className="delete-popover"
                content={
                  <div>
                    <p style={{ marginBottom: "5px" }}>
                      Are you sure to delete this knowledge?
                    </p>
                    <p
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        marginBottom: "0",
                      }}
                    >
                      <Button
                        danger
                        size="small"
                        onClick={() => {
                          if (record.id !== undefined && record.id >= 0) {
                            deleteCuratedKnowledge({
                              id: record.id,
                            })
                              .then((response: any) => {
                                message.success(
                                  "Delete knowledge successfully!"
                                );
                                reforceUpdateTable();
                              })
                              .catch((error: any) => {
                                console.log("Delete knowledge error: ", error);
                                message.error("Delete knowledge failed!");
                              });
                          } else {
                            message.error("Delete knowledge failed!");
                            console.log("Delete knowledge error: ", record);
                          }
                        }}
                      >
                        Confirm
                      </Button>
                    </p>
                  </div>
                }
                title="Comfirm"
                trigger="click"
              >
                {/* If we cannot find id in the record, this means that the record is not in the database. */}
                <Button
                  danger
                  size="small"
                  disabled={
                    record.id !== undefined && record.id >= 0 ? false : true
                  }
                >
                  Delete
                </Button>
              </Popover>
            </div>
          </Space>
        );
      },
    },
  ];

  const mergedColumns = columns.map((col) => {
    if (
      [
        "actions",
        "pmid",
        "created_at",
        "source_name",
        "target_name",
        // "source_type",
        // "target_type",
      ].includes(col.key as string)
    ) {
      return col;
    }

    if (col.key === "source_type") {
      return {
        ...col,
        onCell: (record: GraphEdge) => ({
          record,
          inputType: "select",
          dataIndex: "source_type",
          title: col.title,
          editing: isEditing(record),
          options: entityTypeOptions,
          placeholder: "Please select source type!",
        }),
      };
    }

    if (col.key === "target_type") {
      return {
        ...col,
        onCell: (record: GraphEdge) => ({
          record,
          inputType: "select",
          dataIndex: "target_type",
          title: col.title,
          editing: isEditing(record),
          options: entityTypeOptions,
          placeholder: "Please select target type!",
        }),
      };
    }

    if (col.key === "source_id") {
      return {
        ...col,
        onCell: (record: GraphEdge) => ({
          record,
          inputType: "select",
          dataIndex: "source_id",
          parentId: "graph-table-container", // Please refer to a suitable container for the popover
          title: col.title,
          editing: isEditing(record),
          options: formatEntityIdOptions([]),
          placeholder: "Please select source id!",
          onSearch: fetchEntities,
          entityType: record.source_type,
          updateEntityType: (entityType?: string) => {
            return form.getFieldValue("source_type") || entityType;
          },
          dynamicCheckRule: {
            validator: (rule: any, value: string) => {
              const sourceType = form.getFieldValue('source_type');
              if (value && sourceType) {
                return checkNodeId(sourceType, value);
              }
            }
          },
          updateCachedDataItem: updateCachedDataItem,
        }),
      };
    }

    if (col.key === "target_id") {
      return {
        ...col,
        onCell: (record: GraphEdge) => ({
          record,
          inputType: "select",
          dataIndex: "target_id",
          parentId: "graph-table-container", // Please refer to a suitable container for the popover
          title: col.title,
          editing: isEditing(record),
          options: formatEntityIdOptions([]),
          placeholder: "Please select target id!",
          onSearch: fetchEntities,
          entityType: record.target_type,
          updateEntityType: (entityType?: string) => {
            return form.getFieldValue("target_type") || entityType;
          },
          dynamicCheckRule: {
            validator: (rule: any, value: string) => {
              const targetType = form.getFieldValue('target_type');
              if (value && targetType) {
                return checkNodeId(targetType, value);
              }
            }
          },
          updateCachedDataItem: updateCachedDataItem,
        }),
      };
    }

    if (col.key === "relation_type") {
      return {
        ...col,
        onCell: (record: GraphEdge) => ({
          record,
          inputType: "select",
          dataIndex: "relation_type",
          title: col.title,
          editing: isEditing(record),
          options: formatRelationTypeOptions(props.relationStat, record),
          placeholder: "Please select relation type!",
        }),
      };
    }

    if (col.key === "key_sentence") {
      return {
        ...col,
        onCell: (record: GraphEdge) => ({
          record,
          inputType: "select",
          dataIndex: "key_sentence",
          title: col.title,
          editing: isEditing(record),
          options: formatKeySentenceOptions(props.keySentences),
          placeholder: "Please input key sentence!",
        }),
      };
    }
  });

  const reforceUpdateTable = () => {
    if (props.onChange) {
      props.onChange({
        current: props.data.page,
        pageSize: props.data.pageSize,
      });
    }
  };

  const editKnowledge = async (record: GraphEdge) => {
    form
      .validateFields()
      .then((row) => {
        const payload = {
          ...record,
          ...row,
        };

        // Properties `created_at` is read only.
        delete payload.created_at;
        delete record.created_at;

        if (isEqual(payload, record)) {
          message.warning("Nothing changed!");
          return;
        }

        if (row) {
          console.log("Edit knowledge: ", payload, row, record);

          const id = payload.id;
          // Properties `id` is read only.
          delete payload.id;
          if (id !== undefined && id >= 0) {
            putCuratedKnowledge(
              {
                id: id,
              },
              payload
            )
              .then((response: any) => {
                message.success("Update knowledge successfully!");
                reforceUpdateTable();
              })
              .catch((error: any) => {
                console.log("Update knowledge error: ", error);
                message.error("Update knowledge failed!");
              })
              .finally(() => {
                cancel();
              });
          } else {
            postCuratedKnowledge(payload)
              .then((response: any) => {
                message.success("Create knowledge successfully!");
                reforceUpdateTable();
              })
              .catch((error: any) => {
                console.log("Create knowledge error: ", error);
                message.error("Create knowledge failed!");
              })
              .finally(() => {
                cancel();
              });
          }
        } else {
          console.log("Cannot edit knowledge: ", record, row);
          message.warning(
            "Cannot update knowledge, please fill the form first!"
          );
        }
      })
      .catch((error) => {
        console.log("Validate error: ", error);
      });
  };

  // console.log("Merged Columns: ", columns, mergedColumns, props.data.data);

  return (
    <Row className="graph-table-container" id="graph-table-container">
      <Form form={form} component={false}>
        <Table
          size="small"
          className="graph-table"
          // @ts-ignore
          columns={mergedColumns}
          components={{
            body: {
              cell: EditableCell,
            },
          }}
          scroll={{ x: 1000, y: props.height || 500 }}
          dataSource={data}
          rowKey={(record) => genRowKey(record)}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            pageSizeOptions: ["10", "20", "50", "100"],
            current: page,
            pageSize: pageSize,
            total: total,
            position: ["bottomRight"],
            showTotal: (total) => {
              return `Total ${total} items`;
            },
          }}
          onChange={(pagination) => {
            setPage(pagination.current || 1);
            setPageSize(pagination.pageSize || 10);
            // if (props.onChange) {
            //   props.onChange(pagination);
            //   setPage(pagination.current || 1);
            //   setPageSize(pagination.pageSize || 10);
            // }
          }}
          expandable={{
            expandedRowRender: (record) => (
              <p style={{ margin: 0 }}>{record.key_sentence}</p>
            ),
            rowExpandable: (record) =>
              record.key_sentence !== "" && record.key_sentence !== null,
          }}
        ></Table>
      </Form>
    </Row>
  );
};

export default GraphTable;
