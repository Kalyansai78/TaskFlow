const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/user");

const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Authentication required. Please sign in."
            });
        }

        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET is missing in environment variables");

            return res.status(500).json({
                message: "Authentication service is not configured."
            });
        }

        const token = authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                message: "Authentication token is missing."
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Validate user ID from decoded token.
        if (
            !decoded.userId ||
            !mongoose.Types.ObjectId.isValid(decoded.userId)
        ) {
            return res.status(401).json({
                message: "Invalid authentication token."
            });
        }

        // Check whether the user still exists.
        const user = await User.findById(decoded.userId)
            .select("_id");

        if (!user) {
            return res.status(401).json({
                message: "Your account no longer exists. Please sign in again."
            });
        }

        req.user = {
            userId: user._id.toString()
        };

        next();

    } catch (error) {

        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                message: "Session expired. Please sign in again."
            });
        }

        if (
            error.name === "JsonWebTokenError" ||
            error.name === "NotBeforeError"
        ) {
            return res.status(401).json({
                message: "Invalid authentication token."
            });
        }

        console.error(
            "Authentication middleware error:",
            error.message
        );

        return res.status(500).json({
            message: "Unable to verify authentication. Please try again."
        });
    }
};

module.exports = verifyToken;