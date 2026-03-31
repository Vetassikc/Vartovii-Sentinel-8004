import { readFile } from "node:fs/promises";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

import {
  buildSignedTradeIntentBundle,
  validateSignedTradeIntentBundle,
  verifySignedTradeIntentBundle,
} from "./erc8004.ts";
import {
  evaluateTradeIntent,
  validatePermitVerificationRequest,
  validateTradeIntent,
  verifyTradePermit,
} from "./policy.ts";
import {
  isScenarioName,
  listScenarioNames,
  loadScenarioIntent,
} from "./scenarios.ts";

type JudgeModeResponse = {
  statusCode: number;
  payload: unknown;
  contentType?: string;
};

type ServerEnv = {
  HOST?: string;
  NODE_ENV?: string;
  PORT?: string;
};

const ROOT_DIR = new URL("../../", import.meta.url);
const STATIC_ASSETS = {
  "/": {
    fileUrl: new URL("web/hub.html", ROOT_DIR),
    contentType: "text/html; charset=utf-8",
  },
  "/judge": {
    fileUrl: new URL("web/index.html", ROOT_DIR),
    contentType: "text/html; charset=utf-8",
  },
  "/judge/": {
    fileUrl: new URL("web/index.html", ROOT_DIR),
    contentType: "text/html; charset=utf-8",
  },
  "/web/app.js": {
    fileUrl: new URL("web/app.js", ROOT_DIR),
    contentType: "text/javascript; charset=utf-8",
  },
  "/web/styles.css": {
    fileUrl: new URL("web/styles.css", ROOT_DIR),
    contentType: "text/css; charset=utf-8",
  },
} as const;

function respond(
  response: ServerResponse,
  result: JudgeModeResponse,
): void {
  const isTextResponse = typeof result.payload === "string" && result.contentType !== undefined;
  const body = isTextResponse
    ? result.payload
    : JSON.stringify(result.payload, null, 2);

  response.writeHead(result.statusCode, {
    "content-type": result.contentType ?? "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(body),
  });
  response.end(body);
}

async function readStaticAsset(pathname: keyof typeof STATIC_ASSETS): Promise<string> {
  return readFile(STATIC_ASSETS[pathname].fileUrl, "utf8");
}

async function buildScenarioBundle(pathname: string): Promise<JudgeModeResponse | null> {
  if (pathname === "/healthz") {
    return {
      statusCode: 200,
      payload: {
        status: "ok",
        service: "vartovii-sentinel-8004",
        judge_mode: true,
      },
    };
  }

  if (pathname === "/api/demo/scenarios") {
    return {
      statusCode: 200,
      payload: {
        scenarios: listScenarioNames(),
      },
    };
  }

  const signedIntentPrefix = "/api/demo/signed-intents/";
  if (pathname.startsWith(signedIntentPrefix)) {
    const scenarioName = pathname.slice(signedIntentPrefix.length);
    if (!isScenarioName(scenarioName)) {
      return {
        statusCode: 404,
        payload: {
          error: "not_found",
          details: [`Unknown scenario: ${scenarioName}`],
        },
      };
    }

    const intent = await loadScenarioIntent(scenarioName);
    const signedIntentBundle = buildSignedTradeIntentBundle(intent);

    return {
      statusCode: 200,
      payload: signedIntentBundle,
    };
  }

  const prefix = "/api/demo/scenarios/";
  if (!pathname.startsWith(prefix)) {
    return null;
  }

  const scenarioName = pathname.slice(prefix.length);
  if (!isScenarioName(scenarioName)) {
    return {
      statusCode: 404,
      payload: {
        error: "not_found",
        details: [`Unknown scenario: ${scenarioName}`],
      },
    };
  }

  const intent = await loadScenarioIntent(scenarioName);
  const signedIntentBundle = buildSignedTradeIntentBundle(intent);
  const evaluation = evaluateTradeIntent(intent);

  return {
    statusCode: 200,
    payload: {
      scenario_name: scenarioName,
      intent,
      signed_intent_bundle: signedIntentBundle,
      signed_intent_verification: verifySignedTradeIntentBundle(signedIntentBundle),
      evaluation,
      permit_verification: verifyTradePermit({
        intent,
        signed_verdict: evaluation.signed_verdict,
      }),
    },
  };
}

export function resolveServerConfig(env: ServerEnv = process.env): {
  host: string;
  port: number;
} {
  const port = Number(env.PORT ?? "8787");
  const host = env.HOST ?? (env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1");

  return {
    host,
    port,
  };
}

async function readRawBody(request: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (chunks.length === 0) {
    return "";
  }

  return Buffer.concat(chunks).toString("utf8");
}

export async function handleJudgeModeRequest(
  method: string,
  pathname: string,
  rawBody: string,
): Promise<JudgeModeResponse> {
  if (method === "GET" && pathname in STATIC_ASSETS) {
    return {
      statusCode: 200,
      payload: await readStaticAsset(pathname as keyof typeof STATIC_ASSETS),
      contentType: STATIC_ASSETS[pathname as keyof typeof STATIC_ASSETS].contentType,
    };
  }

  if (method === "GET") {
    const scenarioBundle = await buildScenarioBundle(pathname);
    if (scenarioBundle) {
      return scenarioBundle;
    }
  }

  if (
    method === "POST" &&
    (
      pathname === "/api/demo/evaluate-intent" ||
      pathname === "/api/demo/verify-permit" ||
      pathname === "/api/demo/verify-signed-intent"
    )
  ) {
    try {
      const payload = rawBody.length === 0 ? {} : JSON.parse(rawBody);

      if (pathname === "/api/demo/evaluate-intent") {
        const validation = validateTradeIntent(payload);
        if (!validation.ok) {
          return {
            statusCode: 400,
            payload: validation.error,
          };
        }

        return {
          statusCode: 200,
          payload: evaluateTradeIntent(validation.value),
        };
      }

      if (pathname === "/api/demo/verify-signed-intent") {
        const validation = validateSignedTradeIntentBundle(payload);
        if (!validation.ok) {
          return {
            statusCode: 400,
            payload: validation.error,
          };
        }

        return {
          statusCode: 200,
          payload: verifySignedTradeIntentBundle(validation.value),
        };
      }

      const validation = validatePermitVerificationRequest(payload);
      if (!validation.ok) {
        return {
          statusCode: 400,
          payload: validation.error,
        };
      }

      return {
        statusCode: 200,
        payload: verifyTradePermit(validation.value),
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown JSON parsing error.";

      return {
        statusCode: 400,
        payload: {
          error: "invalid_json",
          details: [message],
        },
      };
    }
  }

  return {
    statusCode: 404,
    payload: {
      error: "not_found",
      details: [`No route for ${method} ${pathname}`],
    },
  };
}

export function createJudgeModeServer() {
  return createServer(async (request, response) => {
    const requestUrl = new URL(request.url ?? "/", "http://127.0.0.1");
    const rawBody = request.method === "POST" ? await readRawBody(request) : "";
    const result = await handleJudgeModeRequest(
      request.method ?? "UNKNOWN",
      requestUrl.pathname,
      rawBody,
    );
    respond(response, result);
  });
}

const isEntryPoint =
  typeof process.argv[1] === "string" &&
  import.meta.url === new URL(`file://${process.argv[1]}`).href;

if (isEntryPoint) {
  const { host, port } = resolveServerConfig();
  const server = createJudgeModeServer();
  server.listen(port, host, () => {
    console.log(`Sentinel judge mode listening on http://${host}:${port}`);
  });
}
