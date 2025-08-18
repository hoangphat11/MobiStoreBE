// __tests__/userAPIService.test.js
import * as service from '../src/services/userAPIService';
import User from '../src/models/UserModel';
import bcrypt from 'bcryptjs';
import {
  generateAccessToken,
  generateRefreshToken,
  refreshNewTokenService
} from '../src/utils/jwtHelpers';
import { Types } from 'mongoose';

jest.mock('../src/models/UserModel');
jest.mock('bcryptjs');
jest.mock('../src/utils/jwtHelpers');

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
      // checkEmailExisted -> User.findOne returns truthy
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
      // first call (email) -> null, second call (phone) -> truthy
      User.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(true);
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
      // both checks false
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
      // both checks false
      User.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
      // mock saving new user
      User.prototype.save = jest.fn().mockResolvedValue(true);
      bcrypt.hashSync.mockReturnValue('hashedpass');

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
      // To surface an error to registerNewUser's catch, make save() reject
      User.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
      User.prototype.save = jest.fn().mockRejectedValueOnce(new Error('DB save fail'));

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
      const fakeUser = {
        id: '1',
        name: 'Test',
        email: 'a@test.com',
        password: 'hashed',
        isAdmin: false,
        phone: '123'
      };

      // 1st call: checkEmailExisted -> truthy
      // 2nd call: findOne(...).select(...) -> simulate chainable select returning fakeUser
      User.findOne
        .mockResolvedValueOnce(true)
        .mockImplementationOnce(() => ({
          select: jest.fn().mockResolvedValue(fakeUser)
        }));

      bcrypt.compareSync.mockReturnValue(true);
      generateAccessToken.mockReturnValue('access');
      generateRefreshToken.mockReturnValue('refresh');

      const result = await service.loginUser(
        { valueLogin: 'a@test.com', password: '1234' },
        res
      );

      expect(result.EC).toBe(0);
      expect(result.EM).toBe('Login successfully');
      expect(result.DT).toBeDefined();
      expect(res.cookie).toHaveBeenCalled();
    });

    it('wrong password', async () => {
      const userMinimal = { id: '1', password: 'hashed' };

      User.findOne
        .mockResolvedValueOnce(true) // checkEmailExisted -> true
        .mockImplementationOnce(() => ({
          select: jest.fn().mockResolvedValue(userMinimal)
        })); // get user

      bcrypt.compareSync.mockReturnValue(false);

      const result = await service.loginUser(
        { valueLogin: 'a@test.com', password: 'wrong' },
        res
      );
      expect(result.EC).toBe(2);
      expect(result.EM).toBe('Wrong password!');
    });

    it('email/phone not existed', async () => {
      // both checks false -> checkEmailExisted returns null then checkPhoneExisted returns null
      User.findOne.mockResolvedValue(null);
      const result = await service.loginUser(
        { valueLogin: 'abc', password: '123' },
        res
      );
      expect(result.EC).toBe(1);
      expect(result.EM).toBe('Email or phone is not existed');
    });

    it('DB error', async () => {
      // make the check pass (so service proceeds to fetch user),
      // then make the fetch user step fail (reject from select)
      User.findOne
        .mockResolvedValueOnce(true) // checkEmailExisted -> true
        .mockImplementationOnce(() => ({
          select: jest.fn().mockRejectedValueOnce(new Error('DB error during get user'))
        }));

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
      jest.spyOn(Types.ObjectId, 'isValid').mockReturnValue(false);
      const result = await service.getDetailUserById('123');
      expect(result.EC).toBe(1);
      Types.ObjectId.isValid.mockRestore();
    });

    it('success', async () => {
      jest.spyOn(Types.ObjectId, 'isValid').mockReturnValue(true);
      User.findOne.mockResolvedValue({ name: 'A' });
      const result = await service.getDetailUserById('507f1f77bcf86cd799439011');
      expect(result.EC).toBe(0);
      Types.ObjectId.isValid.mockRestore();
    });

    it('user not found', async () => {
      jest.spyOn(Types.ObjectId, 'isValid').mockReturnValue(true);
      User.findOne.mockResolvedValue(null);
      const result = await service.getDetailUserById('507f1f77bcf86cd799439011');
      expect(result.EC).toBe(-1);
      Types.ObjectId.isValid.mockRestore();
    });

    it('error', async () => {
      jest.spyOn(Types.ObjectId, 'isValid').mockReturnValue(true);
      User.findOne.mockRejectedValue(new Error('fail'));
      const result = await service.getDetailUserById('507f1f77bcf86cd799439011');
      expect(result.EC).toBe(-2);
      Types.ObjectId.isValid.mockRestore();
    });
  });

  // ===== refreshNewToken =====
  // ===== refreshNewToken =====
  describe('refreshNewToken', () => {
    beforeEach(() => {
      // mặc định return null để tránh gọi code gốc
      refreshNewTokenService.mockReturnValue(null);
    });

    it('missing token', async () => {
      // khi không truyền token, service sẽ check và trả về EC=1
      const result = await service.refreshNewToken();
      expect(refreshNewTokenService).not.toHaveBeenCalled(); // không gọi luôn
      expect(result.EC).toBe(1);
    });

    it('success', async () => {
      refreshNewTokenService.mockReturnValue('newtoken');
      const result = await service.refreshNewToken('token');
      expect(result.EC).toBe(0);
      expect(result.DT).toBe('newtoken');
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
      jest.spyOn(Types.ObjectId, 'isValid').mockReturnValue(false);
      const result = await service.updateUser({ id: '123', data: {} });
      expect(result.EC).toBe(1);
      Types.ObjectId.isValid.mockRestore();
    });

    it('phone existed', async () => {
      jest.spyOn(Types.ObjectId, 'isValid').mockReturnValue(true);
      User.findOne
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce(true);
      const result = await service.updateUser({
        id: '507f1f77bcf86cd799439011',
        data: { phone: '123' }
      });
      expect(result.EC).toBe(2);
      Types.ObjectId.isValid.mockRestore();
    });

    it('success', async () => {
      jest.spyOn(Types.ObjectId, 'isValid').mockReturnValue(true);
      User.findOne
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce(null);
      User.findByIdAndUpdate.mockResolvedValue({
        toObject: () => ({ name: 'A', password: 'x', __v: 0 })
      });
      const result = await service.updateUser({
        id: '507f1f77bcf86cd799439011',
        data: { phone: '123' }
      });
      expect(result.EC).toBe(0);
      Types.ObjectId.isValid.mockRestore();
    });

    it('user not found', async () => {
      jest.spyOn(Types.ObjectId, 'isValid').mockReturnValue(true);
      User.findOne.mockResolvedValue(null);
      const result = await service.updateUser({
        id: '507f1f77bcf86cd799439011',
        data: {}
      });
      expect(result.EC).toBe(-1);
      Types.ObjectId.isValid.mockRestore();
    });

    it('error', async () => {
      jest.spyOn(Types.ObjectId, 'isValid').mockReturnValue(true);
      User.findOne.mockRejectedValue(new Error('fail'));
      const result = await service.updateUser({
        id: '507f1f77bcf86cd799439011',
        data: {}
      });
      expect(result.EC).toBe(-2);
      Types.ObjectId.isValid.mockRestore();
    });
  });

  // ===== deleteUser =====
  describe('deleteUser', () => {
    it('missing id', async () => {
      const result = await service.deleteUser();
      expect(result.EC).toBe(1);
    });

    it('invalid id', async () => {
      jest.spyOn(Types.ObjectId, 'isValid').mockReturnValue(false);
      const result = await service.deleteUser('123');
      expect(result.EC).toBe(1);
      Types.ObjectId.isValid.mockRestore();
    });

    it('success', async () => {
      jest.spyOn(Types.ObjectId, 'isValid').mockReturnValue(true);
      User.findByIdAndDelete.mockResolvedValue({});
      const result = await service.deleteUser('507f1f77bcf86cd799439011');
      expect(result.EC).toBe(0);
      Types.ObjectId.isValid.mockRestore();
    });

    it('user not found', async () => {
      jest.spyOn(Types.ObjectId, 'isValid').mockReturnValue(true);
      User.findByIdAndDelete.mockResolvedValue(null);
      const result = await service.deleteUser('507f1f77bcf86cd799439011');
      expect(result.EC).toBe(-1);
      Types.ObjectId.isValid.mockRestore();
    });

    it('error', async () => {
      jest.spyOn(Types.ObjectId, 'isValid').mockReturnValue(true);
      User.findByIdAndDelete.mockRejectedValue(new Error('fail'));
      const result = await service.deleteUser('507f1f77bcf86cd799439011');
      expect(result.EC).toBe(-2);
      Types.ObjectId.isValid.mockRestore();
    });
  });
});
