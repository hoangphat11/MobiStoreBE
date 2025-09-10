import './configs/tracing'; // phải đứng đầu
require('dotenv').config();
import express from 'express';
import configViewEngine from './configs/viewEngine';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import { tracingMiddleware } from './middleware/tracingMiddleware.js';
import configCors from './configs/cors';
import mongoose from 'mongoose';
import webpush from 'web-push';
import initAPIRoutes from './routes/api';
import winston from 'winston';

// ======================
// Config Logger
// ======================
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(
            ({ timestamp, level, message, ...meta }) =>
                `${timestamp} [${level.toUpperCase()}] ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''
                }`
        )
    ),
    transports: [

        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/app.log' }),
    ],
});

// ======================
// Init App
// ======================
const app = express();
const PORT = process.env.PORT || 8080;

// config view engine & cors
configCors(app);
configViewEngine(app);

app.use(cookieParser());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(tracingMiddleware);

// ======================
// Connect MongoDB
// ======================
mongoose
    .connect(
        `mongodb+srv://vanhuyen:${process.env.DB_PASSWORD}@cluster0.0r8oddv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`
    )
    .then(() => {
        logger.info('Connected to MongoDB successfully');
    })
    .catch((err) => {
        logger.error('MongoDB connection error', { error: err.message });
    });

// ======================
// Config Web-Push
// ======================
const publicVapidKey = process.env.VAPID_PUBLIC_KEY;
const privateVapidKey = process.env.VAPID_PRIVATE_KEY;

webpush.setVapidDetails('mailto:youremail@example.com', publicVapidKey, privateVapidKey);

// ======================
// Subscriptions (RAM)
// ======================
let subscriptions = [];

// ======================
// API Routes
// ======================

// Subscribe API
app.post('/api/v1/subscribe', (req, res) => {
    const subscription = req.body;
    subscriptions.push(subscription);

    res.status(201).json({ message: 'Subscribed successfully!' });
    logger.info('New subscription added', { subscription });

    const payload = JSON.stringify({
        title: 'Mobistore',
        body: '🎉 Bạn đã bật thông báo thành công!',
    });

    webpush.sendNotification(subscription, payload).catch((err) => {
        logger.error('Error sending push notification', { error: err.message });
    });
});

// Notification API
app.post('/api/v1/notification', async (req, res) => {
    const { title, body } = req.body;
    const payload = JSON.stringify({ title, body });

    subscriptions.forEach((sub) => {
        webpush.sendNotification(sub, payload).catch((err) => {
            logger.error('Error sending push notification', { error: err.message });
        });
    });

    res.json({ message: 'Notifications sent!' });
    logger.info('Notifications sent to all subscribers', { total: subscriptions.length });
});

// Init API Routes
initAPIRoutes(app);

// ======================
// Start Server
// ======================
app.listen(PORT, () => {
    logger.info(`Server is running on PORT: ${PORT}`);
});
