
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    title: { type: String, required: true },
    message: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // liên kết user
    isRead: { type: Boolean, default: false }, // trạng thái đã đọc
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Notification", notificationSchema);


// import mongoose from "mongoose";

// const notificationSchema = new mongoose.Schema({
//     message: { type: String, required: true },
//     createdAt: { type: Date, default: Date.now }
// });

// const Notification = mongoose.model("Notification", notificationSchema);

// export default Notification;


