import { Portfolio } from "../models/Portfolio.js";

// Get portfolio
export const getPortfolio = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized user" });
    }

    const portfolio = await Portfolio.find({ userId });
    res.status(200).json({ portfolio });
  } catch (error) {
    res.status(500).json({ message: "Error fetching portfolio", error: error.message });
  }
};


// Add stock
export const addStock = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized user for adding stocks" });

    let { stockName, quantity, avgPrice, country } = req.body;
    if (!stockName || !quantity) {
      return res.status(400).json({ message: "stockName and quantity required" });
    }

    stockName = String(stockName).trim().toUpperCase();
    country = (country || "IN").toString().trim().toUpperCase();
    quantity = Number(quantity);
    avgPrice = avgPrice !== undefined ? Number(avgPrice) : undefined;

    if (!Number.isFinite(quantity) || quantity <= 0) {
      return res.status(400).json({ message: "Quantity must be a positive number" });
    }

    const newStock = new Portfolio({ userId, stockName, quantity, avgPrice, country });
    await newStock.save();

    res.status(201).json({ message: "Stock added", stock: newStock });
  } catch (error) {
    res.status(500).json({ message: "Error adding stock", error: error.message });
  }
};


// remove stock
export const removeStock = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized user to remove stock" });

    let { stock } = req.params;
    if (!stock) return res.status(400).json({ message: "Stock stockName is required to delete" });
    let stockName = String(stock).trim().toUpperCase();

    const deletedStock = await Portfolio.findOneAndDelete({
       userId,stockName
    });

    if (!deletedStock) {
      return res.status(404).json({ message: `Stock ${stockName} not found in portfolio` });
    }

    res.status(200).json({ message: `Stock ${stockName} removed from portfolio` });
  } catch (error) {
    res.status(500).json({ message: "Error deleting stock", error: error.message });
  }
};


// Update stock quantity and/or avgPrice
export const updateStock = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized user" });

    let { stockName, country, quantity, avgPrice } = req.body;
    if (!stockName) {
      return res.status(400).json({ message: "stockName is required" });
    }

    stockName = String(stockName).trim().toUpperCase();
    country = country ? String(country).trim().toUpperCase() : "IN";

    // Ensure at least one field to update
    if (quantity === undefined && avgPrice === undefined) {
      return res.status(400).json({ message: "Provide quantity and/or avgPrice to update" });
    }

    const updateData = {};
    if (quantity !== undefined) {
      quantity = Number(quantity);
      if (!Number.isFinite(quantity) || quantity <= 0) {
        return res.status(400).json({ message: "Quantity must be a positive number" });
      }
      updateData.quantity = quantity;
    }
    if (avgPrice !== undefined) {
      avgPrice = Number(avgPrice);
      if (!Number.isFinite(avgPrice) || avgPrice < 0) {
        return res.status(400).json({ message: "avgPrice must be a non-negative number" });
      }
      updateData.avgPrice = avgPrice;
    }

    const updatedStock = await Portfolio.findOneAndUpdate(
      { userId, stockName, country },
      { $set: updateData },
      { new: true } // return updated document
    );

    if (!updatedStock) {
      return res.status(404).json({ message: `Stock ${stockName} (${country}) not found in portfolio` });
    }

    res.status(200).json({ message: "Stock updated successfully", stock: updatedStock });
  } catch (error) {
    res.status(500).json({ message: "Error updating stock", error: error.message });
  }
};







