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

import "./index.less";

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
  keySentences?: string[];
  getEntityTypes?: () => Promise<any>;
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
  options,
  ...restProps
}) => {
  const inputNode =
    inputType === "text" ? (
      <TextArea rows={8} placeholder="Please input key sentence!" />
    ) : (
      <Select
        showSearch
        allowClear
        defaultActiveFirstOption={false}
        placeholder={placeholder}
        options={options}
        filterOption={false}
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

type Entity = {
  idx: number;
  id: string;
  name: string;
  label: string;
  resource: string;
  taxid: string;
  description?: string;
};

const GraphTable: React.FC<GraphTableProps> = (props) => {
  const [form] = Form.useForm();
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [optionsMap, setOptionsMap] = useState<Record<string, Array<Entity>>>({
    "Gene:Test": [
      {
        idx: 0,
        id: "1",
        name: "Gene1",
        label: "Gene",
        resource: "Test",
        taxid: "9606",
      },
      {
        idx: 1,
        id: "2",
        name: "Gene2",
        label: "Gene",
        resource: "Test",
        taxid: "9606",
      },
    ],
  });

  const [editingKey, setEditingKey] = useState("");

  const genRowKey = (record: GraphEdge) => {
    return `${record.source_name}:${record.target_name}`;
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

  const formatLabelOption = (item: Entity) => {
    if (item.label == "Gene") {
      // TODO: How to deal with multiple species in the future?
      if (item.taxid) {
        return `${item.name} | ${item.id} | ${item.taxid} | ${item.resource}`;
      } else {
        return `${item.name} | ${item.id} | Unknown | ${item.resource}`;
      }
    } else {
      return `${item.name} | ${item.id} | ${item.resource}`;
    }
  };

  const formatKeySentenceOptions = (keySentences: string[] | undefined) => {
    if (keySentences) {
      return keySentences.map((item: string) => ({
        label: item,
        value: item,
      }));
    } else {
      return [];
    }
  };

  const formatEntityIdOptions = (entities: Entity[] | undefined) => {
    if (!entities) {
      return [
        {
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
      const options = formatedData.map((d: any) => {
        return { label: d.text, value: d.value };
      });

      return options;
    }
  };

  const mergedColumns = columns.map((col) => {
    if (
      [
        "actions",
        "pmid",
        "created_at",
        "source_name",
        "target_name",
        "source_type",
        "target_type",
      ].includes(col.key as string)
    ) {
      return col;
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
          options: formatEntityIdOptions(
            optionsMap[`${record.source_type}:${record.source_name}`]
          ),
          placeholder: "Please select source id!",
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
          options: formatEntityIdOptions(
            optionsMap[`${record.target_type}:${record.target_name}`]
          ),
          placeholder: "Please select target id!",
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
          options: [
            { label: "relation_type1", value: "relation_type1" },
            { label: "relation_type2", value: "relation_type2" },
          ],
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
