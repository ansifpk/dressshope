const mongoose = require('mongoose')
const OrderDB = require("../model/orderModel")


const viewOrders = async (req, res) => {
    try {
        const id = req.query.id
        const data = await OrderDB.findById({ _id: id }).populate('userId').populate('products.productId')

        console.log(data.products.length)
        res.render('viewOrders', { orderData: data })
    } catch (error) {
        console.log(error.message);
    }
}


const ordersList = async (req, res) => {
    try {
        var search = req.query.search || ""
        if (req.query.search) {
            search = req.query.search
        }
        const data = await OrderDB.find({
            $or: [
                { 'products.paymentStatus': { $regex: '.*' + search + '.*', $options: 'i' } },
                { "products.deliveryAddress.fname": { $regex: '.*' + search + '.*', $options: 'i' } },
                { "products.deliveryAddress.lname": { $regex: '.*' + search + '.*', $options: 'i' } },
                { "products.deliveryAddress.address": { $regex: '.*' + search + '.*', $options: 'i' } },
                { "products.deliveryAddress.city": { $regex: '.*' + search + '.*', $options: 'i' } },
                { "products.deliveryAddress.state": { $regex: '.*' + search + '.*', $options: 'i' } },
                { "products.deliveryAddress.country": { $regex: '.*' + search + '.*', $options: 'i' } },
                { "products.deliveryAddress.email": { $regex: '.*' + search + '.*', $options: 'i' } }
            ]
        }).populate('userId');
        res.render('orders', { orderData: data });
    } catch (error) {
        console.log(error.message);
    }
}


const orderDetailes = async (req, res) => {
    try {
        const id = req.query.id
        const productId = req.query.productId

        const Data = await OrderDB.findById({ _id: id }).populate('userId').populate('products.productId');
        const product = Data.products.find((p) => {
            return p._id.equals(productId)
        })

        res.render('orderDetailes', { orderData: Data, productData: product });
    } catch (error) {
        console.log(error.message);
    }
}


const editOrders = async (req, res) => {
    try {
        res.render('');
    } catch (error) {
        console.log(error.message);
    }
}
const cancelOrder = async (req, res) => {
    try {

        const { orderId } = req.query;
        const data = await OrderDB.findOne({ 'products._id': orderId }).populate('userId').populate('products.productId')
        const product = data.products.find((p) => {
            return p._id.equals(orderId)
        });
        product.productStatus = "canceled";
        await data.save()

    } catch (error) {
        console.log(error.message);
    }
}

const orderStatus = async (req, res) => {
    try {

        const { changeStatus, productId } = req.query;

        const data = await OrderDB.findOne({ 'products._id': productId }).populate('userId').populate('products.productId')
        const order = data.products.find((p) => {
            return p._id.equals(productId)
        });



        const product = await ProductDb.findOne({ _id: order.productId._id }).populate("categoryID");
        if (changeStatus == "Delivered") {
            order.productStatus = changeStatus;
            product.orderCount++;
            await data.save();
            await product.save();
            const category = await CategoryDb.find({});
            const checkCategory = category.find((value) => {
                return value.name == product.categoryID.name
            });
            checkCategory.orderCount++;
            await checkCategory.save();

        } else {
            order.productStatus = changeStatus
            await data.save();

        }


    } catch (error) {
        console.log(error.message);
    }
}


module.exports={
    viewOrders,
    ordersList,
    orderDetailes,
    editOrders,
    cancelOrder,
    orderStatus,
}