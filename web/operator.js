const selectElement = document.querySelector("#operator-scenario-select");
const loadButton = document.querySelector("#operator-load-button");
const runButton = document.querySelector("#operator-run-button");
const statusBadge = document.querySelector("#operator-status-badge");
const summaryElement = document.querySelector("#operator-summary");
const highlightsElement = document.querySelector("#operator-highlights");
const intentInput = document.querySelector("#operator-intent-input");
const intentPanel = document.querySelector("#operator-intent-panel");
const signedIntentPanel = document.querySelector("#operator-signed-intent-panel");
const verdictPanel = document.querySelector("#operator-verdict-panel");
const artifactPanel = document.querySelector("#operator-artifact-panel");
const permitPanel = document.querySelector("#operator-permit-panel");
const executionPanel = document.querySelector("#operator-execution-panel");
const krakenPaperPanel = document.querySelector("#operator-kraken-paper-panel");

function renderJson(element, value) {
  element.textContent = JSON.stringify(value, null, 2);
}

function renderMessage(message) {
  intentPanel.textContent = message;
  signedIntentPanel.textContent = message;
  verdictPanel.textContent = message;
  artifactPanel.textContent = message;
  permitPanel.textContent = message;
  executionPanel.textContent = message;
  krakenPaperPanel.textContent = message;
}

function formatScenarioLabel(scenarioName) {
  return scenarioName.replaceAll("-", " ");
}

function formatVerdictLabel(verdict) {
  return verdict.replaceAll("_", " ");
}

function formatMachineLabel(value) {
  return value.replaceAll("_", " ").replaceAll("-", " ");
}

function formatDisplayLabel(value) {
  return formatMachineLabel(value)
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function getBadgeVariant(bundle) {
  if (bundle.evaluation.verdict === "ALLOW") {
    return "allow";
  }

  if (bundle.evaluation.verdict === "ALLOW_WITH_DOWNSIZE") {
    return "downsize";
  }

  return "deny";
}

function buildSummary(bundle) {
  return [
    `Intent: ${bundle.intent.intent_id}`,
    `Verdict: ${formatDisplayLabel(bundle.evaluation.verdict)}`,
    `Proof: ${formatDisplayLabel(bundle.evaluation.validation_artifact.proof_status)}`,
    `Permit executable: ${bundle.permit_verification.executable ? "yes" : "no"}`,
    `Execution rail: ${formatDisplayLabel(bundle.execution_preview.execution_disposition)}`,
  ].join(" | ");
}

function renderHighlights(bundle) {
  const cards = [
    {
      label: "Intent",
      value: bundle.intent.intent_id,
      note: `${bundle.intent.market} ${bundle.intent.side}`,
    },
    {
      label: "Agent",
      value: bundle.intent.agent_id,
      note: bundle.signed_intent_bundle.signer_wallet,
    },
    {
      label: "Verdict",
      value: formatDisplayLabel(bundle.evaluation.verdict),
      note: formatDisplayLabel(bundle.evaluation.reason_code),
    },
    {
      label: "Proof",
      value: formatDisplayLabel(bundle.evaluation.validation_artifact.proof_status),
      note: `${bundle.evaluation.validation_artifact.proof_checks.length} checks`,
    },
    {
      label: "Permit",
      value: bundle.permit_verification.executable ? "Executable" : "Blocked",
      note: formatDisplayLabel(bundle.permit_verification.verification_code),
    },
    {
      label: "Execution",
      value: formatDisplayLabel(bundle.execution_preview.execution_disposition),
      note: formatDisplayLabel(bundle.execution_preview.execution_rail),
    },
  ];

  highlightsElement.innerHTML = cards
    .map(
      (card) => `
        <article class="highlight-card">
          <p class="highlight-label">${card.label}</p>
          <h3>${card.value}</h3>
          <p class="highlight-note">${card.note}</p>
        </article>
      `,
    )
    .join("");
}

async function fetchScenarioNames() {
  const response = await fetch("/api/demo/scenarios");
  if (!response.ok) {
    throw new Error("Failed to load canonical scenarios.");
  }

  return response.json();
}

async function fetchScenarioIntent(scenarioName) {
  const response = await fetch(`/api/demo/scenarios/${scenarioName}`);
  if (!response.ok) {
    throw new Error(`Failed to load ${scenarioName}.`);
  }

  const bundle = await response.json();
  return bundle.intent;
}

async function runPipeline(intentText) {
  const response = await fetch("/api/demo/run-pipeline", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: intentText,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ error: "request_failed" }));
    const details = Array.isArray(payload.details) ? payload.details.join(" | ") : "";
    throw new Error([payload.error ?? "request_failed", details].filter(Boolean).join(": "));
  }

  return response.json();
}

async function loadSelectedScenario() {
  statusBadge.textContent = "Loading intent";
  statusBadge.className = "status-pill status-pill-neutral";
  summaryElement.textContent = "Loading canonical scenario...";
  highlightsElement.innerHTML = "";

  try {
    const intent = await fetchScenarioIntent(selectElement.value);
    intentInput.value = JSON.stringify(intent, null, 2);
    summaryElement.textContent =
      `Loaded canonical scenario: ${formatScenarioLabel(selectElement.value)}.`;
    statusBadge.textContent = "Intent loaded";
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown loading error";
    summaryElement.textContent = message;
    statusBadge.textContent = "Load failed";
    statusBadge.className = "status-pill status-pill-deny";
  }
}

async function handlePipelineRun() {
  statusBadge.textContent = "Running pipeline";
  statusBadge.className = "status-pill status-pill-neutral";
  summaryElement.textContent = "Submitting intent through the operator dry-run flow...";
  highlightsElement.innerHTML = "";

  try {
    const parsedIntent = JSON.parse(intentInput.value);
    const normalizedIntent = JSON.stringify(parsedIntent, null, 2);
    intentInput.value = normalizedIntent;

    const bundle = await runPipeline(normalizedIntent);
    summaryElement.textContent = buildSummary(bundle);
    statusBadge.textContent = formatVerdictLabel(bundle.evaluation.verdict);
    statusBadge.className = `status-pill status-pill-${getBadgeVariant(bundle)}`;
    renderHighlights(bundle);
    renderJson(intentPanel, bundle.intent);
    renderJson(signedIntentPanel, {
      signed_intent_bundle: bundle.signed_intent_bundle,
      signed_intent_verification: bundle.signed_intent_verification,
    });
    renderJson(verdictPanel, bundle.evaluation);
    renderJson(artifactPanel, bundle.evaluation.validation_artifact);
    renderJson(permitPanel, bundle.permit_verification);
    renderJson(executionPanel, bundle.execution_preview);
    renderJson(krakenPaperPanel, bundle.kraken_cli_paper_artifact);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown pipeline error";
    summaryElement.textContent = message;
    statusBadge.textContent = "Run failed";
    statusBadge.className = "status-pill status-pill-deny";
    highlightsElement.innerHTML = "";
    renderMessage(message);
  }
}

loadButton.addEventListener("click", () => {
  loadSelectedScenario();
});

runButton.addEventListener("click", () => {
  handlePipelineRun();
});

const payload = await fetchScenarioNames();
for (const scenarioName of payload.scenarios) {
  const option = document.createElement("option");
  option.value = scenarioName;
  option.textContent = scenarioName;
  selectElement.append(option);
}

selectElement.value = "allow-btc-buy";
await loadSelectedScenario();
