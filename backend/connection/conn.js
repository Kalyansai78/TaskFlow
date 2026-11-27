const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error("MONGODB_URI is missing in environment variables");
        }

        await mongoose.connect(process.env.MONGODB_URI, {
            dbName: process.env.DB_NAME || "taskflow"
        });

        console.log("MongoDB connected successfully");
        console.log(`Database: ${mongoose.connection.name}`);

    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
        throw error;
    }
};

module.exports = connectDB;