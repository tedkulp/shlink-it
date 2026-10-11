// (c) 2022 Ted Kulp - @tedkulp

$(document).ready(() => {
  const shlinkUrl = $("#shlinkUrl");
  const apiKey = $("#apiKey");
  const defaultTags = $("#defaultTags");
  const saveStatus = $("#saveStatus");
  let hideTimer;

  const showStatus = (ok, message) => {
    clearTimeout(hideTimer);
    saveStatus
      .removeClass("d-none alert-success alert-danger")
      .addClass(ok ? "alert-success" : "alert-danger")
      .text(message);
    if (ok) hideTimer = setTimeout(() => saveStatus.addClass("d-none"), 3000);
  };

  const handleButtonClick = (evt) => {
    if (evt) evt.preventDefault();

    browser.storage.local
      .set({
        shlinkUrl: shlinkUrl.val(),
        apiKey: apiKey.val(),
        defaultTags: defaultTags.val(),
      })
      .then(() => showStatus(true, "Settings saved."))
      .catch((err) =>
        showStatus(false, `Could not save settings: ${err?.message || err}`)
      );
  };

  browser.storage.local.get().then((data) => {
    console.debug(data);
    shlinkUrl.val(data.shlinkUrl || "");
    apiKey.val(data.apiKey || "");
    defaultTags.val(data.defaultTags || "");
  });

  $("#submitBtn").on("click", handleButtonClick);
});
