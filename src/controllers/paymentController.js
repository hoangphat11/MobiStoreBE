require('dotenv').config();
const fetch = require("node-fetch");
const { sendTelegramMessage } = require("../services/telegramAPIService");

const handleGetPaymentConfig = async (req, res) => {
    try {
        return res.status(200).json({
            EM: 'Get payment config success',
            EC: 0,
            DT: process.env.PAYPAL_CLIENT_ID,
        })
    } catch (error) {
        console.log('>>> check error from handleGetPaymentConfig():', error)
        return res.status(500).json({
            EM: 'error from server',
            EC: -1,
            DT: '',
        })
    }
};

//Capture order
const handleCaptureOrder = async (req, res) => {
    const { orderId, accessToken } = req.body;

    try {
        const paypalRes = await fetch(
            `https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderId}/capture`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken}`,
                },
            }
        );

        const data = await paypalRes.json();

        if (!paypalRes.ok) {
            // Gửi cảnh báo Telegram khi lỗi
            await sendTelegramMessage(
                `❌ PayPal Capture FAILED\nOrderID: ${orderId}\nError: ${JSON.stringify(data)}`
            );

            return res.status(400).json({
                EM: 'Payment failed',
                EC: -1,
                DT: data,
            });
        }

        return res.status(200).json({
            EM: 'Payment success',
            EC: 0,
            DT: data,
        });
    } catch (error) {
        console.log(">>> Error from handleCaptureOrder:", error);

        await sendTelegramMessage(
            `🔥 Server Exception in CaptureOrder\nOrderID: ${req.body.orderId}\nError: ${error.message}`
        );

        return res.status(500).json({
            EM: 'error from server',
            EC: -1,
            DT: '',
        });
    }
};


// const handleCaptureOrder = async (req, res) => {
//     const { orderId, accessToken } = req.body;

//     try {
//         // ---- Fake thanh toán fail ----
//         const fakePaymentFail = true; // hard code để test
//         if (fakePaymentFail) {
//             const fakeError = { message: "Thẻ không đủ tiền" };

//             // Gửi cảnh báo Telegram
//             await sendTelegramMessage(
//                 `❌ PayPal Capture FAILED (Test)\nOrderID: ${orderId}\nError: ${JSON.stringify(fakeError)}`
//             );

//             return res.status(400).json({
//                 EM: 'Payment failed (Test)',
//                 EC: -1,
//                 DT: fakeError,
//             });
//         }
//         // ---- End Fake ----

//         // Nếu không fake, vẫn gọi PayPal thật
//         const paypalRes = await fetch(
//             `https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderId}/capture`,
//             {
//                 method: "POST",
//                 headers: {
//                     "Content-Type": "application/json",
//                     "Authorization": `Bearer ${accessToken}`,
//                 },
//             }
//         );

//         const data = await paypalRes.json();

//         if (!paypalRes.ok) {
//             await sendTelegramMessage(
//                 `❌ PayPal Capture FAILED\nOrderID: ${orderId}\nError: ${JSON.stringify(data)}`
//             );

//             return res.status(400).json({
//                 EM: 'Payment failed',
//                 EC: -1,
//                 DT: data,
//             });
//         }

//         return res.status(200).json({
//             EM: 'Payment success',
//             EC: 0,
//             DT: data,
//         });
//     } catch (error) {
//         console.log(">>> Error from handleCaptureOrder:", error);

//         await sendTelegramMessage(
//             `🔥 Server Exception in CaptureOrder\nOrderID: ${req.body.orderId}\nError: ${error.message}`
//         );

//         return res.status(500).json({
//             EM: 'error from server',
//             EC: -1,
//             DT: '',
//         });
//     }
// };
module.exports = {
    handleGetPaymentConfig,
    handleCaptureOrder,
};
