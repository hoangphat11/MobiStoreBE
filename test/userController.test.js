import * as controller from '../src/controllers/userController';
import * as serviceMock from '../src/services/userAPIService';

jest.mock('../src/services/userAPIService');

describe('userAPIController', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {}, params: {}, headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    };
    jest.clearAllMocks();
  });

  // ----- handleLogin -----
  it('handleLogin - success', async () => {
    serviceMock.loginUser.mockResolvedValue({ EM: 'ok', EC: 0, DT: { token: 'abc' } });
    req.body = { valueLogin: 'test', password: '1234' };

    await controller.handleLogin(req, res);

    expect(serviceMock.loginUser).toHaveBeenCalledWith(req.body, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ EM: 'ok', EC: 0, DT: { token: 'abc' } });
  });

  it('handleLogin - error', async () => {
    serviceMock.loginUser.mockRejectedValue(new Error('fail'));
    await controller.handleLogin(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ EM: 'error from server', EC: -1, DT: '' });
  });

  // ----- handleRegister -----
  it('handleRegister - success', async () => {
    serviceMock.registerNewUser.mockResolvedValue({ EM: 'ok', EC: 0, DT: {} });
    await controller.handleRegister(req, res);
    expect(res.json).toHaveBeenCalledWith({ EM: 'ok', EC: 0, DT: {} });
  });

  it('handleRegister - error', async () => {
    serviceMock.registerNewUser.mockRejectedValue(new Error());
    await controller.handleRegister(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  // ----- handleLogout -----
  it('handleLogout - success', async () => {
    serviceMock.logoutUser.mockResolvedValue({ EM: 'logout', EC: 0, DT: {} });
    await controller.handleLogout(req, res);
    expect(res.json).toHaveBeenCalledWith({ EM: 'logout', EC: 0, DT: {} });
  });

  it('handleLogout - error', async () => {
    serviceMock.logoutUser.mockRejectedValue(new Error());
    await controller.handleLogout(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  // ----- handleGetAllUsers -----
  it('handleGetAllUsers - success', async () => {
    serviceMock.getAllUsers.mockResolvedValue({ EM: 'ok', EC: 0, DT: [] });
    await controller.handleGetAllUsers(req, res);
    expect(res.json).toHaveBeenCalledWith({ EM: 'ok', EC: 0, DT: [] });
  });

  it('handleGetAllUsers - error', async () => {
    serviceMock.getAllUsers.mockRejectedValue(new Error());
    await controller.handleGetAllUsers(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  // ----- handleGetDetailUser -----
  it('handleGetDetailUser - success', async () => {
    req.params = { id: 1 };
    serviceMock.getDetailUserById.mockResolvedValue({ EM: 'ok', EC: 0, DT: {} });
    await controller.handleGetDetailUser(req, res);
    expect(serviceMock.getDetailUserById).toHaveBeenCalledWith(1);
  });

  it('handleGetDetailUser - error', async () => {
    serviceMock.getDetailUserById.mockRejectedValue(new Error());
    await controller.handleGetDetailUser(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  // ----- handleRefreshToken -----
  it('handleRefreshToken - empty cookie', async () => {
    req.headers = {};
    await controller.handleRefreshToken(req, res);
    expect(res.json).toHaveBeenCalledWith({ EM: 'Empty bearer token!', EC: 1, DT: '' });
  });

  it('handleRefreshToken - success', async () => {
    req.headers = { cookie: 'token=abc123' };
    serviceMock.refreshNewToken.mockResolvedValue({ EM: 'ok', EC: 0, DT: {} });
    await controller.handleRefreshToken(req, res);
    expect(serviceMock.refreshNewToken).toHaveBeenCalledWith('abc123');
  });

  it('handleRefreshToken - error', async () => {
    req.headers = { cookie: 'token=abc123' };
    serviceMock.refreshNewToken.mockRejectedValue(new Error());
    await controller.handleRefreshToken(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  // ----- handleUpdateUser -----
  it('handleUpdateUser - success', async () => {
    serviceMock.updateUser.mockResolvedValue({ EM: 'ok', EC: 0, DT: {} });
    await controller.handleUpdateUser(req, res);
    expect(serviceMock.updateUser).toHaveBeenCalledWith(req.body);
  });

  it('handleUpdateUser - error', async () => {
    serviceMock.updateUser.mockRejectedValue(new Error());
    await controller.handleUpdateUser(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  // ----- handleDeleteUser -----
  it('handleDeleteUser - success', async () => {
    req.body = { id: 1 };
    serviceMock.deleteUser.mockResolvedValue({ EM: 'ok', EC: 0, DT: {} });
    await controller.handleDeleteUser(req, res);
    expect(serviceMock.deleteUser).toHaveBeenCalledWith(1);
  });

  it('handleDeleteUser - error', async () => {
    serviceMock.deleteUser.mockRejectedValue(new Error());
    await controller.handleDeleteUser(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
