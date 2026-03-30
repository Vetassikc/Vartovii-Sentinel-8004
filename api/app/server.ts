import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

import { evaluateTradeIntent, validateTradeIntent } from "./policy.ts";

function respondJson(
  response: ServerResponse,
  statusCode: number,
  payload: unknown,
): void {
  const body = JSON.stringify(payload, null, 2);
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(body),
  });
  response.end(body);
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
): Promise<{ statusCode: number; payload: unknown }> {
  if (method === "POST" && pathname === "/api/demo/evaluate-intent") {
    try {
      const payload = rawBody.length === 0 ? {} : JSON.parse(rawBody);
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
    respondJson(response, result.statusCode, result.payload);
  });
}

const isEntryPoint =
  typeof process.argv[1] === "string" &&
  import.meta.url === new URL(`file://${process.argv[1]}`).href;

if (isEntryPoint) {
  const port = Number(process.env.PORT ?? "8787");
  const server = createJudgeModeServer();
  server.listen(port, "127.0.0.1", () => {
    console.log(`Sentinel judge mode listening on http://127.0.0.1:${port}`);
  });
}
