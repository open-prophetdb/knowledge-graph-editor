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
  formatKeySentenceOptions,
  formatRelationTypeOptions,
} from "./utils";

import "./index.less";
import { uniqBy } from "lodash";

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
  update?: (record: GraphEdge) => void;
  delete?: DeleteKnowledgeByIdFn;
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
  options?: any[];
  onSearch?: (
    entityType: string,
    value: string,
    callback: (any: any) => void
  ) => void;
  entityType?: string;
  updateCachedDataItem?: (
    key: string,
    item: Entity | string | OptionType
  ) => void;
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
  options,
  onSearch,
  updateCachedDataItem,
  ...restProps
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [selectOptions, setSelectOptions] = useState<Options | GroupOptions>(
    options || []
  );

  console.log("EditableCell: ", options, selectOptions, loading, onSearch);

  // Only for selecting entity id
  const mergeOptions = (
    historyOptions: OptionType[],
    newOptions: OptionType[]
  ) => {
    const mergedOptions = [
      {
        label: "History",
        options: historyOptions,
      },
      {
        label: "Search Results",
        options: newOptions,
      },
    ];

    const index = selectOptions.findIndex(
      (option) => option.label === "Search Results"
    );

    if (index >= 0) {
      const searchOptions = selectOptions[index] as GroupOptionType;
      if (searchOptions && searchOptions.options) {
        mergedOptions[1].options = uniqBy(
          [...searchOptions.options, ...newOptions],
          "value"
        );
      }
    }

    setSelectOptions(mergedOptions);
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

  useEffect(() => {
    if (entityType) {
      mergeOptions(loadOptions(), options || []);
    }
  }, []);

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
        options={selectOptions}
        filterOption={false}
        loading={loading}
        onSearch={(value) => {
          if (onSearch && entityType && value) {
            setSelectOptions(options || []);
            setLoading(true);
            onSearch(entityType, value, (data: any) => {
              setLoading(false);

              mergeOptions(loadOptions(), data);
            });
          }
        }}
        onFocus={() => {
          if (entityType) {
            mergeOptions(loadOptions(), options || []);
          }
        }}
        onSelect={(value, option) => {
          if (updateCachedDataItem && entityType) {
            // Keep the selected entity in cache for future use
            updateCachedDataItem("entityOptions", {
              label: option.label,
              value: value,
              order: 0,
            });
          }
        }}
        notFoundContent={
          <Empty description={options ? placeholder : "Not Found"} />
        }
      ></Select>
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
  const [cachedData, setCachedData] = useState<CachedData>({});
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [entityTypeOptions, setEntityTypeOptions] = useState<Options>([]);

  useEffect(() => {
    const cachedData = loadCachedData();
    setCachedData(cachedData);

    setEntityTypeOptions(formatEntityTypeOptions(props.entityStat));
  }, []);

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
      align: "center",
      fixed: "left",
      width: 200,
    },
    {
      title: "Source Type",
      dataIndex: "source_type",
      align: "center",
      key: "source_type",
      fixed: "left",
      width: 120,
    },
    {
      title: "Target Name",
      dataIndex: "target_name",
      align: "center",
      key: "target_name",
      // fixed: "left",
      width: 200,
    },
    {
      title: "Target Type",
      dataIndex: "target_type",
      align: "center",
      key: "target_type",
      // fixed: "left",
      width: 100,
    },
    {
      title: "Source ID",
      dataIndex: "source_id",
      align: "center",
      key: "source_id",
      width: 180,
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
                disabled={props.update ? false : true}
                onClick={() => {
                  editKnowledge(record);
                }}
              >
                Update
              </Button>
            </div>
            <div>
              <Popover
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
                          if (
                            record.id !== undefined &&
                            record.id >= 0 &&
                            props.delete
                          ) {
                            props
                              .delete(record.id)
                              .then((response: any) => {
                                message.success(
                                  "Delete knowledge successfully!"
                                );
                              })
                              .catch((error: any) => {
                                console.log("Delete knowledge error: ", error);
                                message.error("Delete knowledge failed!");
                              });
                          } else {
                            message.error("Delete knowledge failed!");
                            console.log(
                              "Delete knowledge error: ",
                              record,
                              props.delete
                            );
                          }
                        }}
                      >
                        Confirm
                      </Button>
                    </p>
                  </div>
                }
                title="Comfirm"
              >
                <Button
                  danger
                  size="small"
                  disabled={props.delete ? false : true}
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
      ["actions", "pmid", "created_at", "source_name", "target_name"].includes(
        col.key as string
      )
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
          title: col.title,
          editing: isEditing(record),
          options: [],
          placeholder: "Please select source id!",
          onSearch: fetchEntities,
          entityType: record.source_type,
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
          title: col.title,
          editing: isEditing(record),
          options: [],
          placeholder: "Please select target id!",
          onSearch: fetchEntities,
          entityType: record.target_type,
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
          options: formatRelationTypeOptions(
            props.relationStat,
            record.source_type,
            record.target_type
          ),
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

  const editKnowledge = (record: GraphEdge) => {
    if (props.update) {
      props.update(record);
    }
  };

  console.log("Merged Columns: ", columns, mergedColumns, props.data.data);

  return (
    <Row className="graph-table-container">
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
          dataSource={props.data.data || []}
          rowKey={(record) => genRowKey(record)}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            pageSizeOptions: ["10", "20", "50", "100"],
            current: page,
            pageSize: pageSize,
            total: props.data.total || 0,
            position: ["bottomRight"],
            showTotal: (total) => {
              return `Total ${total} items`;
            },
          }}
          onChange={(pagination) => {
            if (props.onChange) {
              props.onChange(pagination);
              setPage(pagination.current || 1);
              setPageSize(pagination.pageSize || 10);
            }
          }}
        ></Table>
      </Form>
    </Row>
  );
};

export default GraphTable;
