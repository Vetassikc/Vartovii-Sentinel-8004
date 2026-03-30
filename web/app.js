const selectElement = document.querySelector("#scenario-select");
const reloadButton = document.querySelector("#reload-button");
const summaryElement = document.querySelector("#scenario-summary");
const intentPanel = document.querySelector("#intent-panel");
const verdictPanel = document.querySelector("#verdict-panel");
const artifactPanel = document.querySelector("#artifact-panel");
const permitPanel = document.querySelector("#permit-panel");

function renderJson(element, value) {
  element.textContent = JSON.stringify(value, null, 2);
}

function buildSummary(bundle) {
  const { scenario_name: scenarioName, evaluation, permit_verification: permitVerification } = bundle;
  return [
    `Scenario: ${scenarioName}`,
    `Verdict: ${evaluation.verdict}`,
    `Proof: ${evaluation.validation_artifact.proof_status}`,
    `Permit executable: ${permitVerification.executable ? "yes" : "no"}`,
  ].join(" | ");
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

  try {
    const bundle = await loadScenarioBundle(scenarioName);

    summaryElement.textContent = buildSummary(bundle);
    renderJson(intentPanel, bundle.intent);
    renderJson(verdictPanel, bundle.evaluation);
    renderJson(artifactPanel, bundle.evaluation.validation_artifact);
    renderJson(permitPanel, bundle.permit_verification);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown loading error";
    summaryElement.textContent = message;
    intentPanel.textContent = message;
    verdictPanel.textContent = message;
    artifactPanel.textContent = message;
    permitPanel.textContent = message;
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
