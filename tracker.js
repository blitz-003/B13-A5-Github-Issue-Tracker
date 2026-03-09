async function fetchIssues() {
  try {
    document.getElementById("issues-panel").style.display = "none";
    document.getElementById("issues-grid").innerHTML = `
  <div class="flex justify-center items-center h-64 w-full col-span-full">
    <div class="flex gap-2">
      <span class="loading loading-ball loading-xs"></span>
      <span class="loading loading-ball loading-sm"></span>
      <span class="loading loading-ball loading-md"></span>
      <span class="loading loading-ball loading-lg"></span>
      <span class="loading loading-ball loading-xl"></span>
    </div>
  </div>
`;
    const res = await fetch(
      "https://phi-lab-server.vercel.app/api/v1/lab/issues",
    );
    const data = await res.json();

    issues = data.data || data;

    document.getElementById("issues-panel").style.display = "block";
    filterIssues(currentFilter);
  } catch (err) {
    console.error("Error fetching issues:", err);
  }
}
let issues = [];

const priorityColors = {
  high: { bg: "#fef2f2", text: "#ef4444" },
  medium: { bg: "#fff7ed", text: "#f97316" },
  low: { bg: "#f8fafc", text: "#94a3b8" },
};

const statusIcons = {
  open: `<img src="./assets/Open-Status.png" />`,
  closed: `<img src="./assets/Closed-Status.png" />`,
};

const BADGE_VARIANTS = [
  "badge-primary",
  "badge-secondary",
  "badge-accent",
  "badge-info",
  "badge-success",
  "badge-warning",
  "badge-error",
];

function renderLabel(label, index) {
  const variant = BADGE_VARIANTS[index % BADGE_VARIANTS.length];
  return `<span class="badge badge-soft ${variant}">${label}</span>`;
}

// Modal
async function openModal(issueId) {
  try {
    const res = await fetch(
      `https://phi-lab-server.vercel.app/api/v1/lab/issue/${issueId}`,
    );
    const data = await res.json();

    const issue = data.data || data;
    if (!issue) return;

    const pc = priorityColors[issue.priority];
    const isOpen = issue.status === "open";

    const formattedDate = new Date(issue.createdAt).toLocaleDateString(
      "en-GB",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      },
    );

    // Status badge
    const statusBadge = isOpen
      ? `<span class="badge badge-soft badge-success gap-1">
           <span class="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"></span>
           Opened
         </span>`
      : `<span class="badge badge-soft badge-secondary gap-1">
           <span class="w-1.5 h-1.5 rounded-full bg-pink-500 inline-block"></span>
           Closed
         </span>`;

    // Priority badge
    const priorityBadge = pc
      ? `<span class="badge font-semibold" style="background:${pc.bg};color:${pc.text};">${issue.priority.toUpperCase()}</span>`
      : "";

    // Labels
    const labelsHtml = issue.labels
      .map((label, index) => renderLabel(label, index))
      .join("");

    // Assignee
    const assigneeHtml = issue.assignee
      ? `<span class="font-semibold text-slate-800">${issue.assignee}</span>`
      : `<span class="text-gray-400 italic">Unassigned</span>`;

    document.getElementById("modal-content").innerHTML = `

      <h2 class="text-lg font-bold text-slate-800 mb-3">${issue.title}</h2>

      <div class="flex items-center gap-2 flex-wrap mb-3">
        ${statusBadge}
        <span class="text-xs text-gray-400">
          Opened by <span class="font-medium text-gray-600">${issue.author}</span>
          &bull; ${formattedDate}
        </span>
      </div>

      <div class="flex flex-wrap gap-1.5 mb-4">
        ${labelsHtml}
      </div>

      <p class="text-sm text-gray-500 mb-6">${issue.description}</p>

      <div class="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4">
        <div>
          <p class="text-xs text-gray-400 mb-1">Assignee:</p>
          ${assigneeHtml}
        </div>
        <div>
          <p class="text-xs text-gray-400 mb-1">Priority:</p>
          ${priorityBadge}
        </div>
      </div>
    `;

    document.getElementById("issue-modal").showModal();
  } catch (err) {
    console.error("Error loading issue:", err);
  }
}

function closeModal() {
  document.getElementById("issue-modal").close();
}

function updateIssueCount(list) {
  document.getElementById("issue-count").textContent = list.length;
}

// Card

function renderCard(issue) {
  const pc = priorityColors[issue.priority];
  const borderColor = issue.status === "open" ? "#22c55e" : "#a855f7";
  const formatted = new Date(issue.createdAt).toLocaleDateString("en-GB");

  return `
    <div class="issue-card rounded-xl border bg-white p-4 flex flex-col gap-3 cursor-pointer"
         style="border-top:3px solid ${borderColor};border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;"
         onclick="openModal(${issue.id})">
      <div class="flex items-center justify-between">
        <span>${statusIcons[issue.status]}</span>
        <span class="text-xs font-bold px-2.5 py-0.5 rounded-full"
              style="background:${pc.bg};color:${pc.text};">${issue.priority}</span>
      </div>
      <div>
        <h3 class="font-semibold text-slate-800 text-sm leading-snug">${issue.title}</h3>
        <p class="text-xs text-gray-400 mt-1 leading-relaxed">${issue.description}</p>
      </div>
      <div class="flex flex-wrap gap-1.5">
        ${issue.labels.map(renderLabel).join("")}
      </div>
      <div class="border-t border-gray-100 pt-2 mt-auto">
        <p class="text-xs text-gray-400">#${issue.id} by <span class="text-gray-600 font-medium">${issue.author}</span></p>
        <p class="text-xs text-gray-400">${formatted}</p>
      </div>
    </div>`;
}

// Filter function

let currentFilter = "all";

function filterIssues(filter) {
  currentFilter = filter;
  ["all", "open", "closed"].forEach((t) => {
    const btn = document.getElementById("tab-" + t);
    btn.className =
      t === filter
        ? "btn btn-sm rounded-full tab-active px-6"
        : "btn btn-sm btn-outline rounded-full px-6 border-gray-300 text-gray-600";
  });
  let filtered =
    filter === "all" ? issues : issues.filter((i) => i.status === filter);
  document.getElementById("issues-grid").innerHTML = filtered
    .map(renderCard)
    .join("");
  updateIssueCount(filtered);
}

// Search
let searchTimeout;

document.getElementById("search-input").addEventListener("input", (e) => {
  const searchText = e.target.value.trim();

  clearTimeout(searchTimeout);

  searchTimeout = setTimeout(async () => {
    if (!searchText) {
      fetchIssues();
      return;
    }

    try {
      const res = await fetch(
        `https://phi-lab-server.vercel.app/api/v1/lab/issues/search?q=${searchText}`,
      );

      const data = await res.json();

      let results = data.data || data;

      if (currentFilter !== "all") {
        results = results.filter((i) => i.status === currentFilter);
      }

      document.getElementById("issues-grid").innerHTML = results
        .map(renderCard)
        .join("");
    } catch (err) {
      console.error("Search error:", err);
    }
  }, 400); // debounce delay
});
fetchIssues();
