

import jwt from "jsonwebtoken";
import User from "../models/UserModel.js";
require('dotenv').config();

export const authPermissionMiddleware = (req, res, next) => {
    try {
        if (!req?.headers?.authorization)
            return res.status(200).json({
                EM: 'Empty bearer token!',
                EC: 1,
                DT: '',
            });
        const decoded = jwt.verify(req.headers.authorization.split(' ')[1], process.env.JWT_ACCESS_TOKEN_SECRET);
        if (decoded) {
            if (!decoded?.isAdmin)
                return res.status(500).json({
                    EM: 'You dont have permission !',
                    EC: -1,
                    DT: '',
                });
            else
                next();
        }
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            EM: err.message,
            EC: -999,
            DT: '',
        })
    }
};

export const authUserMiddleware = (req, res, next) => {
    try {
        if (!req?.headers?.authorization)
            return res.status(200).json({
                EM: 'Empty bearer token!',
                EC: 1,
                DT: '',
            });
        const decoded = jwt.verify(req.headers.authorization.split(' ')[1], process.env.JWT_ACCESS_TOKEN_SECRET);
        if (decoded) {

             req.user = decoded; // gán user cho req

            if (decoded?.isAdmin || decoded?._id === req.params.id || decoded?._id === req.body.id || decoded?._id === req.query.id)
                next();
            else {
                return res.status(500).json({
                    EM: 'You dont have permission !',
                    EC: -1,
                    DT: '',
                });
            }
        }
    } catch (err) {
        return res.status(500).json({
            EM: err.message,
            EC: -999,
            DT: '',
        })
    }
};

// export const authUser = (req, res, next) => {
//     const authHeader = req.headers.authorization;
//     if (!authHeader || !authHeader.startsWith("Bearer ")) {
//         return res.status(401).json({ EM: "No token provided", EC: 1, DT: null });
//     }

//     const token = authHeader.split(" ")[1];
//     try {
//         const decoded = jwt.verify(token, process.env.JWT_ACCESS_TOKEN_SECRET);
//         if (!decoded._id) return res.status(401).json({ EM: "Token invalid, no userId", EC: 1, DT: null });
//         req.user = decoded; // đảm bảo có _id
//         next();
//     } catch (error) {
//         return res.status(401).json({ EM: "Invalid token", EC: 1, DT: null });
//     }
// };

