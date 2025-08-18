// __tests__/emailAPIService.test.js
import nodemailer from 'nodemailer';
import { jest } from '@jest/globals';
import * as emailService from '../src/services/emailAPIService';

jest.mock('nodemailer');

describe('emailAPIService', () => {
    const sampleData = {
        shippingAddress: {
            fullName: 'Nguyen Van A',
            phone: '0123456789',
            address: '123 ABC Street',
            city: 'Hanoi',
        },
        orderItems: [{ id: 1 }, { id: 2 }],
        totalPrice: 200,
        shippingPrice: 15,
        paymentMethod: 'cash',
        isPaid: true,
        email: 'test@example.com',
    };

    let sendMailMock;

    beforeEach(() => {
        sendMailMock = jest.fn().mockResolvedValue('Email sent');
        nodemailer.createTransport.mockReturnValue({ sendMail: sendMailMock });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('getBodyHTMLEmail should generate correct HTML (default case)', () => {
        const getBodyHTMLEmail = emailService.getBodyHTMLEmail;
        const html = getBodyHTMLEmail(sampleData);

        expect(html).toContain(sampleData.shippingAddress.fullName);
        expect(html).toContain(sampleData.shippingAddress.phone);
        expect(html).toContain(`${sampleData.orderItems.length}`);
        expect(html).toContain(`${sampleData.totalPrice}`);
        expect(html).toContain('Giao hàng tiết kiệm');
        expect(html).toContain('Thanh toán tiền mặt khi nhận hàng');
        expect(html).toContain('Đã thanh toán');
    });

    test('sendSimpleEmail should call nodemailer with correct params', async () => {
        process.env.EMAIL_APP = 'test@gmail.com';
        process.env.EMAIL_APP_PASSWORD = 'password';

        await emailService.sendSimpleEmail(sampleData);

        expect(nodemailer.createTransport).toHaveBeenCalledWith({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
                user: process.env.EMAIL_APP,
                pass: process.env.EMAIL_APP_PASSWORD,
            },
        });

        expect(sendMailMock).toHaveBeenCalledWith(
            expect.objectContaining({
                from: expect.stringContaining('MobileStore'),
                to: sampleData.email,
                subject: expect.stringContaining('xác nhận đơn hàng'),
                html: expect.any(String),
            })
        );
    });

    // ✅ Cover else branch inside sendSimpleEmail
    test('sendSimpleEmail should handle fast delivery, e-wallet payment, and unpaid status', async () => {
        process.env.EMAIL_APP = 'test@gmail.com';
        process.env.EMAIL_APP_PASSWORD = 'password';

        const altData = {
            ...sampleData,
            shippingPrice: 20,     // khác 15 -> Giao hàng hỏa tốc
            paymentMethod: 'momo', // khác cash -> Thanh toán qua ví điện tử
            isPaid: false          // false -> Chưa thanh toán
        };

        await emailService.sendSimpleEmail(altData);

        const sentHtml = sendMailMock.mock.calls[0][0].html;
        expect(sentHtml).toContain('Giao hàng hỏa tốc');
        expect(sentHtml).toContain('Thanh toán qua ví điện tử');
        expect(sentHtml).toContain('Chưa thanh toán');
    });
});
