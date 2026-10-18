"use strict";
document
  .querySelector("#removal-form")
  .addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.target,
      button = form.querySelector("button"),
      status = document.querySelector("#removal-status");
    button.disabled = true;
    status.textContent = "Removing…";
    try {
      const response = await fetch("/api/community/remove", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      status.textContent =
        "Your contribution has been removed from this server.";
      form.reset();
    } catch (e) {
      status.textContent = e.message;
    } finally {
      button.disabled = false;
    }
  });
