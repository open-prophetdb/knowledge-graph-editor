// eslint-disable-next-line no-undef
/*global chrome*/
import { useEffect, useState } from "react";
import { Row, Modal, message, Button } from "antd";
import { CloudSyncOutlined, RestOutlined } from "@ant-design/icons";
import ReactDOM from "react-dom";
import TableEditor from "./components/TableEditor";
import {
  fetchStatistics,
  initRequest,
  getToken,
} from "@/api/swagger/KnowledgeGraph";
import ButtonGroup from "antd/es/button/button-group";
import { targetWebsite } from "@/api/swagger/KnowledgeGraph";

import Icon from "./images/icon.png";

import "./index.less";

const formatLabel = (label) => {
  const lowerc_label = label.toLowerCase().trim().replace(/[-_]/g, "");
  const labelMap = {
    gene: "Gene",
    disease: "Disease",
    drug: "Compound",
    chemical: "Compound",
    compound: "Compound",
    protein: "Protein",
    metabolite: "Metabolite",
    pathway: "Pathway",
    anatomy: "Anatomy",
    microbe: "Microbe",
    sideeffect: "SideEffect",
    symptom: "Symptom",
    cellularcomponent: "CellularComponent",
    biologicalprocess: "BiologicalProcess",
    molecularfunction: "MolecularFunction",
  };

  if (labelMap[lowerc_label]) {
    return labelMap[lowerc_label];
  } else {
    return label;
  }
};

const formatStat = (stat) => {
  // Make sure the stat is compatible with the current version
  if (stat.relationship_stat && stat.node_stat) {
    return {
      entity_stat: stat.node_stat.map((node) => {
        return {
          resource: node.source,
          entity_type: node.node_type.replace(/\s+/g, ""),
          entity_count: node.node_count,
        };
      }),
      relation_stat: stat.relationship_stat.map((relation) => {
        return {
          resource: relation.source,
          relation_type: relation.relation_type,
          relation_count: relation.relation_count,
          start_entity_type: relation.start_node_type.replace(/\s+/g, ""),
          end_entity_type: relation.end_node_type.replace(/\s+/g, ""),
        };
      }),
    };
  } else {
    return stat;
  }
};

const formatData = (annotations) => {
  const relations = annotations.filter((annotation) => {
    return annotation.type == "relation";
  });

  let knowledges = [];
  let keysentences = [];
  annotations.forEach((annotation) => {
    if (
      annotation.type == "labels" &&
      annotation.value.labels[0] === "key_sentence"
    ) {
      // Remote the heading and trailing spaces
      keysentences.push(annotation.value.text.trim());
    }
  });

  relations.forEach((relation) => {
    const from_id = relation.from_id;
    const to_id = relation.to_id;
    const relation_type = relation.labels[0]; // Only one label is allowed for a relation

    const from = annotations.find((annotation) => {
      return annotation.id == from_id;
    });
    const sourceNode = from.value;
    const sourceType = formatLabel(sourceNode.labels[0]); // Only one label is allowed for a node
    const sourceName = sourceNode.text.trim();

    const to = annotations.find((annotation) => {
      return annotation.id == to_id;
    });
    const targetNode = to.value;
    const targetType = formatLabel(targetNode.labels[0]); // Only one label is allowed for a node
    const targetName = targetNode.text.trim();

    if (!relation_type) {
      message.warning(
        `The relation between ${sourceName} and ${targetName} does not have a type, please check the annotation.`,
        20
      );
    }

    knowledges.push({
      source_name: sourceName,
      source_id: null,
      source_type: sourceType,
      target_name: targetName,
      target_id: null,
      target_type: targetType,
      key_sentence: null,
      relation_type: relation_type,
    });
  });

  return {
    knowledges: knowledges,
    keySentences: keysentences,
  };
};

const getUser = () => {
  return new Promise((resolve, reject) => {
    fetch(`${targetWebsite}/api/current-user/whoami`)
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        resolve(data);
      })
      .catch((error) => {
        console.log(error);
        reject(error);
      });
  });
};

const getAnnotations = () => {
  // More details about getting the current url, please access https://stackoverflow.com/a/59434377
  const url = window.location.href;
  // const url =
  // "https://prophet-studio.3steps.cn/projects/14/data?tab=38&task=17696";
  // Parse the url to get all the parameters
  let params = new URL(url).searchParams;
  console.log("params", url, params);
  const taskId = params.get("task");

  return new Promise((resolve, reject) => {
    if (taskId) {
      fetch(`${targetWebsite}/api/tasks/${taskId}`)
        .then((response) => response.json())
        .then((data) => {
          console.log("getAnnotations: ", data);
          resolve(data);
        })
        .catch((error) => {
          console.log("getAnnotations Error: ", error);
          reject(error);
        });
    } else {
      reject("No task id found");
    }
  });
};

// Filter, extract and merge the result in the annotations that are completed by the current user
const filterAnnotations = (annotations, curator) => {
  const filteredAnnotations = annotations.filter((annotation) => {
    return annotation.completed_by.email === curator;
  });

  if (filteredAnnotations.length === 0) {
    throw new Error(
      `No annotations found for the current user (${curator}) yet, please annotate them first.`
    );
  }

  if (filteredAnnotations.length > 1) {
    const results = filteredAnnotations.map((annotation) => {
      return annotation.result;
    });

    // Concat all the results
    const concatResults = results.reduce((accumulator, currentValue) => {
      return accumulator.concat(currentValue);
    });

    return concatResults;
  }

  if (filteredAnnotations.length === 1) {
    return filteredAnnotations[0].result;
  }
};

function Content() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [editorModalVisiable, setEditorModalVisiable] = useState(false);
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const [curator, setCurator] = useState(""); // TODO: Get the current user from the backend
  const [keySentences, setKeySentences] = useState([]);
  const [statistics, setStatistics] = useState({});

  const getCurrentUser = () => {
    return new Promise((resolve, reject) => {
      getUser()
        .then((response) => {
          const current_curator = response.email;
          setCurator(current_curator);
        })
        .catch((error) => {
          reject(error);
        });
    });
  };

  useEffect(() => {
    getCurrentUser();
    fetchStatistics()
      .then((response) => {
        console.log("statistics", response);
        setStatistics(formatStat(response));
      })
      .catch((error) => {
        console.log(error);
        message.error(
          "Failed to get metadata for the knowledge-graph-editor extension, please check your network connection or login status."
        );
        setStatistics({});
      });
  }, []);

  const handleOk = () => {
    setEditorModalVisiable(false);
    // TODO: Save all relations into database
  };

  const handleCancel = () => {
    setEditorModalVisiable(false);
  };

  const loadData = () => {
    if (!curator) {
      message.error(
        "Failed to get the current user, please refresh your page or login status."
      );
      return;
    }

    return new Promise((resolve, reject) => {
      getAnnotations()
        .then((response) => {
          const annotations = response.annotations;
          const filteredAnnotations = filterAnnotations(annotations, curator);
          console.log("filteredAnnotations", filteredAnnotations);
          const formattedData = formatData(filteredAnnotations);
          const pmid = response.data.pmid;

          const knowledges = formattedData.knowledges.map((knowledge) => {
            return {
              ...knowledge,
              pmid: pmid,
              curator: curator,
              // Convert time to a string
              created_at: new Date().toISOString(),
              key_sentence: null,
            };
          });

          const tableData = {
            total: knowledges.length,
            page: 1,
            pageSize: knowledges.length,
            data: knowledges,
          };

          console.log("formattedData", formattedData);
          console.log("knowledges", knowledges);
          console.log("keySentences", formattedData.keySentences);
          resolve({
            tableData: tableData,
            keySentences: formattedData.keySentences,
          });
        })
        .catch((error) => {
          reject(error);
        });
    });
  };

  const updateTable = () => {
    setLoading(true);
    loadData()
      .then((response) => {
        message.success(
          `Found ${response.tableData.total} knowledges and ${response.keySentences.length} key sentences, please annotate them in the knowledge graph editor.`
        );

        setData(response.tableData);
        setKeySentences(response.keySentences);
        setEditorModalVisiable(true);
        setLoading(false);
        // Reset the table
        setRefreshKey(refreshKey + 1);
      })
      .catch((error) => {
        console.log("Cannot get annotations, error message is", error);
        message.warning(`${error}`, 20);
        setLoading(false);
      });
  };

  const cleanCache = () => {
    window.localStorage.removeItem("cached-kg-editor-data");
    message.success("Clean cache successfully.");
    setRefreshKey(refreshKey + 1);
  };

  return (
    <Row className="knowledge-editor-fixed-content">
      <div
        className="knowledge-editor-fixed-button"
        style={{ display: loading ? "none" : "block" }}
        onClick={() => {
          setLoading(true);
          loadData()
            .then((response) => {
              setData(response.tableData);
              setKeySentences(response.keySentences);

              if (!response.tableData.total && !response.keySentences.length) {
                const error = `No annotations found for the current user (${curator}) yet, please annotate them first.`;
                message.warning(`${error}`, 20);
              } else if (response.tableData.total === 0 || !response.tableData.total) {
                message.error(
                  "No knowledge found, please annotate them first."
                );
                return;
              } else if (response.keySentences.length === 0) {
                message.error(
                  "No key sentence found, please annotate them first."
                );
                return;
              } else {
                message.success(
                  `Found ${response.tableData.total} knowledges and ${response.keySentences.length} key sentences, please annotate them in the knowledge graph editor.`
                );
                setEditorModalVisiable(true);
              }
              setLoading(false);
            })
            .catch((error) => {
              console.log("Cannot get annotations, error message is", error);
              message.warning(`${error}`, 10);
              setLoading(false);
            })
            .finally(() => {
              setLoading(false);
            });
        }}
      >
        <img src={Icon} width={"100%"} height={"100%"} />
      </div>
      <Modal
        className="knowledge-editor-modal"
        title="Knowledge Graph Editor"
        open={editorModalVisiable}
        footer={null}
        onCancel={handleCancel}
      >
        <Row className="header">
          <p className="desc">
            NOTE: You can check the attributes of a knowledge one by one and
            click update button to submit. Please keep the knowledges same with
            the curation that you have done in the previous step. If you
            encounter the disordered options in the dropdown list, please click
            the `Clean Cache` button and try again.
          </p>
          <ButtonGroup>
            <Button danger onClick={cleanCache} icon={<RestOutlined />}>
              Clean Cache
            </Button>
            <Button
              type="primary"
              onClick={updateTable}
              icon={<CloudSyncOutlined />}
              loading={loading}
              disabled={loading}
            >
              Update Table
            </Button>
          </ButtonGroup>
        </Row>
        <TableEditor
          key={refreshKey}
          data={data}
          keySentences={keySentences}
          entityStat={statistics.entity_stat}
          relationStat={statistics.relation_stat}
          onChange={(pagination) => {
            setRefreshKey(refreshKey + 1);
          }}
        />
      </Modal>
    </Row>
  );
}

const url = window.location.href;

if (url.startsWith(`${targetWebsite}/projects`)) {
  console.log("Knowledge Graph Editor is running...")
  getToken().then((token) => {
    // Initalize the request configuration, load the authentication token from the local storage.
    initRequest(token);
    console.log("Insert the knowledge graph editor into the page...");
    const app = document.createElement("div");
    app.id = "knowledge-graph-editor";
    document.body.appendChild(app);
    ReactDOM.render(<Content />, app);
  });
}
