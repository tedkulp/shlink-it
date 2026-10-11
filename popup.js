// (c) 2022 Ted Kulp - @tedkulp
//
// I'm not going to lie...  This code was heavily inspired by
// https://github.com/edward-shen/shlink and some things were copied.
//
// I originally wanted to just do a PR, but I realized it would be
// good experience to write a Chrome Extension in full. It was also
// different enough that I felt that it might not be accepted as a
// PR.

$(document).ready(() => {
  browser.storage.local.get().then((data) => {
    const createLink = (url, defaultTitle) => {
      console.debug(url);

      if (!data.apiKey) {
        return Promise.reject(
          new Error(
            "API Key is not set. Please use the Settings screen to configure the extension."
          )
        );
      }

      if (!data.shlinkUrl) {
        return Promise.reject(
          new Error(
            "Shlink URL is not set. Please use the Settings screen to configure the extension."
          )
        );
      }

      const title = $("#saveTitle").val() || defaultTitle;
      const tags = ($("#saveTags").val() || "")
        .split(" ")
        .filter((s) => s && s !== "");
      const customSlug = $("#saveSlug").val() || null;
      // A number input reports unparseable text (e.g. "abc") as "", so
      // check badInput to reject it instead of treating it as unlimited.
      const maxVisitsInput = $("#saveMaxVisits")[0];
      let maxVisits;
      try {
        maxVisits = parseMaxVisits(
          maxVisitsInput.validity.badInput ? "invalid" : maxVisitsInput.value
        );
      } catch (e) {
        return Promise.reject(e);
      }

      console.debug("tags", tags);

      const headers = new Headers();
      headers.append("accept", "application/json");
      headers.append("Content-Type", "application/json");
      headers.append("X-Api-Key", data.apiKey);

      const options = {
        longUrl: url,
        findIfExists: true,
        title,
        tags,
        customSlug,
        maxVisits,
      };

      console.debug("options", options);

      return fetch(
        new Request(`${data.shlinkUrl}/rest/v2/short-urls`, {
          method: "POST",
          headers,
          body: JSON.stringify(options),
        })
      );
    };

    let saveUrl = "";
    let saveTitle = "";

    const successNotification = (result) => {
      return browser.notifications.create({
        type: "basic",
        title: "Shlink created!",
        iconUrl: "images/shlink-64.png",
        message: `${result.shortUrl} was copied to your clipboard.`,
      });
    };

    const failureNotification = (error) => {
      return browser.notifications.create({
        type: "basic",
        title: "Failed to create Shlink!",
        iconUrl: "images/shlink-64.png",
        message: error.message,
      });
    };

    function copyLinkToClipboard(result) {
      return navigator.clipboard.writeText(result.shortUrl).then(
        () => Promise.resolve(result),
        (e) => {
          console.error(e);
          return Promise.reject(
            new Error(`Failed to copy to clipboard. ${e.message}`)
          );
        }
      );
    }

    function validateResponse(fetchResponse) {
      if (fetchResponse.ok) {
        return fetchResponse.json();
      } else if (fetchResponse.status >= 400 && fetchResponse.status < 500) {
        return Promise.reject(
          new Error(
            `Got error code ${fetchResponse.status}. ` +
              "Please check if you've configured the Shlink extension correctly."
          )
        );
      } else if (fetchResponse.status >= 500 && fetchResponse.status < 600) {
        return Promise.reject(
          new Error(
            `Got error code ${fetchResponse.status}. ` +
              "Please check if the Shlink server is properly configured."
          )
        );
      } else {
        return Promise.reject(
          new Error(
            `Got unknown error code ${fetchResponse.status}. Please try again later.`
          )
        );
      }
    }

    const closeWindow = () => {
      const tm = setTimeout(() => {
        clearTimeout(tm);
        window.close();
      }, 500);
    };

    const handleButtonClick = (evt) => {
      if (evt) evt.preventDefault();

      createLink(saveUrl, saveTitle)
        .then(validateResponse)
        .then(copyLinkToClipboard)
        .then(successNotification)
        .then(closeWindow)
        .catch(failureNotification);
    };

    browser.tabs
      .query({ active: true, currentWindow: true })
      .then((tabData) => {
        console.debug("Tab Data", tabData);

        saveUrl = tabData[0].url;
        saveTitle = tabData[0].title;

        $("#saveUrl").val(saveUrl);
        $("#saveTitle").val(saveTitle);
      });

    $("#shlinkUrl").text(data.shlinkUrl);
    $("#saveTags").val(data.defaultTags ? data.defaultTags + " " : "");
    $("#submitBtn").on("click", handleButtonClick);
  });
});
