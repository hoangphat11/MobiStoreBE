// src/test/productAPIService.test.js
import Product from '../models/ProductModel';
import * as productService from '../services/productAPIService';

// Mock toàn bộ Product model
jest.mock('../models/ProductModel');

describe('productAPIService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('getAllProducts - có sản phẩm', async () => {
        const mockProducts = [
            { name: 'iPhone 15', price: 1000 },
            { name: 'Samsung S24', price: 900 }
        ];
        Product.find.mockResolvedValue(mockProducts);

        const res = await productService.getAllProducts();

        expect(res.EC).toBe(0);
        expect(res.DT).toEqual(mockProducts);
        expect(Product.find).toHaveBeenCalledWith({}, '-createdAt -updatedAt -__v');
    });

    test('getAllProducts - không có sản phẩm', async () => {
        Product.find.mockResolvedValue([]);

        const res = await productService.getAllProducts();

        expect(res.EC).toBe(1);
        expect(res.DT).toEqual([]);
    });

    test('createNewProduct - thiếu params', async () => {
        const res = await productService.createNewProduct({});
        expect(res.EC).toBe(1);
        expect(res.EM).toMatch(/Missing required params/);
    });

    test('createNewProduct - tên sản phẩm trùng', async () => {
        // Giả lập findOne trả về product => tên trùng
        Product.findOne.mockResolvedValue({ name: 'iPhone 15' });

        const data = {
            name: 'iPhone 15',
            image: 'img.jpg',
            type: 'phone',
            price: 1000,
            countInStock: 10,
            rating: 5
        };
        const res = await productService.createNewProduct(data);

        expect(res.EC).toBe(2);
        expect(res.EM).toMatch(/already existed/);
    });

    test('getDetailProdById - id không hợp lệ', async () => {
        const res = await productService.getDetailProdById('invalid-id');
        expect(res.EC).toBe(1);
        expect(res.EM).toMatch(/Invalid ID format/);
    });

    test('deleteProduct - thành công', async () => {
        Product.findByIdAndDelete.mockResolvedValue({ _id: 'abc123' });

        const res = await productService.deleteProduct('507f1f77bcf86cd799439011');

        expect(res.EC).toBe(0);
        expect(res.EM).toMatch(/Delete successfully/);
    });

    test('deleteProduct - không tìm thấy', async () => {
        Product.findByIdAndDelete.mockResolvedValue(null);

        const res = await productService.deleteProduct('507f1f77bcf86cd799439011');

        expect(res.EC).toBe(-1);
        expect(res.EM).toMatch(/not existed/);
    });
});
