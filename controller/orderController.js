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
 
        const id = req.query._id
        
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
        if(order.productStatus == "Delivered"){
           res.json({success:false,message:"This order is deliverd!."})
           return
        }
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
        res.json({success:true,message:"Successfully change the order status!."})

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
        data.products.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
        res.render('order',{orderData:data,cartData,wishlistData,cartTotal})
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
             coupenData = await CoupenDB.findOne({_id:coupen});
             if(!coupenData){
              return  res.send({success:false,message:"Coupen Not Found!."})
            }
        }
        const cartData = await CartDB.findOne({userId:req.session.user_id}).populate('userId').populate('products.productId');
        const userData = await User.findById({_id: req.session.user_id});
     
        const cherckStock = cartData.products.filter((value)=>value.productId.stock == 0)

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

        if(cherckStock.length){
            res.send({outofstock:true,message:"Some of the products from your cart is out of stock"})
            return;
        }

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
       const {addressId,coupen,paymentMethod,paymentStatus,productStatus} = req.body;
       
      
       const products = await CartDB.findOne({userId:req.session.user_id}).populate('userId').populate('products.productId').populate('products.productId.categoryID')
        let productsData = products.products;
        if(productsData.length == 0){
           return;
        }
       
       const offerData = await OfferDB.find({});
       const addressdb = await AddressDB.findOne({userID:req.session.user_id}).populate('userID');
       const address =  addressdb.address.find((a)=>{
        return a.equals(addressId);
       });
      
       const  date =  new Date()
      
       let coupenData=null;
       let money = productsData.reduce((acc,value)=>{                      
        const offerProduct = offerData.find( offer => offer.iteam === value.productId.name || offer.iteam === value.productId.categoryID.name)
        if(offerProduct){
            acc + value.productId.Price*value.quandity - parseInt(value.productId.Price)*offerProduct.offerRate/100*value.quandity;
            value.productId.Price =  value.productId.Price*value.quandity - parseInt(value.productId.Price)*offerProduct.offerRate/100*value.quandity; 
            return acc; 
        }else{
            return acc + parseInt(value.productId.Price)*value.quandity
        }
       },0);
       if(coupen){
        coupenData = await CoupenDB.findById({_id:coupen});
        if(coupenData){
            money = money - Math.round(money*coupenData.offer/100);
            await CoupenDB.findOneAndUpdate({coupenId:coupen},{$push:{usedUsers:req.session.user_id}})
        }
       }

      for(let i=0;i<productsData.length;i++){
             let product = await ProductDb.findOne({_id:productsData[i].productId._id});
             if(productsData[i].productId.stock>0){
                product.stock=product.stock-productsData[i].quandity;
                await product.save();
             }
             const exist = await OrderDB.findOne({userId:req.session.user_id});
             if(exist){
                await OrderDB.findByIdAndUpdate({_id:exist._id},{$push:{
                     products:{
                        productId:productsData[i].productId._id,
                        productStatus,
                        paymentStatus,
                         orderDate:date,
                        quandity:productsData[i].quandity,
                        paymentMethod:paymentMethod,
                        deliveryAddress:address,
                        productTotal:money
                    }
                }})
             }else{

                const data = new OrderDB({
                    userId:req.session.user_id,
                    products:[{
                        productId:productsData[i].productId._id,
                        productStatus,
                        paymentStatus,
                        quandity:productsData[i].quandity,
                        orderDate:date,
                        paymentMethod:paymentMethod,
                        deliveryAddress:address,
                        productTotal:money
                    }]
                });
                await data.save();
             }
         }

       await CartDB.findOneAndUpdate({userId:req.session.user_id},{$set:{products:[]}});
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
    saveOrder,
    successPage,
    failePage,
    payAgain,
    repay,
    wallet,
}