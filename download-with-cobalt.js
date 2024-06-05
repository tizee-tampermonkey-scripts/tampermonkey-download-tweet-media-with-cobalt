// ==UserScript==
// @name         download twitter video with cobalt.tools
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  download twitter video
// @author       tizee
// @match        https://twitter.com/*
// @match        https://x.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=twitter.com
// ==/UserScript==

// twitter(X)
(function () {
  "use strict";

  function getTweetMedia(tweet_url = "") {
    const url = `https://cobalt.tools?u=${tweet_url}`;
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.target = "_blank";
    link.click();
  }

  // download button
  const style = document.createElement("style");
  style.innerHTML = `
    .tweet-download-button {
      display: flex;
      align-items: center;
      justify-content: center;
      outline-style: none;
      color: rgb(113,118,123);
      background-color: rgba(0,0,0,0);
      transition-duration: 0.2s;
      transition-property: background-color，color, box-shadow;
    }
    .tweet-download-button:hover {
      background-color: rgba(29,155,240,0.1);
      color: rgb(29,155,240);
      cursor: pointer;
    }
    `;

  document.body.appendChild(style);

  const regex = /^https:\/\/x\.com\/(\w+$|home$|\w+\/status\/\d+$)/;
  const statusRegex = /^https:\/\/x\.com\/\w+\/status\/\d+$/;

  const tweetSet = new WeakSet();

  function modifyNode(node) {
    if (!node.querySelector || typeof node.querySelector != "function") {
      return;
    }

    const tweet = node.querySelector(`article[data-testid="tweet"]`);

    if (tweet == null) {
      return;
    }

    // prevent duplication
    let tweetId = "";
    let tweetUrl = "";
    const tweetUser = tweet.querySelector(
      `div[data-testid="User-Name"] a[aria-label]`
    );

    // timeline or conversation tweets
    if (tweetUser) {
      tweetUrl = tweetId = `https://x.com${tweetUser.getAttribute("href")}`;
      tweetId = tweetUser
        .getAttribute("href")
        .substring(1)
        .split("/status/")
        .at(1);
    }

    console.debug("tweet Id:", tweetId);
    // status tweet
    if (tweetId == "" && statusRegex.test(window.location.href)) {
      tweetId = window.location.href.split("/status/").at(1);
      tweetUrl = window.location.href;
    }

    if (tweetSet.has(tweet)) {
      return;
    }

    const downloadButton = document.createElement("div");
    downloadButton.dataset.id = tweetId;
    downloadButton.classList.add("tweet-download-button");
    downloadButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="1.5em" height="1.5em" viewBox="0 0 24 24" fill="none">
              <path d="M11 5C11 4.44772 11.4477 4 12 4C12.5523 4 13 4.44772 13 5V12.1578L16.2428 8.91501L17.657 10.3292L12.0001 15.9861L6.34326 10.3292L7.75748 8.91501L11 12.1575V5Z" fill="currentColor"></path>
              <path d="M4 14H6V18H18V14H20V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V14Z" fill="currentColor"></path>
            </svg>
          `;

    downloadButton.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      getTweetMedia(tweetUrl);
    });

    const groupRow = tweet.querySelector(`div[role="group"]`);
    if(!groupRow.querySelector('.tweet-download-button')) {
      groupRow.appendChild(downloadButton);
      tweetSet.add(tweet);
    }
  }

  // watch new added Tweet cards
  function watchTweetNodes(mutationList) {
    mutationList.forEach(function (mutationRecord) {
      mutationRecord.addedNodes.forEach(modifyNode);
    });
  }

  function mutationHandler(mutationList, observer) {
    if (!regex.test(window.location.href)) {
      return;
    }
    // add download button to new added tweet card
    watchTweetNodes(mutationList);
  }

  const observer = new MutationObserver(mutationHandler);

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
})();

