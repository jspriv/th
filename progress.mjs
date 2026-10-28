import { getStore } from "@netlify/blobs";

export default async (req) => {
  const store = getStore("thyroid-tracker");
  const id = (new URL(req.url).searchParams.get("id") || "")
    .replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40);
  if (!id) return Response.json({ error: "missing id" }, { status: 400 });

  if (req.method === "GET") {
    return Response.json((await store.get(id, { type: "json" })) || {});
  }
  if (req.method === "PUT") {
    const b = await req.json().catch(() => null);
    if (!b || !/^\d{4}-\d{2}-\d{2}$/.test(b.start || "")) {
      return Response.json({ error: "bad data" }, { status: 400 });
    }
    const goal = Math.max(7, Math.min(365, parseInt(b.goal, 10) || 30));
    const done = [...new Set((Array.isArray(b.done) ? b.done : [])
      .map(Number).filter((n) => Number.isInteger(n) && n >= 0 && n < goal))];
    await store.setJSON(id, { start: b.start, goal, done });
    return Response.json({ ok: true });
  }
  return new Response("Method not allowed", { status: 405 });
};

export const config = { path: "/api/progress" };
