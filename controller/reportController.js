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
        const workbook = new exceljs.Workbook();
        const worksheet = workbook.addWorksheet("Orders");
        
        worksheet.columns = [
            { header: "S no.", key: 's_no' , width: 10},
            { header: "Order Id", key: 'orderId' , width: 30},
            { header: "User Name", key: 'usersname' , width: 20},
            { header: "Order Address", key: 'orderAddress' , width: 20},
            { header: "Total Products", key: 'totalProducts' , width: 20},
            { header: "Product Total", key: 'productTotal' , width: 20},
            { header: "Discount Amount", key: 'discountAmount' , width: 20},
            { header: "Payment Status", key: 'paymentStatus', width: 20 },
            { header: "Product Status", key: 'orderStatus', width: 20 },
            { header: "Payment Method", key: 'paymentMethod', width: 20 },
            { header: "Order Date", key: 'orderDate' , width: 20},
        ];

        const orderData = await OrderDB.find({$and:[{createdAt:{$lte:eDate}},{createdAt:{$gte:sDate}}]}).populate('userId').populate('products.productId');

        orderData.forEach((order,i) => {
                const total = order.products.reduce((acc,cur)=>acc+=cur.productTotal,0)
                order.s_no = i+1;
                order.orderId = order._id;
                order.usersname = `${order.products[0].deliveryAddress.fname} ${order.products[0].deliveryAddress.lname}`;
                order.orderAddress = order.products[0].deliveryAddress.address;
                order.totalProducts = order.products.length;
                order.productTotal = total;
                order.discountAmount = order.couponOfferPrice;
                order.paymentStatus = order.products[0].paymentStatus;
                order.orderStatus = order.products[0].productStatus;
                order.paymentMethod = order.paymentMethod ;
                order.orderDate = order.createdAt ;
                worksheet.addRow(order);
        

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
        const orderData = await OrderDB.find({$and:[{createdAt:{$lte:eDate}},{createdAt:{$gte:sDate}}]}).populate('userId').populate('products.productId');

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

    const today = new Date();
    const orderData = await OrderDB.find({createdAt:{$eq:new Date(today)}}).populate("userId").populate({path:"products.productId",populate:{path:"categoryID"}})

    res.render("orderReport",{orderData,today})
    return;
    
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
    
    const orderData = await OrderDB.find({$and:[{createdAt:{$lte:(eDate)}},{createdAt:{$gte:sDate}}]}).populate("userId").populate({path:"products.productId",populate:{path:"categoryID"}})
    res.json({success:true,orderData})
    return;

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