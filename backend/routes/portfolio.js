import express from "express";
import { getPortfolio, addStock, removeStock,updateStock } from "../controllers/portfolioController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// GET current portfolio
// full path (when mounted at app.use("/user/portfolio", router)) => GET /user/portfolio
router.get("/", authMiddleware, getPortfolio);

// Add stock
// POST /user/portfolio/add
router.post("/add", authMiddleware, addStock);

// Remove symbol
// DELETE /user/portfolio/remove/:symbol
router.delete("/remove/:stock", authMiddleware, removeStock);

// PATCH /user/portfolio/update
router.patch("/update", authMiddleware, updateStock);


export default router;

