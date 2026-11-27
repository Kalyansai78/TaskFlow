require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./connection/conn");

const auth = require("./routes/auth");
const list = require("./routes/list");
const notification = require("./routes/notification");

const startNotificationScheduler = require("./utils/notificationScheduler");

const app = express();
const PORT = process.env.PORT || 1000;

// Middleware
app.use(express.json());

const allowedOrigins = (
    process.env.FRONTEND_URL || "http://localhost:5173"
)
    .split(",")
    .map(origin => origin.trim());

app.use(cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

// Health check
app.get("/", (req, res) => {
    res.status(200).json({
        message: "TaskFlow API is running"
    });
});

// API routes
app.use("/api/v1", auth);
app.use("/api/v2", list);
app.use("/api/v3/notifications", notification);

// Connect to MongoDB before starting the server
const startServer = async () => {
    try {
        await connectDB();

        // Restore scheduled notifications before starting the server
        await startNotificationScheduler();

        app.listen(PORT, () => {
            console.log(`🚀 Server running at http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("❌ Failed to start server:", error.message);
        process.exit(1);
    }
};

startServer();