// eslint-disable-next-line no-undef
/*global chrome*/

// @ts-ignore
/* eslint-disable */
import request from 'umi-request';

// @ts-ignore
export const prefix = window.KNOWLEDGE_GRAPH_SERVER || 'https://prophetdb.3steps.cn';
console.log('Knowledge Graph Server:', prefix);
let defaultTargetWebsite = window.location.host;
if (window.location.protocol === "chrome-extension:") {
  defaultTargetWebsite = 'https://prophet-studio.3steps.cn'
} else {
  defaultTargetWebsite = window.location.protocol + '//' + window.location.host;
}
export const targetWebsite = defaultTargetWebsite;
console.log('Target Website:', targetWebsite);
// export const prefix = 'http://localhost:8000';

export function getJwtAccessToken(): Promise<string> {
  const cookieQuery = {
    url: targetWebsite,
    name: "jwt_access_token",
  };

  const failedMessage = "Cannot get the token from the prophet studio, please login first or relogin!";

  return new Promise((resolve, reject) => {
    // @ts-ignore
    if (chrome && chrome.tabs && chrome.cookies) {
      // @ts-ignore
      chrome.tabs.query(
        { active: true, currentWindow: true },
        // @ts-ignore
        function (tabs) {
          const tab = tabs[0].url;
          const url = new URL(tab);
          console.log("Current Tab url: ", url);

          if (url.origin === targetWebsite) {
            // @ts-ignore
            chrome.cookies.get(cookieQuery, function (cookie) {
              if (cookie) {
                console.log("cookie", cookie);
                resolve(`Bearer ${cookie.value}`);
              } else {
                reject(failedMessage);
              }
            });
          } else {
            reject("Please open the prophet studio and login first!");
          }
        }
      );
    } else {
      console.log("Run in normal web page, auth token is go");
      const token = getCookie(cookieQuery.name);
      if (token) {
        resolve(`Bearer ${token}`);
      } else {
        reject(failedMessage);
      }
    }
  });
}

export function getCookie(name: string) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  console.log("parts", parts);
  if (parts.length === 2) {
    // @ts-ignore
    return parts.pop().split(";").shift();
  } else {
    return null;
  }
}

export const setToken = (token: string) => {
  return new Promise((resolve, reject) => {
    // @ts-ignore
    if (chrome && chrome.storage) {
      // @ts-ignore
      chrome.storage.local.set({ AUTH_TOKEN: token }).then(() => {
        console.log("AUTH_TOKEN is set");
        resolve("AUTH_TOKEN is set");
      }).catch((err: any) => {
        console.log("AUTH_TOKEN is not set");
        reject(err);
      });
    } else {
      console.log("Run in normal web page, auth token is set.")
      window.localStorage.setItem('AUTH_TOKEN', token);
      resolve("AUTH_TOKEN is set");
    }
  });
}

export const cleanToken = () => {
  window.localStorage.removeItem('AUTH_TOKEN');
}

export const getToken = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    // @ts-ignore
    if (chrome && chrome.storage) {
      // @ts-ignore
      chrome.storage.local.get(["AUTH_TOKEN"], (result: any) => {
        // @ts-ignore
        // console.log('result:', result, chrome.storage.local);
        if (result.AUTH_TOKEN) {
          resolve(result.AUTH_TOKEN);
        } else {
          reject('no token');
        }
      });
    } else {
      console.log("Run in normal web page, auth token is go")
      const token = window.localStorage.getItem('AUTH_TOKEN');
      if (token) {
        resolve(token);
      } else {
        reject('no token');
      }
    }
  });
}

export const getProjectId = () => {
  // More details about getting the current url, please access https://stackoverflow.com/a/59434377
  const url = window.location.href;
  // const url =
  // "https://prophet-studio.3steps.cn/projects/14/data?tab=38&task=17696";
  // Get the project id from the url with regex
  const projectId = url.match(/projects\/(\d+)/);
  if (projectId) {
    return projectId[1];
  } else {
    return null;
  }
}

export const getUserFromToken = (token: string) => {
  // console.log("Token: ", token);
  let payload = token.split(".")[1];
  let decodedPayload = decodeURIComponent(
    atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
      .split("")
      .map(function (c) {
        return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join("")
  );
  let user = JSON.parse(decodedPayload);
  return user;
}

export const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    getJwtAccessToken().then((token: string) => {
      const user = getUserFromToken(token);
      console.log("Curator: ", user);
      resolve(user);
    }).catch((error: any) => {
      console.log("Get token error: ", error);
      reject(error);
    })
  })
}

export const initRequest = (auth_token: string) => {
  let headers: any = {
    'Content-Type': 'application/json',
  }

  if (auth_token) {
    headers = {
      ...headers,
      'Authorization': auth_token,
    }
  }

  // console.log('AUTH_TOKEN:', auth_token);

  request.extendOptions({
    prefix: prefix,
    headers: headers,
    // prefix: 'http://localhost:8000',
    timeout: 1000 * 60 * 60,
  });
}

/** Call `/api/v1/auto-connect-nodes` with query params to fetch edges which connect the input nodes. GET /api/v1/auto-connect-nodes */
export async function fetchEdgesAutoConnectNodes(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.fetchEdgesAutoConnectNodesParams,
  options?: { [key: string]: any },
) {
  return request<API.Graph>('/api/v1/auto-connect-nodes', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** Call `/api/v1/curated-graph` with query params to fetch curated graph. GET /api/v1/curated-graph */
export async function fetchCuratedGraph(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.fetchCuratedGraphParams,
  options?: { [key: string]: any },
) {
  return request<API.Graph>('/api/v1/curated-graph', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** Call `/api/v1/curated-knowledges` with query params to fetch curated knowledges. GET /api/v1/curated-knowledges */
export async function fetchCuratedKnowledges(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.fetchCuratedKnowledgesParams,
  options?: { [key: string]: any },
) {
  return request<API.RecordResponseKnowledgeCuration>('/api/v1/curated-knowledges', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** Call `/api/v1/curated-knowledges` with payload to create a curated knowledge. POST /api/v1/curated-knowledges */
export async function postCuratedKnowledge(
  body: API.KnowledgeCuration,
  options?: { [key: string]: any },
) {
  return request<API.KnowledgeCuration>('/api/v1/curated-knowledges', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** Call `/api/v1/curated-knowledges-by-owner` with query params to fetch curated knowledges by owner. GET /api/v1/curated-knowledges-by-owner */
export async function fetchCuratedKnowledgesByOwner(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.fetchCuratedKnowledgesByOwnerParams,
  options?: { [key: string]: any },
) {
  return request<API.RecordResponseKnowledgeCuration>('/api/v1/curated-knowledges-by-owner', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** Call `/api/v1/curated-knowledges/:id` with payload to create a curated knowledge. PUT /api/v1/curated-knowledges/${param0} */
export async function putCuratedKnowledge(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.putCuratedKnowledgeParams,
  body: API.KnowledgeCuration,
  options?: { [key: string]: any },
) {
  const { id: param0, ...queryParams } = params;
  return request<API.KnowledgeCuration>(`/api/v1/curated-knowledges/${param0}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    params: { ...queryParams },
    data: body,
    ...(options || {}),
  });
}

/** Call `/api/v1/curated-knowledges/:id` with payload to delete a curated knowledge. DELETE /api/v1/curated-knowledges/${param0} */
export async function deleteCuratedKnowledge(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.deleteCuratedKnowledgeParams,
  options?: { [key: string]: any },
) {
  const { id: param0, ...queryParams } = params;
  return request<any>(`/api/v1/curated-knowledges/${param0}`, {
    method: 'DELETE',
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** Call `/api/v1/entities` with query params to fetch entities. GET /api/v1/entities */
export async function fetchEntities(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.fetchEntitiesParams,
  options?: { [key: string]: any },
) {
  return request<API.RecordResponseEntity>('/api/v1/entities', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** Call `/api/v1/entity-colormap` with query params to fetch all entity colormap. GET /api/v1/entity-colormap */
export async function fetchEntityColorMap(options?: { [key: string]: any }) {
  return request<Record<string, any>>('/api/v1/entity-colormap', {
    method: 'GET',
    ...(options || {}),
  });
}

/** Call `/api/v1/entity-metadata` with query params to fetch all entity metadata. GET /api/v1/entity-metadata */
export async function fetchEntityMetadata(options?: { [key: string]: any }) {
  return request<API.EntityMetadata[]>('/api/v1/entity-metadata', {
    method: 'GET',
    ...(options || {}),
  });
}

/** Call `/api/v1/entity2d` with query params to fetch entity2d. GET /api/v1/entity2d */
export async function fetchEntity2d(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.fetchEntity2dParams,
  options?: { [key: string]: any },
) {
  return request<API.RecordResponseEntity2D>('/api/v1/entity2d', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** Call `/api/v1/nodes` with query params to fetch nodes. GET /api/v1/nodes */
export async function fetchNodes(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.fetchNodesParams,
  options?: { [key: string]: any },
) {
  return request<API.Graph>('/api/v1/nodes', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** Call `/api/v1/one-step-linked-nodes` with query params to fetch linked nodes with one step. GET /api/v1/one-step-linked-nodes */
export async function fetchOneStepLinkedNodes(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.fetchOneStepLinkedNodesParams,
  options?: { [key: string]: any },
) {
  return request<API.Graph>('/api/v1/one-step-linked-nodes', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** Call `/api/v1/relation-counts` with query params to fetch relation counts. GET /api/v1/relation-counts */
export async function fetchRelationCounts(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.fetchRelationCountsParams,
  options?: { [key: string]: any },
) {
  return request<API.RelationCount[]>('/api/v1/relation-counts', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** Call `/api/v1/relation-metadata` with query params to fetch all relation metadata. GET /api/v1/relation-metadata */
export async function fetchRelationMetadata(options?: { [key: string]: any }) {
  return request<API.RelationMetadata[]>('/api/v1/relation-metadata', {
    method: 'GET',
    ...(options || {}),
  });
}

/** Call `/api/v1/relations` with query params to fetch relations. GET /api/v1/relations */
export async function fetchRelations(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.fetchRelationsParams,
  options?: { [key: string]: any },
) {
  return request<API.RecordResponseRelation>('/api/v1/relations', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** Call `/api/v1/similarity-nodes` with query params to fetch similarity nodes. GET /api/v1/similarity-nodes */
export async function fetchSimilarityNodes(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.fetchSimilarityNodesParams,
  options?: { [key: string]: any },
) {
  return request<API.Graph>('/api/v1/similarity-nodes', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** Call `/api/v1/statistics` with query params to fetch all entity & relation metadata. GET /api/v1/statistics */
export async function fetchStatistics(options?: { [key: string]: any }) {
  return request<API.Statistics>('/api/v1/statistics', {
    method: 'GET',
    ...(options || {}),
  });
}

/** Call `/api/v1/subgraphs` with query params to fetch subgraphs. GET /api/v1/subgraphs */
export async function fetchSubgraphs(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.fetchSubgraphsParams,
  options?: { [key: string]: any },
) {
  return request<API.RecordResponseSubgraph>('/api/v1/subgraphs', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** Call `/api/v1/subgraphs` with payload to create a subgraph. POST /api/v1/subgraphs */
export async function postSubgraph(body: API.Subgraph, options?: { [key: string]: any }) {
  return request<API.Subgraph>('/api/v1/subgraphs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** Call `/api/v1/subgraphs/:id` with payload to update a subgraph. PUT /api/v1/subgraphs/${param0} */
export async function putSubgraph(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.putSubgraphParams,
  body: API.Subgraph,
  options?: { [key: string]: any },
) {
  const { id: param0, ...queryParams } = params;
  return request<API.Subgraph>(`/api/v1/subgraphs/${param0}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    params: { ...queryParams },
    data: body,
    ...(options || {}),
  });
}

/** Call `/api/v1/subgraphs/:id` with payload to create subgraph. DELETE /api/v1/subgraphs/${param0} */
export async function deleteSubgraph(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.deleteSubgraphParams,
  options?: { [key: string]: any },
) {
  const { id: param0, ...queryParams } = params;
  return request<any>(`/api/v1/subgraphs/${param0}`, {
    method: 'DELETE',
    params: { ...queryParams },
    ...(options || {}),
  });
}
