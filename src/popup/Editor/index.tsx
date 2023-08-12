import React from "react";
import GraphForm from "biominer-components/dist/esm/components/KnowledgeGraphEditor/GraphForm";
import GraphTable from "biominer-components/dist/esm/components/KnowledgeGraphEditor/GraphTable";
import { Row, Col, Tabs, Empty } from "antd";
import type {
  GraphEdge,
  GraphTableData,
} from "biominer-components/dist/esm/components/KnowledgeGraphEditor/index.t";
import { TableOutlined, BulbOutlined } from "@ant-design/icons";
import {
  initRequest,
  fetchCuratedKnowledges as getKnowledges,
  fetchStatistics as getStatistics,
  fetchEntities as getEntities,
  postCuratedKnowledge as postKnowledge,
  putCuratedKnowledge as putKnowledgeById,
  deleteCuratedKnowledge as deleteKnowledgeById,
  // @ts-ignore
} from "@/api/swagger/KnowledgeGraph";
import "./index.less";

type KnowledgeGraphEditorProps = {};

const KnowledgeGraphEditor: React.FC<KnowledgeGraphEditorProps> = (props) => {
  // Initalize the request configuration, load the authentication token from the local storage.
  initRequest();
  const [refreshKey, setRefreshKey] = React.useState<number>(0);
  const [formData, setFormData] = React.useState<GraphEdge>({} as GraphEdge);

  const onSubmitKnowledge = (data: GraphEdge): Promise<GraphEdge> => {
    console.log("Submit knowledge: ", data);
    return new Promise((resolve, reject) => {
      if (data.id !== undefined && data.id >= 0) {
        // The backend API requires the id field to be removed
        let id = data.id;
        delete data.id;
        putKnowledgeById(id, data)
          .then((response: any) => {
            console.log("Put knowledge: ", response);
            setRefreshKey(refreshKey + 1);
            resolve(response);
          })
          .catch((error: any) => {
            console.log("Put knowledge error: ", error);
            setRefreshKey(refreshKey + 1);
            reject(error);
          });
      } else {
        postKnowledge(data)
          .then((response: any) => {
            console.log("Post knowledge: ", response);
            setRefreshKey(refreshKey + 1);
            resolve(response);
          })
          .catch((error: any) => {
            console.log("Post knowledge error: ", error);
            setRefreshKey(refreshKey + 1);
            reject(error);
          });
      }
    });
  };

  const getKnowledgesData = (
    page: number,
    pageSize: number
  ): Promise<GraphTableData> => {
    return new Promise((resolve, reject) => {
      getKnowledges({
        page: page,
        page_size: pageSize,
      })
        .then((response: any) => {
          console.log("Get knowledges: ", response);
          resolve({
            data: response.records,
            total: response.total,
            page: page,
            pageSize: pageSize,
          });
        })
        .catch((error: any) => {
          console.log("Get knowledges error: ", error);
          reject(error);
        });
    });
  };

  const editKnowledge = (record: GraphEdge) => {
    console.log("Edit knowledge: ", record);
    setFormData(record);
  };

  const tableItems = [
    {
      key: "table-viewer",
      label: (
        <span>
          <TableOutlined />
          Table Viewer
        </span>
      ),
      children: (
        <GraphTable
          key={"refreshKey"}
          getTableData={getKnowledgesData}
          editKnowledge={editKnowledge}
          deleteKnowledgeById={deleteKnowledgeById}
        />
      ),
    },
    {
      key: "graph-viewer",
      label: (
        <span>
          <BulbOutlined />
          Graph Viewer
        </span>
      ),
      children: <Empty />,
      disabled: true,
    },
  ];

  const items = [
    {
      key: "graph-editor",
      label: (
        <span>
          <TableOutlined />
          Editor
        </span>
      ),
      children: (
        <GraphForm
          onSubmit={onSubmitKnowledge}
          formData={formData}
          onClose={() => {
            setFormData({} as GraphEdge);
          }}
          getEntities={getEntities}
          getStatistics={getStatistics}
        />
      ),
    },
    {
      key: "graph-table",
      label: (
        <span>
          <BulbOutlined />
          Graph Viewer
        </span>
      ),
      children: (
        <Tabs
          className="knowledge-graph-table"
          size="small"
          defaultActiveKey="table-viewer"
          items={tableItems}
        />
      ),
    },
  ];

  return (
    <Tabs
      className="knowledge-graph-editor"
      size="small"
      defaultActiveKey="graph-editor"
      items={items}
    />
  );
};

export default KnowledgeGraphEditor;
