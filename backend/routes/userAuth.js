import express from "express";
import bcrypt from "bcrypt"; 
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// --- Signup ---
router.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists || Try again" });
    }

    // ✅ Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(201).json({
      message: "User created successfully",
      user: { id: newUser._id, username: newUser.username, email: newUser.email },
      token,
    });

  } catch (err) {
    res.status(500).json({ message: "Server error || can not create user", error: err.message });
  }
});


// --- Login ---
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }
    
    // const user = await User.findOne({
    //   $or: [{ email }, { username }]
    // }).lean();

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials || Please try again" });
    }

    // Compare hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials(password incorrect) || Please try again" });
    }

     // Issue JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    // password hatana response se
    const userObj = user.toObject();
    delete userObj.password;

    res.status(200).json({ message: "Login successful", user: userObj , token });

  } catch (err) {
    res.status(500).json({ message: "Server error || Login failed", error: err.message });
  }
});

router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized user" });
    }

    const user = await User.findById(userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ user });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch profile", error: err.message });
  }
});

export default router;
