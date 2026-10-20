import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import createApp from "../src/app.js";

test("Basic Auth protege GraphQL y health permanece pÃºblico", async (t) => {
  const previous = [process.env.BASIC_AUTH_USER, process.env.BASIC_AUTH_PASS];
  process.env.BASIC_AUTH_USER = "demo";
  process.env.BASIC_AUTH_PASS = "secret";
  const app = createApp({ clientesUseCases: { listar: async () => [] } });
  const server = app.listen(0);
  await once(server, "listening");
  t.after(() => {
    server.close();
    if (previous[0] === undefined) delete process.env.BASIC_AUTH_USER; else process.env.BASIC_AUTH_USER = previous[0];
    if (previous[1] === undefined) delete process.env.BASIC_AUTH_PASS; else process.env.BASIC_AUTH_PASS = previous[1];
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  const health = await fetch(`${base}/health`);
  assert.equal(health.status, 200);
  const unauthorized = await fetch(`${base}/graphql`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: "{ clientes { nombre } }" }) });
  assert.equal(unauthorized.status, 401);
  const headers = { Authorization: `Basic ${Buffer.from("demo:secret").toString("base64")}`, "Content-Type": "application/json" };
  const gql = await fetch(`${base}/graphql`, { method: "POST", headers, body: JSON.stringify({ query: "{ clientes { nombre } }" }) });
  assert.deepEqual((await gql.json()).data.clientes, []);
  const removedRoute = await fetch(`${base}/api/piezas`, { headers });
  assert.equal(removedRoute.status, 404);
});
