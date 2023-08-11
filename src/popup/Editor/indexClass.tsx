import React from "react";
import { KnowledgeGraphEditor } from "biominer-components";
import {
  fetchCuratedKnowledges,
  fetchStatistics,
  fetchEntities,
  postCuratedKnowledge,
  putCuratedKnowledge,
  deleteCuratedKnowledge,
  // @ts-ignore
} from "@/api/swagger/KnowledgeGraph";

import "./index.less";

const KnowledgeGraphEditorWrapper: React.FC = () => {
  return (
    <KnowledgeGraphEditor
      // @ts-ignore
      getKnowledges={fetchCuratedKnowledges}
      getStatistics={fetchStatistics}
      getEntities={fetchEntities}
      // @ts-ignore
      postKnowledge={postCuratedKnowledge}
      // @ts-ignore
      putKnowledgeById={putCuratedKnowledge}
      // @ts-ignore
      deleteKnowledgeById={deleteCuratedKnowledge}
    />
  );
};

export default KnowledgeGraphEditorWrapper;
