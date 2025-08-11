// jwtHelpers.test.js
import Jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import {
    generateAccessToken,
    generateRefreshToken,
    refreshNewTokenService
} from '../utils/jwtHelpers';

// Mock .env
process.env.JWT_ACCESS_TOKEN_SECRET = 'access-secret';
process.env.JWT_REFRESH_TOKEN_SECRET = 'refresh-secret';

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
    sign: jest.fn(),
    verify: jest.fn()
}));

describe('jwtHelpers', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('generateAccessToken', () => {
        it('should sign token when payload is mongoose.Document', () => {
            const mockDoc = new mongoose.Document({}, new mongoose.Schema({ name: String }));
            mockDoc.toObject = jest.fn().mockReturnValue({ id: '123' });
            Jwt.sign.mockReturnValue('access-token');

            const token = generateAccessToken(mockDoc);

            expect(mockDoc.toObject).toHaveBeenCalled();
            expect(Jwt.sign).toHaveBeenCalledWith({ id: '123' }, 'access-secret', { expiresIn: '15m' });
            expect(token).toBe('access-token');
        });

        it('should sign token when payload is plain object', () => {
            const payload = { id: '456' };
            Jwt.sign.mockReturnValue('access-token-plain');

            const token = generateAccessToken(payload);

            expect(Jwt.sign).toHaveBeenCalledWith(payload, 'access-secret', { expiresIn: '15m' });
            expect(token).toBe('access-token-plain');
        });

        it('should throw error when sign fails', () => {
            const payload = { id: '789' };
            Jwt.sign.mockImplementation(() => { throw new Error('sign failed'); });

            expect(() => generateAccessToken(payload)).toThrow('Failed to generate access token');
        });
    });

    describe('generateRefreshToken', () => {
        it('should sign refresh token from mongoose.Document', () => {
            const mockDoc = new mongoose.Document({}, new mongoose.Schema({ name: String }));
            mockDoc.toObject = jest.fn().mockReturnValue({ id: '123' });
            Jwt.sign.mockReturnValue('refresh-token');

            const token = generateRefreshToken(mockDoc);

            expect(Jwt.sign).toHaveBeenCalledWith({ id: '123' }, 'refresh-secret', { expiresIn: '1d' });
            expect(token).toBe('refresh-token');
        });

        it('should throw error when sign fails', () => {
            const mockDoc = new mongoose.Document({}, new mongoose.Schema({ name: String }));
            mockDoc.toObject = jest.fn().mockReturnValue({ id: 'error' });
            Jwt.sign.mockImplementation(() => { throw new Error('refresh sign failed'); });

            expect(() => generateRefreshToken(mockDoc)).toThrow('Failed to generate refresh token');
        });
    });

    describe('refreshNewTokenService', () => {
        it('should verify token and generate new access token', () => {
            const payload = { id: '123', iat: 111, exp: 222 };
            Jwt.verify.mockReturnValue(payload);
            const newAccess = 'new-access-token';
            jest.spyOn(require('../utils/jwtHelpers'), 'generateAccessToken').mockReturnValue(newAccess);

            const result = refreshNewTokenService('refresh-token');

            expect(Jwt.verify).toHaveBeenCalledWith('refresh-token', 'refresh-secret');
            expect(result).toBe(newAccess);
        });

        it('should return null if verify throws', () => {
            Jwt.verify.mockImplementation(() => { throw new Error('invalid token'); });

            const result = refreshNewTokenService('bad-token');
            expect(result).toBeNull();
        });

        it('should return undefined if no token is provided', () => {
            const result = refreshNewTokenService();
            expect(result).toBeUndefined();
        });
    });
});
