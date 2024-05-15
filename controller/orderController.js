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


const instance = new razorPay({
    key_id: process.env.RAZOR_ID,
    key_secret: process.env.RAZOR_SECRET
});


const viewOrders = async (req, res) => {
    try {
        const id = req.query.id
        const data = await OrderDB.findById({ _id: id }).populate('userId').populate('products.productId')
        
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
        }).populate('userId').populate("products.productId");
        let array=[];
        for(let i=0;i<data.length;i++){
            for(let j=0;j<data[i].products.length;j++){
              
                array.push(data[i].products[j])
            }
        }
      
        const arrayNew = array.sort((a,b) => new Date(b.orderDate) - new Date(a.orderDate) )
        res.render('orders', { orderData: arrayNew });

    } catch (error) {
        console.log(error.message);
    }
}


const orderDetailes = async (req, res) => {
    try {
        const id = req.query.id
        const productId = req.query.productId

        const Data = await OrderDB.find({}).populate('userId').populate('products.productId');
        let product;
        let user;
        for(let i=0;i<Data.length;i++){
            for(let j=0;j<Data[i].products.length;j++){
               if(Data[i].products[j].equals(id)){
                  product = Data[i].products[j] ; 
                  user = Data[i].userId
               }
            }
        }
        
        res.render('orderDetailes', { userData: user, productData: product });
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
            console.log(product)
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

//############################################################################
//####################   order user side   ###################################
//############################################################################

const order = async (req,res)=>{
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
    
        const data =  await OrderDB.findOne({userId:req.session.user_id}).populate('userId').populate('products.productId')  
        res.render('order',{orderData:data,cartData,wishlistData,cartTotal})
    } catch (error) {
        console.log(error.message);
    }
}



const placeOrder = async (req,res)=>{
    try {
        const {addressId,paymentMethod,coupen} = req.query
        const offerData = await OfferDB.find({});
        console.log("address");
       
        if(paymentMethod=="Razor pay"){
            console.log(coupen)
            if(coupen!=='undefined'){
                console.log("coupen vech");
                
                const userData= await User.findOne({userId:req.session.user_id})
                if(addressId){
                    const cartData = await CartDB.findOne({userId:req.session.user_id}).populate('userId').populate('products.productId');
                    const userData = await User.findOne({userId: req.session.user_Id});
        
                    const coupenId = await CoupenDB.findOne({coupenId:coupen})
                    const money = cartData.products.reduce((acc,value)=>{
                                       
                        const offerProduct = offerData.find( offer => offer.iteam === value.productId.name || offer.iteam === value.productId.categoryID.name)
                        if(offerProduct){
                            return acc+ value.productId.Price*value.quandity - parseInt(value.productId.Price)*offerProduct.offerRate/100*value.quandity; 
                        }else{
                            return acc+parseInt(value.productId.Price)*value.quandity
                        }
                        
                    },0);
                    
                    let coupenmoney = 0;
                    if(coupenId){
                        coupenmoney =  money - Math.round(money*coupenId.offer/100)
                    }else{
                        coupenmoney = money
                    }
                    
                    const amount =coupenmoney*100;
                    
                    const options = {
                        amount: amount,
                        currency: 'INR',
                        receipt: 'pkansif39@gmail.com'
                    }
                    instance.orders.create(options, 
                        (err, order)=>{
                            if(!err){
                             
                                res.send({
                                    success:true,
                                    msg:'Order Created',
                                    order_id:order.id,
                                    amount:amount,
                                    key_id:process.env.RAZOR_ID,
                                    // product_name:req.body.name,
                                    // description:req.body.description,
                                    contact:"7994566779",
                                    name:userData.name,
                                    email: "pkansif39@gmail.com",
                                    addressId:addressId,
                                    coupenId:coupen,
                                    paymentMethod:paymentMethod,
                                });

                            }else{
                                console.error("Error creating order:", err);
        
                                res.send({success:false,msg:'Something went wrong!'});
                            }
                        }
                    );
                    


                }else{
                    const data = await CartDB.findOne({userId:req.session.user_id}).populate('userId').populate('products.productId');
                    if(data){
                     
                       res.send({addAddress:true})
                      
                    }else{
                      
                      res.send({noProducts:true})
                    }
                }
            }else{
              
                const userData = await User.findOne({userId:req.session.user_id});
             
                    if(addressId){
                       
                     
                        const cartData = await CartDB.findOne({userId:req.session.user_id}).populate('products.productId');;
                                    const userData = await User.findOne({userId: req.session.user_Id})
                                    const money = cartData.products.reduce((acc,value)=>{
                                       
                                        const offerProduct = offerData.find( offer => offer.iteam === value.productId.name || offer.iteam === value.productId.categoryID.name)
                                        if(offerProduct){
                                            return acc+ value.productId.Price*value.quandity - parseInt(value.productId.Price)*offerProduct.offerRate/100*value.quandity; 
                                        }else{
                                            return acc+parseInt(value.productId.Price)*value.quandity
                                        }
                                        
                                    },0);
                                    
                                    const amount =money*100;
                                    const options = {
                                        amount: amount,
                                        currency: 'INR',
                                        receipt: 'pkansif39@gmail.com'
                                    }
                                    instance.orders.create(options, 
                                        (err, order)=>{
                                            if(!err){
                                               
                                                res.send({
                                                    success:true,
                                                    msg:'Order Created',
                                                    order_id:order.id,
                                                    amount:amount,
                                                    key_id:process.env.RAZOR_ID,
                                                    // product_name:req.body.name,
                                                    // description:req.body.description,
                                                    contact:"7994566779",
                                                    name:userData.name,
                                                    email: "pkansif39@gmail.com",
                                                    addressId:addressId,
                                                    coupenId:coupen,
                                                    paymentMethod:paymentMethod,
                                                });
                                                
            
                                            }else{
                                                console.log(err)
                                                console.error("Error creating order:", err);
                        
                                                res.send({success:false,msg:'Something went wrong!'});
                                            }
                                        }
                                    );
            
            
                       }else{
                        const data = await CartDB.findOne({userId:req.session.user_id}).populate('userId').populate('products.productId');
                         if(data){
                           
                            res.send({addAddress:true})
                            
                         }else{
                           
                            res.send({noProducts:true})
                         }
                       }
            }
   
        }else{
             console.log("cod")
              if(coupen){
               const coupenId = await CoupenDB.findOne({coupenId:coupen});
                    if(addressId){
                            const products = await CartDB.findOne({userId:req.session.user_id}).populate('userId').populate('products.productId').populate('products.productId.categoryID')
       
                            const addressdb = await AddressDB.findOne({userID:req.session.user_id}).populate('userID');
                             const address =  addressdb.address.find((a)=>{
                                return a.equals(addressId)
                           });

                           const  date =  new Date().toISOString().slice(0,10);
                           console.log(date)
                           let productsData = products.products;
                       
                           for(let i=0;i<productsData.length;i++){
                            let product = await ProductDb.findOne({_id:productsData[i].productId._id});
                       
                            
                            if(productsData[i].productId.stock>0){
                    
                                product.stock = product.stock-productsData[i].quandity;
                                 await product.save();
                            
                                 const exist = await OrderDB.findOne({userId:req.session.user_id}).populate('products.productId');

                                 if(!exist){
                                  
                                    const offerProduct = offerData.find( offer => offer.iteam === productsData[i].productId.name || offer.iteam === productsData[i].productId.categoryID.name)
                                    var amount = 0;
                                    var newPrice=0;
                                    const offer = coupenId.offer/100;
                                     
                                    if(offerProduct){         
                                      
                                        amount =productsData[i].productId.Price*productsData[i].quandity -  Math.round(productsData[i].productId.Price*offerProduct.offerRate/100)*productsData[i].quandity
                                        newPrice = amount -  Math.round(amount*offer)

                                    }else{
                                        newPrice = productsData[i].productId.Price*productsData[i].quandity
                                           
                                    }
                                      
                                        const data = new OrderDB({
                                            userId:req.session.user_id,
                                            products:[{
                                                productId:productsData[i].productId._id,
                                                productStatus:"pending",
                                                paymentStatus:"Not paid",
                                                quandity:productsData[i].quandity,
                                                orderDate:date,
                                                paymentMethod:paymentMethod,
                                                deliveryAddress:address,
                                                productTotal:newPrice
                                            }],
                                           
                                           });
                                      
                                           await data.save();
                                       await CartDB.findOneAndDelete({userId:req.session.user_id}).populate('userId').populate('products.productId')
                                       await CoupenDB.findOneAndUpdate({coupenId:coupen},{$push:{usedUsers:req.session.user_id}})
                                       res.send({successPage:true})
                                }else{
                                    
                                    const offerProduct = offerData.find( offer => offer.iteam === productsData[i].productId.name || offer.iteam === productsData[i].productId.categoryID.name)
                                    var amount = 0;
                                    var newPrice=0;
                                    const offer = coupenId.offer/100;

                                    if(offerProduct){         
                                      
                                        amount =productsData[i].productId.Price*productsData[i].quandity -  Math.round(productsData[i].productId.Price*offerProduct.offerRate/100)*productsData[i].quandity
                                        newPrice = amount -  Math.round(amount*offer)

                                    }else{
                                        newPrice = productsData[i].productId.Price*productsData[i].quandity
                                           
                                    }
                                     
                                      await OrderDB.findOneAndUpdate({userId:req.session.user_id},{$push:{'products':{
                                        productId:productsData[i].productId,
                                        productStatus:"pending",
                                        paymentStatus:"Not paid",
                                        quandity:productsData[i].quandity,
                                        orderDate:date,
                                        paymentMethod:paymentMethod,
                                        deliveryAddress:address,
                                        productTotal:newPrice
                                    }}}).populate('products.productId');

                                   
                                    await CartDB.findOneAndDelete({userId:req.session.user_id}).populate('userId').populate('products.productId')
                                   
                                   res.send({successPage:true})
                                 };
                  
                            }else{
                                
                                res.send({outofstock:true , product:product.name})
                            }
                            
                          
                           };
                       
                     
                    }else{
                        console.log("1")

                         const data = await CartDB.findOne({userId:req.session.user_id}).populate('userId').populate('products.productId');
                          if(data){
                             
                                res.send({addAddress:true})
                              
                          }else{
                              
                               res.send({noProducts:true})
                          }
           
                    }
             
        
               
              }else{
                console.log("no cupon cod")

                if(addressId){
                      

                        const products = await CartDB.findOne({userId:req.session.user_id}).populate('userId').populate('products.productId').populate('products.productId.categoryID')
                     
                        const addressdb = await AddressDB.findOne({userID:req.session.user_id}).populate('userID');
                         const address =  addressdb.address.find((a)=>{
                            return a.equals(addressId)
                       })
                       const  date =  new Date().toISOString().slice(0,10);
                       console.log(date)
                       let productsData = products.products;
                   
                       for(let i=0;i<productsData.length;i++){
                        let product = await ProductDb.findOne({_id:productsData[i].productId._id});
                      
                
                        if(productsData[i].productId.stock>0){
                
                            product.stock = product.stock-productsData[i].quandity;
                             await product.save();
                        
                             const exist = await OrderDB.findOne({userId:req.session.user_id}).populate('products.productId');
                             if(!exist){
                                const offerProduct = offerData.find( offer => offer.iteam === productsData[i].productId.name || offer.iteam === productsData[i].productId.categoryID.name)
                                var amount = 0;
                                if(offerProduct){                      
                                    amount =productsData[i].productId.Price*productsData[i].quandity -  Math.round(productsData[i].productId.Price*offerProduct.offerRate/100)*productsData[i].quandity
                                }else{
                                      amount = productsData[i].productId.Price*productsData[i].quandity
                                  }
                        
                                  console.log("2",date)
                            const data = new OrderDB({
                                userId:req.session.user_id,
                                products:[{
                                    productId:productsData[i].productId._id,
                                    productStatus:"pending",
                                    paymentStatus:"Not paid",
                                    quandity:productsData[i].quandity,
                                    orderDate:date,
                                    paymentMethod:paymentMethod,
                                    deliveryAddress:address,

                                    productTotal:amount
                                }],
                               
                               });
                           
                               await data.save();

                           
                                await CartDB.findOneAndDelete({userId:req.session.user_id}).populate('userId').populate('products.productId')
                              
                            }else{
                             
                                const offerProduct = offerData.find( offer => offer.iteam === productsData[i].productId.name || offer.iteam === productsData[i].productId.categoryID.name)
                                var amount = 0;
                                if(offerProduct){                      
                                  amount =productsData[i].productId.Price*productsData[i].quandity -  Math.round(productsData[i].productId.Price*offerProduct.offerRate/100)*productsData[i].quandity
                                }else{
                                    amount = productsData[i].productId.Price*productsData[i].quandity
                                }
                                
                                await OrderDB.findOneAndUpdate({userId:req.session.user_id},{$push:{'products':{
                                    productId:productsData[i].productId,
                                    productStatus:"pending",
                                    paymentStatus:"Not paid",
                                    quandity:productsData[i].quandity,
                                    orderDate:date,
                                    paymentMethod:paymentMethod,
                                    deliveryAddress:address,
                                    productTotal:amount
                                }}}).populate('products.productId');
                               
                          
                                await CartDB.findOneAndDelete({userId:req.session.user_id}).populate('userId').populate('products.productId')
                                console.log("success page")
                               res.send({successPage:true})
                                console.log("true")
                             }
                           
                        }else{
                        
                            res.send({outofstock:true , product:product.name})
                        }
                        
                      
                       };
                   
                  
                        } else{
                           
                            const address = await AddressDB.findOne({userID:req.session.user_id}).populate('userID');
                            const data = await CartDB.findOne({userId:req.session.user_id}).populate('userId').populate('products.productId');
                             if(data){
                                
                                res.send({addAddress:true})
                               
                             }else{
                                
                                console.log("product illa")
                             }
                           
                        }
              }
    
    }
        
    } catch (error) {
        console.log(error.message);
    }
}



const failePage = async(req,res)=>{
    try {
       const {addressId,coupen,paymentMethod} = req.query;
       console.log('failePage',req.query);
       const coupenData = await CoupenDB.findOne({coupenId:coupen});
       const offerData = await OfferDB.find({});
          
       const products = await CartDB.findOne({userId:req.session.user_id}).populate('userId').populate('products.productId').populate('products.productId.categoryID')
       const addressdb = await AddressDB.findOne({userID:req.session.user_id}).populate('userID');
       console.log(addressdb)
       const address =  addressdb.address.find((a)=>{
           return a.equals(addressId);
       });

       const  date =  new Date().toISOString().slice(0,10);
      let productsData = products.products;

      for(let i=0;i<productsData.length;i++){
       let product = await ProductDb.findOne({_id:productsData[i].productId._id});
       console.log("start");
       
       if(productsData[i].productId.stock>0){

          
            await product.save();
       
            const exist = await OrderDB.findOne({userId:req.session.user_id}).populate('products.productId');

            if(!exist){
               const money = products.products.reduce((acc,value)=>{
                                  
                   const offerProduct = offerData.find( offer => offer.iteam === value.productId.name || offer.iteam === value.productId.categoryID.name)
                   if(offerProduct){
                       return acc+ value.productId.Price*value.quandity - parseInt(value.productId.Price)*offerProduct.offerRate/100*value.quandity; 
                   }else{
                       return acc+parseInt(value.productId.Price)*value.quandity
                   }
                   
               },0);
               let coupenmoney = 0;
                     console.log('money',money);
                if(coupenData){
                  
                   coupenmoney = money - Math.round(money*coupenData.offer/100);
                   await CoupenDB.findOneAndUpdate({coupenId:coupen},{$push:{usedUsers:req.session.user_id}})
               }else{
                   
                   coupenmoney = money
               }
               
               console.log('coupenmoney',coupenmoney);
           const data = new OrderDB({
               userId:req.session.user_id,
               products:[{
                   productId:productsData[i].productId._id,
                   productStatus:"pending",
                   paymentStatus:"Failed",
                   quandity:productsData[i].quandity,
                   orderDate:date,
                   paymentMethod:paymentMethod,
                   deliveryAddress:address,
                   productTotal:coupenmoney
               }]
           });
              await data.save();
              await CartDB.findOneAndDelete({userId:req.session.user_id}).populate('userId').populate('products.productId')
               console.log("success");
           }else{
               console.log(" products kk add akkanam");
                   let money=0;   
                   const offerProduct = offerData.find( offer => offer.iteam === productsData[i].productId.name || offer.iteam === productsData[i].productId.categoryID.name)
                   if(offerProduct){
                       money =  productsData[i].productId.Price*productsData[i].quandity - parseInt(productsData[i].productId.Price)*offerProduct.offerRate/100*productsData[i].quandity; 
                  
                   }else{
                       money = parseInt(productsData[i].productId.Price)*productsData[i].quandity
                   }

              let coupenmoney = 0;

                if(coupenData){
                   console.log('coupenData', money*coupenData.offer/100)
                   coupenmoney = Math.round(money - money*coupenData.offer/100);
                   await CoupenDB.findOneAndUpdate({coupenId:coupen},{$push:{usedUsers:req.session.user_id}})
               }else{
                   
                   coupenmoney = money
               }
           
               await OrderDB.findOneAndUpdate({userId:req.session.user_id},{$push:{'products':{
                   productId:productsData[i].productId._id,
                   productStatus:"pending",
                   paymentStatus:"Failed",
                   quandity:productsData[i].quandity,
                   orderDate:date,
                   paymentMethod:paymentMethod,
                   deliveryAddress:address,
                   productTotal:coupenmoney
               }}}).populate('products.productId');

              
               await CartDB.findOneAndDelete({userId:req.session.user_id}).populate('userId').populate('products.productId')

            };
               
       }else{
           console.log("false");
           res.send({outofstock:true , product:product.name})
       }
       
     
      };

         
    } catch (error) {
       console.log(error.message);
    }
}
const successPage = async(req,res)=>{
   try { 
       const {addressId,coupen,paymentMethod} = req.query;
       const coupenData = await CoupenDB.findOne({coupenId:coupen});
       const offerData = await OfferDB.find({});
       if(paymentMethod=='Razor pay'){

           const products = await CartDB.findOne({userId:req.session.user_id}).populate('userId').populate('products.productId').populate('products.productId.categoryID')
           const addressdb = await AddressDB.findOne({userID:req.session.user_id}).populate('userID');
           console.log(addressdb)
           const address =  addressdb.address.find((a)=>{
               return a.equals(addressId);
           });

           const  date =  new Date().toISOString().slice(0,10);
          
          let productsData = products.products;
      
          for(let i=0;i<productsData.length;i++){
           let product = await ProductDb.findOne({_id:productsData[i].productId._id});
           console.log("start");
           
           if(productsData[i].productId.stock>0){
   
               product.stock=product.stock-productsData[i].quandity;
                await product.save();
           
                const exist = await OrderDB.findOne({userId:req.session.user_id}).populate('products.productId');

                if(!exist){
                   const money = products.products.reduce((acc,value)=>{
                                      
                       const offerProduct = offerData.find( offer => offer.iteam === value.productId.name || offer.iteam === value.productId.categoryID.name)
                       if(offerProduct){
                           return acc+ value.productId.Price*value.quandity - parseInt(value.productId.Price)*offerProduct.offerRate/100*value.quandity; 
                       }else{
                           return acc+parseInt(value.productId.Price)*value.quandity
                       }
                       
                   },0);
                   let coupenmoney = 0;
                         console.log('money',money);
                    if(coupenData){
                      
                       coupenmoney = money - Math.round(money*coupenData.offer/100);
                       await CoupenDB.findOneAndUpdate({coupenId:coupen},{$push:{usedUsers:req.session.user_id}})
                   }else{
                       
                       coupenmoney = money
                   }
                   
                   console.log('coupenmoney',coupenmoney);
               const data = new OrderDB({
                   userId:req.session.user_id,
                   products:[{
                       productId:productsData[i].productId._id,
                       productStatus:"pending",
                       paymentStatus:"Paid",
                       quandity:productsData[i].quandity,
                       orderDate:date,
                       paymentMethod:paymentMethod,
                       deliveryAddress:address,
                       productTotal:coupenmoney
                   }]
               });
               console.log("data",data)
                  await data.save();
                  await CartDB.findOneAndDelete({userId:req.session.user_id}).populate('userId').populate('products.productId')
                   console.log("success");
               }else{
                   console.log(" products kk add akkanam");
                       let money=0;   
                       const offerProduct = offerData.find( offer => offer.iteam === productsData[i].productId.name || offer.iteam === productsData[i].productId.categoryID.name)
                       if(offerProduct){
                           money =  productsData[i].productId.Price*productsData[i].quandity - parseInt(productsData[i].productId.Price)*offerProduct.offerRate/100*productsData[i].quandity; 
                      
                       }else{
                           money = parseInt(productsData[i].productId.Price)*productsData[i].quandity
                       }
    
                  let coupenmoney = 0;

                    if(coupenData){
                       console.log('coupenData', money*coupenData.offer/100)
                       coupenmoney = Math.round(money - money*coupenData.offer/100);
                       await CoupenDB.findOneAndUpdate({coupenId:coupen},{$push:{usedUsers:req.session.user_id}})
                   }else{
                       
                       coupenmoney = money
                   }
               
                   await OrderDB.findOneAndUpdate({userId:req.session.user_id},{$push:{'products':{
                       productId:productsData[i].productId._id,
                       productStatus:"pending",
                       paymentStatus:"Paid",
                       quandity:productsData[i].quandity,
                       orderDate:date,
                       paymentMethod:paymentMethod,
                       deliveryAddress:address,
                       productTotal:coupenmoney
                   }}}).populate('products.productId');

                  
                   await CartDB.findOneAndDelete({userId:req.session.user_id}).populate('userId').populate('products.productId')
   
                };
                   
           }else{
               console.log("false");
               res.send({outofstock:true , product:product.name})
           }
           
         
          };

          res.render('success');

       }else{
           res.render('success');
       }
          
      
   } catch (error) {
       console.log(error.message);
   }
}

const payAgain = async(req,res)=>{
   try {
       const {productId,productTotal,quandity,addressId} = req.query
       const cartData = await CartDB.findOne({userId:req.session.user_id}).populate('products.productId');
                   const userData = await User.findOne({userId: req.session.user_Id});
       
                   const amount =productTotal*100;
                   const options = {
                       amount: amount,
                       currency: 'INR',
                       receipt: 'pkansif39@gmail.com'
                   }
                   instance.orders.create(options, 
                       (err, order)=>{
                           if(!err){
                               console.log(order)
                               res.send({
                                   success:true,
                                   msg:'Order Created',
                                   order_id:order.id,
                                   amount:amount,
                                   key_id:process.env.RAZOR_ID,
                                   productId:productId,
                                   quandity:quandity,
                                   addressId:addressId,
                                   name:userData.name,
                                   email: "pkansif39@gmail.com"
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


const repay = async(req,res)=>{
    try {
        const { addressId,amount,quandity,productId} = req.query;
        const orderData =  await OrderDB.findOne({userId:req.session.user_id}).populate('products.productId');
        console.log(req.query)
        const product = orderData.products.find((pro)=>{
            return pro._id.equals(productId)
        });
        
       product.paymentStatus="Paid"
       await orderData.save();
       res.render('success');
    } catch (error) {
        console.log(error.message);
    }
}

const returnOrder = async (req,res)=>{
    try {      
       const {productId,value} = req.query;
      
       const productData = await OrderDB.findOne({userId:req.session.user_id}).populate({
        path: 'products.productId',
        populate: { path: 'categoryID' }
        });

       const product = productData.products.find((p)=>{
         return  p._id.equals(productId);     
       });
          
       product.productStatus = "return";
      
       const pro = await ProductDb.findOne({_id:product.productId._id}).populate("categoryID");
       
       pro.orderCount--;
       pro.stock = pro.stock+product.quandity
       
       await pro.save();
      
      
       const categoty = await CategoryDb.findOne({_id:pro.categoryID});
      
       categoty.orderCount--;
       await categoty.save();
               
       product.cancellationReason = value;

       await  productData.save();
       
       const walletData = await WalletDB.findOne({userId:req.session.user_id});
       const offerData = await OfferDB.find({});
       const offer = offerData.find((value)=> value.iteam == pro.name || value.iteam == pro.categoryID.name)
       let amount =0;
       if(offer){
        amount = product.productId.Price*product.quandity   - Math.round(product.productId.Price*offer.offerRate/100)*product.quandity
       }else{
        amount =product.productId.Price*product.quandity;
       }
      
    if(!walletData){
       const data = new WalletDB({
        userId:req.session.user_id,
        Balance:amount,
        walletHistery:[`Credit : ${product.productId.name} refunded amount of Rs.${product.productId.Price*product.quandity}.00`]
       });

       await data.save()
   
    }else{
        const data = await WalletDB.findOne({userId:req.session.user_id});
        const total = data.Balance +=amount;

       await WalletDB.findOneAndUpdate({userId:req.session.user_id},{$set:{Balance:total}})
       await WalletDB.findOneAndUpdate({userId:req.session.user_id},{$push:{walletHistery:`Credit : ${product.productId.name} refunded amount of Rs.${amount}.00`}})
    }
      
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
        const {id} = req.query  
        const data =  await OrderDB.findOne({userId:req.session.user_id}).populate('userId').populate('products.productId')
        
        const product =  data.products.find((p)=>{
            return p._id.equals(id)
        });
       
   
      
       res.render('orderDetailes',{ orderData:product, userData:data,cartData,wishlistData,cartTotal})
       
    } catch (error) {
        console.log(error.message);
    }
}



const cancelUserOrder = async (req,res)=>{
    try {
    
        const {id} = req.query;
        const orderData =  await OrderDB.findOne({userId:req.session.user_id}).populate('userId').populate('products.productId');
          
        const a = orderData.products.find((p)=>{
            return p._id.equals(id)
        });
                
       a.productStatus="canceled" 
       a.stock=a.stock--
        await orderData.save();
        const data =  await OrderDB.findOne({userId:req.session.user_id}).populate('userId').populate('products.productId');;
                  
        let totalPriceOfPendingProducts = 0;

         for (let i = 0; i < data.products.length; i++) {
              if (data.products[i].productStatus === "pending") {
                    totalPriceOfPendingProducts += data.products[i].totalPrice;
                }
            }

         data.total=totalPriceOfPendingProducts
         await data.save();
           
    } catch (error) {
        console.log(error.message);
    }
}



const wallet = async (req,res)=>{
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
       const walletData = await WalletDB.findOne({userId:req.session.user_id})
       res.render("wallet",{walletData:walletData,cartData,wishlistData,cartTotal});

    } catch (error) {
        console.log(error.message);
    }
}


module.exports={
    viewOrders,
    ordersList,
    orderDetailes,
    cancelOrder,
    orderStatus,

    //user side

    order,
    returnOrder,
    placeOrder,
    orderUserDetailes,
    cancelUserOrder,
    failePage,
    successPage,
    payAgain,
    repay,
    wallet,
}