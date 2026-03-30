import { readFile } from "node:fs/promises";
import path from "node:path";

import type {
  AgentRegistration,
  SentinelEvaluationResponse,
  TradeIntent,
  ValidationArtifact,
} from "../../shared/schemas/sentinel.ts";

const SCENARIO_NAMES = [
  "allow-btc-buy",
  "deny-oversize-eth",
  "downsize-eth-buy",
  "fail-closed-oracle",
] as const;

type ScenarioName = (typeof SCENARIO_NAMES)[number];

const ROOT_DIR = new URL("../../", import.meta.url);

function resolveFromRoot(...segments: string[]): URL {
  return new URL(segments.join("/"), ROOT_DIR);
}

export function listScenarioNames(): ScenarioName[] {
  return [...SCENARIO_NAMES];
}

export function isScenarioName(value: string): value is ScenarioName {
  return SCENARIO_NAMES.includes(value as ScenarioName);
}

export function resolveScenarioIntentPath(name: ScenarioName): URL {
  return resolveFromRoot(`examples/intents/${name}.json`);
}

export function resolveScenarioVerdictPath(name: ScenarioName): URL {
  return resolveFromRoot(`examples/verdicts/${name}.verdict.json`);
}

export function resolveValidationArtifactPath(name: ScenarioName): URL {
  return resolveFromRoot(`examples/validation-artifacts/${name}.validation-artifact.json`);
}

export function resolveAgentRegistrationPath(name: string): URL {
  return resolveFromRoot(`examples/agent-registrations/${name}.registration.json`);
}

export function resolveInputPath(input: string): URL {
  if (path.isAbsolute(input)) {
    return new URL(`file://${input}`);
  }

  return new URL(input, ROOT_DIR);
}

async function readJsonFile<T>(fileUrl: URL): Promise<T> {
  const content = await readFile(fileUrl, "utf8");
  return JSON.parse(content) as T;
}

export async function loadScenarioIntent(name: ScenarioName): Promise<TradeIntent> {
  return readJsonFile<TradeIntent>(resolveScenarioIntentPath(name));
}

export async function loadExpectedVerdict(
  name: ScenarioName,
): Promise<SentinelEvaluationResponse> {
  return readJsonFile<SentinelEvaluationResponse>(resolveScenarioVerdictPath(name));
}

export async function loadExpectedValidationArtifact(
  name: ScenarioName,
): Promise<ValidationArtifact> {
  return readJsonFile<ValidationArtifact>(resolveValidationArtifactPath(name));
}

export async function loadAgentRegistration(name: string): Promise<AgentRegistration> {
  return readJsonFile<AgentRegistration>(resolveAgentRegistrationPath(name));
}

export async function loadIntentFromFile(fileUrl: URL): Promise<TradeIntent> {
  return readJsonFile<TradeIntent>(fileUrl);
}
