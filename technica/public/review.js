"use strict";
(() => {
  let key = "";
  const queue = document.querySelector("#review-queue"),
    message = document.querySelector("#review-message");
  const escape = (v) =>
    String(v).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  async function api(route = "", body) {
    const response = await fetch("/api/review" + route, {
      method: body ? "POST" : "GET",
      cache: "no-store",
      headers: {
        authorization: `Bearer ${key}`,
        ...(body ? { "content-type": "application/json" } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data;
  }
  async function load() {
    message.textContent = "Loading private suggestions…";
    try {
      const data = await api();
      document.querySelector("#review-login").hidden = true;
      document.querySelector("#refresh").hidden = false;
      document.querySelector("#logout").hidden = false;
      queue.innerHTML = data.contributions.length
        ? data.contributions
            .map(
              (row) =>
                `<article class="review-item" data-id="${row.id}"><span class="tag review-status">${row.status}</span><h2>${escape(row.situation)}</h2><p><strong>What makes it difficult:</strong> ${escape(row.difficulty)}</p><p><strong>Understanding requested:</strong> ${escape(row.understanding)}</p><p><strong>Optional suggestion:</strong> ${escape(row.suggestion || "None")}</p><p class="small">Credit: ${escape(row.credit || "Anonymous contributor")}<br>Public adaptation permission: <strong>${row.publishPermission ? "Granted" : "Not granted — keep private"}</strong></p>${row.status === "submitted" ? '<button data-action="review">Mark reviewed</button>' : ""}${["reviewed", "drafted"].includes(row.status) ? `<form class="draft-form">${["title", "situation", "explanation", "improvement"].map((name) => `<label>${{ title: "Learning note title", situation: "Edited fictional situation", explanation: "Reviewed explanation", improvement: "What this adds to the learning content" }[name]}<textarea name="${name}" required maxlength="${name === "title" ? 100 : 1600}">${escape(row.draft?.[name] || "")}</textarea></label>`).join("")}<button style="margin-top:16px">Save learning draft</button></form>` : ""}${row.status === "drafted" ? `<label class="check"><input type="checkbox" class="sources-checked"><span>I checked sources, financial claims, accessibility, and privacy. This is suitable to publish as a learning note.</span></label><button data-action="publish" ${row.publishPermission ? "" : "disabled"}>Publish with permission</button>` : ""}${row.status === "published" ? '<button class="secondary" data-action="unpublish">Unpublish adaptation</button>' : row.status !== "rejected" ? '<button class="text-button" data-action="reject">Decline suggestion</button>' : ""}<div class="item-status" role="status"></div></article>`,
            )
            .join("")
        : '<p class="empty">No submissions in the queue.</p>';
      message.textContent = `${data.contributions.length} private queue record(s).`;
    } catch (e) {
      queue.innerHTML = "";
      message.textContent = e.message;
    }
  }
  document
    .querySelector("#review-login")
    .addEventListener("submit", async (event) => {
      event.preventDefault();
      key = document.querySelector("#reviewer-key").value;
      document.querySelector("#reviewer-key").value = "";
      await load();
    });
  document.querySelector("#refresh").addEventListener("click", load);
  document.querySelector("#logout").addEventListener("click", () => {
    key = "";
    queue.innerHTML = "";
    message.textContent = "Review access locked.";
    document.querySelector("#review-login").hidden = false;
    document.querySelector("#refresh").hidden = true;
    document.querySelector("#logout").hidden = true;
    document.querySelector("#reviewer-key").focus();
  });
  async function act(element, body) {
    const article = element.closest(".review-item"),
      status = article.querySelector(".item-status");
    element.disabled = true;
    try {
      await api("/" + article.dataset.id, body);
      await load();
    } catch (e) {
      status.textContent = e.message;
      element.disabled = false;
    }
  }
  queue.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (button)
      act(button, {
        action: button.dataset.action,
        sourcesChecked: !!button
          .closest("article")
          .querySelector(".sources-checked")?.checked,
      });
  });
  queue.addEventListener("submit", (event) => {
    event.preventDefault();
    act(event.target.querySelector("button"), {
      action: "draft",
      ...Object.fromEntries(new FormData(event.target)),
    });
  });
  window.addEventListener("pagehide", () => {
    key = "";
    queue.innerHTML = "";
  });
})();
