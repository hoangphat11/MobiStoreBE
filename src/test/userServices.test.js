import * as service from '../services/userAPIService';
import User from '../models/UserModel';
import bcrypt from 'bcryptjs';
import {
  generateAccessToken,
  generateRefreshToken,
  refreshNewTokenService
} from '../utils/JWTHelpers';
import { Types } from 'mongoose';

jest.mock('../models/UserModel');
jest.mock('bcryptjs');
jest.mock('../utils/JWTHelpers');

describe('userAPIService', () => {
  let res;

  beforeEach(() => {
    jest.clearAllMocks();
    res = {
      cookie: jest.fn(),
      clearCookie: jest.fn()
    };
  });

  // ===== registerNewUser =====
  describe('registerNewUser', () => {
    it('missing params', async () => {
      const result = await service.registerNewUser({});
      expect(result.EC).toBe(1);
      expect(result.EM).toMatch(/Missing/);
    });

    it('invalid email', async () => {
      const result = await service.registerNewUser({
        name: 'A',
        email: 'abc',
        password: '1234',
        phone: '123'
      });
      expect(result.EC).toBe(1);
      expect(result.EM).toMatch(/Email is not valid/);
    });

    it('email existed', async () => {
      User.findOne.mockResolvedValueOnce(true);
      const result = await service.registerNewUser({
        name: 'A',
        email: 'a@test.com',
        password: '1234',
        phone: '123'
      });
      expect(result.EC).toBe(2);
      expect(result.EM).toMatch(/already existed/);
    });

    it('phone existed', async () => {
      User.findOne
        .mockResolvedValueOnce(null) // email ok
        .mockResolvedValueOnce(true); // phone existed
      const result = await service.registerNewUser({
        name: 'A',
        email: 'a@test.com',
        password: '1234',
        phone: '123'
      });
      expect(result.EC).toBe(2);
      expect(result.EM).toMatch(/Phone number is already existed/);
    });

    it('password too short', async () => {
      User.findOne.mockResolvedValue(null);
      const result = await service.registerNewUser({
        name: 'A',
        email: 'a@test.com',
        password: '12',
        phone: '123'
      });
      expect(result.EC).toBe(3);
    });

    it('success', async () => {
      User.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
      User.prototype.save = jest.fn().mockResolvedValue(true);
      const result = await service.registerNewUser({
        name: 'A',
        email: 'a@test.com',
        password: '1234',
        phone: '123'
      });
      expect(result.EC).toBe(0);
      expect(result.EM).toMatch(/Created successfully/);
    });

    it('DB error', async () => {
      User.findOne.mockRejectedValue(new Error('DB error'));
      const result = await service.registerNewUser({
        name: 'A',
        email: 'a@test.com',
        password: '1234',
        phone: '123'
      });
      expect(result.EC).toBe(-2);
    });
  });

  // ===== loginUser =====
  describe('loginUser', () => {
    it('success with email', async () => {
      User.findOne
        .mockResolvedValueOnce(true) // email exists
        .mockResolvedValueOnce({
          id: '1',
          name: 'Test',
          email: 'a@test.com',
          password: 'hashed',
          isAdmin: false,
          phone: '123',
          select: jest.fn().mockResolvedValue({
            id: '1',
            name: 'Test',
            email: 'a@test.com',
            password: 'hashed',
            isAdmin: false,
            phone: '123'
          })
        });
      bcrypt.compareSync.mockReturnValue(true);
      generateAccessToken.mockReturnValue('access');
      generateRefreshToken.mockReturnValue('refresh');
      const result = await service.loginUser(
        { valueLogin: 'a@test.com', password: '1234' },
        res
      );
      expect(result.EC).toBe(0);
      expect(res.cookie).toHaveBeenCalled();
    });

    it('wrong password', async () => {
      User.findOne.mockResolvedValueOnce(true).mockResolvedValueOnce({
        select: jest.fn().mockResolvedValue({ password: 'hashed' })
      });
      bcrypt.compareSync.mockReturnValue(false);
      const result = await service.loginUser(
        { valueLogin: 'a@test.com', password: 'wrong' },
        res
      );
      expect(result.EC).toBe(2);
    });

    it('email/phone not existed', async () => {
      User.findOne.mockResolvedValue(null);
      const result = await service.loginUser(
        { valueLogin: 'abc', password: '123' },
        res
      );
      expect(result.EC).toBe(1);
    });

    it('DB error', async () => {
      User.findOne.mockRejectedValue(new Error('DB error'));
      const result = await service.loginUser(
        { valueLogin: 'abc', password: '123' },
        res
      );
      expect(result.EC).toBe(-2);
    });
  });

  // ===== logoutUser =====
  describe('logoutUser', () => {
    it('success', async () => {
      const result = await service.logoutUser(res);
      expect(result.EC).toBe(0);
      expect(res.clearCookie).toHaveBeenCalled();
    });

    it('error', async () => {
      res.clearCookie.mockImplementation(() => {
        throw new Error('fail');
      });
      const result = await service.logoutUser(res);
      expect(result.EC).toBe(-2);
    });
  });

  // ===== getAllUsers =====
  describe('getAllUsers', () => {
    it('has data', async () => {
      User.find.mockResolvedValue([{ name: 'A' }]);
      const result = await service.getAllUsers();
      expect(result.EC).toBe(0);
    });

    it('empty', async () => {
      User.find.mockResolvedValue([]);
      const result = await service.getAllUsers();
      expect(result.DT).toEqual([]);
    });

    it('error', async () => {
      User.find.mockRejectedValue(new Error('fail'));
      const result = await service.getAllUsers();
      expect(result.EC).toBe(-2);
    });
  });

  // ===== getDetailUserById =====
  describe('getDetailUserById', () => {
    it('missing id', async () => {
      const result = await service.getDetailUserById();
      expect(result.EC).toBe(1);
    });

    it('invalid id', async () => {
      const result = await service.getDetailUserById('123');
      expect(result.EC).toBe(1);
    });

    it('success', async () => {
      Types.ObjectId.isValid = jest.fn().mockReturnValue(true);
      User.findOne.mockResolvedValue({ name: 'A' });
      const result = await service.getDetailUserById('507f1f77bcf86cd799439011');
      expect(result.EC).toBe(0);
    });

    it('user not found', async () => {
      Types.ObjectId.isValid = jest.fn().mockReturnValue(true);
      User.findOne.mockResolvedValue(null);
      const result = await service.getDetailUserById('507f1f77bcf86cd799439011');
      expect(result.EC).toBe(-1);
    });

    it('error', async () => {
      Types.ObjectId.isValid = jest.fn().mockReturnValue(true);
      User.findOne.mockRejectedValue(new Error('fail'));
      const result = await service.getDetailUserById('507f1f77bcf86cd799439011');
      expect(result.EC).toBe(-2);
    });
  });

  // ===== refreshNewToken =====
  describe('refreshNewToken', () => {
    it('missing token', async () => {
      const result = await service.refreshNewToken();
      expect(result.EC).toBe(1);
    });

    it('success', async () => {
      refreshNewTokenService.mockReturnValue('newtoken');
      const result = await service.refreshNewToken('token');
      expect(result.EC).toBe(0);
    });

    it('invalid token', async () => {
      refreshNewTokenService.mockReturnValue(false);
      const result = await service.refreshNewToken('token');
      expect(result.EC).toBe(2);
    });

    it('error', async () => {
      refreshNewTokenService.mockImplementation(() => {
        throw new Error('fail');
      });
      const result = await service.refreshNewToken('token');
      expect(result.EC).toBe(-2);
    });
  });

  // ===== updateUser =====
  describe('updateUser', () => {
    it('missing id', async () => {
      const result = await service.updateUser({ data: {} });
      expect(result.EC).toBe(1);
    });

    it('invalid id', async () => {
      const result = await service.updateUser({ id: '123', data: {} });
      expect(result.EC).toBe(1);
    });

    it('phone existed', async () => {
      Types.ObjectId.isValid = jest.fn().mockReturnValue(true);
      User.findOne.mockResolvedValueOnce({}).mockResolvedValueOnce(true);
      const result = await service.updateUser({
        id: '507f1f77bcf86cd799439011',
        data: { phone: '123' }
      });
      expect(result.EC).toBe(2);
    });

    it('success', async () => {
      Types.ObjectId.isValid = jest.fn().mockReturnValue(true);
      User.findOne.mockResolvedValueOnce({}).mockResolvedValueOnce(null);
      User.findByIdAndUpdate.mockResolvedValue({
        toObject: () => ({ name: 'A', password: 'x', __v: 0 })
      });
      const result = await service.updateUser({
        id: '507f1f77bcf86cd799439011',
        data: { phone: '123' }
      });
      expect(result.EC).toBe(0);
    });

    it('user not found', async () => {
      Types.ObjectId.isValid = jest.fn().mockReturnValue(true);
      User.findOne.mockResolvedValue(null);
      const result = await service.updateUser({
        id: '507f1f77bcf86cd799439011',
        data: {}
      });
      expect(result.EC).toBe(-1);
    });

    it('error', async () => {
      Types.ObjectId.isValid = jest.fn().mockReturnValue(true);
      User.findOne.mockRejectedValue(new Error('fail'));
      const result = await service.updateUser({
        id: '507f1f77bcf86cd799439011',
        data: {}
      });
      expect(result.EC).toBe(-2);
    });
  });

  // ===== deleteUser =====
  describe('deleteUser', () => {
    it('missing id', async () => {
      const result = await service.deleteUser();
      expect(result.EC).toBe(1);
    });

    it('invalid id', async () => {
      const result = await service.deleteUser('123');
      expect(result.EC).toBe(1);
    });

    it('success', async () => {
      Types.ObjectId.isValid = jest.fn().mockReturnValue(true);
      User.findByIdAndDelete.mockResolvedValue({});
      const result = await service.deleteUser('507f1f77bcf86cd799439011');
      expect(result.EC).toBe(0);
    });

    it('user not found', async () => {
      Types.ObjectId.isValid = jest.fn().mockReturnValue(true);
      User.findByIdAndDelete.mockResolvedValue(null);
      const result = await service.deleteUser('507f1f77bcf86cd799439011');
      expect(result.EC).toBe(-1);
    });

    it('error', async () => {
      Types.ObjectId.isValid = jest.fn().mockReturnValue(true);
      User.findByIdAndDelete.mockRejectedValue(new Error('fail'));
      const result = await service.deleteUser('507f1f77bcf86cd799439011');
      expect(result.EC).toBe(-2);
    });
  });
});
