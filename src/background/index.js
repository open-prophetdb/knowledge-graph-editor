// eslint-disable-next-line no-undef
/*global chrome*/

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // 2. A page requested user data, respond with a copy of `user`
  if (message === "get-annotations") {
    // It works!
    // sendResponse({ data: "hello" });
    sendResponse(
      chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
        // 接收来自content的api请求
        let url = tabs[0].url;
        sendResponse({ data: url });
      })
    );
  }
});
