// eslint-disable-next-line no-undef
/*global chrome*/

import React, { useEffect } from "react";
import GraphForm from "biominer-components/dist/esm/components/KnowledgeGraphEditor/GraphForm";
import GraphTable from "biominer-components/dist/esm/components/KnowledgeGraphEditor/GraphTable";
import { Row, Col, Tabs, Empty, Button, Space } from "antd";
import type {
  GraphEdge,
  GraphTableData,
} from "biominer-components/dist/esm/components/KnowledgeGraphEditor/index.t";
import { TableOutlined, BulbOutlined, ForkOutlined } from "@ant-design/icons";
import {
  initRequest,
  fetchCuratedKnowledges as getKnowledges,
  fetchStatistics as getStatistics,
  fetchEntities as getEntities,
  postCuratedKnowledge as postKnowledge,
  putCuratedKnowledge as putKnowledgeById,
  deleteCuratedKnowledge as deleteKnowledgeById,
  getCurrentUser,
  // @ts-ignore
} from "@/api/swagger/KnowledgeGraph";
import "./index.less";
import { makeQueryKnowledgeStr } from "../../content/components/TableEditor/utils";

type KnowledgeGraphEditorProps = {};

const KnowledgeGraphEditor: React.FC<KnowledgeGraphEditorProps> = (props) => {
  const [refreshKey, setRefreshKey] = React.useState<number>(0);
  const [curator, setCurator] = React.useState<string>(""); // TODO: get the curator from the jwt token
  const [formData, setFormData] = React.useState<GraphEdge>({} as GraphEdge);

  useEffect(() => {
    getCurrentUser()
      .then((username: any) => {
        console.log("Get current user: ", username);
        setCurator(username);
      })
      .catch((error: any) => {
        console.log("Get current user error: ", error);
        setCurator("");
      });
  }, []);

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

  const forceUpdate = () => {
    setRefreshKey(refreshKey + 1);
  };

  const getKnowledgesData = (
    page: number,
    pageSize: number
  ): Promise<GraphTableData> => {
    return new Promise((resolve, reject) => {
      let queryParams = {
        page: page,
        page_size: pageSize,
        query_str: makeQueryKnowledgeStr({
          curator: "anonymous",
        }),
      };

      let queryStr = makeQueryKnowledgeStr({
        curator: curator,
      });

      let newQueryParams: any = queryParams;
      // Remove the empty fields
      if (curator !== "") {
        newQueryParams = {
          ...queryParams,
          query_str: queryStr,
        };
      }

      getKnowledges(newQueryParams)
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

  const items = [
    {
      key: "table-viewer",
      label: (
        <span>
          <BulbOutlined />
          Table Viewer
        </span>
      ),
      children: (
        <GraphTable
          yScroll={"calc(100vh - 160px)"}
          key={refreshKey}
          getTableData={getKnowledgesData}
          // Don'w allow to edit or delete the knowledge in a query table
          // editKnowledge={editKnowledge}
          // deleteKnowledgeById={deleteKnowledgeById}
        />
      ),
    },
    {
      key: "graph-viewer",
      label: (
        <span>
          <ForkOutlined />
          Graph Viewer
        </span>
      ),
      children: <Empty />,
      disabled: true,
    },
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
          curator={curator}
        />
      ),
    },
  ];

  return (
    <Tabs
      className="knowledge-graph-editor"
      size="small"
      defaultActiveKey="table-viewer"
      items={items}
      tabBarExtraContent={
        <Space>
          <Button type="primary" onClick={() => forceUpdate()}>
            Force Update
          </Button>
          <Button
            // @ts-ignore
            disabled={!(chrome && chrome.tabs)}
            type="primary"
            onClick={() => {
              // @ts-ignore
              chrome.tabs.create({
                // @ts-ignore
                url: chrome.runtime.getURL("index.html#/editor"),
              });
            }}
          >
            Open as Tab
          </Button>
        </Space>
      }
    />
  );
};

export default KnowledgeGraphEditor;
