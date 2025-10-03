import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1]; // "Bearer <token>"

  if (!token) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};
