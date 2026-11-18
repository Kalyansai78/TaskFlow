require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./connection/conn");

const auth = require("./routes/auth");
const list = require("./routes/list");

const app = express();
const PORT = process.env.PORT || 1000;

// Middleware
app.use(express.json());

app.use(cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
    })
);

// Health check
app.get("/", (req, res) => {
    res.status(200).json({
        message: "Todo API is running"
    });
});

// API routes
app.use("/api/v1", auth);
app.use("/api/v2", list);

// Connect to MongoDB before starting the server
const startServer = async () => {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log(`🚀 Server running at http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("❌ Failed to start server:", error.message);
        process.exit(1);
    }
};

startServer();