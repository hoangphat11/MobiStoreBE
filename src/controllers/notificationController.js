// import notificationAPIService from "../services/notificationAPIService";

// const createNotification = async (req, res) => {
//   const { userId, message, type } = req.body;
//   const data = await notificationAPIService.createNotification(userId, message, type);
//   return res.status(200).json(data);
// };

// const getNotificationsByUser = async (req, res) => {
//   const { userId } = req.params;
//   const data = await notificationAPIService.getNotificationsByUser(userId);
//   return res.status(200).json(data);
// };

// const markAsRead = async (req, res) => {
//   const { notiId } = req.params;
//   const { userId } = req.body;
//   const data = await notificationAPIService.markAsRead(notiId, userId);
//   return res.status(200).json(data);
// };

// export default { createNotification, getNotificationsByUser, markAsRead };
