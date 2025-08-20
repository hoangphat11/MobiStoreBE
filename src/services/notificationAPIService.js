
import Notification from "../models/NotificationModel.js";

/**
 * Tạo thông báo mới gắn với user
 * @param {ObjectId} userId - ID của user
 * @param {Array} orderItems - danh sách sản phẩm trong đơn
 */
export const addNotification = async (orderItems, userId) => {
    if (!Array.isArray(orderItems) || orderItems.length === 0) return null;

    const firstProductName = orderItems[0]?.name || "Sản phẩm";
    const total = orderItems.reduce((sum, item) => sum + (item.price || 0) * (item.amount || 1), 0);

    const title = "Thông báo đơn hàng"; // 👈 thêm title
    const message = `Đơn hàng ${firstProductName}… đã đặt thành công! Tổng: ${total}$`;

    try {
        const newNotification = new Notification({ title, message, userId });
        await newNotification.save();
        return newNotification;
    } catch (error) {
        console.error("Lỗi lưu thông báo:", error);
        return null;
    }
};



// Lấy tất cả thông báo, có thể lọc theo userId
export const getAllNotifications = async (userId = null) => {
    try {
        let query = {};
        if (userId) query.userId = userId;

        const notifications = await Notification.find(query)
            .populate("userId", "name email avatar") // lấy thông tin user
            .sort({ createdAt: -1 });

        return notifications;
    } catch (error) {
        console.error("Lỗi lấy thông báo:", error);
        return [];
    }
};

// import Notification from "../models/NotificationModel.js";

// // Tạo thông báo mới
// export const addNotification = async (orderItems) => {
//     if (!Array.isArray(orderItems) || orderItems.length === 0) {
//         console.error("Order thiếu dữ liệu:", orderItems);
//         return null;
//     }

//     const firstProductName = orderItems[0]?.name || "Sản phẩm";
//     const total = orderItems.reduce((sum, item) => {
//         return sum + (item.price || 0) * (item.amount || 1);
//     }, 0);

//     const message = `Đơn hàng ${firstProductName}… đã đặt thành công! Tổng: ${total}$`;

//     try {
//         const newNotification = new Notification({  message });
//         await newNotification.save(); // lưu vào database
//         return newNotification;
//     } catch (error) {
//         console.error("Lỗi lưu thông báo:", error);
//         return null;
//     }
// };

// // Lấy tất cả thông báo
// export const getAllNotifications = async () => {
//     try {
//         const notifications = await Notification.find().sort({ createdAt: -1 });
//         return notifications;
//     } catch (error) {
//         console.error("Lỗi lấy thông báo:", error);
//         return [];
//     }
// };




