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
        const {endYearly,startYearly,startWeekly,endWeekly,startMonth,endMonth} = req.query;
        const workbook = new exceljs.Workbook();
        const worksheet = workbook.addWorksheet("Orders");
        
        let start ;
        let end ;
        if(endWeekly&&startWeekly){
            const pastDays = getPastDays(new Date(endWeekly), 7);
             start = pastDays[0]
             end = pastDays[pastDays.length-1]
        }else if(startMonth&&endMonth){
            const pastDays = getPastDays(new Date(endMonth), 31);
            start = pastDays[0]
            end = pastDays[pastDays.length-1]
           
        }else if(startYearly&&endYearly){
            
            start = startYearly
            end = endYearly
            
        }
        worksheet.columns = [
            { header: "S no.", key: 's_no' , width: 20},
            { header: "User Name", key: 'usersname' , width: 20},
            { header: "Product Name", key: 'productsname' , width: 20},
            { header: "Order Date", key: 'orderDate' , width: 20},
            { header: "Product Status", key: 'orderStatus', width: 20 },
            { header: "Actual Price", key: 'actualprice' , width: 20},
            { header: "Product Price", key: 'productprice', width: 20 },
            { header: "Product Quandity", key: 'productQuandity', width: 20 },
            { header: "Offer Price", key: 'offerPrice' , width: 20},
            { header: "Total", key: 'total', width: 20 },
        ];

        let counter = 1;
        const orderData = await OrderDB.find({ }).populate('userId').populate('products.productId');
     
         let array = []
        for(let i=0;i<orderData.length;i++){
            for(let j=0;j<orderData[i].products.length;j++){
                if(new Date(orderData[i].products[j].orderDate).toISOString().split("T")[0] >=new Date(start).toISOString().split("T")[0] && new Date(orderData[i].products[j].orderDate).toISOString().split("T")[0] <=new Date(end).toISOString().split("T")[0] ){
                  array.push(orderData[i].products[j])
                }
            }
        }

        array.forEach((order) => {
            
                order.s_no = counter;
                counter++;
                order.usersname = `${order.deliveryAddress.fname} ${order.deliveryAddress.lname}`;
                order.productsname = order.productId.name;
                order.orderStatus = order.productStatus;
                order.orderDate = order.orderDate ;
                order.productprice = Math.ceil(order.productTotal/order.quandity);
                order.actualprice = order.productId.Price
                order.productQuandity = order.quandity;
                if (order.productId.Price == Math.ceil(order.productTotal / order.quandity)) {
                    order.offerPrice = 0;   
                } else {
                   order.offerPrice = order.productId.Price -  Math.ceil(order.productTotal / order.quandity)
                }
                order.total = order.productTotal*order.quandity;
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

        const {endYearly,startYearly,startWeekly,endWeekly,startMonth,endMonth} = req.query;
        let orderData = await OrderDB.find({}).populate('userId').populate('products.productId');
         console.log(req.query)
       
        
        const currentDate = new Date()

        let start ;
        let end ;
        if(endWeekly&&startWeekly){
            const pastDays = getPastDays(new Date(endWeekly), 7);
             start = pastDays[0]
             end = pastDays[pastDays.length-1]
        }else if(startMonth&&endMonth){
            const pastDays = getPastDays(new Date(endMonth), 31);
            start = pastDays[0]
            end = pastDays[pastDays.length-1]
        }else if(startYearly&&endYearly){
            start = startYearly
            end = endYearly
        }
        let array = []
        for(let i=0;i<orderData.length;i++){
            for(let j=0;j<orderData[i].products.length;j++){
                if(new Date(orderData[i].products[j].orderDate).toISOString().split("T")[0] >=new Date(start).toISOString().split("T")[0] && new Date(orderData[i].products[j].orderDate).toISOString().split("T")[0] <=new Date(end).toISOString().split("T")[0] ){
                  array.push(orderData[i].products[j])
                }
            }
        }
       
        const data = {
            orderData: array,
            start:start,
            end:end,
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

const weaklyReport = async(req,res)=>{
   try {

    const today = new Date()
    const pastDays = getPastDays(today, 7);
   
    const start = pastDays[0]
    const end = pastDays[pastDays.length-1]
    const orderData = await OrderDB.find({}).populate("userId").populate({path:"products.productId",populate:{path:"categoryID"}})

     const array =[];
        for(let i=0;i<orderData.length;i++){
            for(let j=0;j<orderData[i].products.length;j++){
                if(new Date(orderData[i].products[j].orderDate).toISOString().split("T")[0] >=new Date(start).toISOString().split("T")[0] && new Date(orderData[i].products[j].orderDate).toISOString().split("T")[0] <=new Date(end).toISOString().split("T")[0] ){
                    array.push(orderData[i].products[j])
                }
            }
        }
   
        res.render("weeklyReport",{orderData,start,end,array,today})
    return;
    
} catch (error) {
    console.log(error.message);
   }
}
const dateChange = async(req,res)=>{
   try {

  
    const {eDate,type,sDate,year}  = req.query;
 
    console.log(req.query)
     let end;
     let start;

     

    switch (type) {
        case "monthly":
             start =sDate
             end = eDate
            break;
        case "yearly":
             start =`${year}-01-01` ;
             end = `${year}-12-30`;
            break;
    
        default:
             const pastDays = getPastDays(new Date(eDate), 7);
             start = pastDays[0]
             end = pastDays[pastDays.length-1];
            
            break;
    }

    const orderData = await OrderDB.find({}).populate("userId").populate({path:"products.productId",populate:{path:"categoryID"}})

     const array =[];
        for(let i=0;i<orderData.length;i++){
            for(let j=0;j<orderData[i].products.length;j++){
                if(new Date(orderData[i].products[j].orderDate).toISOString().split("T")[0] >=new Date(start).toISOString().split("T")[0] && new Date(orderData[i].products[j].orderDate).toISOString().split("T")[0] <=new Date(end).toISOString().split("T")[0] ){
                    array.push(orderData[i].products[j])
                }
            }
        }

    

        res.json({start,end,array})
   
    return;
    
} catch (error) {
    console.log(error.message);
   }
}

const monthlyReport = async(req,res)=>{
    try {
        const orderData = await OrderDB.find({}).populate("userId").populate({path:"products.productId",populate:{path:"categoryID"}})
        const {sDate,eDate} = req.query;
        const today = new Date()
        const pastDays = getPastDays(today, 31);
        const array = [];
        const start = pastDays[0]
        const end = pastDays[pastDays.length-1]

         for(let i=0;i<orderData.length;i++){
            for(let j=0;j<orderData[i].products.length;j++){
                if(new Date(orderData[i].products[j].orderDate).toISOString().split("T")[0] >=new Date(start).toISOString().split("T")[0] && new Date(orderData[i].products[j].orderDate).toISOString().split("T")[0] <=new Date(end).toISOString().split("T")[0] ){
                    array.push(orderData[i].products[j])
                }
            }
        }

         res.render("monthlyReport",{array,start,end})

      
       
    } catch (error) {
        console.log(error.message);
    }
}

const yearlyReport = async(req,res)=>{
    try {
        const {year} = req.query;

        const today = new Date()

            const currentYear =today.getFullYear()
            const start =`${currentYear}-01-01` ;
            const end = `${currentYear}-12-30`;
            const orderData = await OrderDB.find({}).populate("userId").populate({path:"products.productId",populate:{path:"categoryID"}})
            let array =[];

        for(let i=0;i<orderData.length;i++){
            for(let j=0;j<orderData[i].products.length;j++){
                if(new Date(orderData[i].products[j].orderDate).toISOString().split("T")[0] >=new Date(start).toISOString().split("T")[0] && new Date(orderData[i].products[j].orderDate).toISOString().split("T")[0] <=new Date(end).toISOString().split("T")[0] ){
                    array.push(orderData[i].products[j])
                }
            }
        }

        res.render("yearlyReport",{array,start,end,currentYear})
  
       
    } catch (error) {
        console.log(error.message);
    }
}


module.exports = {
    createReportPdf,
    createReport,
    weaklyReport,
    monthlyReport,
    yearlyReport,
    dateChange,

}