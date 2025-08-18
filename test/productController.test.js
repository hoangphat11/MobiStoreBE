import * as controller from '../src/controllers/productController';
import * as serviceMock from '../src/services/productAPIService';

jest.mock('../src/services/productAPIService');

describe('productAPIController', () => {
    let req, res;

    beforeEach(() => {
        req = { body: {}, params: {}, query: {} };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        jest.clearAllMocks();
    });

    // --- handleGetAllProducts ---
    it('handleGetAllProducts - pagination', async () => {
        req.query = { page: '1', limit: '5', sort: 'asc', field: 'name', filter: 'phone' };
        serviceMock.getAllProductsPagination.mockResolvedValue({ EM: 'ok', EC: 0, DT: [] });

        await controller.handleGetAllProducts(req, res);

        expect(serviceMock.getAllProductsPagination).toHaveBeenCalledWith(1, 5, 'asc', 'name', 'phone');
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ EM: 'ok', EC: 0, DT: [] });
    });

    it('handleGetAllProducts - only limit', async () => {
        req.query = { limit: '3' };
        serviceMock.getAllProductsPagination.mockResolvedValue({ EM: 'ok', EC: 0, DT: [] });

        await controller.handleGetAllProducts(req, res);

        expect(serviceMock.getAllProductsPagination).toHaveBeenCalledWith('', '3', undefined, undefined, undefined);
    });

    it('handleGetAllProducts - no pagination', async () => {
        req.query = {};
        serviceMock.getAllProducts.mockResolvedValue({ EM: 'ok', EC: 0, DT: [] });

        await controller.handleGetAllProducts(req, res);

        expect(serviceMock.getAllProducts).toHaveBeenCalled();
    });

    it('handleGetAllProducts - error', async () => {
        serviceMock.getAllProducts.mockRejectedValue(new Error());
        await controller.handleGetAllProducts(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
    });

    // --- handleGetDetailProd ---
    it('handleGetDetailProd - success', async () => {
        req.params = { id: '1' };
        serviceMock.getDetailProdById.mockResolvedValue({ EM: 'ok', EC: 0, DT: {} });

        await controller.handleGetDetailProd(req, res);

        expect(serviceMock.getDetailProdById).toHaveBeenCalledWith('1');
    });

    it('handleGetDetailProd - error', async () => {
        serviceMock.getDetailProdById.mockRejectedValue(new Error());
        await controller.handleGetDetailProd(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
    });

    // --- handleCreateNewProduct ---
    it('handleCreateNewProduct - success', async () => {
        req.body = { name: 'Phone' };
        serviceMock.createNewProduct.mockResolvedValue({ EM: 'ok', EC: 0, DT: {} });

        await controller.handleCreateNewProduct(req, res);

        expect(serviceMock.createNewProduct).toHaveBeenCalledWith(req.body);
    });

    it('handleCreateNewProduct - error', async () => {
        serviceMock.createNewProduct.mockRejectedValue(new Error());
        await controller.handleCreateNewProduct(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
    });

    // --- handleUpdateProduct ---
    it('handleUpdateProduct - success', async () => {
        req.body = { id: 1, name: 'Laptop' };
        serviceMock.updateProduct.mockResolvedValue({ EM: 'ok', EC: 0, DT: {} });

        await controller.handleUpdateProduct(req, res);

        expect(serviceMock.updateProduct).toHaveBeenCalledWith(req.body);
    });

    it('handleUpdateProduct - error', async () => {
        serviceMock.updateProduct.mockRejectedValue(new Error());
        await controller.handleUpdateProduct(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
    });

    // --- handleDeleteProduct ---
    it('handleDeleteProduct - success', async () => {
        req.body = { id: 10 };
        serviceMock.deleteProduct.mockResolvedValue({ EM: 'deleted', EC: 0, DT: {} });

        await controller.handleDeleteProduct(req, res);

        expect(serviceMock.deleteProduct).toHaveBeenCalledWith(10);
    });

    it('handleDeleteProduct - error', async () => {
        serviceMock.deleteProduct.mockRejectedValue(new Error());
        await controller.handleDeleteProduct(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
    });

    // --- handleDeleteManyProduct ---
    it('handleDeleteManyProduct - success', async () => {
        req.body = { ids: [1, 2, 3] };
        serviceMock.deleteManyProduct.mockResolvedValue({ EM: 'deleted many', EC: 0, DT: {} });

        await controller.handleDeleteManyProduct(req, res);

        expect(serviceMock.deleteManyProduct).toHaveBeenCalledWith([1, 2, 3]);
    });

    it('handleDeleteManyProduct - error', async () => {
        serviceMock.deleteManyProduct.mockRejectedValue(new Error());
        await controller.handleDeleteManyProduct(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
    });

    // --- handleGetTypesProduct ---
    it('handleGetTypesProduct - success', async () => {
        serviceMock.getTypesProduct.mockResolvedValue({ EM: 'ok', EC: 0, DT: ['phone'] });

        await controller.handleGetTypesProduct(req, res);

        expect(serviceMock.getTypesProduct).toHaveBeenCalled();
    });

    it('handleGetTypesProduct - error', async () => {
        serviceMock.getTypesProduct.mockRejectedValue(new Error());
        await controller.handleGetTypesProduct(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
    });

    // --- handleGetProductsByType ---
    it('handleGetProductsByType - success', async () => {
        req.query = { page: 1, limit: 10, filter: 'new' };
        req.params = { prodType: 'phone' };
        serviceMock.getProductsByType.mockResolvedValue({ EM: 'ok', EC: 0, DT: [] });

        await controller.handleGetProductsByType(req, res);

        expect(serviceMock.getProductsByType).toHaveBeenCalledWith(1, 10, 'new', 'phone');
    });

    it('handleGetProductsByType - error', async () => {
        req.query = { page: 1, limit: 10, filter: 'new' };
        req.params = { prodType: 'phone' };
        serviceMock.getProductsByType.mockRejectedValue(new Error());

        await controller.handleGetProductsByType(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});
