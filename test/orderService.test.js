// src/test/orderAPIService.test.js
import { Types } from 'mongoose';
import Order from '../src/models/OrderProduct';
import Product from '../src/models/ProductModel';
import User from '../src/models/UserModel';
import emailAPIService from '../src/services/emailAPIService';

import * as orderService from '../src/services/orderAPIService';

jest.mock('../src/models/OrderProduct');
jest.mock('../src/models/ProductModel');
jest.mock('../src/models/UserModel');
jest.mock('../src/services/emailAPIService');

// Helper bỏ dấu tiếng Việt để test message chứa tiếng Việt dễ hơn
function removeVietnameseTones(str) {
    if (!str) return '';
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .toLowerCase();
}

describe('orderAPIService', () => {
    beforeAll(() => {
        jest.spyOn(console, 'log').mockImplementation(() => { });
        jest.spyOn(console, 'error').mockImplementation(() => { });
    });

    afterAll(() => {
        console.log.mockRestore();
        console.error.mockRestore();
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getAllOrders', () => {
        it('should return all orders if data exists', async () => {
            const mockOrders = [{ _id: '1' }, { _id: '2' }];
            Order.find.mockResolvedValue(mockOrders);

            const res = await orderService.getAllOrders();

            expect(res.EC).toBe(0);
            expect(res.DT).toEqual(mockOrders);
            expect(res.EM).toMatch(/success/i);
            expect(Order.find).toHaveBeenCalledWith({}, '-updatedAt -__v');
        });

        it('should return error if no orders', async () => {
            Order.find.mockResolvedValue([]);

            const res = await orderService.getAllOrders();

            expect(res.EC).toBe(1);
            expect(res.DT).toEqual([]);
            expect(res.EM).toMatch(/empty/i);
        });

        it('should handle exceptions', async () => {
            Order.find.mockRejectedValue(new Error('DB error'));

            const res = await orderService.getAllOrders();

            expect(res.EC).toBe(-2);
            expect(res.EM).toMatch(/something wrongs/i);
        });
    });

    describe('createNewOrder', () => {
        const validData = {
            orderItems: [
                { name: 'Product 1', product: '60f6f9a4e1b2b3a5c8f0d9a1', amount: 2 },
                { name: 'Product 2', product: '60f6f9a4e1b2b3a5c8f0d9a2', amount: 1 },
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

        it('should return error if missing required params', async () => {
            const res = await orderService.createNewOrder({});
            expect(res.EC).toBe(1);
            expect(res.EM).toMatch(/missing required params/i);
        });

        it('should create order successfully when all products available', async () => {
            Product.findOneAndUpdate.mockImplementation(({ _id }) =>
                Promise.resolve({ _id, countInStock: 10, sold: 5 })
            );
            Order.prototype.save = jest.fn().mockResolvedValue({});
            emailAPIService.sendSimpleEmail.mockResolvedValue();

            const res = await orderService.createNewOrder(validData);

            expect(res.EC).toBe(0);
            expect(res.EM).toMatch(/order created successfully/i);
            expect(Product.findOneAndUpdate).toHaveBeenCalledTimes(validData.orderItems.length);
            expect(Order.prototype.save).toHaveBeenCalled();
            expect(emailAPIService.sendSimpleEmail).toHaveBeenCalled();
        });

        it('should create order with missing products info in message', async () => {
            Product.findOneAndUpdate.mockImplementation(({ _id }) => {
                if (_id === '60f6f9a4e1b2b3a5c8f0d9a1') return Promise.resolve(null); // product 1 missing
                return Promise.resolve({ _id, countInStock: 5, sold: 10 });
            });
            Order.prototype.save = jest.fn().mockResolvedValue({});
            emailAPIService.sendSimpleEmail.mockResolvedValue();

            const res = await orderService.createNewOrder(validData);

            expect(res.EC).toBe(0);
            expect(removeVietnameseTones(res.EM)).toContain('co 1 san pham');
            expect(res.DT.length).toBe(1);
        });

        it('should return error if all products missing', async () => {
            Product.findOneAndUpdate.mockResolvedValue(null);

            const res = await orderService.createNewOrder(validData);

            expect(res.EC).toBe(2);
            expect(removeVietnameseTones(res.EM)).toContain('da ban sach hoac khong du so luong');
        });

        it('should handle exception thrown outside loop and return EC -2', async () => {
            Product.findOneAndUpdate.mockImplementation(() => {
                // lỗi sẽ được catch bên trong vòng for, nên ta giả lập thành công để qua bước tiếp theo
                return Promise.resolve({ _id: 'any', countInStock: 10, sold: 5 });
            });
            // Giả lập lỗi khi save order (ngoài vòng for)
            Order.prototype.save = jest.fn(() => { throw new Error('Unexpected error'); });
            emailAPIService.sendSimpleEmail.mockResolvedValue();

            const res = await orderService.createNewOrder(validData);

            expect(res.EC).toBe(-2);
            expect(res.EM).toMatch(/something wrongs/i);
        });
    });

    describe('getOrdersByUserId', () => {
        it('should return error if missing userId', async () => {
            const res = await orderService.getOrdersByUserId();
            expect(res.EC).toBe(1);
            expect(res.EM).toMatch(/missing required parameter/i);
        });

        it('should return error if invalid userId format', async () => {
            const res = await orderService.getOrdersByUserId('invalidid');
            expect(res.EC).toBe(1);
            expect(res.EM).toMatch(/invalid id format/i);
        });

        it('should return orders if exist', async () => {
            const mockOrders = [{ _id: '1' }, { _id: '2' }];
            Order.find.mockResolvedValue(mockOrders);

            const res = await orderService.getOrdersByUserId(new Types.ObjectId().toHexString());

            expect(res.EC).toBe(0);
            expect(res.DT).toEqual(mockOrders);
            expect(res.EM).toMatch(/success/i);
        });

        it('should return error if user has no orders', async () => {
            Order.find.mockResolvedValue([]);

            const res = await orderService.getOrdersByUserId(new Types.ObjectId().toHexString());

            expect(res.EC).toBe(-1);
            expect(res.EM).toMatch(/doesnt have any orders/i);
        });

        it('should handle exception', async () => {
            Order.find.mockRejectedValue(new Error('DB error'));

            const res = await orderService.getOrdersByUserId(new Types.ObjectId().toHexString());

            expect(res.EC).toBe(-2);
            expect(res.EM).toMatch(/something wrongs/i);
        });
    });

    describe('getDetailOrder', () => {
        const userId = new Types.ObjectId().toHexString();
        const orderId = new Types.ObjectId().toHexString();

        it('should return error if missing params', async () => {
            const res = await orderService.getDetailOrder(null, null);
            expect(res.EC).toBe(1);
        });

        it('should return error if invalid ObjectId format', async () => {
            const res = await orderService.getDetailOrder('invalid', 'invalid');
            expect(res.EC).toBe(1);
        });

        it('should get order detail for admin', async () => {
            User.findOne.mockResolvedValue({ isAdmin: true });
            const mockOrder = { _id: orderId, orderStatus: 'Pending' };
            Order.findOne.mockResolvedValue(mockOrder);

            const res = await orderService.getDetailOrder(orderId, userId);

            expect(res.EC).toBe(0);
            expect(res.DT).toEqual(mockOrder);
            expect(Order.findOne).toHaveBeenCalledWith({ _id: orderId }, '-user -createdAt -updatedAt -__v');
        });

        it('should get order detail for normal user', async () => {
            User.findOne.mockResolvedValue({ isAdmin: false });
            const mockOrder = { _id: orderId };
            Order.findOne.mockResolvedValue(mockOrder);

            const res = await orderService.getDetailOrder(orderId, userId);

            expect(res.EC).toBe(0);
            expect(res.DT).toEqual(mockOrder);
            expect(Order.findOne).toHaveBeenCalledWith({ _id: orderId, user: userId }, '-user -createdAt -updatedAt -__v');
        });

        it('should return error if order not found', async () => {
            User.findOne.mockResolvedValue({ isAdmin: true });
            Order.findOne.mockResolvedValue(null);

            const res = await orderService.getDetailOrder(orderId, userId);

            expect(res.EC).toBe(-1);
            expect(res.EM).toMatch(/order is not existed/i);
        });

        it('should handle exception', async () => {
            User.findOne.mockRejectedValue(new Error('DB error'));

            const res = await orderService.getDetailOrder(orderId, userId);

            expect(res.EC).toBe(-2);
        });
    });

    describe('deleteOrder', () => {
        const userId = new Types.ObjectId().toHexString();
        const orderId = new Types.ObjectId().toHexString();

        it('should return error if missing params', async () => {
            const res = await orderService.deleteOrder(null, null);
            expect(res.EC).toBe(1);
        });

        it('should return error if invalid ObjectId', async () => {
            const res = await orderService.deleteOrder('invalid', 'invalid');
            expect(res.EC).toBe(1);
        });

        it('should delete order and update products if admin', async () => {
            User.findOne.mockResolvedValue({ isAdmin: true });
            const mockOrder = {
                orderItems: [
                    { product: 'prod1', amount: 2 },
                    { product: 'prod2', amount: 3 },
                ],
            };
            Order.findByIdAndDelete.mockResolvedValue(mockOrder);
            Product.findOneAndUpdate.mockResolvedValue({});

            const res = await orderService.deleteOrder(orderId, userId);

            expect(res.EC).toBe(0);
            expect(Order.findByIdAndDelete).toHaveBeenCalledWith(orderId);
            expect(Product.findOneAndUpdate).toHaveBeenCalledTimes(mockOrder.orderItems.length);
        });

        it('should delete order and update products if normal user', async () => {
            User.findOne.mockResolvedValue({ isAdmin: false });
            const mockOrder = {
                orderItems: [
                    { product: 'prod1', amount: 2 },
                ],
            };
            Order.findOneAndDelete.mockResolvedValue(mockOrder);
            Product.findOneAndUpdate.mockResolvedValue({});

            const res = await orderService.deleteOrder(orderId, userId);

            expect(res.EC).toBe(0);
            expect(Order.findOneAndDelete).toHaveBeenCalledWith({ _id: orderId, user: userId });
            expect(Product.findOneAndUpdate).toHaveBeenCalledTimes(mockOrder.orderItems.length);
        });

        it('should return error if order not found to delete', async () => {
            User.findOne.mockResolvedValue({ isAdmin: true });
            Order.findByIdAndDelete.mockResolvedValue(null);

            const res = await orderService.deleteOrder(orderId, userId);

            expect(res.EC).toBe(-1);
            expect(res.EM).toMatch(/not existed to delete/i);
        });

        it('should handle exceptions', async () => {
            User.findOne.mockRejectedValue(new Error('DB error'));

            const res = await orderService.deleteOrder(orderId, userId);

            expect(res.EC).toBe(-2);
        });
    });

    describe('updateOrderStatus', () => {
        const userId = new Types.ObjectId().toHexString();
        const orderId = new Types.ObjectId().toHexString();

        it('should return error if missing params', async () => {
            const res = await orderService.updateOrderStatus(null, null, null);
            expect(res.EC).toBe(1);
        });

        it('should return error if invalid ObjectId format', async () => {
            const res = await orderService.updateOrderStatus('invalid', 'Pending', 'invalid');
            expect(res.EC).toBe(1);
        });

        it('should return error if user not found', async () => {
            User.findById.mockResolvedValue(null);
            const res = await orderService.updateOrderStatus(orderId, 'Pending', userId);
            expect(res.EC).toBe(-1);
            expect(res.EM).toMatch(/user not found/i);
        });

        it('should return error if status invalid', async () => {
            User.findById.mockResolvedValue({ isAdmin: true });
            const res = await orderService.updateOrderStatus(orderId, 'InvalidStatus', userId);
            expect(res.EC).toBe(2);
            expect(res.EM).toMatch(/invalid status/i);
        });

        it('should update order status successfully if admin', async () => {
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

        it('should update order status successfully if normal user', async () => {
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

        it('should return error if order not found or access denied', async () => {
            User.findById.mockResolvedValue({ isAdmin: true });
            Order.findOneAndUpdate.mockResolvedValue(null);

            const res = await orderService.updateOrderStatus(orderId, 'Delivered', userId);

            expect(res.EC).toBe(-1);
            expect(res.EM).toMatch(/not found or access denied/i);
        });

        it('should handle exceptions', async () => {
            User.findById.mockRejectedValue(new Error('DB error'));

            const res = await orderService.updateOrderStatus(orderId, 'Pending', userId);

            expect(res.EC).toBe(-2);
        });
    });
});
