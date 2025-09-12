import _ from 'lodash';
import { Types } from 'mongoose';
import Order from '../models/OrderProduct';
import Product from '../models/ProductModel';
import User from '../models/UserModel';
import emailAPIService from './emailAPIService';

// const getAllOrders = async () => {
//     try {
//         const listOrders = await Order.find({}, '-updatedAt -__v');
//         if (listOrders.length > 0) {
//             return {
//                 EM: 'Get all orders success!',
//                 EC: 0,
//                 DT: listOrders
//             };
//         }
//         return {
//             EM: 'Cannot get all orders because data is empty',
//             EC: 1,
//             DT: []
//         };
//     } catch (error) {
//         console.log('>>> check error from getAllOrders():', error);
//         return {
//             EM: 'Something wrongs in Service getAllOrders()',
//             EC: -2,
//             DT: ''
//         };
//     }
// };

// const createNewOrder = async (rawData) => {
//     try {
//         let {
//             orderItems, paymentMethod, itemsPrice, shippingPrice, totalPrice,
//             email, fullName, address, city, phone, user, isPaid = false, paidAt = ''
//         } = rawData;

//         if (!paymentMethod || !itemsPrice || !shippingPrice || !totalPrice || !email || !fullName || !address ||
//             !city || !phone || !user || !orderItems) {
//             return {
//                 EM: 'Missing required params',
//                 EC: 1,
//                 DT: ''
//             };
//         }

//         const missingProducts = [];

//         for (const item of orderItems) {
//             const { name, product, amount } = item;
//             if (!product || !amount)
//                 throw new Error(`Missing required params in item: ${JSON.stringify(item)}`);

//             try {
//                 const productData = await Product.findOneAndUpdate(
//                     { _id: product, countInStock: { $gte: amount } },
//                     {
//                         $inc: {
//                             countInStock: -amount,
//                             sold: +amount,
//                         },
//                     },
//                     { new: true }
//                 );

//                 if (!productData) missingProducts.push(name);
//             } catch (error) {
//                 console.error(`Error updating product ${product}:`, error);
//                 missingProducts.push(name);
//             }
//         }

//         orderItems = orderItems.filter(item => !missingProducts.includes(item.name));
//         orderItems = orderItems.map(({ countInStock, ...rest }) => rest);

//         if (orderItems.length === 0) {
//             return {
//                 EM: 'Các sản phẩm bạn chọn đã bán sạch hoặc không đủ số lượng',
//                 EC: 2,
//                 DT: '',
//             };
//         }

//         const data = {
//             orderItems,
//             shippingAddress: { fullName, address, city, phone },
//             paymentMethod,
//             itemsPrice,
//             shippingPrice,
//             totalPrice,
//             user,
//             isPaid,
//             paidAt,
//         };

//         const newOrder = new Order(data);
//         await newOrder.save();
//         await emailAPIService.sendSimpleEmail({ ...data, email });

//         return {
//             EM: missingProducts.length > 0
//                 ? `Tạo đơn thành công, có ${missingProducts.length} sản phẩm không đủ số lượng: ${missingProducts}`
//                 : 'Order created successfully',
//             EC: 0,
//             DT: orderItems,
//         };
//     } catch (error) {
//         console.log('>>> check error from createNewOrder():', error);
//         return {
//             EM: 'Something wrongs in Service createNewOrder()',
//             EC: -2,
//             DT: ''
//         };
//     }
// };

// getAllOrders with pagination
const getAllOrders = async () => {
    try {
        const orders = await Order.find({}, '-updatedAt -__v')
            .sort({ createdAt: -1 });

        return {
            EM: 'Get all orders success!',
            EC: 0,
            DT: { orders, totalOrders: orders.length }
        };
    } catch (error) {
        console.log(">>> check error from getAllOrders():", error);
        return { EM: 'Something went wrong', EC: -2, DT: [] };
    }
};


// createNewOrder optimized with Promise.all
const createNewOrder = async (rawData) => {
    try {
        let {
            orderItems, paymentMethod, itemsPrice, shippingPrice, totalPrice,
            email, fullName, address, city, phone, user, isPaid = false, paidAt = ''
        } = rawData;

        if (!paymentMethod || !itemsPrice || !shippingPrice || !totalPrice || !email || !fullName || !address ||
            !city || !phone || !user || !orderItems) {
            return {
                EM: 'Missing required params',
                EC: 1,
                DT: ''
            };
        }

        // Chạy song song các update stock
        const updateResults = await Promise.all(orderItems.map(async (item) => {
            const { name, product, amount } = item;
            if (!product || !amount) {
                return { success: false, name };
            }

            try {
                const productData = await Product.findOneAndUpdate(
                    { _id: product, countInStock: { $gte: amount } },
                    {
                        $inc: {
                            countInStock: -amount,
                            sold: +amount,
                        },
                    },
                    { new: true }
                );

                if (!productData) {
                    return { success: false, name };
                }
                return { success: true, item };
            } catch (error) {
                console.error(`Error updating product ${product}:`, error);
                return { success: false, name };
            }
        }));

        // Tách sản phẩm thành công & thất bại
        const successfulItems = updateResults.filter(r => r.success).map(r => r.item);
        const missingProducts = updateResults.filter(r => !r.success).map(r => r.name);

        if (successfulItems.length === 0) {
            return {
                EM: 'Các sản phẩm bạn chọn đã bán sạch hoặc không đủ số lượng',
                EC: 2,
                DT: '',
            };
        }

        const data = {
            orderItems: successfulItems,
            shippingAddress: { fullName, address, city, phone },
            paymentMethod,
            itemsPrice,
            shippingPrice,
            totalPrice,
            user,
            isPaid,
            paidAt,
        };

        const newOrder = new Order(data);
        await newOrder.save();

        // Gửi email confirm
        await emailAPIService.sendSimpleEmail({ ...data, email });

        return {
            EM: missingProducts.length > 0
                ? `Tạo đơn thành công, ${missingProducts.length} sản phẩm không đủ số lượng: ${missingProducts.join(', ')}`
                : 'Order created successfully',
            EC: 0,
            DT: successfulItems,
        };
    } catch (error) {
        console.log('>>> check error from createNewOrder():', error);
        return {
            EM: 'Something went wrong in createNewOrder()',
            EC: -2,
            DT: ''
        };
    }
};

const getOrdersByUserId = async (userId) => {
    try {
        if (!userId) return { EM: 'Missing required parameter!', EC: 1, DT: '' };
        if (!Types.ObjectId.isValid(userId)) return { EM: 'Invalid ID format!', EC: 1, DT: '' };

        const listOrders = await Order.find({ user: userId }, '-updatedAt -__v');
        return listOrders.length > 0
            ? { EM: 'Get list orders by userId success', EC: 0, DT: listOrders }
            : { EM: 'User not existed, or doesnt have any orders!', EC: -1, DT: '' };
    } catch (error) {
        console.log('>>> check error from getOrdersByUserId():', error);
        return {
            EM: 'Something wrongs in Service getOrdersByUserId()',
            EC: -2,
            DT: ''
        };
    }
};
//
const getDetailOrder = async (orderId, userId) => {
    try {
        if (!orderId || !userId)
            return { EM: 'Missing required parameter!', EC: 1, DT: '' };

        if (!Types.ObjectId.isValid(orderId) || !Types.ObjectId.isValid(userId))
            return { EM: 'Invalid ID format orderId or userId!', EC: 1, DT: '' };

        const user = await User.findOne({ _id: userId }, '-password -createdAt -updatedAt -__v');
        const order = user?.isAdmin
            ? await Order.findOne({ _id: orderId }, '-user -createdAt -updatedAt -__v')
            : await Order.findOne({ _id: orderId, user: userId }, '-user -createdAt -updatedAt -__v');

        return order
            ? { EM: 'Get detail order success', EC: 0, DT: order }
            : { EM: 'Order is not existed!', EC: -1, DT: '' };
    } catch (error) {
        console.log('>>> check error from getDetailOrder():', error);
        return {
            EM: 'Something wrongs in Service getDetailOrder()',
            EC: -2,
            DT: ''
        };
    }
};

const deleteOrder = async (orderId, userId) => {
    try {
        if (!orderId || !userId)
            return { EM: 'Missing required parameter!', EC: 1, DT: '' };

        if (!Types.ObjectId.isValid(orderId) || !Types.ObjectId.isValid(userId))
            return { EM: 'Invalid ID format!', EC: 1, DT: '' };

        const user = await User.findOne({ _id: userId }, '-password -createdAt -updatedAt -__v');
        const orderDeleted = user?.isAdmin
            ? await Order.findByIdAndDelete(orderId)
            : await Order.findOneAndDelete({ _id: orderId, user: userId });

        if (orderDeleted) {
            const { orderItems } = orderDeleted;
            for (const item of orderItems) {
                const { product, amount } = item;
                if (!product || !amount) continue;

                try {
                    await Product.findOneAndUpdate(
                        { _id: product, sold: { $gte: amount } },
                        {
                            $inc: {
                                countInStock: +amount,
                                sold: -amount,
                            },
                        },
                        { new: true }
                    );
                } catch (error) {
                    console.error(`Error updating product ${product}:`, error);
                }
            }
        }

        return orderDeleted
            ? { EM: 'Delete successfully', EC: 0, DT: orderDeleted }
            : { EM: 'Order not existed to delete!', EC: -1, DT: '' };
    } catch (error) {
        console.error('>>> Error in deleteOrder():', error.message, error.stack);
        return {
            EM: 'Something wrongs in Service deleteOrder()',
            EC: -2,
            DT: ''
        };
    }
};

// cập nhật trạng thái đơn hàng
const updateOrderStatus = async (orderId, status, userId) => {
    try {
        // Kiểm tra tham số bắt buộc
        if (!orderId || !status || !userId) {
            return {
                EM: 'Missing required parameter: orderId, status or userId!',
                EC: 1,
                DT: ''
            };
        }

        // Kiểm tra định dạng ObjectId
        if (!Types.ObjectId.isValid(orderId) || !Types.ObjectId.isValid(userId)) {
            return {
                EM: 'Invalid ID format for orderId or userId!',
                EC: 1,
                DT: ''
            };
        }

        // Xác thực user
        const user = await User.findById(userId, '-password -createdAt -updatedAt -__v');
        if (!user) {
            return {
                EM: 'User not found!',
                EC: -1,
                DT: ''
            };
        }

        // Danh sách trạng thái hợp lệ
        const validStatuses = ["Pending", "Confirmed", "Shipping", "Delivered", "Cancelled"];
        if (!validStatuses.includes(status)) {
            return {
                EM: 'Invalid status provided!',
                EC: 2,
                DT: ''
            };
        }

        // Xác định các trường cập nhật tương ứng theo status
        const updateFields = { orderStatus: status };
        const now = new Date();
        switch (status) {
            case 'Confirmed':
                updateFields.confirmedAt = now;
                break;
            case 'Shipping':
                updateFields.shippedAt = now;
                break;
            case 'Delivered':
                updateFields.deliveredAt = now;
                break;
            case 'Cancelled':
                updateFields.cancelledAt = now;
                break;
        }

        // Chỉ admin có thể cập nhật tất cả, user thường chỉ được cập nhật đơn hàng của chính mình
        const filter = user.isAdmin
            ? { _id: orderId }
            : { _id: orderId, user: userId };

        const updatedOrder = await Order.findOneAndUpdate(
            filter,
            updateFields,
            { new: true, runValidators: true }
        );

        return updatedOrder
            ? { EM: 'Order status updated successfully!', EC: 0, DT: updatedOrder }
            : { EM: 'Order not found or access denied!', EC: -1, DT: '' };
    } catch (error) {
        console.error('>>> Error from updateOrderStatus():', error);
        return {
            EM: 'Something went wrong in updateOrderStatus()',
            EC: -2,
            DT: ''
        };
    }
};
//
// Cập nhật trạng thái thanh toán (cho COD)
const updatePaymentStatus = async (id, newStatus) => {
    try {
        let order = await Order.findById(id);

        if (!order) {
            return {
                EM: "Order not found",
                EC: 1,
                DT: null
            };
        }

        // Nếu đã thanh toán thì không được thay đổi nữa
        if (order.paymentStatus === "Paid") {
            return {
                EM: "Order has already been paid. Payment status cannot be changed.",
                EC: 1,
                DT: order
            };
        }

        // Cập nhật trạng thái nếu chưa thanh toán
        order.paymentStatus = newStatus;
        await order.save();

        return {
            EM: "Payment status updated successfully",
            EC: 0,
            DT: order
        };

    } catch (error) {
        console.log("Error updatePaymentStatus:", error);
        return {
            EM: "Something went wrong",
            EC: -1,
            DT: null
        };
    }
};

module.exports = {
    getAllOrders,
    createNewOrder,
    getOrdersByUserId,
    getDetailOrder,
    deleteOrder,
    updateOrderStatus,
    updatePaymentStatus, // 👈 thêm export
};

