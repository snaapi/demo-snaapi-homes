const apiBase = Deno.env.get("API_BASE") ?? "http://localhost:5173";

const escapedApiBase = JSON.stringify(apiBase).slice(1, -1);

const html = (
  await Deno.readTextFile(new URL("./index.html", import.meta.url))
).replace("__API_BASE__", escapedApiBase);

Deno.serve({ port: 8080 }, (_req) => {
  return new Response(html, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
});
