/*global chrome*/
import "./index.less";

function listener(message) {
  return () =>
    chrome.runtime.sendMessage("get-user-data", (response) => {
      console.log(message, response);
    });
}

document.addEventListener("click", listener("regular"));

const button = document.createElement("button");
button.innerText = "HELLO";
button.addEventListener("click", listener("button"));
document.body.appendChild(button);
