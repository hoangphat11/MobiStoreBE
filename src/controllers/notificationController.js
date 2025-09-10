import { addNotification, getAllNotifications } from "../services/notificationAPIService";


// Lấy tất cả notification của user hiện tại
export const fetchAllNotifications = async (req, res) => {
  try {
    const userId = req.user?._id;
    const notifications = await getAllNotifications(userId);
    res.status(200).json({ EM: "Lấy thông báo thành công", EC: 0, DT: notifications });
  } catch (err) {
    console.error("fetchAllNotifications error:", err);
    res.status(500).json({ EM: err.message, EC: -1, DT: [] });
  }
};

// Tạo notification
export const createNotification = async (req, res) => {
  try {
    const { orderItems } = req.body;
    const userId = req.user?._id;

    const notification = await addNotification(orderItems, userId);
    res.status(200).json({ EM: "Thông báo tạo thành công", EC: 0, DT: notification });
  } catch (err) {
    console.error("createNotification error:", err);
    res.status(500).json({ EM: err.message, EC: -1, DT: null });
  }
};

// Controller tạo thông báo
// export const createNotification = async (req, res) => {
//     try {
//         const { orderItems } = req.body;
//         const userId = req.user?._id; // lấy từ token (authUserMiddleware phải decode token và gán req.user)

//         if (!userId) {
//             return res.status(400).json({
//                 EM: "Thiếu thông tin user",
//                 EC: 1,
//                 DT: null
//             });
//         }

//         const notification = await addNotification(userId, orderItems);
//         if (notification) {
//             res.status(200).json({
//                 EM: "Thông báo tạo thành công",
//                 EC: 0,
//                 DT: notification
//             });
//         } else {
//             res.status(500).json({
//                 EM: "Tạo thông báo thất bại",
//                 EC: 1,
//                 DT: null
//             });
//         }
//     } catch (error) {
//         console.error("Error in createNotification:", error);
//         res.status(500).json({
//             EM: "Lỗi server",
//             EC: -1,
//             DT: null
//         });
//     }
// };

// // Controller lấy tất cả thông báo, có thể lọc theo user
// export const fetchAllNotifications = async (req, res) => {
//     try {
//         const userId = req.user?._id; // lấy từ token
//         const notifications = await getAllNotifications(userId);
//         res.status(200).json({
//             EM: "Lấy thông báo thành công",
//             EC: 0,
//             DT: notifications
//         });
//     } catch (error) {
//         console.error("Error in fetchAllNotifications:", error);
//         res.status(500).json({
//             EM: "Lỗi server",
//             EC: -1,
//             DT: []
//         });
//     }
// };


//  import { addNotification, getAllNotifications } from "../services/notificationAPIService";

// // Controller tạo thông báo
// export const createNotification = async (req, res) => {
    
//     const { orderItems } = req.body;
//     const notification = await addNotification(orderItems);
//     if (notification) {
//         res.status(200).json({
//             EM: "Thông báo tạo thành công",
//             EC: 0,
//             DT: notification
//         });
//     } else {
//         res.status(500).json({
//             EM: "Tạo thông báo thất bại",
//             EC: 1,
//             DT: null
//         });
//     }
// };

// // Controller lấy tất cả thông báo
// export const fetchAllNotifications = async (req, res) => {
//     const notifications = await getAllNotifications();
//     res.status(200).json({
//         EM: "Lấy thông báo thành công",
//         EC: 0,
//         DT: notifications
//     });
// };

