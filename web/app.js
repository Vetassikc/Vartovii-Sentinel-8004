const selectElement = document.querySelector("#scenario-select");
const reloadButton = document.querySelector("#reload-button");
const summaryElement = document.querySelector("#scenario-summary");
const scenarioBadge = document.querySelector("#scenario-badge");
const highlightsElement = document.querySelector("#scenario-highlights");
const intentPanel = document.querySelector("#intent-panel");
const verdictPanel = document.querySelector("#verdict-panel");
const artifactPanel = document.querySelector("#artifact-panel");
const permitPanel = document.querySelector("#permit-panel");
const executionPanel = document.querySelector("#execution-panel");

function renderJson(element, value) {
  element.textContent = JSON.stringify(value, null, 2);
}

function buildSummary(bundle) {
  const { scenario_name: scenarioName, evaluation, permit_verification: permitVerification } = bundle;
  return [
    `Scenario: ${formatScenarioLabel(scenarioName)}`,
    `Verdict: ${formatDisplayLabel(evaluation.verdict)}`,
    `Proof: ${formatDisplayLabel(evaluation.validation_artifact.proof_status)}`,
    `Permit executable: ${permitVerification.executable ? "yes" : "no"}`,
    `Execution rail: ${formatDisplayLabel(bundle.execution_preview.execution_disposition)}`,
  ].join(" | ");
}

function formatVerdictLabel(verdict) {
  return verdict.replaceAll("_", " ");
}

function formatScenarioLabel(scenarioName) {
  return scenarioName.replaceAll("-", " ");
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
  const verdict = bundle.evaluation.verdict;
  if (verdict === "ALLOW") {
    return "allow";
  }

  if (verdict === "ALLOW_WITH_DOWNSIZE") {
    return "downsize";
  }

  return "deny";
}

function renderHighlights(bundle) {
  const {
    scenario_name: scenarioName,
    intent,
    evaluation,
    permit_verification: permitVerification,
    execution_preview: executionPreview,
  } = bundle;
  const cards = [
    {
      label: "Scenario",
      value: formatScenarioLabel(scenarioName),
      note: `${intent.market} ${intent.side}`,
    },
    {
      label: "Verdict",
      value: formatDisplayLabel(evaluation.verdict),
      note: formatDisplayLabel(evaluation.reason_code),
    },
    {
      label: "Permit",
      value: permitVerification.executable ? "Executable" : "Blocked",
      note: formatDisplayLabel(permitVerification.verification_code),
    },
    {
      label: "Proof",
      value: formatDisplayLabel(evaluation.validation_artifact.proof_status),
      note: `${evaluation.validation_artifact.proof_checks.length} checks`,
    },
    {
      label: "Requested",
      value: `$${intent.notional_usd}`,
      note: `Trace ${intent.trace_id}`,
    },
    {
      label: "Execution rail",
      value: formatDisplayLabel(executionPreview.execution_disposition),
      note: formatDisplayLabel(executionPreview.execution_rail),
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

async function loadScenarioBundle(scenarioName) {
  const response = await fetch(`/api/demo/scenarios/${scenarioName}`);
  if (!response.ok) {
    throw new Error(`Failed to load ${scenarioName}`);
  }

  return response.json();
}

async function populateScenarioList() {
  const response = await fetch("/api/demo/scenarios");
  if (!response.ok) {
    throw new Error("Failed to load scenarios");
  }

  const payload = await response.json();
  for (const scenarioName of payload.scenarios) {
    const option = document.createElement("option");
    option.value = scenarioName;
    option.textContent = scenarioName;
    selectElement.append(option);
  }
}

async function renderScenario(scenarioName) {
  summaryElement.textContent = "Loading scenario bundle...";
  scenarioBadge.textContent = "Loading scenario";
  scenarioBadge.className = "status-pill status-pill-neutral";
  highlightsElement.innerHTML = "";

  try {
    const bundle = await loadScenarioBundle(scenarioName);

    summaryElement.textContent = buildSummary(bundle);
    scenarioBadge.textContent = formatVerdictLabel(bundle.evaluation.verdict);
    scenarioBadge.className = `status-pill status-pill-${getBadgeVariant(bundle)}`;
    renderHighlights(bundle);
    renderJson(intentPanel, bundle.intent);
    renderJson(verdictPanel, bundle.evaluation);
    renderJson(artifactPanel, bundle.evaluation.validation_artifact);
    renderJson(permitPanel, bundle.permit_verification);
    renderJson(executionPanel, bundle.execution_preview);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown loading error";
    summaryElement.textContent = message;
    scenarioBadge.textContent = "Load failed";
    scenarioBadge.className = "status-pill status-pill-deny";
    highlightsElement.innerHTML = "";
    intentPanel.textContent = message;
    verdictPanel.textContent = message;
    artifactPanel.textContent = message;
    permitPanel.textContent = message;
    executionPanel.textContent = message;
  }
}

reloadButton.addEventListener("click", () => {
  renderScenario(selectElement.value);
});

selectElement.addEventListener("change", () => {
  renderScenario(selectElement.value);
});

await populateScenarioList();
selectElement.value = "allow-btc-buy";
await renderScenario(selectElement.value);
