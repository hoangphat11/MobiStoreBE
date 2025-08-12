import { Types } from 'mongoose';
import _ from 'lodash';
import Product from '../models/ProductModel';
import * as productService from '../services/productAPIService';

jest.mock('../models/ProductModel');
jest.mock('lodash');

describe('Product Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createNewProduct', () => {
    it('should return error if missing params', async () => {
      const res = await productService.createNewProduct({});
      expect(res.EC).toBe(1);
    });

    it('should return error if product name existed', async () => {
      Product.findOne.mockResolvedValueOnce({ name: 'ABC' });
      const res = await productService.createNewProduct({
        name: 'ABC', image: 'img', type: 't', price: 10, countInStock: 1, rating: 5
      });
      expect(res.EC).toBe(2);
    });

    it('should create successfully', async () => {
      Product.findOne.mockResolvedValueOnce(null);
      const mockSave = jest.fn().mockResolvedValue({});
      Product.mockImplementation(() => ({ save: mockSave }));
      const res = await productService.createNewProduct({
        name: 'ABC', image: 'img', type: 't', price: 10, countInStock: 1, rating: 5
      });
      expect(res.EC).toBe(0);
    });

    it('should handle exception', async () => {
      // Mock new Product để save() ném lỗi
      Product.mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(new Error('DB error')),
      }));

      const res = await productService.createNewProduct({
        name: 'ABC',
        image: 'img',
        type: 't',
        price: 10,
        countInStock: 1,
        rating: 5,
      });

      expect(res.EC).toBe(-2);
    });


    it('should return error if only some fields missing', async () => {
      const res = await productService.createNewProduct({
        name: 'OnlyName', price: 10
      });
      expect(res.EC).toBe(1);
    });
  });

  describe('getAllProducts', () => {
    it('should return success if products found', async () => {
      Product.find.mockResolvedValueOnce([{ name: 'p1' }]);
      const res = await productService.getAllProducts();
      expect(res.EC).toBe(0);
    });

    it('should return error if no products', async () => {
      Product.find.mockResolvedValueOnce([]);
      const res = await productService.getAllProducts();
      expect(res.EC).toBe(1);
    });

    it('should handle exception', async () => {
      Product.find.mockRejectedValueOnce(new Error('DB error'));
      const res = await productService.getAllProducts();
      expect(res.EC).toBe(-2);
    });
  });

  describe('getAllProductsPagination', () => {
    beforeEach(() => {
      Product.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([{ name: 'p1' }])
      });
    });

    it('should paginate with page and limit', async () => {
      Product.countDocuments.mockResolvedValueOnce(10);
      const res = await productService.getAllProductsPagination(1, 5);
      expect(res.EC).toBe(0);
    });

    it('should handle filter + field with page', async () => {
      Product.countDocuments.mockResolvedValueOnce(10);
      await productService.getAllProductsPagination(1, 5, null, 'name', 'abc');
      expect(Product.find).toHaveBeenCalledWith({ name: { '$regex': 'abc', '$options': 'i' } });
    });

    it('should handle sort + field with page', async () => {
      Product.countDocuments.mockResolvedValueOnce(10);
      await productService.getAllProductsPagination(1, 5, 'asc', 'name');
      expect(Product.find).toHaveBeenCalled();
    });

    it('should handle error with page', async () => {
      Product.countDocuments.mockRejectedValueOnce(new Error('DB error'));
      const res = await productService.getAllProductsPagination(1, 5);
      expect(res.EC).toBe(-2);
    });

    it('should work without page and limit', async () => {
      Product.countDocuments.mockResolvedValueOnce(5);
      const res = await productService.getAllProductsPagination(null, null);
      expect(res.EC).toBe(0);
    });

    it('should work without page but with sort', async () => {
      Product.countDocuments.mockResolvedValueOnce(5);
      const res = await productService.getAllProductsPagination(null, null, 'desc', 'price');
      expect(res.EC).toBe(0);
    });

    it('should return success with empty list if no products in pagination', async () => {
      // Mock countDocuments trả về 0 (không có sản phẩm)
      Product.countDocuments = jest.fn().mockResolvedValue(0);

      // Mock find trả về mảng rỗng
      Product.find = jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
        sort: jest.fn().mockReturnThis(),  // nếu có gọi sort
      });

      const res = await productService.getAllProductsPagination(1, 5);

      expect(res.EC).toBe(0);
      expect(res.DT.listProducts).toHaveLength(0);
    });



    it('should handle exception in getAllProductsPagination', async () => {
      Product.countDocuments.mockRejectedValueOnce(new Error('Count error'));
      const res = await productService.getAllProductsPagination(1, 5);
      expect(res.EC).toBe(-2);
    });
  });

  describe('getDetailProdById', () => {
    it('should return error if missing id', async () => {
      const res = await productService.getDetailProdById();
      expect(res.EC).toBe(1);
    });

    it('should return error if invalid id', async () => {
      jest.spyOn(Types.ObjectId, 'isValid').mockReturnValueOnce(false);
      const res = await productService.getDetailProdById('123');
      expect(res.EC).toBe(1);
    });

    it('should return product if found', async () => {
      jest.spyOn(Types.ObjectId, 'isValid').mockReturnValueOnce(true);
      Product.findOne.mockResolvedValueOnce({ name: 'p1' });
      const res = await productService.getDetailProdById('validId');
      expect(res.EC).toBe(0);
    });

    it('should return not found', async () => {
      jest.spyOn(Types.ObjectId, 'isValid').mockReturnValueOnce(true);
      Product.findOne.mockResolvedValueOnce(null);
      const res = await productService.getDetailProdById('validId');
      expect(res.EC).toBe(-1);
    });

    it('should handle error', async () => {
      jest.spyOn(Types.ObjectId, 'isValid').mockReturnValueOnce(true);
      Product.findOne.mockRejectedValueOnce(new Error('err'));
      const res = await productService.getDetailProdById('validId');
      expect(res.EC).toBe(-2);
    });
  });

  describe('updateProduct', () => {
    it('should return error if missing id', async () => {
      const res = await productService.updateProduct({ data: {} });
      expect(res.EC).toBe(1);
    });

    it('should return error if invalid id', async () => {
      jest.spyOn(Types.ObjectId, 'isValid').mockReturnValueOnce(false);
      const res = await productService.updateProduct({ id: 'bad', data: {} });
      expect(res.EC).toBe(1);
    });

    // Bổ sung test trường hợp data rỗng
    // it('should return error if data is empty object', async () => {
    //   jest.spyOn(Types.ObjectId, 'isValid').mockReturnValueOnce(true);
    //   const res = await productService.updateProduct({ id: 'validId', data: {} });
    //   expect(res.EC).toBe(1);
    // });

    it('should return error if name existed', async () => {
      jest.spyOn(Types.ObjectId, 'isValid').mockReturnValueOnce(true);
      Product.findOne.mockResolvedValueOnce({ name: 'dup' });
      const res = await productService.updateProduct({ id: 'id', data: { name: 'dup' } });
      expect(res.EC).toBe(2);
    });

    it('should update success', async () => {
      jest.spyOn(Types.ObjectId, 'isValid').mockReturnValueOnce(true);
      Product.findOne.mockResolvedValueOnce(null);
      Product.findByIdAndUpdate.mockResolvedValueOnce({ name: 'updated' });
      const res = await productService.updateProduct({ id: 'id', data: { name: 'n' } });
      expect(res.EC).toBe(0);
    });

    it('should update when no name provided', async () => {
      jest.spyOn(Types.ObjectId, 'isValid').mockReturnValueOnce(true);
      Product.findByIdAndUpdate.mockResolvedValueOnce({ name: 'updated' });
      const res = await productService.updateProduct({ id: 'id', data: { price: 100 } });
      expect(res.EC).toBe(0);
    });

    it('should return not found', async () => {
      jest.spyOn(Types.ObjectId, 'isValid').mockReturnValueOnce(true);
      Product.findOne.mockResolvedValueOnce(null);
      Product.findByIdAndUpdate.mockResolvedValueOnce(null);
      const res = await productService.updateProduct({ id: 'id', data: { name: 'n' } });
      expect(res.EC).toBe(-1);
    });

    it('should handle error', async () => {
      jest.spyOn(Types.ObjectId, 'isValid').mockReturnValueOnce(true);
      // Mock checkProdNameExisted không lỗi, trả về false (tên không trùng)
      productService.checkProdNameExisted = jest.fn().mockResolvedValue(false);

      // Mock findByIdAndUpdate ném lỗi để test catch
      Product.findByIdAndUpdate.mockRejectedValueOnce(new Error('err'));

      const res = await productService.updateProduct({ id: 'id', data: { name: 'n' } });
      expect(res.EC).toBe(-2);
    });

  });

  describe('deleteProduct', () => {
    it('should return error if missing id', async () => {
      const res = await productService.deleteProduct();
      expect(res.EC).toBe(1);
    });

    it('should return error if invalid id', async () => {
      jest.spyOn(Types.ObjectId, 'isValid').mockReturnValueOnce(false);
      const res = await productService.deleteProduct('bad');
      expect(res.EC).toBe(1);
    });

    it('should delete success', async () => {
      jest.spyOn(Types.ObjectId, 'isValid').mockReturnValueOnce(true);
      Product.findByIdAndDelete.mockResolvedValueOnce({});
      const res = await productService.deleteProduct('id');
      expect(res.EC).toBe(0);
    });

    it('should return not found', async () => {
      jest.spyOn(Types.ObjectId, 'isValid').mockReturnValueOnce(true);
      Product.findByIdAndDelete.mockResolvedValueOnce(null);
      const res = await productService.deleteProduct('id');
      expect(res.EC).toBe(-1);
    });

    // Bổ sung test xử lý exception trong deleteProduct
    it('should handle error if findByIdAndDelete throws', async () => {
      jest.spyOn(Types.ObjectId, 'isValid').mockReturnValueOnce(true);
      Product.findByIdAndDelete.mockRejectedValueOnce(new Error('Delete fail'));
      const res = await productService.deleteProduct('validId');
      expect(res.EC).toBe(-2);
    });
  });

  describe('deleteManyProduct', () => {
    it('should return error if arr empty', async () => {
      _.isEmpty.mockReturnValueOnce(true);
      const res = await productService.deleteManyProduct([]);
      expect(res.EC).toBe(1);
    });

    it('should return error if invalid id', async () => {
      _.isEmpty.mockReturnValueOnce(false);
      jest.spyOn(Types.ObjectId, 'isValid').mockReturnValueOnce(false);
      const res = await productService.deleteManyProduct(['bad']);
      expect(res.EC).toBe(1);
    });

    it('should delete success', async () => {
      _.isEmpty.mockReturnValueOnce(false);
      jest.spyOn(Types.ObjectId, 'isValid').mockReturnValue(true);
      Product.deleteMany.mockResolvedValueOnce({ deletedCount: 2 });
      const res = await productService.deleteManyProduct(['id']);
      expect(res.EC).toBe(0);
    });

    it('should return not found', async () => {
      _.isEmpty.mockReturnValueOnce(false);
      jest.spyOn(Types.ObjectId, 'isValid').mockReturnValue(true);
      Product.deleteMany.mockResolvedValueOnce({ deletedCount: 0 });
      const res = await productService.deleteManyProduct(['id']);
      expect(res.EC).toBe(-1);
    });

    it('should handle error', async () => {
      _.isEmpty.mockReturnValueOnce(false);
      jest.spyOn(Types.ObjectId, 'isValid').mockReturnValue(true);
      Product.deleteMany.mockRejectedValueOnce(new Error('err'));
      const res = await productService.deleteManyProduct(['id']);
      expect(res.EC).toBe(-2);
    });
  });

  describe('getTypesProduct', () => {
    it('should return types', async () => {
      Product.distinct.mockResolvedValueOnce(['a', 'b']);
      const res = await productService.getTypesProduct();
      expect(res.EC).toBe(0);
    });

    it('should return empty', async () => {
      Product.distinct.mockResolvedValueOnce([]);
      const res = await productService.getTypesProduct();
      expect(res.EC).toBe(1);
    });

    it('should handle error', async () => {
      Product.distinct.mockRejectedValueOnce(new Error('err'));
      const res = await productService.getTypesProduct();
      expect(res.EC).toBe(-2);
    });
  });

  describe('getProductsByType', () => {
    it('should return error if missing type', async () => {
      const res = await productService.getProductsByType(null, 5, null, null);
      expect(res.EC).toBe(1);
    });

    it('should return success without pagination', async () => {
      const leanMock = jest.fn().mockResolvedValue([{ name: 'p1', type: 'abc' }]);
      Product.find.mockReturnValue({ lean: leanMock }); // mock Product.find trả về object có hàm lean()

      const res = await productService.getProductsByType(null, null, null, 'abc');

      expect(res.EC).toBe(0);
      expect(res.DT).toHaveLength(1);
      expect(res.DT[0].name).toBe('p1');
    });


    it('should return success with pagination', async () => {
      Product.countDocuments.mockResolvedValueOnce(1);
      Product.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([{ name: 'p1' }])
      });
      const res = await productService.getProductsByType(1, 5, 'asc', 'abc');
      expect(res.EC).toBe(0);
    });

    it('should return success with sort desc', async () => {
      Product.countDocuments.mockResolvedValueOnce(1);
      Product.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([{ name: 'p1' }])
      });
      const res = await productService.getProductsByType(1, 5, 'desc', 'abc');
      expect(res.EC).toBe(0);
    });

    it('should return not found if no products', async () => {
      // Mock Product.find().lean() trả về mảng rỗng, nghĩa là không tìm thấy sản phẩm
      const leanMock = jest.fn().mockResolvedValue([]);
      Product.find.mockReturnValue({ lean: leanMock });

      const res = await productService.getProductsByType(1, 5, 'asc', 'abc');
      expect(res.EC).toBe(-1);
      expect(res.DT).toEqual([]);
    });


    it('should handle error', async () => {
      // Mock Product.find().lean() ném lỗi để bắt exception
      Product.find.mockReturnValue({
        lean: jest.fn().mockRejectedValueOnce(new Error('err'))
      });

      const res = await productService.getProductsByType(1, 5, 'asc', 'abc');
      expect(res.EC).toBe(-2);
    });

  });
});
