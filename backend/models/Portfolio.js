import mongoose from "mongoose";

const portfolioSchema = new mongoose.Schema(
  {
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: true 
    },
    stockName: { 
      type: String, 
      required: true,
      trim: true,        
    },
    quantity: { 
        type: Number, 
        required: true 
    }, 
    avgPrice: { 
        type: Number 
    },
    country: {
      type: String,
      trim: true,
      uppercase: true,
      default: "IN",
      maxlength: 2
    },              
  },
  { timestamps: true }
);

// Unique index on { userId, stockName } ensures the same user cannot have duplicate entries for the same stock.
portfolioSchema.index({ userId: 1, stockName: 1 ,country: 1}, { unique: true }); // ensure one stock per user

export const Portfolio = mongoose.model("Portfolio", portfolioSchema);
