export class Counter {
  constructor(state) {
    this.state = state;
  }

  async fetch(request) {
    const url = new URL(request.url);
    if (request.method !== "POST" && request.method !== "GET") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const current = (await this.state.storage.get("value")) ?? 0;

    // GET only reads; POST increments. (We also allow GET increment via /hit route below.)
    if (request.method === "POST") {
      const next = current + 1;
      await this.state.storage.put("value", next);
      return json({ value: next });
    }

    return json({ value: current });
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "");

    // CORS (so a static HTML page can call this)
    if (request.method === "OPTIONS") {
      return cors(new Response(null, { status: 204 }));
    }

    // Routes:
    // - GET  /get/<key>  -> read current count
    // - GET  /hit/<key>  -> increment and return count
    // - POST /hit/<key>  -> increment and return count
    const hitMatch = path.match(/^\/hit\/([^/]+)$/);
    const getMatch = path.match(/^\/get\/([^/]+)$/);
    if (!hitMatch && !getMatch) {
      return cors(new Response("Not Found", { status: 404 }));
    }

    const key = decodeURIComponent((hitMatch ?? getMatch)[1]).slice(0, 128);
    const id = env.COUNTER.idFromName(key);
    const stub = env.COUNTER.get(id);

    if (getMatch) {
      const res = await stub.fetch("https://do/get", { method: "GET" });
      return cors(res);
    }

    // hit route
    const res = await stub.fetch("https://do/hit", {
      method: request.method === "POST" ? "POST" : "POST",
    });
    return cors(res);
  },
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function cors(response) {
  const headers = new Headers(response.headers);
  headers.set("access-control-allow-origin", "*");
  headers.set("access-control-allow-methods", "GET,POST,OPTIONS");
  headers.set("access-control-allow-headers", "content-type");
  headers.set("access-control-max-age", "86400");
  return new Response(response.body, { status: response.status, headers });
}

