import express from 'express';
import userController from '../controllers/userController';
import productController from '../controllers/productController';
import orderController from '../controllers/orderController';
import { handleGetPaymentConfig, handleCaptureOrder } from '../controllers/paymentController';
import {
    authPermissionMiddleware,
    authUserMiddleware,
    authUserNotificationMiddleware
} from '../middleware/authMiddleWare';
import { createNotification, fetchAllNotifications } from "../controllers/notificationController.js";
import logger from "../configs/logger.js"; // logger winston
// Tracing middleware
const tracingMiddleware = (req, res, next) => {
    const startTime = Date.now();
    const method = req.method;
    const url = req.originalUrl;

    res.on("finish", () => {
        const duration = Date.now() - startTime;
        const userId = req.user?._id || "guest"; // nếu đã decode JWT thì lấy user
        logger.info(`[TRACE] ${method} ${url} - Status: ${res.statusCode} - Duration: ${duration}ms - User: ${userId}`);
    });

    next();
};

const router = express.Router();

const initAPIRoutes = (app) => {
    // ----------------- TRACING -----------------
    router.use(tracingMiddleware); // Tất cả request qua router đều được trace

    // ----------------- AUTH -----------------
    router.post("/login", userController.handleLogin);
    router.post("/register", userController.handleRegister);
    router.post("/logout", userController.handleLogout);

    // ----------------- USER -----------------
    router.get('/', authPermissionMiddleware, userController.handleGetAllUsers);
    router.get('/users/:id', authUserMiddleware, userController.handleGetDetailUser);
    router.get('/refresh-token', userController.handleRefreshToken);
    router.put('/users/update', authUserMiddleware, userController.handleUpdateUser);
    router.delete('/users/delete', authPermissionMiddleware, userController.handleDeleteUser);

    // ----------------- PRODUCT -----------------
    router.get('/product', productController.handleGetAllProducts);
    router.get('/product/get-all-types', productController.handleGetTypesProduct);
    router.get('/product/get-products-by-type/:prodType', productController.handleGetProductsByType);
    router.get('/product/:id', productController.handleGetDetailProd);
    router.post('/product/create', authPermissionMiddleware, productController.handleCreateNewProduct);
    router.put('/product/update', authPermissionMiddleware, productController.handleUpdateProduct);
    router.delete('/product/delete', authPermissionMiddleware, productController.handleDeleteProduct);
    router.delete('/product/delete-many', authPermissionMiddleware, productController.handleDeleteManyProduct);

    // ----------------- ORDER -----------------
    router.get('/order', authPermissionMiddleware, orderController.handleGetAllOrders);
    router.get('/order/get-orders-by-userId/:id', authUserMiddleware, orderController.handleGetOrdersByUserId);
    router.get('/order/get-detail-order/:orderId', authUserMiddleware, orderController.handleGetDetailOrder);
    router.post('/order/create', authUserMiddleware, orderController.handleCreateNewOrder);
    router.delete('/order/delete/:orderId', orderController.handleDeleteOrder);
    router.put('/order/update-status/:orderId', authPermissionMiddleware, orderController.handleUpdateOrderStatus);
    router.put("/orders/:orderId/payment", orderController.handleUpdatePaymentStatus);

    // ----------------- PAYMENT -----------------
    router.get('/payment/config', handleGetPaymentConfig);
    router.post("/payment/capture", handleCaptureOrder);

    // ----------------- NOTIFICATIONS -----------------
    router.post("/create", authUserNotificationMiddleware, createNotification);
    router.get("/notification", authUserNotificationMiddleware, fetchAllNotifications);

    // ----------------- PREFIX API -----------------
    return app.use("/api/v1", router);
}

export default initAPIRoutes;
