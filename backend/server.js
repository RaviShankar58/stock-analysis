import "dotenv/config";
import express from "express";
import cron from "node-cron"; // for news fetcher
import cors from "cors";
import connectDB  from "./config/db.js";

// scheduler import
import { startNewsScheduler } from "./controllers/newsScheduler.js";

const app = express();


// ---------- CORS (replace app.use(cors()); with this) -------------------------
// app.use(cors());

const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:5173",
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
};

app.use(cors(corsOptions));

// ------------------------------------------------------------------------------


app.use(express.json());


// ------------------routes-----------------------------
// importing routes
import userAuthRoutes from "./routes/userAuth.js";
import portfolioRoutes from "./routes/portfolio.js";
import newsRouter from "./routes/newsRoutes.js";


// using routes
app.use("/user", userAuthRoutes);
app.use("/user/portfolio", portfolioRoutes);
app.use("/user/news", newsRouter);


const PORT = process.env.PORT || 8000;


;(async () => {
  await connectDB();
  // app.listen(PORT, () => console.log(`🚀 API running on http://localhost:${PORT}`));
  const server = app.listen(PORT, () =>
    console.log(`🚀 API running on http://localhost:${PORT}`)
  );

  server.setTimeout(5 * 60 * 1000);

  // runNewsFetch()// newly added
  
  startNewsScheduler();
})();



