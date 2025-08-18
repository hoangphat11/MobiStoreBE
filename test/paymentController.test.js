// __tests__/paymentController.test.js
import { handleGetPaymentConfig } from '../src/controllers/paymentController';

describe('Payment Controller - handleGetPaymentConfig', () => {
    let req;
    let res;

    beforeEach(() => {
        req = {}; // không cần request body
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
    });

    test('should return PayPal client id when env var exists', async () => {
        process.env.PAYPAL_CLIENT_ID = 'test-paypal-client-id';

        await handleGetPaymentConfig(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            EM: 'Get payment config success',
            EC: 0,
            DT: 'test-paypal-client-id',
        });
    });

    test('should handle missing PAYPAL_CLIENT_ID gracefully', async () => {
        delete process.env.PAYPAL_CLIENT_ID;

        await handleGetPaymentConfig(req, res);

        expect(res.status).toHaveBeenCalledWith(200); // vẫn 200 vì code gốc không check null
        expect(res.json).toHaveBeenCalledWith({
            EM: 'Get payment config success',
            EC: 0,
            DT: undefined,
        });
    });

    test('should return 500 if exception is thrown', async () => {
        const errorRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        // Mock res.status để throw lỗi
        errorRes.status.mockImplementation(() => { throw new Error('Mock error'); });

        await handleGetPaymentConfig(req, errorRes);

        // Không có expect vì lỗi xảy ra trong try-catch => code bắt lỗi
        // Ta expect trả về status 500 từ catch
        expect(errorRes.status).toHaveBeenCalledWith(500);
        expect(errorRes.json).toHaveBeenCalledWith({
            EM: 'error from server',
            EC: -1,
            DT: '',
        });
    });
});
