import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, unique: true },
        image: { type: String, required: true }, // ảnh chính của sản phẩm
        // detailImages: { 
        //     type: [String], // Mảng các ảnh chi tiết, lưu trữ URL ảnh
        //     default: [] , required: true
        // },
        type: { type: String, required: true },
        price: { type: Number, required: true },
        countInStock: { type: Number, required: true },
        rating: { type: Number, required: true, default: 0 },
        description: { type: String, default: '' },
        discount: { type: Number, default: 0 }, // nếu không nhập thì mặc định là 0%
        sold: { type: Number, default: 0 }, // mặc định là 0
        category: { type: String, required: false }, // thêm loại sản phẩm, nếu cần
    },
    {
        timestamps: true
    }
);

const Product = mongoose.model("Product", productSchema);
module.exports = Product;
