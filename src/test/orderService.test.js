// src/test/orderAPIService.test.js
import Order from '../models/OrderProduct';
import Product from '../models/ProductModel';
import User from '../models/UserModel';
import emailAPIService from '../services/emailAPIService';
import * as orderService from '../services/orderAPIService';
import { Types } from 'mongoose';

jest.mock('../models/OrderProduct');
jest.mock('../models/ProductModel');
jest.mock('../models/UserModel');
jest.mock('../services/emailAPIService');

describe('orderAPIService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getAllOrders', () => {
        test('trả về danh sách orders khi có data', async () => {
            const mockOrders = [{ _id: '1' }, { _id: '2' }];
            Order.find.mockResolvedValue(mockOrders);

            const res = await orderService.getAllOrders();

            expect(res.EC).toBe(0);
            expect(res.DT).toEqual(mockOrders);
            expect(Order.find).toHaveBeenCalledWith({}, '-updatedAt -__v');
        });

        test('trả về lỗi khi không có order nào', async () => {
            Order.find.mockResolvedValue([]);

            const res = await orderService.getAllOrders();

            expect(res.EC).toBe(1);
            expect(res.DT).toEqual([]);
        });

        test('bắt lỗi khi gọi service', async () => {
            Order.find.mockRejectedValue(new Error('DB error'));

            const res = await orderService.getAllOrders();

            expect(res.EC).toBe(-2);
            expect(res.EM).toMatch(/Something wrongs/);
        });
    });

    describe('createNewOrder', () => {
        const baseData = {
            orderItems: [
                { name: 'Prod1', product: '60f6f9a4e1b2b3a5c8f0d9a1', amount: 2 },
                { name: 'Prod2', product: '60f6f9a4e1b2b3a5c8f0d9a2', amount: 1 },
            ],
            paymentMethod: 'Paypal',
            itemsPrice: 100,
            shippingPrice: 10,
            totalPrice: 110,
            email: 'test@example.com',
            fullName: 'Test User',
            address: '123 Street',
            city: 'Hanoi',
            phone: '0123456789',
            user: '60f6f9a4e1b2b3a5c8f0d9ff',
            isPaid: false,
            paidAt: '',
        };

        test('thiếu params trả về lỗi', async () => {
            const res = await orderService.createNewOrder({});
            expect(res.EC).toBe(1);
            expect(res.EM).toMatch(/Missing required params/);
        });

        test('đơn hàng thành công, đủ hàng trong kho', async () => {
            // Mock cập nhật sản phẩm thành công
            Product.findOneAndUpdate.mockImplementation(({ _id }) => Promise.resolve({
                _id, countInStock: 10, sold: 5
            }));
            // Mock lưu order thành công
            Order.prototype.save = jest.fn().mockResolvedValue({});
            emailAPIService.sendSimpleEmail.mockResolvedValue();

            const res = await orderService.createNewOrder(baseData);

            expect(res.EC).toBe(0);
            expect(res.EM).toBe('Order created successfully');
            expect(Product.findOneAndUpdate).toHaveBeenCalledTimes(baseData.orderItems.length);
            expect(Order.prototype.save).toHaveBeenCalled();
            expect(emailAPIService.sendSimpleEmail).toHaveBeenCalled();
        });

        test('đơn hàng thành công nhưng có sản phẩm thiếu hàng', async () => {
            Product.findOneAndUpdate.mockImplementation(({ _id }) => {
                if (_id === '60f6f9a4e1b2b3a5c8f0d9a1') return Promise.resolve(null); // sản phẩm 1 thiếu hàng
                return Promise.resolve({ _id, countInStock: 5, sold: 10 });
            });
            Order.prototype.save = jest.fn().mockResolvedValue({});
            emailAPIService.sendSimpleEmail.mockResolvedValue();

            const res = await orderService.createNewOrder(baseData);

            expect(res.EC).toBe(0);
            expect(res.EM).toMatch(/co 1 san pham/);
            expect(res.DT).toHaveLength(1); // chỉ còn sản phẩm còn hàng
            expect(Order.prototype.save).toHaveBeenCalled();
        });

        test('tất cả sản phẩm thiếu hàng', async () => {
            Product.findOneAndUpdate.mockResolvedValue(null);
            const res = await orderService.createNewOrder(baseData);
            expect(res.EC).toBe(2);
            expect(res.EM).toMatch(/da ban sach hoac khong du so luong/);
        });

        test('bắt lỗi service', async () => {
            Product.findOneAndUpdate.mockRejectedValue(new Error('DB error'));
            const res = await orderService.createNewOrder(baseData);
            expect(res.EC).toBe(-2);
            
        });
    });

    describe('getOrdersByUserId', () => {
        test('thiếu userId', async () => {
            const res = await orderService.getOrdersByUserId();
            expect(res.EC).toBe(1);
            expect(res.EM).toMatch(/Missing required parameter/);
        });

        test('userId không hợp lệ', async () => {
            const res = await orderService.getOrdersByUserId('invalidid');
            expect(res.EC).toBe(1);
            expect(res.EM).toMatch(/Invalid ID format/);
        });

        test('trả về danh sách order', async () => {
            const mockOrders = [{ _id: '1' }, { _id: '2' }];
            Order.find.mockResolvedValue(mockOrders);

            const res = await orderService.getOrdersByUserId(new Types.ObjectId().toHexString());

            expect(res.EC).toBe(0);
            expect(res.DT).toEqual(mockOrders);
        });

        test('không có order nào', async () => {
            Order.find.mockResolvedValue([]);

            const res = await orderService.getOrdersByUserId(new Types.ObjectId().toHexString());

            expect(res.EC).toBe(-1);
            expect(res.EM).toMatch(/doesnt have any orders/);
        });

        test('bắt lỗi service', async () => {
            Order.find.mockRejectedValue(new Error('DB error'));
            const res = await orderService.getOrdersByUserId(new Types.ObjectId().toHexString());
            expect(res.EC).toBe(-2);
        });
    });

    describe('getDetailOrder', () => {
        const userId = new Types.ObjectId().toHexString();
        const orderId = new Types.ObjectId().toHexString();

        test('thiếu params', async () => {
            const res = await orderService.getDetailOrder(null, null);
            expect(res.EC).toBe(1);
        });

        test('id không hợp lệ', async () => {
            const res = await orderService.getDetailOrder('invalid', 'invalid');
            expect(res.EC).toBe(1);
        });

        test('là admin lấy order thành công', async () => {
            User.findOne.mockResolvedValue({ isAdmin: true });
            const mockOrder = { _id: orderId, orderStatus: 'Pending' };
            Order.findOne.mockResolvedValue(mockOrder);

            const res = await orderService.getDetailOrder(orderId, userId);

            expect(res.EC).toBe(0);
            expect(res.DT).toEqual(mockOrder);
            expect(Order.findOne).toHaveBeenCalledWith({ _id: orderId }, '-user -createdAt -updatedAt -__v');
        });

        test('là user thường lấy order thành công', async () => {
            User.findOne.mockResolvedValue({ isAdmin: false });
            const mockOrder = { _id: orderId };
            Order.findOne.mockResolvedValue(mockOrder);

            const res = await orderService.getDetailOrder(orderId, userId);

            expect(res.EC).toBe(0);
            expect(res.DT).toEqual(mockOrder);
            expect(Order.findOne).toHaveBeenCalledWith({ _id: orderId, user: userId }, '-user -createdAt -updatedAt -__v');
        });

        test('order không tồn tại', async () => {
            User.findOne.mockResolvedValue({ isAdmin: true });
            Order.findOne.mockResolvedValue(null);

            const res = await orderService.getDetailOrder(orderId, userId);

            expect(res.EC).toBe(-1);
            expect(res.EM).toMatch(/Order is not existed/);
        });

        test('bắt lỗi', async () => {
            User.findOne.mockRejectedValue(new Error('DB error'));
            const res = await orderService.getDetailOrder(orderId, userId);
            expect(res.EC).toBe(-2);
        });
    });

    describe('deleteOrder', () => {
        const userId = new Types.ObjectId().toHexString();
        const orderId = new Types.ObjectId().toHexString();

        test('thiếu params', async () => {
            const res = await orderService.deleteOrder(null, null);
            expect(res.EC).toBe(1);
        });

        test('id không hợp lệ', async () => {
            const res = await orderService.deleteOrder('invalid', 'invalid');
            expect(res.EC).toBe(1);
        });

        test('admin xóa thành công', async () => {
            User.findOne.mockResolvedValue({ isAdmin: true });
            const mockOrder = {
                _id: orderId,
                orderItems: [
                    { product: 'prodId1', amount: 2 },
                    { product: 'prodId2', amount: 3 },
                ]
            };
            Order.findByIdAndDelete.mockResolvedValue(mockOrder);
            Product.findOneAndUpdate.mockResolvedValue({});

            const res = await orderService.deleteOrder(orderId, userId);

            expect(res.EC).toBe(0);
            expect(Order.findByIdAndDelete).toHaveBeenCalledWith(orderId);
            expect(Product.findOneAndUpdate).toHaveBeenCalledTimes(mockOrder.orderItems.length);
        });

        test('user thường xóa thành công', async () => {
            User.findOne.mockResolvedValue({ isAdmin: false });
            const mockOrder = {
                _id: orderId,
                orderItems: [
                    { product: 'prodId1', amount: 2 },
                ]
            };
            Order.findOneAndDelete.mockResolvedValue(mockOrder);
            Product.findOneAndUpdate.mockResolvedValue({});

            const res = await orderService.deleteOrder(orderId, userId);

            expect(res.EC).toBe(0);
            expect(Order.findOneAndDelete).toHaveBeenCalledWith({ _id: orderId, user: userId });
            expect(Product.findOneAndUpdate).toHaveBeenCalledTimes(mockOrder.orderItems.length);
        });

        test('không tìm thấy order để xóa', async () => {
            User.findOne.mockResolvedValue({ isAdmin: true });
            Order.findByIdAndDelete.mockResolvedValue(null);

            const res = await orderService.deleteOrder(orderId, userId);

            expect(res.EC).toBe(-1);
            expect(res.EM).toMatch(/Order not existed/);
        });

        test('bắt lỗi', async () => {
            User.findOne.mockRejectedValue(new Error('DB error'));
            const res = await orderService.deleteOrder(orderId, userId);
            expect(res.EC).toBe(-2);
        });
    });

    describe('updateOrderStatus', () => {
        const userId = new Types.ObjectId().toHexString();
        const orderId = new Types.ObjectId().toHexString();

        test('thiếu params', async () => {
            const res = await orderService.updateOrderStatus(null, null, null);
            expect(res.EC).toBe(1);
        });

        test('id không hợp lệ', async () => {
            const res = await orderService.updateOrderStatus('invalid', 'Pending', 'invalid');
            expect(res.EC).toBe(1);
        });

        test('user không tồn tại', async () => {
            User.findById.mockResolvedValue(null);
            const res = await orderService.updateOrderStatus(orderId, 'Pending', userId);
            expect(res.EC).toBe(-1);
            expect(res.EM).toMatch(/User not found/);
        });

        test('status không hợp lệ', async () => {
            User.findById.mockResolvedValue({ isAdmin: true });
            const res = await orderService.updateOrderStatus(orderId, 'UnknownStatus', userId);
            expect(res.EC).toBe(2);
            expect(res.EM).toMatch(/Invalid status/);
        });

        test('admin cập nhật thành công', async () => {
            User.findById.mockResolvedValue({ isAdmin: true });
            Order.findOneAndUpdate.mockResolvedValue({ _id: orderId, orderStatus: 'Confirmed' });

            const res = await orderService.updateOrderStatus(orderId, 'Confirmed', userId);

            expect(res.EC).toBe(0);
            expect(Order.findOneAndUpdate).toHaveBeenCalledWith(
                { _id: orderId },
                expect.objectContaining({ orderStatus: 'Confirmed', confirmedAt: expect.any(Date) }),
                { new: true, runValidators: true }
            );
        });

        test('user thường cập nhật thành công', async () => {
            User.findById.mockResolvedValue({ isAdmin: false });
            Order.findOneAndUpdate.mockResolvedValue({ _id: orderId, orderStatus: 'Shipping' });

            const res = await orderService.updateOrderStatus(orderId, 'Shipping', userId);

            expect(res.EC).toBe(0);
            expect(Order.findOneAndUpdate).toHaveBeenCalledWith(
                { _id: orderId, user: userId },
                expect.objectContaining({ orderStatus: 'Shipping', shippedAt: expect.any(Date) }),
                { new: true, runValidators: true }
            );
        });

        test('không tìm thấy order hoặc không có quyền cập nhật', async () => {
            User.findById.mockResolvedValue({ isAdmin: true });
            Order.findOneAndUpdate.mockResolvedValue(null);

            const res = await orderService.updateOrderStatus(orderId, 'Delivered', userId);

            expect(res.EC).toBe(-1);
            expect(res.EM).toMatch(/Order not found or access denied/);
        });

        test('bắt lỗi', async () => {
            User.findById.mockRejectedValue(new Error('DB error'));
            const res = await orderService.updateOrderStatus(orderId, 'Pending', userId);
            expect(res.EC).toBe(-2);
        });
    });
});
