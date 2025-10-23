export const basicAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return res.status(401).json({ message: "Authorization header missing or invalid" });
  }

  // Decodificar credenciales base64
  const base64Credentials = authHeader.split(" ")[1];
  const credentials = Buffer.from(base64Credentials, "base64").toString("utf8");
  const [username, password] = credentials.split(":");

  // Validar contra variables de entorno
  const validUser = process.env.BASIC_AUTH_USER;
  const validPass = process.env.BASIC_AUTH_PASS;

  if (username !== validUser || password !== validPass) {
    return res.status(403).json({ message: "Invalid credentials" });
  }

  next(); // autorizado
};
