import { timingSafeEqual } from "node:crypto";

export const validateBasicAuthConfig = (env = process.env) => {
  if (!env.BASIC_AUTH_USER || !env.BASIC_AUTH_PASS) throw new Error("BASIC_AUTH_USER y BASIC_AUTH_PASS deben configurarse");
};

export const basicAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Basic ")) return res.status(401).set("WWW-Authenticate", 'Basic realm="ferreteria"').json({ message: "Autenticación requerida" });
  const encoded = authHeader.slice(6).trim();
  let credentials;
  try {
    if (!encoded || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(encoded)) throw new Error("Formato inválido");
    credentials = Buffer.from(encoded, "base64").toString("utf8");
  } catch {
    return res.status(401).json({ message: "Credenciales inválidas" });
  }
  const separator = credentials.indexOf(":");
  if (separator < 0) return res.status(401).json({ message: "Credenciales inválidas" });
  const supplied = [credentials.slice(0, separator), credentials.slice(separator + 1)];
  const expected = [process.env.BASIC_AUTH_USER || "", process.env.BASIC_AUTH_PASS || ""];
  const matches = supplied.every((value, index) => {
    const a = Buffer.from(value);
    const b = Buffer.from(expected[index]);
    return a.length === b.length && (a.length === 0 || timingSafeEqual(a, b));
  });
  if (!matches || !expected[0] || !expected[1]) return res.status(401).json({ message: "Credenciales inválidas" });
  next();
};
