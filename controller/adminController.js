const mongoose = require('mongoose')
const UserDb = require("../model/userModel");
const ProductDb = require("../model/productModel");
const CategoryDb = require("../model/categoryModel");
const OrderDB = require('../model/orderModel');
const CupenDB = require('../model/cuppenModel');
const OfferDB = require('../model/offerModel');
const bcrypt = require('bcrypt');
const exceljs = require('exceljs');
const pdf = require('html-pdf');
const fs = require('fs');
const path = require('path');
const ejs = require('ejs');
const randomstring = require('randomstring');
const { log } = require('console');

const securePassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        return passwordHash;
    } catch (error) {
        console.log(error.message);
    }
}


const adminLogin = async (req, res) => {
    try {

        res.render('adminLogin')
    } catch (error) {
        console.log(error.message)

    }
}


const veryfyLogin = async (req, res) => {
    try {

        const password = req.body.password
        const email = req.body.email;
        const userData = await UserDb.findOne({ email: email });

        if (userData) {
            const passwordMatch = await bcrypt.compare(password, userData.password)
            if (passwordMatch) {
                if (userData.is_admin == 0) {
                    res.render('adminLogin', { message: 'You Are Not Admin' });
                } else {
                    req.session.admin_id = userData._id;
                    res.redirect('/admin/dashboard')
                }
            } else {
                res.render('adminLogin', { message: "Incorrect Password" });
            }
        } else {
            res.render('adminLogin', { message: "You are not registered" });
        }
    } catch (error) {
        console.log(error.message)

    }
}

const viewUser = async (req, res) => {
    try {

        var search = '';
        if (req.query.search) {
            search = req.query.search
        }

        let page;
        if (req.query.page) {
            page = req.query.page;
        }

        const limit = 2;

        const userData = await UserDb.find({
            is_admin: false,
            $or: [
                { name: { $regex: '.*' + search + '.*', $options: 'i' } },
                { email: { $regex: '.*' + search + '.*', $options: 'i' } },
                { mobile: { $regex: '.*' + search + '.*', $options: 'i' } },

            ]
        }).limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();


        const count = await UserDb.find({
            is_admin: false,
            $or: [
                { name: { $regex: '.*' + search + '.*', $options: 'i' } },
                { email: { $regex: '.*' + search + '.*', $options: 'i' } },
                { mobile: { $regex: '.*' + search + '.*', $options: 'i' } },

            ]
        }).countDocuments();


        res.render('usersList', {
            userData: userData,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        })
    } catch (error) {
        console.log(error.message)

    }
}

const dashboard = async (req, res) => {
    try {

        const {filter} = req.query;
        let data;
        let date;
        if(!filter||filter == 'Yearly'){
           data = "nulll"
        }else if(filter == "Monthly"){
             date = new Date().getMonth()+1;
            data = "Monthly"
           
        }
        const orderData = await OrderDB.find({}).populate("products.productId");
        const categoryData = await CategoryDb.find({});
        let arrayProducts = [];
        let arrayCategory = [];
        for (let i = 0; i < orderData.length; i++) {
            for (let j = 0; j < orderData[i].products.length; j++) {
                if (orderData[i].products[j].productStatus == "Delivered") {
                    arrayProducts.push({ count: orderData[i].products[j].productId.orderCount, name: orderData[i].products[j].productId.name, image: orderData[i].products[j].productId.image[0] })
                }
            }
        }
        const uniqueProducts = new Set(arrayProducts.map(JSON.stringify));
        let spreadArray = [...uniqueProducts].map(JSON.parse);
        const top10Product = spreadArray.sort((a, b) => b.count - a.count).slice(0, 10);

        categoryData.forEach((value) => arrayCategory.push({ count: value.orderCount, name: value.name }))
        const top10Category = arrayCategory.sort((a, b) => b.count - a.count).slice(0, 10);
        res.render('dashboard', { dbData: orderData, arrayCount: top10Product, top10Category: top10Category ,data,date});

    } catch (error) {
        console.log(error.message)

    }
}

const chart = async (req, res) => {
    try {
        const { status } = req.query;
        const orderData = await OrderDB.find({});
        let dataSend = [];
        if (status == "Filter" || status == "Yearly") {
            console.log("Yearly")
            res.send({ status: "Monthly", dataSend: dataSend });
        } else {
            const Month = new Date().getMonth()

            for (let i = 0; i < orderData.length; i++) {
                for (let j = 0; j < orderData[i].products.length; j++) {
                    if (new Date(orderData[i].products[j].orderDate).getMonth() + 1 == Month + 1) {
                        dataSend.push(orderData[i].products[j])
                    }
                }
            }

            res.send({ status: "Monthly", dataSend: dataSend });
        }

    } catch (error) {
        console.log(error.message)

    }
}

const blockUser = async (req, res) => {
    try {
        const { userId } = req.query

        const data = await UserDb.findOne({ _id: userId })


        //  if(data.is_blocked==true){
        //       await UserDb.findByIdAndUpdate({_id:userId},{$set:{is_blocked:false}})
        //  }else{
        //     await UserDb.findByIdAndUpdate({_id:userId},{$set:{is_blocked:true}})
        //  }

        data.is_blocked = !data.is_blocked


        data.save();
        res.redirect("/admin/viewUser")

    } catch (error) {
        console.log(error.message)

    }
}




const loadaddUser = async (req, res) => {
    try {
        res.render('addUser')
    } catch (error) {
        console.log(error.message)

    }
}



const addUser = async (req, res) => {
    try {

        if (/^[A-Za-z]+(?:[A-Za-z]+)?$/.test(req.body.name)) {
            if (/^[A-Za-z0-9.%+-]+@gmail\.com$/.test(req.body.email)) {
                const emailCheck = await UserDb.findOne({ email: req.body.email });
                if (!emailCheck) {
                    const mobileLength = (req.body.mobile).length;
                    if (mobileLength < 11) {
                        const passwordLength = (req.body.password).length;
                        if (passwordLength > 4) {
                            const userData = new UserDb({
                                name: req.body.name,
                                email: req.body.email,
                                password: req.body.password,
                                mobile: req.body.mobile,

                            });
                            const user = await userData.save();
                            if (user) {
                                res.redirect('/admin/viewUser')
                            } else {
                                res.render('addUser', { message: "SOmthing Wrong..." });
                            }
                        } else {
                            res.render('addUser', { message: "Password Is Note Strong" });
                        }
                    } else {
                        res.render('addUser', { message: " Mobile Number Should be 10 Degits " });
                    }

                } else {
                    res.render('addUser', { message: " User Already Exists" });
                }
            } else {
                res.render('addUser', { message: " Please Check Your Email Structure" });
            }
        } else {
            res.render('addUser', { message: " Invalid Name Provide" });
        }


    } catch (error) {
        console.log(error.message)

    }
}



const viewProducts = async (req, res) => {
    try {
        var search = req.query.search || '';
        if (req.query.search) {
            search = req.query.search;

        }
        let page;
        if (req.query.page) {
            page = req.query.page;
        }
        const limit = 4;
        const productData = await ProductDb.find({
            $or: [
                { name: { $regex: '.*' + search + '.*', $options: 'i' } },

            ]
        }).populate('categoryID').limit(limit * 1).skip((page - 1) * limit).exec();

        const count = await ProductDb.find({
            $or: [
                { name: { $regex: '.*' + search + '.*', $options: 'i' } },
            ]
        }).populate('categoryID').countDocuments();
        console.log(Math.ceil(count / limit))
        res.render('productList', {
            productData: productData,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        })
    } catch (error) {
        console.log(error.message)

    }
}


const loadaddProducts = async (req, res) => {
    try {
        const category = await CategoryDb.find({});

        res.render('addProduct', { category: category });
    } catch (error) {
        console.log(error.message)

    }
}



const addProducts = async (req, res) => {
    try {

        if (req.body.Price > 0) {

            const image = req.files.map((file) => file.filename);
            if (image.length > 3) {
                const productData = new ProductDb({
                    name: req.body.name,
                    Price: req.body.Price,
                    stock: req.body.stock,
                    Description: req.body.Description,
                    image: image,
                    categoryID: req.body.category
                });

                let data = await productData.save();

                res.redirect('/admin/viewProducts')
            } else {
                const category = await CategoryDb.find({});

                res.render('addProduct', { category: category, message: 'minimum 4 image needs' });
            }


        } else {
            const category = await CategoryDb.find({});

            res.render('addProduct', { category: category, message: 'price Should be Positive' });
        }


    } catch (error) {
        console.log(error.message)

    }
}


const editProducts = async (req, res) => {
    try {

        const category = await CategoryDb.find({});
        const productData = await ProductDb.findById({ _id: req.query.id });

        res.render('editProduct', {
            productData: productData,
            category: category,
        });

    } catch (error) {
        console.log(error.message)

    }
}


const UpdateProducts = async (req, res) => {
    try {
        // const {index,newPhoto,oldPhoto,id}= req.body;
        // console.log(req.body)
        const id = req.query.id
        const data = await ProductDb.findById({ _id: id }).populate('categoryID');
        // data.image[index] = newPhoto ; 
        // await data.save()
        const alreadyImage = data.image
        const image = req.files.map((file) => file.filename);
        const name = req.body.name.trim();

        if (/[a-zA-Z]/.test(name)) {
            if (req.body.Price > 0) {
                if (req.body.stock >= 0) {
                    if (image.length == 0) {

                        const product = await ProductDb.findByIdAndUpdate({ _id: req.query.id }, {
                            $set: {
                                name: req.body.name,
                                Description: req.body.Description,
                                Price: req.body.Price,
                                image: alreadyImage,
                                stock: req.body.stock,
                                categoryID: req.body.category,

                            }
                        });
                        res.redirect('/admin/ViewProducts')
                    } else {
                        if (image.length >= 4) {
                            const product = await ProductDb.findByIdAndUpdate({ _id: req.query.id }, {
                                $set: {
                                    name: req.body.name,
                                    Description: req.body.Description,
                                    Price: req.body.Price,
                                    image: image,
                                    stock: req.body.stock,
                                    categoryID: req.body.category
                                }
                            });
                            res.redirect('/admin/ViewProducts')
                        } else {
                            const category = await CategoryDb.find({});
                            const productData = await ProductDb.findById({ _id: req.query.id })

                            res.render('editProduct', { productData: productData, category: category, message: "Add Minimum 4 Images" })

                        }
                    }


                } else {
                    const category = await CategoryDb.find({});
                    const productData = await ProductDb.findById({ _id: req.query.id })

                    res.render('editProduct', { productData: productData, category: category, message: "stock should be positive" })

                }

            } else {
                const category = await CategoryDb.find({});
                const productData = await ProductDb.findById({ _id: req.query.id })

                res.render('editProduct', { productData: productData, category: category, message: "price should be positive" })
            }
        } else {
            const category = await CategoryDb.find({});
            const productData = await ProductDb.findById({ _id: req.query.id })

            res.render('editProduct', { productData: productData, category: category, message: "invalid name provide" })
        }

    } catch (error) {
        console.log(error.message)

    }

}

const listProduct = async (req, res) => {
    try {
        const { userId } = req.query

        const data = await ProductDb.findOne({ _id: userId })

        data.is_listed = !data.is_listed


        data.save();
        res.redirect('/admin/productList')

    } catch (error) {
        console.log(error.message)

    }
}


const category = async (req, res) => {
    try {
        const categoryData = await CategoryDb.find({});
        res.render('category', { categoryData })
    } catch (error) {
        console.log(error.message)

    }
}

const loadaddcategory = async (req, res) => {
    try {

        res.render('addCategory')
    } catch (error) {
        console.log(error.message)

    }
}


const addcategory = async (req, res) => {
    try {
        const nameCheck = await CategoryDb.findOne({ name: { $regex: new RegExp(req.body.name, "i") } })
        if (!nameCheck) {
            const category = new CategoryDb({
                name: req.body.name,
                Description: req.body.description,
                is_listed: true
            });
            await category.save();

            res.redirect('/admin/category')
        } else {
            res.render('editCategory', { categoryData: nameCheck, message: 'category name already exists' })
        }

    } catch (error) {
        console.log(error.message)

    }
}

const loadeditcategory = async (req, res) => {
    try {
        const categoryData = await CategoryDb.findById({ _id: req.query.id })
        res.render('editCategory', { categoryData: categoryData })
    } catch (error) {
        console.log(error.message)

    }
}

const editcategory = async (req, res) => {
    try {
        const category = await CategoryDb.findOne({ _id: req.body.id });
        if (/^[A-Z]+(?:[A-Z]+)?$/.test(req.body.name)) {
            const nameExist = await CategoryDb.findOne({ name: req.body.name });
            if (!nameExist) {

                const Data = await CategoryDb.findByIdAndUpdate({ _id: req.body.id }, {
                    $set: {
                        name: req.body.name,
                        Description: req.body.description,

                    }
                });
                res.redirect("/admin/category");
            } else if (nameExist._id == req.body.id) {

                const Data = await CategoryDb.findByIdAndUpdate({ _id: req.body.id }, {
                    $set: {
                        name: req.body.name,
                        Description: req.body.description,

                    }
                });
                res.redirect("/admin/category");
            }
            else {
                res.render('editCategory', { categoryData: category, message: 'Category Name Already Exists' })
            }
        } else {
            res.render('editCategory', { categoryData: category, message: 'invalid Name Provide' })
        }
    } catch (error) {
        console.log(error.message)

    }
}


const listcategory = async (req, res) => {
    try {
        const { userId } = req.query;

        const Data = await CategoryDb.findOne({ _id: userId });

        Data.is_listed = !Data.is_listed;

        await Data.save();
        res.redirect('/admin/category')
    } catch (error) {
        console.log(error.message)

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


//########### cuppen ##################3


const addCuppen = async (req, res) => {
    try {
        const offerPrice = req.body.offerPrice * 1;
        const expiryDate = new Date(req.body.date);
        const today = new Date();
        if (offerPrice >= 20 & offerPrice <= 70) { 
            if (expiryDate.getFullYear() >= today.getFullYear() & expiryDate.getMonth() >= today.getMonth()) {
                    if(expiryDate.getFullYear() == today.getFullYear() & expiryDate.getMonth() == today.getMonth()){
                       if(expiryDate.getDate() >= today.getDate() & expiryDate.getDate()<=31 ){
                        const data = new CupenDB({
                            name: req.body.name,
                            expiryDate: req.body.date,
                            offer: offerPrice,
                            minLimite: req.body.max,
                            image: req.file.filename,
                            coupenId: req.body.coupenId,
                        });
                        await data.save();
                        res.redirect('/admin/coupens')

                       }else{
                        res.render('addCuppen', { message: "Invalid Date month" })
                       }
                       
                    }else{
                        const data = new CupenDB({
                                name: req.body.name,
                                expiryDate: req.body.date,
                                offer: offerPrice,
                                minLimite: req.body.max,
                                image: req.file.filename,
                                coupenId: req.body.coupenId,
                            });
                            await data.save();
                            res.redirect('/admin/coupens')
                    }
                          
                
            } else {
                res.render('addCuppen', { message: "Invalid Date year" })

            }
        } else {
            res.render('addCuppen', { message: " Offer Rate Must Be More Than 20 And Below 70 " })
        }

    } catch (error) {
        console.log(error.message);
    }
}


const loadaddCuppen = async (req, res) => {
    try {
        res.render('addCuppen')
    } catch (error) {
        console.log(error.message);
    }
}


const coupens = async (req, res) => {
    try {
        const data = await CupenDB.find({})

        res.render('coupens', { data: data })
    } catch (error) {
        console.log(error.message);
    }
}


const loadeditCuppen = async (req, res) => {
    try {
        const data = await CupenDB.findById({ _id: req.query.id });
        res.render('editCoupens', { data: data })
    } catch (error) {
        console.log(error.message);
    }
}


const editCuppen = async (req, res) => {
    try {
        const data = await CupenDB.findById({ _id: req.query.id });
        const alreadyImage = data.image;
        const today = new Date();
        const offerPrice = req.body.offerPrice;
        const expiryDate = new Date(req.body.validity);
        if (req.file) {
            if (offerPrice >= 20 & offerPrice <= 70) {
                if (expiryDate.getFullYear() >= today.getFullYear() & expiryDate.getMonth() >= today.getMonth()) {
                    if(expiryDate.getFullYear() == today.getFullYear() & expiryDate.getMonth() == today.getMonth()){
                       if(expiryDate.getDate() >= today.getDate() & expiryDate.getDate()<=31 ){
                        const data = await CupenDB.findByIdAndUpdate({ _id: req.query.id }, {
                        $set: {
                            name: req.body.name,
                            expiryDate: req.body.validity,
                            offer: offerPrice,
                            minLimite: req.body.min,
                            image: req.file.filename,
                            coupenId: req.body.coupenId,
                        }
                       });
                       res.redirect('/admin/coupens');
                    
                    }else{
                        res.render('editCoupens', { message: "Invalid Date", data: data })
                       }
                    }else{
                        
                    const data = await CupenDB.findByIdAndUpdate({ _id: req.query.id }, {
                        $set: {
                            name: req.body.name,
                            expiryDate: req.body.validity,
                            offer: offerPrice,
                            minLimite: req.body.min,
                            image: req.file.filename,
                            coupenId: req.body.coupenId,
                        }
                    });
                    res.redirect('/admin/coupens');
                    }
                } else {
                    res.render('editCoupens', { message: "Invalid Date", data: data })

                }
            } else {
                res.render('editCoupens', { message: " Offer Rate Must Be More Than 20 And Below 70 ", data: data })
            }

        } else {
            if (offerPrice >= 20 & offerPrice <= 70) {
                if (expiryDate.getFullYear() >= today.getFullYear() & expiryDate.getMonth() >= today.getMonth()) {
                    if(expiryDate.getFullYear() == today.getFullYear() & expiryDate.getMonth() == today.getMonth()){
                       if(expiryDate.getDate() >= today.getDate() & expiryDate.getDate()<=31 ){
                        const data = await CupenDB.findByIdAndUpdate({ _id: req.query.id }, {
                        $set: {
                            name: req.body.name,
                            expiryDate: req.body.validity,
                            offer: offerPrice,
                            minLimite: req.body.min,
                            image: alreadyImage,
                            coupenId: req.body.coupenId,
                        }
                       });
                       res.redirect('/admin/coupens');
                    
                    }else{
                        res.render('editCoupens', { message: "Invalid Date", data: data })
                       }
                    }else{
                        
                    const data = await CupenDB.findByIdAndUpdate({ _id: req.query.id }, {
                        $set: {
                            name: req.body.name,
                            expiryDate: req.body.validity,
                            offer: offerPrice,
                            minLimite: req.body.min,
                            image: alreadyImage,
                            coupenId: req.body.coupenId,
                        }
                    });
                    res.redirect('/admin/coupens');
                    }
                } else {
                    res.render('editCoupens', { message: "Invalid Date", data: data })

                }
            } else {
                res.render('editCoupens', { message: " Offer Rate Must Be More Than 20 And Below 70 ", data: data })
            }
        }

    } catch (error) {
        console.log(error.message);
    }
}

const deleteCoupen = async (req, res) => {
    try {

        const { id } = req.query;
        await CupenDB.findByIdAndDelete({ _id: id });

    } catch (error) {
        console.log(error.message);
    }
}
// ############# offer ##################

const offer = async (req, res) => {
    try {
        const data = await OfferDB.find({});
        res.render('offer', { offer: data });
    } catch (error) {
        console.log(error.message);
    }
}

const loadaddOffer = async (req, res) => {
    try {
        res.render('addOffer')
    } catch (error) {
        console.log(error.message);
    }
}

const verifyOffer = async (req, res) => {
    try {
        const data = await OfferDB.find({});
        let value;
        const today = new Date();
        const offerPrice = req.body.offerPrice;
        const expiryDate = new Date(req.body.date);
        const exist = data.find((p) => p.iteam == req.body.offerIteam)

        if (!exist) {
            if (offerPrice >= 20 & offerPrice <= 70) {
                if (expiryDate.getFullYear() >= today.getFullYear() & expiryDate.getMonth() >= today.getMonth()) {
                    if(expiryDate.getFullYear() == today.getFullYear() & expiryDate.getMonth() == today.getMonth()){
                       if(expiryDate.getDate() >= today.getDate() & expiryDate.getDate()<=31 ){
                    const data = new OfferDB({
                        name: req.body.title,
                        iteam: req.body.offerIteam,
                        offerRate: req.body.offerPrice,
                        validity: req.body.date
                    });
                    await data.save();
                    res.redirect('/admin/offer');
                    
                       } else {
                           res.render('addOffer', { message: "Invalid Date" })
                       }
                    }else{
                        
                    const data = new OfferDB({
                        name: req.body.title,
                        iteam: req.body.offerIteam,
                        offerRate: req.body.offerPrice,
                        validity: req.body.date
                    });
                    await data.save();
                    res.redirect('/admin/offer');
                    }
            } else {
                res.render('addOffer', { message: "Invalid Date" })
            }
        }else{
            res.render('addOffer', { message: " Offer Rate Must Be More Than 20 And Below 70 " })
        }
        } else {
            res.render('addOffer', { message: "this iteam already have offer" })
        }


    } catch (error) {
        console.log(error.message);
    }
}


const deleteOffer = async (req, res) => {
    try {
        const { offerId } = req.query;
        await OfferDB.findByIdAndDelete({ _id: offerId });

    } catch (error) {
        console.log(error.message);
    }
}


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
            console.log("save",array.length)
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

const adminLogout = async (req, res) => {
    try {
        req.session.destroy();
        res.redirect('/admin');
    } catch (error) {
        console.log(error.message);
    }
}

module.exports = {
    adminLogin,
    veryfyLogin,
    dashboard,
    chart,
    viewUser,
    blockUser,
    loadaddUser,
    addUser,
    viewProducts,
    loadaddProducts,
    addProducts,
    editProducts,
    listProduct,
    UpdateProducts,
    category,
    loadaddcategory,
    addcategory,
    loadeditcategory,
    editcategory,
    listcategory,
    adminLogout,
    // test,
    viewOrders,
    ordersList,
    orderDetailes,
    editOrders,
    cancelOrder,
    orderStatus,


    addCuppen,
    loadaddCuppen,
    coupens,
    loadeditCuppen,
    editCuppen,
    deleteCoupen,

    offer,
    loadaddOffer,
    verifyOffer,
    deleteOffer,

    createReport,
    createReportPdf,
    weaklyReport,
    monthlyReport,
    yearlyReport,
}