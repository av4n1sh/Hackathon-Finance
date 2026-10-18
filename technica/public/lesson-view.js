function renderLesson(id) {
  const l = Content.lessons.find((l) => l.id === id);
  if (!l) return notFound();
  const index = Content.lessons.indexOf(l);
  if (index > 0 && !state.user.lessons[Content.lessons[index - 1].id]) {
    toast("Complete the previous lesson first.");
    location.hash = "learn";
    return;
  }
  state.topic = id;
  const saved = draft.get("lesson-" + id, {});
  page(
    esc(l.title),
    `Lesson ${index + 1} of 6 · ${esc(l.topic)}`,
    esc(l.objective),
    `
  <div class="grid-two"><article class="panel lesson-content"><p>${esc(l.text)}</p>${l.sections.map((s) => `<section class="lesson-section"><h2>${esc(s.title)}</h2><p>${esc(s.text)}</p></section>`).join("")}
  <section class="worked-example"><h2>${esc(l.example.title)}</h2><p>${esc(l.example.text)}</p></section>
  <section class="lesson-section"><h2>${esc(l.worked.title)}</h2><p>${esc(l.worked.text)}</p><a class="button secondary" href="${l.worked.link}">${esc(l.worked.label)} →</a></section>
  <div class="callout warning"><h3>A common misunderstanding</h3><p>${esc(l.misunderstanding)}</p></div>
  <details class="lesson-more"><summary>Learn more</summary><p>${esc(l.more)}</p></details>
  <form id="lesson-form"><h2>Check your understanding</h2><p class="note">Answer both questions. Feedback explains each choice; you can change an answer and retry.</p>${choices("answer", l.options, saved.answer, l.task)}${choices("check", l.checks, saved.check, l.check)}<button class="button" type="submit">Review my answers</button></form>
  <div id="lesson-feedback" class="feedback" aria-live="polite" tabindex="-1"></div></article>
  <aside class="panel lesson-aside"><h2>Your takeaway</h2><p>${esc(l.takeaway)}</p><p>Both correct answers complete the lesson. Earn 50 XP once; your existing completion stays saved.</p><button class="button secondary" id="lesson-guide">Ask about this lesson</button><div class="field">${sourceLinks(id === "final" ? ["fees", "fraud", "tokens"] : [l.source])}</div><a href="${l.worked.link}" class="text-button">${esc(l.worked.label)} →</a></aside></div>`,
    `<a class="top-back" href="#learn">← All lessons</a> · ${esc(l.time)} · 50 XP`,
  );
  const reading = $(".lesson-content"),
    aside = $(".lesson-aside");
  const sections = [
    {
      element: $(".lesson-section h2", reading),
      id: "lesson-explanation",
      label: "Read the explanation",
    },
    {
      element: $(".worked-example h2", reading),
      id: "lesson-worked-example",
      label: "Review the worked example",
    },
    {
      element: $("#lesson-form h2"),
      id: "lesson-questions",
      label: "Answer the two questions",
    },
  ];
  const outline = document.createElement("nav");
  outline.className = "lesson-outline";
  outline.setAttribute("aria-label", "Lesson sections");
  outline.innerHTML = `<h3>In this lesson</h3><ol>${sections.map((s, i) => `<li><button class="text-button" data-lesson-section="${i}">${s.label}</button></li>`).join("")}</ol><p class="note lesson-completed-count">${Object.keys(state.user.lessons).length} of 6 lessons completed</p><progress class="lesson-completion-progress" value="${Object.keys(state.user.lessons).length}" max="6" aria-label="Lessons completed"></progress>${index > 0 ? `<a class="text-button" href="#lesson/${Content.lessons[index - 1].id}">← Previous lesson</a>` : ""}`;
  aside.prepend(outline);
  sections.forEach((s) => {
    s.element.id = s.id;
    s.element.tabIndex = -1;
  });
  $$("[data-lesson-section]", outline).forEach(
    (btn) =>
      (btn.onclick = () => {
        const heading = sections[Number(btn.dataset.lessonSection)].element;
        heading.focus({ preventScroll: true });
        heading.scrollIntoView?.({ block: "start", behavior: "instant" });
      }),
  );
  on("#lesson-guide", "click", () => openGuide());
  const form = $("#lesson-form"),
    target = $("#lesson-feedback");
  on("#lesson-form", "input", () =>
    draft.set("lesson-" + id, Object.fromEntries(new FormData(form))),
  );
  form.onsubmit = async (e) => {
    e.preventDefault();
    const epoch = viewVersion,
      btn = $("button[type=submit]", form);
    btn.disabled = true;
    btn.textContent = "Checking answers…";
    form.setAttribute("aria-busy", "true");
    try {
      const d = await api("/api/lesson/complete", {
        id,
        answer: Number(form.elements.answer.value),
        check: Number(form.elements.check.value),
      });
      if (epoch !== viewVersion || !form.isConnected) return;
      $(".lesson-completed-count", aside).textContent =
        `${Object.keys(state.user.lessons).length} of 6 lessons completed`;
      $(".lesson-completion-progress", aside).value = Object.keys(
        state.user.lessons,
      ).length;
      target.innerHTML = `<div class="callout ${d.correct ? "success" : "warning"}"><h3>${d.correct ? "Well reasoned." : "Review the reasoning and try again."}</h3><p>${d.correct ? `Lesson complete. +${d.awarded} XP saved.` : "Your progress stays saved. Change either answer and resubmit."}</p><ol class="answer-feedback">${d.questionFeedback.map((f, i) => `<li><strong>Question ${i + 1}: ${f.correct ? "Correct" : "Review this answer"}</strong><p>${esc(f.explanation)}</p></li>`).join("")}</ol></div>${d.correct ? `<p>${esc(l.takeaway)}</p><a class="button secondary" href="${l.next}">${esc(l.nextLabel)} →</a>` : ""}`;
      target.focus({ preventScroll: true });
      if (d.correct)
        toast(
          d.awarded
            ? "+50 XP · Lesson complete"
            : "Your completion is already saved",
        );
    } catch (error) {
      if (epoch === viewVersion) feedback(target, error.message, "error");
    } finally {
      btn.disabled = false;
      btn.textContent = "Review my answers";
      form.removeAttribute("aria-busy");
    }
  };
}
