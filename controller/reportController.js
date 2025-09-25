const mongoose = require('mongoose')
const OrderDB = require("../model/orderModel");
const exceljs = require('exceljs');
const pdf = require('html-pdf');
const fs = require('fs');
const path = require('path');
const ejs = require('ejs');
const getPastDays = require('../helperfunctions/getPastDays');

const createReport = async (req, res) => {
    try {
        const {sDate,eDate} = req.query;

         console.log(new Date(sDate),new Date(eDate));
        const workbook = new exceljs.Workbook();
        const worksheet = workbook.addWorksheet("Orders");
        
        worksheet.columns = [
            { header: "Si.No", key: 'si_no' , width: 10,alignment:"center"},
            { header: "Order Id", key: 'orderId' , width: 30},
            { header: "Billing Name", key: 'billingName' , width: 20},
            { header: "Billing Address", key: 'billingAddress' , width: 20},
            { header: "Product Name", key: 'productName' , width: 30},
            { header: "Product Status", key: 'productStatus' , width: 20},
            { header: "Payment Method", key: 'paymentMethod', width: 20 },
            { header: "Order Date", key: 'orderDate' , width: 20},
            { header: "Product Quandity", key: 'productQuandity' , width: 20},
            { header: "Product Price", key: 'productPrice' , width: 20},
            { header: "Discount Amount", key: 'discountAmount' , width: 20},
            { header: "Product Total", key: 'productTotal' , width: 20},
        ];
        worksheet.columns.forEach(col => {
        col.alignment = { horizontal: 'center', vertical: 'middle' };
        });

        // const orderData = await OrderDB.find({$and:[{createdAt:{$lte:eDate}},{createdAt:{$gte:sDate}}]}).populate('userId').populate('products.productId');
        const orderData = await OrderDB.aggregate([
            {$unwind:"$products"},
            {$match : {$and:[{createdAt:{$gte:new Date(sDate)}},{createdAt:{$lte:new Date(eDate)}},{"products.productStatus":{$in:["pending","Delivered","returnPending"]}} ]} },
            {$lookup:{
                from:"users",
                localField:"userId",
                foreignField:"_id",
                as:"userId"
            }},
            {$unwind:"$userId"},
            {$lookup:{
                from:"products",
                localField:"products.productId",
                foreignField:"_id",
                as:"products.productId"
            }},
            {$unwind:"$products.productId"},
            {
                $sort:{createdAt:-1}
            }
        ]); 
        let total = 0;
        let discount = 0;
        orderData.forEach((order,i) => {
                total+=order.products.productTotal 
                discount+=order.couponOfferPrice;
                order.si_no = i+1;
                order.orderId = order._id;
                order.billingName = `${order.products.deliveryAddress.fname} ${order.products.deliveryAddress.lname}`;
                order.billingAddress = order.products.deliveryAddress.address;
                order.productName = order.products.productId.name;
                order.productStatus = order.products.productStatus;
                order.paymentMethod = order.products.paymentMethod;
                order.orderDate = order.createdAt;
                order.productQuandity = order.products.quandity
                order.productPrice = order.products.productId.Price;
                order.discountAmount = order.couponOfferPrice;
                order.productTotal = order.products.productTotal - order.couponOfferPrice;
                worksheet.addRow(order);
        });

        worksheet.addRow({
            discountAmount:"Total",
            productTotal:total,
        });
        worksheet.addRow({
            discountAmount:"Discount",
            productTotal:discount,
        });
        worksheet.addRow({
            discountAmount:"Grand Total",
            productTotal:total-discount,
        });
       
        worksheet.getRow(1).eachCell((cell) => {
            cell.font = { bold: true }; 
        });

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheatml.sheet"
        );
        res.setHeader("Content-Disposition", `attachment;filename=orders.xlsx`);

        return workbook.xlsx.write(res).then(() => {
            res.status(200);
        })

    } catch (error) {
        console.log(error.message);
    }
}

const createReportPdf = async (req, res) => {
    try {

        const {sDate,eDate} = req.query;
        // const orderData = await OrderDB.find({$and:[{createdAt:{$lte:eDate}},{createdAt:{$gte:sDate}}]}).populate('userId').populate('products.productId');
        const orderData = await OrderDB.aggregate([
            {$unwind:"$products"},
            {$match : {$and:[{createdAt:{$gte:new Date(sDate)}},{createdAt:{$lte:new Date(eDate)}},{"products.productStatus":{$in:["pending","Delivered","returnPending"]}} ]} },
            {$lookup:{
                from:"users",
                localField:"userId",
                foreignField:"_id",
                as:"userId"
            }},
            {$unwind:"$userId"},
            {$lookup:{
                from:"products",
                localField:"products.productId",
                foreignField:"_id",
                as:"products.productId"
            }},
            {$unwind:"$products.productId"},
            {
                $sort:{createdAt:-1}
            }
        ]); 
        const data = {
            orderData: orderData,
            start:sDate,
            end:eDate,
        };
        const filepathname = path.resolve(__dirname, '../views/admin/topdf.ejs');
        const htmlString = fs.readFileSync(filepathname).toString();
        let options = {
            format: 'A3',
            orientation: "portrait",
            border: "10mm"
        };

        const ejsData = ejs.render(htmlString, data);
        pdf.create(ejsData, options).toFile('topdf.pdf', (err, response) => {
            if (err) console.log(err);

            const filePath = path.resolve(__dirname, '../topdf.pdf');

            fs.readFile(filePath, (err, file) => {
                if (err) {
                    console.log(err);
                    return res.status(500).send('could not doenload the file')
                }

                res.setHeader('Content-type', 'application/pdf')
                res.setHeader('Content-Disposition', 'attachment;filename="topdf.pdf"');

                res.send(file)
            })
        })
    } catch (error) {
        console.log(error.message);
    }
}

const orderReport = async(req,res)=>{
   try {

    const eDate = new Date();
    const sDate = new Date(eDate.getFullYear(),0,1);
    const orderData = await OrderDB.aggregate([
        {$unwind:"$products"},
        {$match : {$and:[{createdAt:{$gte:new Date(sDate)}},{createdAt:{$lte:new Date(eDate)}},{"products.productStatus":{$in:["pending","Delivered","returnPending"]}} ]} },
        {$lookup:{
            from:"users",
            localField:"userId",
            foreignField:"_id",
            as:"userId"
        }},
        {$unwind:"$userId"},
        {$lookup:{
            from:"products",
            localField:"products.productId",
            foreignField:"_id",
            as:"products.productId"
        }},
        {$unwind:"$products.productId"},
        {
            $sort:{createdAt:-1}
        }
    ])
    res.render("orderReport",{orderData,eDate,sDate})
} catch (error) {
    console.log(error.message);
   }
}
const dateChange = async(req,res)=>{
   try {
    const {eDate,sDate}  = req.query;
    if(new Date(eDate) < new Date(sDate) ){
        return res.json({success:false,message:"Invalid Date Period!."})
    }
    const orderData = await OrderDB.aggregate([
        {$unwind:"$products"},
        {$match : {$and:[{createdAt:{$lte:new Date(eDate)}},{createdAt:{$gte:new Date(sDate)}},{"products.productStatus":{$in:["pending","Delivered","returnPending"]}} ]} },
        {$lookup:{
            from:"users",
            localField:"userId",
            foreignField:"_id",
            as:"userId"
        }},
        {$unwind:"$userId"},
        {$lookup:{
            from:"products",
            localField:"products.productId",
            foreignField:"_id",
            as:"products.productId"
        }},
        {$unwind:"$products.productId"},
        {
            $sort:{createdAt:-1}
        }
    ])
    return res.json({success:true,orderData})
    
} catch (error) {
    console.log(error.message);
   }
}




module.exports = {
    createReportPdf,
    createReport,
    orderReport,
    dateChange,
}