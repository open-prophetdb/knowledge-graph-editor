// eslint-disable-next-line no-undef
/*global chrome*/
import { useEffect, useState } from "react";
import { Row, Modal, message } from "antd";
import ReactDOM from "react-dom";

import TableEditor from "./components/TableEditor";
import { exampleData } from "./components/TableEditor";
import Icon from "./images/icon.png";

import "./index.less";

const formatLabel = (label) => {
  const lowerc_label = label.toLowerCase().trim().replace(/-_/g, "");
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

    knowledges.push({
      source_name: sourceName,
      source_id: null,
      source_type: sourceType,
      target_name: targetName,
      target_id: null,
      target_type: targetType,
      key_sentence: null,
      relation_type: null,
    });
  });

  return {
    knowledges: knowledges,
    keySentences: keysentences,
  };
};

const getUser = () => {
  return new Promise((resolve, reject) => {
    fetch("https://prophet-studio.3steps.cn/api/current-user/whoami")
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
  // Parse the url to get all the parameters
  let params = new URL(url).searchParams;
  console.log("params", url, params);
  const taskId = params.get("task");

  return new Promise((resolve, reject) => {
    if (taskId) {
      fetch(`https://prophet-studio.3steps.cn/api/tasks/${taskId}`)
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
  const [editorModalVisiable, setEditorModalVisiable] = useState(false);
  const [data, setData] = useState({});
  const [curator, setCurator] = useState(""); // TODO: Get the current user from the backend
  const [keySentences, setKeySentences] = useState([]);

  const loadData = () => {
    return new Promise((resolve, reject) => {
      getUser()
        .then((response) => {
          const curator = response.email;
          setCurator(curator);
          getAnnotations()
            .then((response) => {
              const annotations = response.annotations;
              const filteredAnnotations = filterAnnotations(
                annotations,
                curator
              );
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
              setData(tableData);

              setKeySentences(formattedData.keySentences);

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
        })
        .catch((error) => {
          reject(error);
        });
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOk = () => {
    setEditorModalVisiable(false);
    // TODO: Save all relations into database
  };

  const handleCancel = () => {
    setEditorModalVisiable(false);
  };

  return (
    <Row className="knowledge-editor-fixed-content">
      <div
        className="knowledge-editor-fixed-button"
        onClick={() => {
          if (!data.total && !keySentences.length) {
            // loadData()
            //   .then((response) => {
            //     message.success(
            //       `Found ${response.tableData.total} knowledges and ${response.keySentences.length} key sentences, please annotate them in the knowledge graph editor.`
            //     );
            //     setEditorModalVisiable(true);
            //   })
            //   .catch((error) => {
            //     console.log("Cannot get annotations, error message is", error);
            //     message.warning(`${error}`, 30);
            //   });
            const error = `No annotations found for the current user (${curator}) yet, please annotate them first.`;
            message.warning(`${error}`, 20);
          } else if (data.total === 0 || !data.total) {
            message.error("No knowledge found, please annotate them first.");
            return;
          } else if (keySentences.length === 0) {
            message.error("No key sentence found, please annotate them first.");
            return;
          } else {
            message.success(
              `Found ${data.total} knowledges and ${keySentences.length} key sentences, please annotate them in the knowledge graph editor.`
            );
            setEditorModalVisiable(true);
          }
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
        <p className="desc">
          NOTE: You can check the attributes of a knowledge one by one and click
          update button to submit. Please keep the knowledges same with the
          curation that you have done in the previous step.
        </p>
        <TableEditor data={data} keySentences={keySentences} />
      </Modal>
    </Row>
  );
}

const app = document.createElement("div");
app.id = "knowledge-graph-editor";
document.body.appendChild(app);
ReactDOM.render(<Content />, app);
