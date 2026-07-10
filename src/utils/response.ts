interface JsonResponseInit {
  status?: number;
  headers?: Record<string, string>;
}

export function jsonResponse(data: unknown, init?: JsonResponseInit): Response {
  return new Response(JSON.stringify(data), {
    status: init?.status ?? 200,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
}

export function textResponse(text: string, init?: JsonResponseInit): Response {
  return new Response(text, {
    status: init?.status ?? 200,
    headers: {
      "Content-Type": "text/plain",
      ...init?.headers,
    },
  });
}

export function errorResponse(message: string, status = 500): Response {
  return jsonResponse({ error: message }, { status });
}
