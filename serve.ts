const apiBase = Deno.env.get("API_BASE") ?? "http://localhost:5173";

const html = (
  await Deno.readTextFile(new URL("./index.html", import.meta.url))
).replace("__API_BASE__", apiBase);

Deno.serve({ port: 8080 }, (_req) => {
  return new Response(html, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
});
