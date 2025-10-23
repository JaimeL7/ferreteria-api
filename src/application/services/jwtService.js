import jwt from "jsonwebtoken";

const TOKEN_SECRET = process.env.JWT_SECRET;

export const jwtService = {
  sign(payload, options = {}) {
    return jwt.sign(payload, TOKEN_SECRET, { expiresIn: "1h", ...options });
  },

  verify(token) {
    try {
      return jwt.verify(token, TOKEN_SECRET);
    } catch (error) {
      return null;
    }
  },

  decode(token) {
    return jwt.decode(token);
  },
};
