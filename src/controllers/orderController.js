import orderAPIService from '../services/orderAPIService';
import { addNotification } from "../services/notificationAPIService.js";
//import { createNotificationForOrder } from "./notificationController.js";
import Order from "../models/OrderProduct";
const handleGetAllOrders = async (req, res) => {
    try {
        const data = await orderAPIService.getAllOrders();
        return res.status(200).json({
            EM: data.EM,
            EC: data.EC,
            DT: data.DT,
        });
    } catch (error) {
        console.log('>>> check error from handleGetAllOrders():', error);
        return res.status(500).json({
            EM: 'error from server',
            EC: -1,
            DT: '',
        });
    }
};
//goc
// const handleCreateNewOrder = async (req, res) => {
//     try {
//         const data = await orderAPIService.createNewOrder(req.body);
//         return res.status(200).json({
//             EM: data.EM,
//             EC: data.EC,
//             DT: data.DT,
//         });
//     } catch (error) {
//         console.log('>>> error from handleCreateNewOrder():', error);
//         return res.status(500).json({
//             EM: 'error from server',
//             EC: -1,
//             DT: '',
//         });
//     }
// };



//goc2
// const handleCreateNewOrder = async (req, res) => {
//     try {
//         const data = await orderAPIService.createNewOrder(req.body);

//         // Tạo notification ngắn gọn
//         const notification = addNotification(data.DT);

//         return res.status(200).json({
//             EM: data.EM,
//             EC: data.EC,
//             DT: data.DT,
//             notification,  // gửi luôn về client
//         });
//     } catch (error) {
//         console.log('>>> error from handleCreateNewOrder():', error);
//         return res.status(500).json({
//             EM: 'error from server',
//             EC: -1,
//             DT: '',
//         });
//     }
// };
const handleCreateNewOrder = async (req, res) => {
    try {
        // 1️⃣ Tạo order
        const data = await orderAPIService.createNewOrder(req.body);

        // Nếu order tạo thất bại thì không tạo notification
        if (data.EC !== 0) {
            return res.status(400).json(data);
        }

        // 2️⃣ Tạo notification gắn userId
        // Giả sử userId gửi từ req.body.user
        const notification = await addNotification(data.DT, req.body.user);

        // 3️⃣ Trả về client
        return res.status(200).json({
            EM: data.EM,
            EC: data.EC,
            DT: data.DT,
            notification,  // gửi luôn thông tin notification
        });
    } catch (error) {
        console.log('>>> error from handleCreateNewOrder():', error);
        return res.status(500).json({
            EM: 'error from server',
            EC: -1,
            DT: '',
        });
    }
};


// controllers/orderController.js


// const handleCreateNewOrder = async (req, res) => {
//     try {
//         const data = await orderAPIService.createNewOrder(req.body);

//         if (data.EC !== 0) {
//             return res.status(400).json(data);
//         }

//         const { _id: orderId, user: userId, orderItems } = data.DT;

//         // tạo thông báo gắn với userId
//         const notification = await addNotification(userId, orderItems);

//         return res.status(200).json({
//             EM: data.EM,
//             EC: data.EC,
//             DT: data.DT,
//             notification
//         });
//     } catch (error) {
//         console.log(">>> error from handleCreateNewOrder():", error);
//         return res.status(500).json({
//             EM: "error from server",
//             EC: -1,
//             DT: ""
//         });
//     }
// };

const handleGetOrdersByUserId = async (req, res) => {
    try {
        const data = await orderAPIService.getOrdersByUserId(req.params.id);
        return res.status(200).json({
            EM: data.EM,
            EC: data.EC,
            DT: data.DT,
        });
    } catch (error) {
        console.log('>>> error from handleGetOrdersByUserId():', error);
        return res.status(500).json({
            EM: 'error from server',
            EC: -1,
            DT: '',
        });
    }
};

const handleGetDetailOrder = async (req, res) => {
    try {
        const data = await orderAPIService.getDetailOrder(req.params.orderId, req.query.id);
        return res.status(200).json({
            EM: data.EM,
            EC: data.EC,
            DT: data.DT,
        });
    } catch (error) {
        console.log('>>> check error from handleGetDetailOrder():', error);
        return res.status(500).json({
            EM: 'error from server',
            EC: -1,
            DT: '',
        });
    }
};

const handleDeleteOrder = async (req, res) => {
    try {
        const data = await orderAPIService.deleteOrder(req.params.orderId, req.query.id);
        return res.status(200).json({
            EM: data.EM,
            EC: data.EC,
            DT: data.DT,
        });
    } catch (error) {
        console.log('>>> check error from handleDeleteOrder():', error);
        return res.status(500).json({
            EM: 'error from server',
            EC: -1,
            DT: '',
        });
    }
};
// cập nhật trạng thái đơn hàng
const handleUpdateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { orderStatus } = req.body;
        const userId = req.query.id;

        if (!orderId || !orderStatus || !userId) {
            return res.status(400).json({
                EM: 'Missing required parameters: orderId, orderStatus or userId',
                EC: 1,
                DT: '',
            });
        }

        const data = await orderAPIService.updateOrderStatus(orderId, orderStatus, userId);

        return res.status(200).json({
            EM: data.EM,
            EC: data.EC,
            DT: data.DT,
        });
    } catch (error) {
        console.log('>>> check error from handleUpdateOrderStatus():', error);
        return res.status(500).json({
            EM: 'error from server',
            EC: -1,
            DT: '',
        });
    }
};

export const handleUpdatePaymentStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { isPaid } = req.body;

        console.log("OrderId:", orderId);
        console.log("isPaid from body:", isPaid);

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        // Nếu đã thanh toán rồi thì không cho update nữa
        if (order.isPaid) {
            return res.status(400).json({ message: "Order already paid, cannot update" });
        }

        // Chỉ chấp nhận update sang true
        if (isPaid === true) {
            order.isPaid = true;
            order.paidAt = Date.now();
        } else {
            return res.status(400).json({ message: "Invalid request, isPaid must be true" });
        }

        const updatedOrder = await order.save();
        return res.status(200).json(updatedOrder);
    } catch (error) {
        console.error("Error updating payment status:", error);
        return res.status(500).json({ message: error.message || "Internal server error" });
    }
};

module.exports = {
    handleGetAllOrders,
    handleCreateNewOrder,
    handleGetOrdersByUserId,
    handleGetDetailOrder,
    handleDeleteOrder,
    handleUpdateOrderStatus,
    handleUpdatePaymentStatus,
};
