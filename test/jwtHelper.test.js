import Jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

import * as jwtHelpers from '../src/utils/jwtHelpers';

// Giả lập biến môi trường
process.env.JWT_ACCESS_TOKEN_SECRET = 'access-secret';
process.env.JWT_REFRESH_TOKEN_SECRET = 'refresh-secret';

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
    sign: jest.fn(),
    verify: jest.fn()
}));

// Tạo một class giả lập Mongoose Document
class MockMongooseDoc {
    toObject() {
        return { foo: 'bar' };
    }
}

describe('jwtHelpers', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('generateAccessToken', () => {
        it('should sign with plain object if payload is not mongoose document', () => {
            const payload = { userId: 123 };
            Jwt.sign.mockReturnValue('access-token');

            const token = jwtHelpers.generateAccessToken(payload);

            expect(Jwt.sign).toHaveBeenCalledWith(payload, 'access-secret', { expiresIn: '15m' });
            expect(token).toBe('access-token');
        });

        it('should sign with payload.toObject() if payload is mongoose document', () => {
            const payload = {
                toObject: () => ({ foo: 'bar' })
            };
            Object.setPrototypeOf(payload, mongoose.Document.prototype); // quan trọng

            Jwt.sign.mockReturnValue('access-token');

            const token = jwtHelpers.generateAccessToken(payload);

            expect(Jwt.sign).toHaveBeenCalledWith(payload.toObject(), 'access-secret', { expiresIn: '15m' });
            expect(token).toBe('access-token');
        });

        it('should throw error and log if Jwt.sign throws', () => {
            const payload = { userId: 123 };
            const error = new Error('sign failed');
            Jwt.sign.mockImplementation(() => { throw error; });
            console.error = jest.fn();

            expect(() => jwtHelpers.generateAccessToken(payload)).toThrow('Failed to generate access token');
            expect(console.error).toHaveBeenCalledWith('Error generating access token:', error);
        });
    });

    describe('generateRefreshToken', () => {
        it('should sign with payload.toObject()', () => {
            const payload = new MockMongooseDoc();
            Jwt.sign.mockReturnValue('refresh-token');

            const token = jwtHelpers.generateRefreshToken(payload);

            expect(Jwt.sign).toHaveBeenCalledWith(payload.toObject(), 'refresh-secret', { expiresIn: '1d' });
            expect(token).toBe('refresh-token');
        });

        it('should throw error and log if Jwt.sign throws', () => {
            const payload = new MockMongooseDoc();
            const error = new Error('sign failed');
            Jwt.sign.mockImplementation(() => { throw error; });
            console.error = jest.fn();

            expect(() => jwtHelpers.generateRefreshToken(payload)).toThrow('Failed to generate refresh token');
            expect(console.error).toHaveBeenCalledWith('Error generating refresh token:', error);
        });
    });

    describe('refreshNewTokenService', () => {
        it('should return new access token if token is valid', () => {
            const token = 'valid-refresh-token';
            const decoded = { iat: 1000, exp: 2000, userId: 123 };
            Jwt.verify.mockReturnValue(decoded);

            // Không mock generateAccessToken, vì không kiểm tra spy được
            // Thay vào đó mock Jwt.sign để kiểm soát kết quả generateAccessToken bên trong
            Jwt.sign.mockReturnValue('new-access-token');

            const result = jwtHelpers.refreshNewTokenService(token);

            expect(Jwt.verify).toHaveBeenCalledWith(token, 'refresh-secret');
            expect(result).toBe('new-access-token');  // kiểm tra đúng kết quả trả về
        });

        it('should return null and log error if Jwt.verify throws', () => {
            const token = 'invalid-token';
            const error = new Error('jwt malformed');
            Jwt.verify.mockImplementation(() => { throw error; });
            console.error = jest.fn();

            const result = jwtHelpers.refreshNewTokenService(token);

            expect(console.error).toHaveBeenCalledWith('Error refresh new token:', error);
            expect(result).toBeNull();
        });

        it('should return undefined if token is falsy', () => {
            const result = jwtHelpers.refreshNewTokenService(null);
            expect(result).toBeUndefined();
        });
    });



});
