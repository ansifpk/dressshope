const mongoose = require('mongoose')
const ProductDb = require("../model/productModel");
const CategoryDb = require("../model/categoryModel");
const CartDB = require("../model/cartModel");
const WishlistDB = require("../model/wishlist");
const OfferDB = require("../model/offerModel");

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
        data.is_listed = !data.is_listed;

        data.save();
        res.redirect('/admin/productList')

    } catch (error) {
        console.log(error.message)

    }
}

//############################################################################################
//#########################    user side            ##########################################
//############################################################################################



const loadProducts = async(req,res)=>{
    try {
        const id = req.query.sort
        const cartData = await CartDB.findOne({userId:req.session.user_id}).populate({
            path: 'products.productId',
            populate: { path: 'categoryID' }})
        const wishlistData = await WishlistDB.findOne({userId:req.session.user_id}).populate('products.productId')
        const offerData = await OfferDB.find({});
        const productData = await ProductDb.find({is_listed:true}).populate('categoryID');
        const  rate = offerData.offerRate/100;
         let cartTotal=0;
         if(cartData){
         cartTotal = cartData.products.reduce((acc,value)=>{value
           const offer =  offerData.find( iteam => iteam.iteam === value.productId.name || iteam.iteam === value.productId.categoryID.name)
           if(offer){
             return acc+ value.productId.Price*value.quandity - Math.round(value.productId.Price*value.quandity * offer.offerRate/100)
           }else{
          
             return acc+value.productId.Price*value.quandity
           }
        },0)
    }
       

        var search='';
        if(req.query.search){
            search=req.query.search
        }
        let sort;
        if (id === "Defult Sort") {
            console.log('1')
            const productData = await ProductDb.find({is_listed:true}).populate('categoryID')
            res.render('products',{productData,wishlistData,offerData,rate,cartData,cartTotal});
        } else if (id === "Sort by Price: low to high") {
            console.log('2')
            sort = { Price: 1 };
            const productData = await ProductDb.find({is_listed:true}).populate('categoryID').lean().sort(sort).exec()
            productData.sort((a,b)=>a.Price-b.Price)
            res.render('products',{productData:productData,wishlistData,offerData,rate,cartData,cartTotal});
        } else if (id === "Sort by Price: high to low") {
            console.log('3')
            sort = { Price: -1 };
            const productData = await ProductDb.find({is_listed:true}).populate('categoryID').lean().sort(sort).exec()
            productData.sort((a,b)=>b.Price-a.Price)
            res.render('products',{productData:productData,wishlistData,offerData,rate,cartData,cartTotal});
       } else if (id === "Sort by Name : A-Z") {
        console.log('4')
           sort = { name: 1 };
           const productData = await ProductDb.find({is_listed:true}).populate('categoryID').lean().sort(sort)
           res.render('products',{productData,wishlistData,offerData,rate,cartData,cartTotal});
       } else if (id === "Sort by Name : Z-A") {
        console.log('5')
           sort = { name: -1 };
           const productData = await ProductDb.find({is_listed:true}).populate('categoryID').lean().sort(sort)
           res.render('products',{productData,wishlistData,offerData,rate,cartData,cartTotal});
       } else {
        console.log('6')
        const productData = await ProductDb.find({is_listed:true}).populate('categoryID')
        console.log(productData)
        res.render('products',{productData,wishlistData,offerData,rate,cartData,cartTotal});
        }
         
         
      
         
       
    } catch (error) {
        console.log(error.message);
    }
};



module.exports = {
    viewProducts,
    loadaddProducts,
    addProducts,
    editProducts,
    UpdateProducts,
    listProduct,

    //user side 

    loadProducts,
}