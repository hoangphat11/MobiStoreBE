import orderAPIService from '../services/orderAPIService';

const handleGetAllOrders = async (req, res) => {
    try {
        const data = await orderAPIService.getAllOrders();
        return res.status(200).json({
            EM: data.EM,
            EC: data.EC,
            DT: data.DT,
        });
    } catch (error) {
        console.log('>>> check error from handleGetAllOrders():', error);
        return res.status(500).json({
            EM: 'error from server',
            EC: -1, 
            DT: '',
        });
    }
};

const handleCreateNewOrder = async (req, res) => {
    try {
        const data = await orderAPIService.createNewOrder(req.body);
        return res.status(200).json({
            EM: data.EM,
            EC: data.EC,
            DT: data.DT,
        });
    } catch (error) {
        console.log('>>> error from handleCreateNewOrder():', error);
        return res.status(500).json({
            EM: 'error from server',
            EC: -1,
            DT: '',
        });
    }
};

const handleGetOrdersByUserId = async (req, res) => {
    try {
        const data = await orderAPIService.getOrdersByUserId(req.params.id);
        return res.status(200).json({
            EM: data.EM,
            EC: data.EC,
            DT: data.DT,
        });
    } catch (error) {
        console.log('>>> error from handleGetOrdersByUserId():', error);
        return res.status(500).json({
            EM: 'error from server',
            EC: -1,
            DT: '',
        });
    }
};

const handleGetDetailOrder = async (req, res) => {
    try {
        const data = await orderAPIService.getDetailOrder(req.params.orderId, req.query.id);
        return res.status(200).json({
            EM: data.EM,
            EC: data.EC,
            DT: data.DT,
        });
    } catch (error) {
        console.log('>>> check error from handleGetDetailOrder():', error);
        return res.status(500).json({
            EM: 'error from server',
            EC: -1,
            DT: '',
        });
    }
};

const handleDeleteOrder = async (req, res) => {
    try {
        const data = await orderAPIService.deleteOrder(req.params.orderId, req.query.id);
        return res.status(200).json({
            EM: data.EM,
            EC: data.EC,
            DT: data.DT,
        });
    } catch (error) {
        console.log('>>> check error from handleDeleteOrder():', error);
        return res.status(500).json({
            EM: 'error from server',    
            EC: -1,
            DT: '',
        });
    }
};
// cập nhật trạng thái đơn hàng
const handleUpdateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { orderStatus } = req.body;
        const userId = req.query.id;

        if (!orderId || !orderStatus || !userId) {
            return res.status(400).json({
                EM: 'Missing required parameters: orderId, orderStatus or userId',
                EC: 1,
                DT: '',
            });
        }

        const data = await orderAPIService.updateOrderStatus(orderId, orderStatus, userId);

        return res.status(200).json({
            EM: data.EM,
            EC: data.EC,
            DT: data.DT,
        });
    } catch (error) {
        console.log('>>> check error from handleUpdateOrderStatus():', error);
        return res.status(500).json({
            EM: 'error from server',
            EC: -1,
            DT: '',
        });
    }
};

module.exports = {
    handleGetAllOrders,
    handleCreateNewOrder,
    handleGetOrdersByUserId,
    handleGetDetailOrder,
    handleDeleteOrder,
    handleUpdateOrderStatus,
};
