function formatMachineLabel(value) {
  return String(value).replaceAll("_", " ").replaceAll("-", " ");
}

function formatDisplayLabel(value) {
  return formatMachineLabel(value)
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function buildVerificationNote(permitVerification) {
  if (permitVerification.verification_code === "REQUEST_EXCEEDS_APPROVED_NOTIONAL") {
    return {
      label: "Permit scope mismatch",
      detail:
        `The original request ($${permitVerification.requested_notional_usd}) exceeds the approved permit envelope ` +
        `($${permitVerification.approved_notional_usd}).`,
    };
  }

  if (permitVerification.verification_code === "VERDICT_DENIES_EXECUTION") {
    return {
      label: "Execution denied",
      detail: "The signed verdict denies execution, so the permit gate remains non-executable.",
    };
  }

  return {
    label: "Permit verification",
    detail: `Permit verification returned ${formatDisplayLabel(permitVerification.verification_code)}.`,
  };
}

export function buildStatusNotes(bundle) {
  const artifact = bundle?.evaluation?.validation_artifact;
  const permitVerification = bundle?.permit_verification;
  const executionPreview = bundle?.execution_preview;

  if (!artifact || !permitVerification || !executionPreview) {
    return [];
  }

  const notes = [];

  if (
    artifact.proof_status === "VALIDATED" &&
    permitVerification.verification_code === "EXECUTION_PERMITTED" &&
    executionPreview.execution_disposition === "ALLOWED_AS_REQUESTED"
  ) {
    return notes;
  }

  if (artifact.proof_status === "CONSTRAINED") {
    notes.push({
      label: "Constrained proof state",
      detail:
        "Sentinel returned a constrained proof state because execution is only permitted inside the approved downsized permit envelope.",
    });
  } else if (artifact.proof_status === "BLOCKED") {
    notes.push({
      label: "Blocked proof state",
      detail: "Sentinel did not produce a fully executable proof path for this scenario.",
    });
  }

  if (permitVerification.verification_code !== "EXECUTION_PERMITTED") {
    notes.push(buildVerificationNote(permitVerification));
  }

  const surfacedFailedChecks = permitVerification.checks
    .filter((check) => !check.ok)
    .filter(
      (check) =>
        check.name !== "requested_notional_within_approved" &&
        check.name !== "verdict_allows_execution",
    )
    .slice(0, 2);

  for (const check of surfacedFailedChecks) {
    notes.push({
      label: formatDisplayLabel(check.name),
      detail: check.detail,
    });
  }

  if (executionPreview.execution_disposition === "ALLOWED_WITH_DOWNSIZE") {
    notes.push({
      label: "Execution preview",
      detail:
        "The preview includes a downsized executable order. The permit panel still reflects the original requested envelope so judges can see the constrained path clearly.",
    });
  } else if (executionPreview.execution_disposition === "BLOCKED") {
    notes.push({
      label: "Execution preview",
      detail: "The Kraken preview remains blocked and does not emit an executable order for this scenario.",
    });
  }

  return notes;
}

export function buildStatusSummary(bundle, notes) {
  if (notes.length === 0) {
    return "";
  }

  const proofStatus = bundle?.evaluation?.validation_artifact?.proof_status;

  if (proofStatus === "CONSTRAINED") {
    return "Sentinel produced a bounded path. The notes below explain why the original request is not fully executable as requested.";
  }

  if (proofStatus === "BLOCKED") {
    return "Sentinel blocked the requested path. The notes below explain why this scenario should not be read as fully green.";
  }

  return "The notes below explain why the current state is not fully green.";
}
