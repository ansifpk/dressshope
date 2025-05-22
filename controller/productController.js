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
                
                if( req.body.Description.length<=20){
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
                }else{
                    const category = await CategoryDb.find({});

                    res.render('addProduct', { category: category, message: 'Length Of Description Shoulbe be Less than 20' });
                }
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
        console.log(productData)
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
                    if( req.body.Description.length<=20){
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
                    }else{
                        const category = await CategoryDb.find({});
                        const productData = await ProductDb.findById({ _id: req.query.id })
    
                        res.render('editProduct', { productData: productData, category: category, message: "Length Of Description Shoulbe be Less than 20" })
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

const getStoreDataForUser = async(req,res)=>{
    try {
        const cartData = await CartDB.findOne({userId:req.session.user_id}).populate({
            path: 'products.productId',
            populate: { path: 'categoryID' }})
           
        const wishlistData = await WishlistDB.findOne({userId:req.session.user_id})
        const offerData = await OfferDB.find({});
        const  cartTotal = cartData.products.reduce((acc,value)=>{value
           const offer =  offerData.find( iteam => iteam.iteam === value.productId.name || iteam.iteam === value.productId.categoryID.name)
           if(offer){
             return acc+ value.productId.Price*value.quandity - Math.round(value.productId.Price*value.quandity * offer.offerRate/100)
           }else{
             return acc+value.productId.Price*value.quandity
           }
       },0);
        return {cartData,wishlistData,offerData,cartTotal}
    } catch (error) {
        console.error(error.message)
    }
}

const loadProducts = async(req,res)=>{
    try {
  
        const {cartData,wishlistData,offerData,cartTotal} = await getStoreDataForUser(req,res);
        const limit = 8
        const totalProducts = await ProductDb.find({is_listed:true}).countDocuments();
        const categories = await CategoryDb.find({is_listed:true});
        const productData = await ProductDb.find({is_listed:true}).limit(limit).populate('categoryID')
        const  rate = offerData.offerRate/100;
        const totalPage = Math.ceil(totalProducts/limit);
        res.render('products',{productData,wishlistData,offerData,rate,cartData,cartTotal,totalPage, currentPage:1,categories});
    } catch (error) {
        console.log(error.message);
    }
};

const mcollection = async(req,res)=>{
    try {
        const {cartData,wishlistData,offerData,cartTotal} = await getStoreDataForUser(req,res);
        const limit = 8
      
        let productData = await ProductDb.find({is_listed:true}).populate('categoryID')
        productData = productData.filter((val)=>val.categoryID.is_listed == true && val.categoryID.name == "MEN" );
        const totalPage = productData.length
        productData = productData.slice(0,8)

        res.render("mcollection", {
        productData: productData,
        cartData,
        wishlistData,
        offerData,
        cartTotal,
        currentPage:1,
        totalPage:Math.ceil(totalPage/limit)
      });
    } catch (error) {
        console.error(error.message)
    }
}
const wcollection = async(req,res)=>{
try {
       const {cartData,wishlistData,offerData,cartTotal} = await getStoreDataForUser(req,res);
        const limit = 8
      
        let productData = await ProductDb.find({is_listed:true}).populate('categoryID')
        productData = productData.filter((val)=>val.categoryID.is_listed == true && val.categoryID.name == "WOMEN" );
        const totalPage = productData.length
        productData = productData.slice(0,8);
        
        res.render("wcollection", {
        productData: productData,
        cartData,
        wishlistData,
        offerData,
        cartTotal,
        currentPage:1,
        totalPage:Math.ceil(totalPage/limit)
      });
    } catch (error) {
        console.error(error.message)
    }
}
const changePage = async(req,res)=>{
    try {
        const {page,sort,filter} = req.query;
        const limit = 8;
        const query = {};

   switch (sort) {
      case "Sort by Price: high to low":
        query.Price=-1
        break;
        case "Sort by Price: low to high":
        query.Price=1
        break;
      case "Sort by Name : Z-A":
        query.name=-1
        break;
      case "Sort by Name : A-Z":
        query.name=1
        break;
    
      default:
         query.name=1
        break;
    }
        const {cartData,wishlistData,offerData} = await getStoreDataForUser(req,res);
        const products =  await ProductDb.find({is_listed:true}).skip((page-1)*limit).limit(page*limit).sort(query).populate('categoryID')
        const data =  products.filter((val)=>{
            if( filter == "All"){
                return val.categoryID.is_listed == true
            }else{
                return val.categoryID.is_listed == true && val.categoryID.name == filter
            }
        });
        res.render('productGrid', { productData:data, offerData, wishlistData, cartData });
        
    } catch (error) {
         console.error(error.message);
    }
}

module.exports = {
    viewProducts,
    loadaddProducts,
    addProducts,
    editProducts,
    UpdateProducts,
    listProduct,

    //user side 
    changePage,
    loadProducts,
    mcollection,
    wcollection,
}