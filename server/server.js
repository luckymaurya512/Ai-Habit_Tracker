import "dotenv/config";
import express from "express";
import dns from "dns";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.js";
import habitRoutes from "./routes/habits.js";
import logRoutes from "./routes/logs.js";
import aiRoutes from "./routes/ai.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const app = express();

const allowedOrigins = (process.env.CLIENT_URL || "").split(",").map((s) => s.trim()).filter(Boolean);

const corsOptions = {
    origin(origin, cb) {
        if (!origin) return cb(null, true);
        if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
            return cb(null, true);
        }
        if (allowedOrigins.includes(origin)) return cb(null, true);
        return cb(new Error(`Origin ${origin} not allowed by cors`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["content-Type", "Authorization"],
};

app.use(cors(corsOptions));
// app.options(/.*/, cors(corsOptions));

const jsonParser = express.json({ limit: "1mb" });

app.use((req, res, next) => {
    jsonParser(req, res, (err) => {
        if (err) {
            // If the body is just empty or whitespace, ignore the parse error and set req.body = {}
            if (err.status === 400 && typeof err.body === "string" && err.body.trim() === "") {
                req.body = {};
                return next();
            }
            return next(err);
        }
        next();
    });
});

app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() })
});

app.use("/api/auth", authRoutes);
app.use("/api/habits", habitRoutes);
app.use("/api/logs", logRoutes);
app.use("/api/ai", aiRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 8000;

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}).catch((err) => {
    console.error("Failed to start server:", err.message);
    process.exit(1);
});