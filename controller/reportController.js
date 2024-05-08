const mongoose = require('mongoose')
const OrderDB = require("../model/orderModel");


const createReport = async (req, res) => {
    try {
        const {endYearly,startYearly,startWeekly,endWeekly,startMonth,endMonth} = req.query;
        const workbook = new exceljs.Workbook();
        const worksheet = workbook.addWorksheet("Orders");
        function getPastDays(date, numberOfDays) {
            const pastDays = [];
            for (let i = 0; i < numberOfDays; i++) {
                const pastDay = new Date(date);
                pastDay.setDate(date.getDate() - i);
                pastDays.push(pastDay.toISOString().slice(0, 10));
            }
            return pastDays.reverse(); // Reverse the array to have the days in chronological order
        }
        
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
        const data = await OrderDB.find({ }).populate('userId').populate('products.productId');
        data.forEach((order) => {
            for (let i = 0; i < order.products.length; i++) {
                if(order.products[i].orderDate >= start & order.products[i].orderDate <= end){
                order.s_no = counter;
                counter++;
                order.usersname = order.userId.name;
                order.productsname = order.products[i].productId.name;
                order.orderStatus = order.products[i].productStatus;
                order.orderDate = order.products[i].orderDate ;
                order.productprice = order.products[i].productTotal/order.products[i].quandity;
                order.actualprice = order.products[i].productId.Price
                order.productQuandity = order.products[i].quandity;
                if (order.products[i].productId.Price == order.products[i].productTotal / order.products[i].quandity) {
                    order.offerPrice = 0;   
                } else {
                   order.offerPrice = order.products[i].productId.Price - order.products[i].productTotal / order.products[i].quandity
                }
                order.total = order.products[i].productTotal*order.products[i].quandity;
                worksheet.addRow(order);
            }

            }


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
        const order = await OrderDB.find({}).populate('userId').populate('products.productId');

        function getPastDays(date, numberOfDays) {
            const pastDays = [];
            for (let i = 0; i < numberOfDays; i++) {
                const pastDay = new Date(date);
                pastDay.setDate(date.getDate() - i);
                pastDays.push(pastDay.toISOString().slice(0, 10));
            }
            return pastDays.reverse(); // Reverse the array to have the days in chronological order
        }
        
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
        console.log(start,end)
        const data = {
            orderData: order,
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
        pdf.create(ejsData, options).toFile('orders.pdf', (err, response) => {
            if (err) console.log(err);

            const filePath = path.resolve(__dirname, '../orders.pdf');

            fs.readFile(filePath, (err, file) => {
                if (err) {
                    console.log(err);
                    return res.status(500).send('could not doenload the file')
                }

                res.setHeader('Content-type', 'application/pdf')
                res.setHeader('Content-Disposition', 'attachment;filename="orders.pdf"');

                res.send(file)
            })
        })
    } catch (error) {
        console.log(error.message);
    }
}

const weaklyReport = async(req,res)=>{
   try {
    const {eDate} = req.query;
      function getPastDays(date, numberOfDays) {
        console.log(date)
        const pastDays = [];
        for (let i = 0; i < numberOfDays; i++) {
            const pastDay = new Date(date);
            pastDay.setDate(date.getDate() - i);
            pastDays.push(pastDay.toISOString().slice(0, 10));
        }
        return pastDays.reverse(); // Reverse the array to have the days in chronological order
    }
    
    const currentDate = new Date()
    // const pastDays = getPastDays(currentDate, 7);
   
    if(!eDate){  
        const pastDays = getPastDays(currentDate, 7);
        const start = pastDays[0]
        const end = pastDays[pastDays.length-1]
        const orderData = await OrderDB.find({}).populate("userId").populate({path:"products.productId",populate:{path:"categoryID"}})
        const array =[];
        for(let i=0;i<orderData.length;i++){
            for(let j=0;j<orderData[i].products.length;j++){
                if(orderData[i].products[j].orderDate >=start & orderData[i].products[j].orderDate <=end ){
                    array.push(orderData[i].products[j])
                }
            }
        }
        console.log("1",start,end,array.length)
   
    res.render("weeklyReport",{orderData,start,end,array})
    }else{
        const orderData = await OrderDB.find({}).populate("userId").populate({path:"products.productId",populate:{path:"categoryID"}})
        const pastDays = getPastDays(new Date(eDate), 7);
        const start = pastDays[0]
        const end = pastDays[pastDays.length-1]
        const array =[];
        for(let i=0;i<orderData.length;i++){
            for(let j=0;j<orderData[i].products.length;j++){
                if(orderData[i].products[j].orderDate >=start & orderData[i].products[j].orderDate <=end ){
                    array.push(orderData[i].products[j])
                }
            }
        }
        console.log("2",start,end,array.length)
        res.render("weeklyReport",{orderData,start,end,array})
    }
   
    
} catch (error) {
    console.log(error.message);
   }
}

const monthlyReport = async(req,res)=>{
    try {
        const orderData = await OrderDB.find({}).populate("userId").populate({path:"products.productId",populate:{path:"categoryID"}})
        const {sDate,eDate} = req.query;
        function getPastDays(date, numberOfDays) {
            const pastDays = [];
            for (let i = 0; i < numberOfDays; i++) {
                const pastDay = new Date(date);
                pastDay.setDate(date.getDate() - i);
                pastDays.push(pastDay.toISOString().slice(0, 10));
            }
            return pastDays.reverse(); // Reverse the array to have the days in chronological order
        }
        
        const currentDate = new Date()
        const pastDays = getPastDays(currentDate, 31);
        if(!eDate&!sDate){
            const start = pastDays[0]
            const end = pastDays[pastDays.length-1]
            let array=[]
            for(let i=0;i<orderData.length;i++){
                for(let j=0;j<orderData[i].products.length;j++){
                  if(orderData[i].products[j].orderDate >=start & orderData[i].products[j].orderDate <=end){
                      array.push(orderData[i].products[j])
                  }
                }
            }

          
            res.render("monthlyReport",{orderData,array,start,end})
        }else{
            const start =sDate
            const end = eDate
            let array=[]
            for(let i=0;i<orderData.length;i++){
                for(let j=0;j<orderData[i].products.length;j++){
                  if(orderData[i].products[j].orderDate >=start & orderData[i].products[j].orderDate <=end){
                    array.push(orderData[i].products[j])
                  }
                }
            }

           
            res.render("monthlyReport",{orderData,array,start,end})
        }
        
       
    } catch (error) {
        console.log(error.message);
    }
}

const yearlyReport = async(req,res)=>{
    try {
        const {year} = req.query;
        if(year){
            const currentYear =year
            const start =`${currentYear}-01-01` ;
            const end = `${currentYear}-12-30`;
            const orderData = await OrderDB.find({}).populate("userId").populate({path:"products.productId",populate:{path:"categoryID"}})
            let array =[];
            for(let i=0;i<orderData.length;i++){
                for(let j=0;j<orderData[i].products.length;j++){
                  if(orderData[i].products[j].orderDate >=start & orderData[i].products[j].orderDate <=end){
                      array.push(orderData[i].products[j])
                  }
                }
            }
          
            res.render("yearlyReport",{orderData,array,start,end,currentYear})
        }else{
            const currentYear = new Date().getFullYear();
            const start =`${currentYear}-01-01` ;
            const end = `${currentYear}-12-30`;
            const orderData = await OrderDB.find({}).populate("userId").populate({path:"products.productId",populate:{path:"categoryID"}})
           let array =[];
            for(let i=0;i<orderData.length;i++){
                for(let j=0;j<orderData[i].products.length;j++){
                  if(orderData[i].products[j].orderDate >=start & orderData[i].products[j].orderDate <=end){
                      array.push(orderData[i].products[j])
                  }
                }
            }
            console.log(array.length)
            res.render("yearlyReport",{orderData,array,start,end,currentYear})
        }
       
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

}