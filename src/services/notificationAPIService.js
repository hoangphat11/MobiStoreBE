// import Notification from "../models/NotificationModel";
// import { Types } from "mongoose";

// const createNotification = async ({ userId, message, type = "system" }) => {
//     try {
//         if (!userId || !message) {
//             return {
//                 EM: "Missing required parameter!",
//                 EC: 1,
//                 DT: "",
//             };
//         }

//         if (!Types.ObjectId.isValid(userId)) {
//             return {
//                 EM: "Invalid user ID format!",
//                 EC: 1,
//                 DT: "",
//             };
//         }

//         const newNoti = new Notification({ user: userId, message, type });
//         await newNoti.save();

//         const { __v, updatedAt, ...cleanNoti } = newNoti.toObject();

//         return {
//             EM: "Notification created successfully",
//             EC: 0,
//             DT: cleanNoti,
//         };
//     } catch (error) {
//         console.log(">>> check error createNotification():", error);
//         return {
//             EM: "Something wrong in Service createNotification()",
//             EC: -2,
//             DT: "",
//         };
//     }
// };

// const getNotificationsByUser = async (userId) => {
//     try {
//         if (!userId) {
//             return {
//                 EM: "Missing required parameter!",
//                 EC: 1,
//                 DT: "",
//             };
//         }

//         if (!Types.ObjectId.isValid(userId)) {
//             return {
//                 EM: "Invalid user ID format!",
//                 EC: 1,
//                 DT: "",
//             };
//         }

//         const notis = await Notification.find({ user: userId })
//             .sort({ createdAt: -1 })
//             .select("-__v -updatedAt");

//         return {
//             EM: "Get notifications success",
//             EC: 0,
//             DT: notis,
//         };
//     } catch (error) {
//         console.log(">>> check error getNotificationsByUser():", error);
//         return {
//             EM: "Something wrong in Service getNotificationsByUser()",
//             EC: -2,
//             DT: "",
//         };
//     }
// };

// const markAsRead = async (notiId, userId) => {
//     try {
//         if (!notiId || !userId) {
//             return {
//                 EM: "Missing required parameter!",
//                 EC: 1,
//                 DT: "",
//             };
//         }

//         if (!Types.ObjectId.isValid(notiId) || !Types.ObjectId.isValid(userId)) {
//             return {
//                 EM: "Invalid ID format!",
//                 EC: 1,
//                 DT: "",
//             };
//         }

//         const noti = await Notification.findOneAndUpdate(
//             { _id: notiId, user: userId },
//             { isRead: true },
//             { new: true }
//         ).select("-__v -updatedAt");

//         if (!noti) {
//             return {
//                 EM: "Notification not found",
//                 EC: 1,
//                 DT: "",
//             };
//         }

//         return {
//             EM: "Notification marked as read",
//             EC: 0,
//             DT: noti,
//         };
//     } catch (error) {
//         console.log(">>> check error markAsRead():", error);
//         return {
//             EM: "Something wrong in Service markAsRead()",
//             EC: -2,
//             DT: "",
//         };
//     }
// };

// module.exports = {
//     createNotification,
//     getNotificationsByUser,
//     markAsRead,
// };
