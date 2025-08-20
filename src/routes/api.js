import express from 'express';
import userController from '../controllers/userController';
import productController from '../controllers/productController';
import orderController from '../controllers/orderController';
import paymentController from '../controllers/paymentController';
import { authPermissionMiddleware, authUserMiddleware, authUser } from '../middleware/authMiddleWare';
import { createNotification, fetchAllNotifications } from "../controllers/notificationController.js";
//import { createNotification, fetchNotificationsByUser } from "../controllers/notificationController.js";

const router = express.Router();

const initAPIRoutes = (app) => {
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
    router.get('/payment/config', paymentController.handleGetPaymentConfig);

    // ----------------- NOTIFICATIONS -----------------
    // Tất cả route notification đều cần login

    // router.post("/create", authUser, createNotification);

    // Lấy tất cả notification của user
    // router.get("/", authUser, fetchAllNotifications);


    //  router.post("/create", createNotification);
    //  router.get("/", fetchAllNotifications);

    // Tạo notification (user phải login)
    router.post("/create", authUserMiddleware, createNotification);

    // Lấy notification của user hiện tại
    router.get("/", authUserMiddleware, fetchAllNotifications);
    // ----------------- PREFIX API -----------------
    return app.use("/api/v1", router);
}

export default initAPIRoutes;
