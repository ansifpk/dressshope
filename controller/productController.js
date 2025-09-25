const ProductDb = require("../model/productModel");
const CategoryDb = require("../model/categoryModel");
const CartDB = require("../model/cartModel");
const WishlistDB = require("../model/wishlist");
const OfferDB = require("../model/offerModel");
const getStoreDataForUser = require("../helperfunctions/helper");
const cloudineryHelper = require("../helperfunctions/cloudinry");

const viewProducts = async (req, res) => {
  try {

    const limit = 4;
    const productData = await ProductDb.find({})
      .sort({createdAt:-1})
      .populate("categoryID")
      .limit(limit )
     const categories = await CategoryDb.find({});
    const count = await ProductDb.find()
      .populate("categoryID")
      .countDocuments();

    res.render("productList", {
      productData: productData,
      categories,
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    console.log(error.message);
  }
};

const loadaddProducts = async (req, res) => {
  try {
    const category = await CategoryDb.find({});

    res.render("addProduct", { category: category });
  } catch (error) {
    console.log(error.message);
  }
};

const addProducts = async (req, res) => {
  try {

         const { title, category, stock, price, description } = req.body;
        
         let array = [];
         const nameCheck = await ProductDb.findOne({ name: { $regex: new RegExp(title, "i") } })
         const categoryCheck = await CategoryDb.findOne({ _id:category });
      
         if(nameCheck){
          return res.json({success:false,message:"This Product Name Already Exists!."})
         }
         
         if(description < 10){
          return res.json({success:false,message:"Description should be more than 10 word!."})
         }
         if(price <50 || price > 8000){
          return res.json({success:false,message:"Price SHould be in Between 50 and 8000!."})
         }
         if(stock < 1){
          return res.json({success:false,message:"Stock should be more than 1!."})
         }
         
         if(!categoryCheck){
          return res.json({success:false,message:"Category Not Found!."})
         }

         for (let i = 0; i < 4; i++) {
      
          const { secure_url, public_id } = await cloudineryHelper(
            req.files[`file-upload${i}`][0].path,
            "products"
          );
          array[i] = { secure_url, public_id };
        }
          const productData = new ProductDb({
            name: title,
            Price: price,
            stock: stock,
            image:array,
            Description: description,
            categoryID:category,
          });

          await productData.save();
         return res.json({success:true,message:"Successfully created The Product!."})

       
  } catch (error) {
    console.log(error.message);
  }
};

const editProducts = async (req, res) => {
  try {
    const category = await CategoryDb.find({});
    const productData = await ProductDb.findById({ _id: req.query._id }).populate('categoryID');

    res.render("editProduct", {
      productData: productData,
      category: category,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const UpdateProducts = async (req, res) => {
  try {
    const _id = req.query._id;
    const { title, category, stock, price, description } = req.body;
   
    const data = await ProductDb.findById({ _id: _id });
   
    let array = data.image;
    if (!data) {
      return res.json({ success: false, message: "Product Not Found!." });
    }

    const check = await ProductDb.findOne({
      name: { $regex: new RegExp(title, "i") },
    });
 
    if (check && check._id.toString() !== data._id.toString()) {
      return res.json({
        success: false,
        message: "This Product Name Already Exists!.",
      });
    }

    if (stock < 0) {
      return res.json({
        success: false,
        message: "stock should be greaterthan 0",
      });
    }
  
    if (price < 50 || price > 8000) {
      return res.json({
        success: false,
        message: "Product Price Must be in between 50 and 8000",
      });
    }
   
    if (description.length < 10) {
      return res.json({
        success: false,
        message: "Description Shoulbe be more than 10 words!.",
      });
    }
   
  
    for (let i = 0; i < 4; i++) {
      if (req.files[`file-upload${i}`]) {
        const { secure_url, public_id } = await cloudineryHelper(
          req.files[`file-upload${i}`][0].path,
          "products"
        );
        array[i] = { secure_url, public_id };
      }
    }

    await ProductDb.findByIdAndUpdate(
      { _id: _id },
      {
        $set: {
          name: title,
          Description: description,
          Price: price,
          image: array,
          stock: stock,
          categoryID: category,
        },
      }
    );

    return res.json({
      success: true,
      message: "Product Edited Successfully!.",
    });
  } catch (error) {
    console.log(error.message, "ji");
  }
};

const listProduct = async (req, res) => {
  try {
    const { _id } = req.query;
    const product = await ProductDb.findOne({ _id: _id });
    if(!product){
      return res.json({success:false,message:"Product Not Found!."})
    }
    product.is_listed = !product.is_listed;

    await product.save();
    return res.json({success:true,message:`Successfulyy ${product.is_listed?"Listed":"UnListed"} The Product`})
  
  } catch (error) {
    console.log(error.message);
  }
};

const searchProduct = async (req, res) => {
  try {
    const { search } = req.query;
    let limit = 4;
    const count = await ProductDb.find({$or: [{ name: { $regex: ".*" + search + ".*", $options: "i" } }]}).countDocuments()
    const products = await ProductDb.find({$or: [{ name: { $regex: ".*" + search + ".*", $options: "i" } }]}).limit(limit).populate("categoryID");
   
    return res.send({products,totelPage:Math.ceil(count/limit)})
  } catch (error) {
    console.log(error.message);
  }
};

const paginationProduct = async (req, res) => {
  try {
    const { page,search,sort,} = req.query;
    let limit = 4;
   
    const query = {};
    switch (sort) {
      case "Price Low - High":
        query.Price = 1;
        break;
        case "Price High - Low":
        query.Price = -1;
        break;
        case "Name Z - A":
        query.name = -1;
        break;
        case "Name A - Z":
        query.name = 1;
        break;
        case "Old":
        query.createdAt = 1;
        break;
        default:
        query.createdAt = -1;
        break;
    }

  
    let products = await ProductDb.find({ name: { $regex: ".*" + search + ".*", $options: "i" }}).skip((page*limit)-limit).limit(limit).sort(query).populate("categoryID")
       

    return res.send({products:products})
  } catch (error) {
    console.log(error.message);
  }
};

const filterAndsortProduct = async(req,res)=>{
  try {

     const { filter,sort,search} = req.query;
     let products
     let totelPage = 0;
     const limit = 4;
     const query = {};

    switch (sort) {
      case "Price Low - High":
        query.Price = 1;
        break;
        case "Price High - Low":
        query.Price = -1;
        break;
        case "Name Z - A":
        query.name = -1;
        break;
        case "Name A - Z":
        query.name = 1;
        break;
        case "Old":
        query.createdAt = 1;
        break;
        default:
        query.createdAt = -1;
        break;
    }


     if(filter == 'IN STOCK'){
        products = await ProductDb.find({$and:[{stock:{$gt:0}},{ name: { $regex: ".*" + search + ".*", $options: "i" }}]}).sort(query).populate("categoryID");
        totelPage = Math.ceil(products.length/limit);
     }else if(filter == 'OUT OF STOCK'){
        products = await ProductDb.find({$and:[{stock:{$lt:1}},{ name: { $regex: ".*" + search + ".*", $options: "i" }}]}).sort(query).populate("categoryID")
     }else if(filter !== ""){
       products = await ProductDb.find({name: { $regex: ".*" + search + ".*", $options: "i" }}).sort(query).populate("categoryID")
       products = products.filter((product)=>product.categoryID.name == filter);
     }else{
      products = await ProductDb.find({name: { $regex: ".*" + search + ".*", $options: "i" }}).sort(query).populate("categoryID")
     }

     totelPage = Math.ceil(products.length/limit);
     products = products.slice(0,limit)
     
     res.json({products,totelPage:totelPage})

  } catch (error) {
     console.log(error.message);
  }
}

//############################################################################################
//#########################    user side            ##########################################
//############################################################################################

const loadProducts = async (req, res) => {
  try {
    const { cartData, wishlistData, offerData, cartTotal } = await getStoreDataForUser(req, res);
     
    const limit = 8;
    const totalProducts = await ProductDb.find({
      is_listed: true,
    }).countDocuments();

    const categories = await CategoryDb.find({ is_listed: true });
    const productData = await ProductDb.find({ is_listed: true })
      .sort({createdAt:-1})
      .limit(limit)
      .populate("categoryID");

    const rate = offerData.offerRate / 100;
    const totalPage = Math.ceil(totalProducts / limit);
    res.render("products", {
      productData,
      wishlistData,
      offerData,
      rate,
      cartData,
      cartTotal,
      totalPage,
      categories,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const mcollection = async (req, res) => {
  try {
    const { cartData, wishlistData, offerData, cartTotal } = await getStoreDataForUser(req, res);
      const limit = 8;

    let productData = await ProductDb.find({ is_listed: true }).sort({createdAt:-1}).populate(
      "categoryID"
    );
    productData = productData.filter(
      (val) => val.categoryID.is_listed == true && val.categoryID.name == "MEN"
    );
    
    const totalPage = Math.ceil(productData.length/limit)
    productData = productData.slice(0, limit);

    res.render("mcollection", {
      productData: productData,
      cartData,
      wishlistData,
      offerData,
      cartTotal,
      totalPage
    });
  } catch (error) {
    console.error(error.message);
  }
};
const wcollection = async (req, res) => {
  try {
    const { cartData, wishlistData, offerData, cartTotal } =  await getStoreDataForUser(req, res);
     
    const limit = 8;

    let productData = await ProductDb.find({ is_listed: true }).sort({createdAt:-1}).populate(
      "categoryID"
    );
    productData = productData.filter(
      (val) =>
        val.categoryID.is_listed == true && val.categoryID.name == "WOMEN"
    );
    const totalPage = Math.ceil(productData.length/limit)
    productData = productData.slice(0, limit);

    res.render("wcollection", {
      productData: productData,
      cartData,
      wishlistData,
      offerData,
      cartTotal,
      totalPage
    });
  } catch (error) {
    console.error(error.message);
  }
};
const changePage = async (req, res) => {
  try {
    const { page, sort, filter } = req.query;
    const limit = 8;
    const query = {};

    switch (sort) {
      case "Sort by Price: high to low":
        query.Price = -1;
        break;
      case "Sort by Price: low to high":
        query.Price = 1;
        break;
      case "Sort by Name : Z-A":
        query.name = -1;
        break;
      case "Sort by Name : A-Z":
        query.name = 1;
        break;
      case "Old":
        query.createdAt = 1;
        break;
      default:
        query.createdAt = -1;
        break;
    }
    const { cartData, wishlistData, offerData } = await getStoreDataForUser(
      req,
      res
    );
    const products = await ProductDb.find({ is_listed: true })
      .skip((page - 1) * limit)
      .limit(page * limit)
      .sort(query)
      .populate("categoryID");
    const data = products.filter((val) => {
      if (filter == "All") {
        return val.categoryID.is_listed == true;
      } else {
        return (
          val.categoryID.is_listed == true && val.categoryID.name == filter
        );
      }
    });
    res.render("productGrid", {
      productData: data,
      offerData,
      wishlistData,
      cartData,
    });
  } catch (error) {
    console.error(error.message);
  }
};

module.exports = {
  viewProducts,
  loadaddProducts,
  addProducts,
  editProducts,
  UpdateProducts,
  listProduct,
  searchProduct,
  paginationProduct,
  filterAndsortProduct,

  //user side

  changePage,
  loadProducts,
  mcollection,
  wcollection,
};
