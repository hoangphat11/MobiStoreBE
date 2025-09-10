const fetch = require("node-fetch");

// Thông tin Telegram
const TOKEN = "7679750015:AAHnao0eeLEOFufIRDeru6WtK8lhoe6Rd6Y";
const CHAT_ID = "5658934392"; // Thay bằng chat_id thực tế

// Dữ liệu test thanh toán thất bại
const testData = {
    shippingAddress: {
        fullName: "Nguyen Van A",
        phone: "0987654321",
        address: "123 Đường ABC",
        city: "Hà Nội"
    },
    orderItems: [
        { name: "iPhone 15", price: 1200, qty: 1 },
        { name: "Ốp lưng iPhone", price: 25, qty: 2 }
    ],
    totalPrice: 1250,
    shippingPrice: 15,
    paymentMethod: "paypal",
    isPaid: false // Thanh toán thất bại
};

// Hàm tạo nội dung tin nhắn
const createMessage = (data) => {
    let itemsText = data.orderItems.map(item =>
        `- ${item.name}: ${item.qty} x ${item.price}$`
    ).join("\n");

    return `
⚠️ Thanh toán thất bại!

Thông tin khách hàng:
Họ và tên: ${data.shippingAddress.fullName}
Số điện thoại: ${data.shippingAddress.phone}
Địa chỉ: ${data.shippingAddress.address}, ${data.shippingAddress.city}

Thông tin đơn hàng:
${itemsText}
Tổng tiền: ${data.totalPrice}$
Phương thức vận chuyển: ${data.shippingPrice === 15 ? 'Giao hàng tiết kiệm' : 'Giao hàng hỏa tốc'}
Phương thức thanh toán: ${data.paymentMethod === 'cash' ? 'Tiền mặt' : 'Ví điện tử'}
Trạng thái: Thanh toán thất bại
`;
};

// Hàm gửi tin nhắn Telegram
async function sendTelegramMessage() {
    try {
        const res = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: createMessage(testData)
            }),
        });

        const data = await res.json();
        console.log("Kết quả gửi Telegram:", data);
    } catch (err) {
        console.error("Lỗi gọi API Telegram:", err);
    }
}

sendTelegramMessage();
