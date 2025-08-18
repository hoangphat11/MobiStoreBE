import * as orderController from '../src/controllers/orderController';
import orderAPIService from '../src/services/orderAPIService';

jest.mock('../src/services/orderAPIService');

describe('orderController', () => {
    let req, res;

    beforeEach(() => {
        req = { body: {}, params: {}, query: {} };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        jest.clearAllMocks();
    });

    // ============================
    // handleGetAllOrders
    // ============================
    describe('handleGetAllOrders', () => {
        it('should return all orders successfully', async () => {
            orderAPIService.getAllOrders.mockResolvedValue({ EM: 'ok', EC: 0, DT: [] });

            await orderController.handleGetAllOrders(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ EM: 'ok', EC: 0, DT: [] });
        });

        it('should handle error when getAllOrders fails', async () => {
            orderAPIService.getAllOrders.mockRejectedValue(new Error('DB error'));

            await orderController.handleGetAllOrders(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ EM: 'error from server', EC: -1, DT: '' });
        });
    });

    // ============================
    // handleCreateNewOrder
    // ============================
    describe('handleCreateNewOrder', () => {
        it('should create a new order successfully', async () => {
            req.body = { productId: 1 };
            orderAPIService.createNewOrder.mockResolvedValue({ EM: 'created', EC: 0, DT: { id: 1 } });

            await orderController.handleCreateNewOrder(req, res);

            expect(orderAPIService.createNewOrder).toHaveBeenCalledWith({ productId: 1 });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ EM: 'created', EC: 0, DT: { id: 1 } });
        });

        it('should handle error when createNewOrder fails', async () => {
            orderAPIService.createNewOrder.mockRejectedValue(new Error('Insert fail'));

            await orderController.handleCreateNewOrder(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ EM: 'error from server', EC: -1, DT: '' });
        });
    });

    // ============================
    // handleGetOrdersByUserId
    // ============================
    describe('handleGetOrdersByUserId', () => {
        it('should return orders by userId successfully', async () => {
            req.params.id = 99;
            orderAPIService.getOrdersByUserId.mockResolvedValue({ EM: 'ok', EC: 0, DT: [{ id: 1 }] });

            await orderController.handleGetOrdersByUserId(req, res);

            expect(orderAPIService.getOrdersByUserId).toHaveBeenCalledWith(99);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ EM: 'ok', EC: 0, DT: [{ id: 1 }] });
        });

        it('should handle error when getOrdersByUserId fails', async () => {
            orderAPIService.getOrdersByUserId.mockRejectedValue(new Error('Fail'));

            await orderController.handleGetOrdersByUserId(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ EM: 'error from server', EC: -1, DT: '' });
        });
    });

    // ============================
    // handleGetDetailOrder
    // ============================
    describe('handleGetDetailOrder', () => {
        it('should return order detail successfully', async () => {
            req.params.orderId = 1;
            req.query.id = 10;
            orderAPIService.getDetailOrder.mockResolvedValue({ EM: 'ok', EC: 0, DT: { id: 1 } });

            await orderController.handleGetDetailOrder(req, res);

            expect(orderAPIService.getDetailOrder).toHaveBeenCalledWith(1, 10);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ EM: 'ok', EC: 0, DT: { id: 1 } });
        });

        it('should handle error when getDetailOrder fails', async () => {
            orderAPIService.getDetailOrder.mockRejectedValue(new Error('Fail'));

            await orderController.handleGetDetailOrder(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ EM: 'error from server', EC: -1, DT: '' });
        });
    });

    // ============================
    // handleDeleteOrder
    // ============================
    describe('handleDeleteOrder', () => {
        it('should delete order successfully', async () => {
            req.params.orderId = 1;
            req.query.id = 10;
            orderAPIService.deleteOrder.mockResolvedValue({ EM: 'deleted', EC: 0, DT: {} });

            await orderController.handleDeleteOrder(req, res);

            expect(orderAPIService.deleteOrder).toHaveBeenCalledWith(1, 10);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ EM: 'deleted', EC: 0, DT: {} });
        });

        it('should handle error when deleteOrder fails', async () => {
            orderAPIService.deleteOrder.mockRejectedValue(new Error('Fail'));

            await orderController.handleDeleteOrder(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ EM: 'error from server', EC: -1, DT: '' });
        });
    });

    // ============================
    // handleUpdateOrderStatus
    // ============================
    describe('handleUpdateOrderStatus', () => {
        it('should return 400 if missing params', async () => {
            req.params = {};
            req.body = {};
            req.query = {};

            await orderController.handleUpdateOrderStatus(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                EM: 'Missing required parameters: orderId, orderStatus or userId',
                EC: 1,
                DT: '',
            });
        });

        it('should update order status successfully', async () => {
            req.params.orderId = 1;
            req.body.orderStatus = 'shipped';
            req.query.id = 10;

            orderAPIService.updateOrderStatus.mockResolvedValue({ EM: 'updated', EC: 0, DT: {} });

            await orderController.handleUpdateOrderStatus(req, res);

            expect(orderAPIService.updateOrderStatus).toHaveBeenCalledWith(1, 'shipped', 10);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ EM: 'updated', EC: 0, DT: {} });
        });

        it('should handle error when updateOrderStatus fails', async () => {
            req.params.orderId = 1;
            req.body.orderStatus = 'shipped';
            req.query.id = 10;

            orderAPIService.updateOrderStatus.mockRejectedValue(new Error('Fail'));

            await orderController.handleUpdateOrderStatus(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ EM: 'error from server', EC: -1, DT: '' });
        });
    });
});
