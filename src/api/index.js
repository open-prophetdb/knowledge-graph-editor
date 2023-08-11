/*global chrome*/

// 委托background执行请求
export function sendRequestToBackground(config) {
  // chrome.runtime.sendMessage中只能传递JSON数据，不能传递file类型数据，因此直接从popup发起请求。
  // The message to send. This message should be a JSON-ifiable object.
  // 详情参阅：https://developer.chrome.com/extensions/runtime#method-sendMessage
  console.log("sendRequestToBackground", config, chrome);
  if (chrome && chrome.runtime) {
    console.log("chrome.runtime.sendMessage", config)
    chrome.runtime.sendMessage('get-annotations',
      (response) => {
        console.log("background script返回的结果：", response, config);
      }
    );
  } else {
    console.log("未找到chrome API");
  }
}
