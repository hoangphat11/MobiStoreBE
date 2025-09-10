import jwt from "jsonwebtoken";
import User from "../models/UserModel.js";
import winston from "winston";
import { trace, context } from "@opentelemetry/api";
import dotenv from "dotenv";

dotenv.config();

// ======================
// Config Logger
// ======================
const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        winston.format.printf(
            ({ timestamp, level, message, ...meta }) =>
                `${timestamp} [${level.toUpperCase()}] ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ""
                }`
        )
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: "logs/app.log" }),
    ],
});

// ======================
// Helper function for tracing
// ======================
const logWithTrace = (message, meta = {}) => {
    const span = trace.getSpan(context.active());
    const traceId = span?.spanContext()?.traceId;
    logger.info(message, { ...meta, traceId });
};

// ======================
// Admin Permission Middleware
// ======================
export const authPermissionMiddleware = (req, res, next) => {
    try {
        if (!req?.headers?.authorization) {
            logger.warn("Empty bearer token in authPermissionMiddleware");
            return res.status(401).json({ EM: "Empty bearer token!", EC: 1, DT: "" });
        }

        const token = req.headers.authorization.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_TOKEN_SECRET);

        if (!decoded?.isAdmin) {
            logger.warn("User without admin permission attempted access", { user: decoded });
            return res.status(403).json({ EM: "You don't have permission!", EC: -1, DT: "" });
        }

        logWithTrace("Admin access granted", { user: decoded });
        req.user = decoded;
        next();
    } catch (err) {
        logger.error("authPermissionMiddleware error", { error: err.message });
        return res.status(500).json({ EM: err.message, EC: -999, DT: "" });
    }
};

// ======================
// User Authorization Middleware
// ======================
export const authUserMiddleware = (req, res, next) => {
    try {
        if (!req?.headers?.authorization) {
            logger.warn("Empty bearer token in authUserMiddleware");
            return res.status(401).json({ EM: "Empty bearer token!", EC: 1, DT: "" });
        }

        const token = req.headers.authorization.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_TOKEN_SECRET);

        req.user = decoded;

        if (
            decoded?.isAdmin ||
            decoded?._id === req.params.id ||
            decoded?._id === req.body.id ||
            decoded?._id === req.query.id
        ) {
            logWithTrace("User authorized", { user: decoded });
            next();
        } else {
            logger.warn("User unauthorized access attempt", { user: decoded });
            return res.status(403).json({ EM: "You don't have permission!", EC: -1, DT: "" });
        }
    } catch (err) {
        logger.error("authUserMiddleware error", { error: err.message });
        return res.status(500).json({ EM: err.message, EC: -999, DT: "" });
    }
};

// ======================
// User Notification Middleware
// ======================
export const authUserNotificationMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers?.authorization;
        if (!authHeader) {
            logger.warn("Empty bearer token in authUserNotificationMiddleware");
            return res.status(401).json({ EM: "Empty bearer token!", EC: 1, DT: "" });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_TOKEN_SECRET);

        if (!decoded) {
            logger.warn("Invalid token in authUserNotificationMiddleware");
            return res.status(401).json({ EM: "Invalid token!", EC: 2, DT: "" });
        }

        req.user = decoded;
        logWithTrace("Decoded user in authUserNotificationMiddleware", { user: decoded });
        next();
    } catch (err) {
        logger.error("authUserNotificationMiddleware error", { error: err.message });
        return res.status(500).json({ EM: err.message, EC: -999, DT: "" });
    }
};
