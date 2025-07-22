const mongoose = require('mongoose')
const OrderDB = require("../model/orderModel")
const ProductDb = require("../model/productModel");
const CategoryDb = require("../model/categoryModel");
const OfferDB = require("../model/offerModel");
const WalletDB = require('../model/walletModel');
const WishlistDB = require('../model/wishlist')
const User = require("../model/userModel");
const CartDB = require('../model/cartModel');
const AddressDB = require('../model/addressModel');
const CoupenDB = require('../model/cuppenModel');
const razorPay = require('razorpay');
const nodemailer = require("nodemailer");
const getStoreDataForUser  = require('../helperfunctions/helper') ;

const instance = new razorPay({
    key_id: process.env.RAZOR_ID,
    key_secret: process.env.RAZOR_SECRET
});




const sendReturnProductEmail = async (product,user,status) => {
  try {
    
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MY_EMAIL,
        pass: process.env.MY_PASSWORD,
      },
    });
     let message = ``
    if( status == "return" ){
     message = `Hi ${user.name}
      Your product ${product.productId.name} has been succsfully Returned And Money will be credited to Your Wallet Account`
    }else{
        message = `Hi ${user.name}
         Your Request to Return The product Name ${product.productId.name} has been Declained becouse of The reason That you provide is Not Eligble for Retarning This product!.`
    }

    
    // mail options
    const mailOptions = {
      from: process.env.MY_EMAIL,
      to: process.env.MY_EMAIL,
      subject: message,
      
    };

    await transporter.sendMail(mailOptions);

   
  } catch (error) {
    console.log(error.message);
  }

}

const ordersList = async (req, res) => {
    try {
      
       const limit = 4 ;
      
        let orderData = await OrderDB.find({}).populate('userId').populate("products.productId").sort({createdAt:-1});
        const totalPage =  Math.ceil(orderData.length/limit) ;
        
        res.render('orders', { orderData:orderData.slice(0,limit),totalPage });

    } catch (error) {
        console.log(error.message);
    }
}


const orderDetailes = async (req, res) => {
    try {
 
        const {_id} = req.query
        
        const orderData = await OrderDB.findOne({_id}).populate('userId').populate('products.productId');
        
        res.render('orderDetailes', { orderData });
    } catch (error) {
        console.log(error.message);
    }
}




const adminReturnOrder = async (req, res) => {
    try {

        const { orderId } = req.query;
        const { status,productId } = req.body;
 
         const orderData = await OrderDB.findById({ _id:orderId }).populate('userId').populate('products.productId')
        if(!orderData){
            return res.json({success:false,message:"Order Not Fount!."})
        }
      
        const product = orderData.products.find((value) =>value._id == productId);
        product.productStatus = status;

        if(status == "return"){
            await ProductDb.findByIdAndUpdate({_id:product.productId._id},{$inc:{stock:product.quandity,orderCount:-product.quandity}});
            await WalletDB.findOneAndUpdate({ userId:orderData.userId},{$inc:{Balance:product.productTotal},$push:{ walletHistery:`Credit : ${product.productId.name} refunded amount of Rs.${product.productTotal}.00`}});
          }
         
         await orderData.save()
        await sendReturnProductEmail(product,orderData.userId,status)
        return res.json({success:true,returnAmount:product.productTotal})
          
    } catch (error) {
        console.log(error.message);
    }
}

const orderStatus = async (req, res) => {
    try {

        const { _id } = req.query;
        const { changeStatus } = req.body;

        const orderData = await OrderDB.findOne({ _id }).populate('userId').populate('products.productId')
        const products = orderData.products
        products.forEach((order)=>{
           if( order.productStatus == "Delivered"){
                res.json({success:false,message:"This order is deliverd!."})
                return
           }else if(order.productStatus == "return"){
                res.json({success:false,message:"This order is Returned!."})
                return
           }
        })
        let check;
        let updated;
        switch(changeStatus){
            case "canceled":
                
                check = false
                products.forEach((order)=>{
                    if( order.productStatus == "pending"){
                        check = true
                    }
                })
               
                if(!check){
                     res.json({success:false,message:"You Can Only Cancell The Pending Orders!."})
                     return
                }
                
                  updated = false
                 for (let i = 0; i < products.length; i++) {
                    if(products[i].productStatus == "pending"){
                       products[i].productStatus = 'canceled';
                       updated = true
                     
                        await ProductDb.findByIdAndUpdate({_id:products[i].productId._id},{$inc:{stock:products[i].quandity}});
                       if(products[i].paymentMethod !== "COD"){
                        await WalletDB.findOneAndUpdate({ userId:orderData.userId},{$inc:{Balance:products[i].productTotal},$push:{ walletHistery:`Credit : ${products[i].productId.name} refunded amount of Rs.${products[i].productTotal}.00`}});
                       }

                    }
                 }
                 if(updated){
             
                  await orderData.save();
                 }
              break
            case "Delivered":
                
                check = false
                products.forEach((order)=>{
                    if( order.productStatus == "pending"){
                        check = true
                    }
                })
                if(!check){
                     res.json({success:false,message:"You Can Only Delivered The Pending Orders!."})
                     return
                }
                updated = false
                 for (let i = 0; i < products.length; i++) {
                    if(products[i].productStatus == "pending"){
                       products[i].productStatus = 'Delivered';
                       updated = true
                       if(products[i].paymentMethod !== "COD"){
                
                         products[i].paymentStatus = "Paid";
                        }else{
                            await WalletDB.findOneAndUpdate({ userId:orderData.userId},{$inc:{Balance:products[i].productTotal},$push:{ walletHistery:`Credit : ${products[i].productId.name} refunded amount of Rs.${products[i].productTotal}.00`}});
                          
                        }
                        const product = await ProductDb.findOne({ _id: products[i].productId._id }).populate("categoryID");
                      
                        product.orderCount++;

                        const category = await CategoryDb.find({});
                        const checkCategory = category.find((value) => {
                            return value.name == product.categoryID.name
                        });
                        
                        checkCategory.orderCount++;
                        await checkCategory.save()
                        await product.save()
                    }
                 }
                 if(updated){
                      await orderData.save();
                 }
              break
            default:
              break
        }

        return res.json({success:true,message:"Successfully change the order status!.",orderData})
        
        
    } catch (error) {
        console.log(error.message);
    }
}

const filterAndsortOrders = async(req,res) => {
    try {
         const { sort,search} = req.query;
          
             const limit = 4;
       
             let orders = await OrderDB.find().populate('userId').populate("products.productId");
             orders = orders.filter((order)=>order.userId.name.toLowerCase().includes(search.toLowerCase()))
              switch (sort) {
                case "Name Z - A":
                orders =orders.sort((a,b) => b.userId.name.toLowerCase().localeCompare(a.userId.name.toLowerCase()))
                break;
                case "Name A - Z":
                orders = orders.sort((a,b) => a.userId.name.toLowerCase().localeCompare(b.userId.name.toLowerCase()) )
                break;
                case "Old":
                orders = orders.sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt) )
                break;
                default:
                orders = orders.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt) )
                break;
            }
           
            const totalPage =  Math.ceil(orders.length/limit) ;
             orders = orders.slice(0,limit)
            return res.json({products:orders,totalPage})


    } catch (error) {
         console.log(error.message);
    }
}

const searchOrders = async(req,res)=>{
   try {
          const { search } = req.query;
          let limit = 4;
          let orders = await OrderDB.find({}).populate("userId").populate("products.productId");
      
          orders = orders.filter((product)=>product.userId.name.toLowerCase().includes(search.toLowerCase()))
          const totalPage = Math.ceil(orders.length/limit);
          orders = orders.slice(0,limit)
          return res.send({orders:orders,totalPage})
   } catch (error) {
       console.error(error.message)
   }
}
const paginationOrders = async(req,res)=>{
   try {
      const { search,sort,page} = req.query;
 
         const limit = 4;
       
             let orders = await OrderDB.find().populate('userId').populate("products.productId");
             orders = orders.filter((order)=>order.userId.name.toLowerCase().includes(search.toLowerCase()))
              switch (sort) {
                case "Name Z - A":
                orders =orders.sort((a,b) => b.userId.name.toLowerCase().localeCompare(a.userId.name.toLowerCase()))
                break;
                case "Name A - Z":
                orders = orders.sort((a,b) => a.userId.name.toLowerCase().localeCompare(b.userId.name.toLowerCase()) )
                break;
                case "Old":
                orders = orders.sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt) )
                break;
                default:
                orders = orders.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt) )
                break;
            }
            const totalPage = Math.floor(orders.length/limit)
            orders = orders.slice((page-1)*limit,page*limit)
            return res.json({orders,totalPage})

          
   } catch (error) {
       console.error(error.message)
   }
}
//############################################################################
//####################   order user side   ###################################
//############################################################################

const order = async (req,res)=>{
    try {

        const {cartData,wishlistData,cartTotal} = await getStoreDataForUser(req,res)
        const limit = 4;
        let data =  await OrderDB.find({userId:req.session.user_id}).populate('userId').populate('products.productId').sort({createdAt:-1}) 
       
       
        const totalPage = Math.ceil(data.length/limit);
       
        res.render('order',{orderData:data.slice(0,limit),cartData,wishlistData,cartTotal,totalPage})
    } catch (error) {
        console.log(error.message);
    }
}

const paginationUserOrder = async (req,res)=>{
    try {
        const {page} = req.query;
        const limit = 4;
        console.log(page)
        let data =  await OrderDB.find({userId:req.session.user_id}).skip((page-1)*limit).limit(page*limit).sort({createdAt:-1}).populate('userId').populate('products.productId') 
        const totalPage = Math.ceil(data.length/limit);
        return res.json({orderData:data,totalPage});
    } catch (error) {
        console.log(error.message);
    }
}



const placeOrder = async (req,res)=>{
    try {
        const {addressId,paymentMethod,coupen} = req.body
        if(!addressId){
            res.send({success:false,message:"Address Not Found!."})
        }
        const offerData = await OfferDB.find({});
        let coupenData;

        if(coupen){
             coupenData = await CoupenDB.findById({_id:coupen});
             if(!coupenData){
              return  res.send({success:false,message:"Coupen Not Found!."})
            }
        }
        const cartData = await CartDB.findOne({userId:req.session.user_id}).populate('userId').populate('products.productId');
        const userData = await User.findById({_id: req.session.user_id});
     
        const cherckStock = cartData.products.filter((value)=>value.productId.stock == 0 || value.productId.stock < value.quandity )
       
        if(cherckStock.length){
            res.send({outofstock:true,message:"Some of the products from your cart is out of stock"})
            return;
        }
      
        //* calculating money start

        let money = cartData.products.reduce((acc,value)=>{
            if(value.productId.stock >0){
                const offerProduct = offerData.find( offer => offer.iteam === value.productId.name || offer.iteam === value.productId.categoryID.name)
                if(offerProduct){
                    return acc+ value.productId.Price*value.quandity - parseInt(value.productId.Price)*offerProduct.offerRate/100*value.quandity; 
                }else{
                    return acc+parseInt(value.productId.Price)*value.quandity
                }
            }else{
               
            }
        },0);
     
        if(coupenData){
          money =   money - Math.ceil(money*coupenData.offer/100)
        }
         //* calculating money end

      

        if(paymentMethod=="Razor pay"){
          //* Razor pay payment method

            const options = {
                 amount: money * 100,
                 currency: 'INR',
                 receipt: process.env.MY_EMAIL
            }

           instance.orders.create(options, 
                (err, order)=>{
                    if(!err){
                        req.session.orderId = order.id
                        res.send({
                           success:true,
                           msg:'Order Created',
                           order_id:order.id,
                           amount:money * 100,
                           key_id:process.env.RAZOR_ID,
                           contact: process.env.MY_NUMBER,
                           name:userData.name,
                           email: process.env.MY_EMAIL,
                           addressId:addressId,
                           coupenId:coupen,
                           paymentMethod:paymentMethod,
                        });
                    }else{
                        console.error("Error creating order:", err);
                        res.send({success:false,msg:'Something went wrong!'});
                    }
                    });


        }else{
            //* COD payment method
            res.send({success:true})
        }
 
    } catch (error) {
        console.log(error.message);
    }
}



const saveOrder = async(req,res)=>{
   try { 
       const {addressId,coupen,paymentMethod,paymentStatus,productStatus,orderId} = req.body;
    
       if(!req.session.orderId || req.session.orderId !== orderId){
        return res.json({success:false,message:"Session Ended!."})
       }
      
       req.session.orderId = null;

       const products = await CartDB.findOne({userId:req.session.user_id}).populate('userId').populate('products.productId').populate('products.productId.categoryID')
        let productsData = products.products;
        
        if(productsData.length == 0){
            return;
        }

        productsData.filter((product)=>{
            if(product.productId.stock < product.quandity){
              return res.json({success:false,message:"Some of your product from your Cart is out of stock!."})
            }
        })
    
       
       const offerData = await OfferDB.find({});
       const addressdb = await AddressDB.findOne({userID:req.session.user_id}).populate('userID');
       const address =  addressdb.address.find((a)=>{
        return a.equals(addressId);
       });
      
       let coupenData=null;
 
     
 

       const array = []
       let calculatingMoney = 0;
      for(let i=0;i<productsData.length;i++){
             let product = await ProductDb.findOne({_id:productsData[i].productId._id});
             let category = await CategoryDb.findById({_id:productsData[i].productId.categoryID._id});
              
             if(productsData[i].productId.stock > 0 && paymentStatus !== "Failed"){
                product.stock = product.stock - productsData[i].quandity;
                await product.save();
               
             }
             let money = 0;
             const offerProduct = offerData.find( offer => offer.iteam === product.name || offer.iteam === category.name)
      
            if(offerProduct){
                money = product.Price*productsData[i].quandity -  Math.floor((product.Price*productsData[i].quandity)*offerProduct.offerRate/100),"money",product.Price*productsData[i].quandity - Math.floor(product.Price); 
                calculatingMoney += product.Price*productsData[i].quandity -  Math.floor((product.Price*productsData[i].quandity)*offerProduct.offerRate/100),"money",product.Price*productsData[i].quandity - Math.floor(product.Price); 
            }else{
                 money =  product.Price*productsData[i].quandity
                 calculatingMoney +=  product.Price*productsData[i].quandity
            }
             
            array.push(
                {
                    productId:productsData[i].productId._id,
                    productStatus,
                    paymentStatus,
                    quandity:productsData[i].quandity,
                    paymentMethod:paymentMethod,
                    deliveryAddress:address,
                    productTotal:money
                }
             )
       }
     
                let offerMoney  = 0;

                if(coupen && paymentStatus !== 'Failed'){
                    coupenData = await CoupenDB.findOne({_id:coupen});
                    if(coupenData){
                        await CoupenDB.findByIdAndUpdate({_id:coupen},{$push:{usedUsers:req.session.user_id}})
                    }
                }

                if(coupenData){
                    offerMoney = Math.round(calculatingMoney*coupenData.offer/100)
                }

             
                const data = new OrderDB({
                    userId:req.session.user_id,
                    products:array,
                    couponOfferPrice: offerMoney,
                });

                await data.save();
          
           
       if(paymentStatus !== 'Failed'){
           await CartDB.findOneAndUpdate({userId:req.session.user_id},{$set:{products:[]}});
       }
      
       res.json({success:true});
   
      
   } catch (error) {
       console.log(error.message);
   }
}

const successPage = async(req,res)=>{
   try {
       res.render('success');
   } catch (error) {
       console.error(error.message)
   }
}


const failePage = async(req,res)=>{
    try {
       res.render("faile")
    } catch (error) {
       console.log(error.message);
    }
}
const payAgain = async(req,res)=>{
   try {
       const {orderId,quandity,addressId,productId} = req.query  
       const orderData = await OrderDB.findById({_id:orderId}).populate('userId').populate('products.productId');
       const product = orderData.products.find((value)=>value._id == productId);
    
       if(product.productId.stock <= 0){
         return res.json({success:false,message:"Product Is Out Of Stock!."});
       }

       if( product.productId.stock < quandity ){
         return res.json({success:false,message:"Product Quandity Exceeded The Product Stock!."})
       }


       const options = {
                       amount: (product.productId.Price*quandity) *100,
                       currency: 'INR',
                       receipt: orderData.userId.email
                       }
        instance.orders.create(options, 
                       (err, order)=>{
                           if(!err){
                                req.session.orderId = order.id
                               res.send({
                                   success:true,
                                   msg:'Order Created',
                                   order_id:order.id,
                                   amount:(product.productId.Price*quandity) *100,
                                   key_id:process.env.RAZOR_ID,
                                   productId:productId,
                                   quandity:quandity,
                                   addressId:addressId,
                                   name:orderData.userId.name,
                                   email: orderData.userId.email
                               });
                           }else{
                               console.error("Error creating order:", err);
                               res.send({success:false,msg:'Something went wrong!'});
                           }
                       }
                   );           
                   
   } catch (error) {
       console.log(error.message);
   }
}


const payAgainAll = async(req,res)=>{
    try {
        const {orderId} = req.query  ;
        const orderData = await OrderDB.findById({_id:orderId}).populate('userId').populate('products.productId');

        let money = 0
        for(let i=0;i<orderData.products.length;i++){
            if(orderData.products[i].productId.stock <= 0){
              return res.json({success:false,message:"Product Is Out Of Stock!."});
            }

            if( orderData.products[i].productId.stock < orderData.products[i].quandity ){
              return res.json({success:false,message:"Product Quandity Exceeded The Product Stock!."})
            }

            money+=orderData.products[i].productTotal
        }
        
        

        const options = {
                       amount:  money*100,
                       currency: 'INR',
                       receipt: orderData.userId.email
                       }

        instance.orders.create(options, 
                       (err, order)=>{
                           if(!err){
                                req.session.orderId = order.id
                               res.send({
                                   success:true,
                                   msg:'Order Created',
                                   order_id:orderId,
                                   razor_id:order.id,
                                   amount:money *100,
                                   key_id:process.env.RAZOR_ID,
                                   name:orderData.userId.name,
                                   email: orderData.userId.email
                               });
                           }else{
                               console.error("Error creating order:", err);
                               res.send({success:false,msg:'Something went wrong!'});
                           }
                       }
                   );           
                   
    } catch (error) {
        console.log(error.message);
    }
}

const savePayAgainAll = async (req,res) => {
    try {
        const {paymentStatus,productStatus,orderId} = req.body
        const {_id} = req.query
 
        const orderData = await OrderDB.findById({_id:_id})
    
        if(!req.session.orderId || req.session.orderId !== orderId){
          return res.json({success:false,message:"Session Ended!."})
        }
        req.session.orderId = null;
        
        const products = orderData.products;

        for(let i=0;i<products.length;i++){
           products[i].paymentStatus = paymentStatus
           products[i].productStatus = productStatus
           if(paymentStatus !== "Failed" ){
             await ProductDb.findByIdAndUpdate({_id:products[i].productId},{$inc:{stock:-products[i].quandity}})
           }
        }
        
   
        const data = new OrderDB({
                    userId:req.session.user_id,
                    products:products,
                    couponOfferPrice: 0,
        });

        await data.save();
        res.json({success:true})
    } catch (error) {
        console.log(error.message)
    }
}

const savePayAgain = async (req,res) => {
    try {

        const {paymentStatus,productStatus,orderId,razor_id} = req.body
       
        const orderData = await OrderDB.findOne({"products._id":orderId});
        
        if(!req.session.orderId || req.session.orderId !== razor_id){
          return res.json({success:false,message:"Session Ended!."})
        }
        req.session.orderId = null;
        const order = orderData.products.find((order)=>order._id == orderId);
        order.productStatus = productStatus
        order.paymentStatus = paymentStatus
        
        const data = new OrderDB({
                    userId:req.session.user_id,
                    products:[order],
                    couponOfferPrice: 0,
        });
        await data.save();
        if(paymentStatus !== "Failed" ){
             await ProductDb.findByIdAndUpdate({_id:order.productId},{$inc:{stock:-order.quandity}})
        }
        res.json({success:true})

    } catch (error) {
        console.log(error.message)
    }
}

const returnOrder = async (req,res)=>{
    try {      
       const {orderId} = req.query;
       const {value,productId} = req.body;
       const productData = await OrderDB.findById({_id:orderId});

        if(!productData){
            return res.json({success:false,message:"Order Not Found!."})
        }
        
        const product = productData.products.find((value)=>value._id == productId);
       
        product.productStatus = "returnPending"; 
        product.cancellationReason = value;
        await  productData.save();

       return  res.json({success:true,message:"Product Return Request Sented Successfully. Meney Will Credit to Your Wallet After Admin Accept your Return Request"})
    } catch (error) {
        console.log(error.message);
    }
}

const returnAllOrder = async (req,res)=>{
    try {      
       const {_id} = req.query;
       const {reason} = req.body;
       
       const productData = await OrderDB.findById({_id}).populate("products.productId")
        if(!productData){
            return res.json({success:false,message:"Order Not Found!."})
        }
     
        const products = productData.products;
       
        products.forEach((product)=>{
            if(product.productStatus == "Delivered"){
                product.productStatus = "returnPending"
                product.cancellationReason = reason;
            }
        })
      
       await  productData.save();
     res.json({success:true,orderData:productData,message:"Product Return Request Sented Successfully. Meney Will Credit to Your Wallet After Admin Accept your Return Request"})
    } catch (error) {
        console.log(error.message);
    }
}



const orderUserDetailes = async (req,res)=>{
    try {
        const cartData = await CartDB.findOne({userId:req.session.user_id}).populate({
            path: 'products.productId',
            populate: { path: 'categoryID' }})
            const wishlistData = await WishlistDB.findOne({userId:req.session.user_id}).populate('products.productId')
        const offerData = await OfferDB.find({});
        let cartTotal=0;
        if(cartData){
            cartTotal = cartData.products.reduce((acc,productsId)=>{
                parseInt(productsId.quandity);
                parseInt(productsId.productId.Price);
                const offer = offerData.find( value => value.iteam === productsId.productId.name ||  value.iteam === productsId.productId.categoryID.name)
                if(offer){
                    return acc+productsId.quandity*productsId.productId.Price - Math.round(productsId.quandity*productsId.productId.Price*offer.offerRate/100)
                }else{
                    return acc+productsId.quandity*productsId.productId.Price
                }
            },0);
        }
       const {_id} = req.query  
       const orders =  await OrderDB.findOne({_id:_id}).populate('userId').populate('products.productId')

       return res.render('orderDetailes',{ orderData:orders,cartData,wishlistData,cartTotal})
       
    } catch (error) {
        console.log(error.message);
    }
}



const cancelUserOrder = async (req,res)=>{
    try {
    
        const {_id,productId} = req.body;
     
        const orderData =  await OrderDB.findOne({_id:_id}).populate('userId').populate('products.productId');
       
         if(!orderData){
            return  res.json({success:false,message:"Order Not Found!."});
         }
        const order = orderData.products.find((p)=>p._id == productId);
       
        const product = await ProductDb.findById({_id:order.productId._id});
        if(!product){
            return res.json({success:false,message:"Product Not Found!."});
        }

         order.productStatus= "canceled";
         await orderData.save();
         product.stock =  product.stock + order.quandity;
        if(order.paymentMethod !==  "COD"){
          
          await WalletDB.findOneAndUpdate({ userId:req.session.user_id},{$inc:{Balance:order.productTotal},$push:{ walletHistery:`Credit : ${order.productId.name} refunded amount of Rs.${order.productTotal}.00`}},{new:true});
          
        }
        await product.save();
        
     
        let clearAction = true;
        orderData.products.forEach((product)=>{
            if(product.productStatus == "pending"){
                clearAction = false;
                return;
            }
        });

        const total = orderData.products.reduce((acc,cur)=>{
          if(cur.productStatus !== "canceled" ){
            return acc+cur.productTotal
          }else{
            return acc
          }
        },0)
     
        return res.send({success:true,message:"Successfully Cancelled this Productsa!.",clearAction,total})
        
    } catch (error) {
        console.log(error.message);
    }
}

const cancelAllProductInOrder = async (req,res)=>{
    try {
    
        const {_id} = req.body;
     
        const orderData =  await OrderDB.findOne({_id:_id}).populate('userId').populate('products.productId');
       
         if(!orderData){
            return  res.json({success:false,message:"Order Not Found!."});
         }

        const products = orderData.products;
        
        for(let product of products){
            const productCheck = await ProductDb.findById({_id:product.productId._id});
            if(!productCheck){
                return res.json({success:false,message:"Product Not Found!."});
            }
         

            product.productStatus= "canceled";
            
            productCheck.stock =  productCheck.stock + product.quandity;
            if(product.paymentMethod !==  "COD"){
               
                await WalletDB.findOneAndUpdate({ userId:req.session.user_id},{$inc:{Balance:product.productTotal},$push:{ walletHistery:`Credit : ${product.productId.name} refunded amount of Rs.${product.productTotal}.00`}},{new:true});
                
            }
            await productCheck.save();
        }
        await orderData.save()
        res.send({success:true,message:"Successfully Cancelled ALl Products!.",orderData})
   
    } catch (error) {
        console.log(error.message);
    }
}



const wallet = async (req,res)=>{
    try {           
        
        const {cartData,wishlistData,cartTotal} = await getStoreDataForUser(req,res)
        const walletData = await WalletDB.findOne({userId:req.session.user_id})
        res.render("wallet",{walletData:walletData,cartData,wishlistData,cartTotal});

    } catch (error) {
        console.log(error.message);
    }
}


module.exports={
    ordersList,
    orderDetailes,
    orderStatus,
    filterAndsortOrders,
    paginationOrders,
    searchOrders,
    paginationUserOrder,
    savePayAgainAll,
    //user side
    returnAllOrder,
    order,
    returnOrder,
    placeOrder,
    orderUserDetailes,
    cancelUserOrder,
    cancelAllProductInOrder,
    saveOrder,
    successPage,
    failePage,
    payAgain,
    payAgainAll,
    adminReturnOrder,
    savePayAgain,
    wallet,
}