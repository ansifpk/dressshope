const mongoose = require('mongoose')
const CategoryDb = require("../model/categoryModel");

const category = async (req, res) => {
    try {
        const limit = 2;
        const count = await CategoryDb.find({}).countDocuments();
        const categoryData = await CategoryDb.find({}).limit(limit).sort({createdAt:-1});
        res.render('category', { categoryData,totalPage:Math.ceil(count/limit) })
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
        const {name,description} = req.body;
        const nameCheck = await CategoryDb.findOne({ name: { $regex: new RegExp(name, "i") } })
        if(nameCheck){
            return res.json({success:false,field:'name',message: 'category name already exists'})
        }
        if(description.length < 20){
            return res.json({success:false,field:"description",message: 'Category Description should be more than 20 words!.'})
        }
        
         const category = new CategoryDb({
                name: name,
                Description: description,
                is_listed: true
            });

        await category.save();
        return res.json({success:true,message:`New Category ${name} Added Successfully!.`})

        
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
        const {_id} = req.query;
        const {name,description} = req.body;

        const category = await CategoryDb.findById({_id});
        if(!category){
            return res.json({success:false,message:"Category Not Found!."});
        }

        if(!/^[A-Za-z]+(?:\s+[A-Za-z]+)*$/.test(name)){
            return res.json({success:false,message:"Invalid Category Name!."});
        }

        const nameExist = await CategoryDb.findOne({ name:name });
        
        if(nameExist && nameExist._id.toString() !== category._id.toString() ){
              return res.json({success:false,message:"Category Name Already Exists!."});
        }

        await CategoryDb.findByIdAndUpdate({ _id: _id }, {
                    $set: {
                        name: name,
                        Description:description,

                    }
                });

         return res.json({success:true,message:"Successfully Edited The Category!."});

    } catch (error) {
        console.log(error.message)

    }
}


const listcategory = async (req, res) => {
    try {
        const { categoryId } = req.body;
   
        const category = await CategoryDb.findById(categoryId);
        if (!category) {
            return res.json({ success: false, message: "Category Not Found!." });
        }
        const newcategory =  await CategoryDb.findByIdAndUpdate({ _id: categoryId },{$set:{is_listed:!category.is_listed}},{new:true});
        return res.json({success:true,action:newcategory.is_listed});

    } catch (error) {
        console.log(error.message)
    }
}

const searchCategory = async (req, res) => {
    try {
        const { search } = req.query;
        let limit = 2;
        const count = await CategoryDb.find({$or: [{ name: { $regex: ".*" + search + ".*", $options: "i" } }]}).countDocuments()
        const category = await CategoryDb.find({$or: [{ name: { $regex: ".*" + search + ".*", $options: "i" } }]}).limit(limit)
        return res.json({category,totelPage:Math.ceil(count/limit)});

    } catch (error) {
        console.log(error.message)
    }
}

const filterAndsortCategory = async (req, res) => {
    try {
       
        
             const { filter,sort,search} = req.query;
             let category
             let totelPage = 0;
             const limit = 2;
             const query = {};
        
            switch (sort) {
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
        
        
             if(filter == 'List'){
                category = await CategoryDb.find({$and:[{is_listed:true},{ name: { $regex: ".*" + search + ".*", $options: "i" }}]}).sort(query).limit(limit)
             }else if(filter == 'Un List'){
                category = await CategoryDb.find({$and:[{is_listed:false},{ name: { $regex: ".*" + search + ".*", $options: "i" }}]}).sort(query).limit(limit)
             }else{
                category = await CategoryDb.find({name: { $regex: ".*" + search + ".*", $options: "i" }}).sort(query).limit(limit)
             }
        
             totelPage = Math.ceil(category.length/limit);
             
             res.json({category,totelPage:totelPage})

    } catch (error) {
        console.log(error.message)
    }
}

const categoryPagination = async (req, res) => {
    try {
       
        
             const { filter,sort,search,page} = req.query;
             let category
             const limit = 2;
             const query = {};
    
            switch (sort) {
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
        
        
             if(filter == 'List'){
                category = await CategoryDb.find({$and:[{is_listed:true},{ name: { $regex: ".*" + search + ".*", $options: "i" }}]}).sort(query).skip((page-1)*limit).limit(limit*page)
             }else if(filter == 'Un List'){
                category = await CategoryDb.find({$and:[{is_listed:false},{ name: { $regex: ".*" + search + ".*", $options: "i" }}]}).sort(query).skip((page-1)*limit).limit(limit*page)
             }else{
                category = await CategoryDb.find({name: { $regex: ".*" + search + ".*", $options: "i" }}).sort(query).skip((page-1)*limit).limit(limit*page)
             }
        
              res.json({category})

    } catch (error) {
        console.log(error.message)
    }
}


module.exports ={
    category,
    loadaddcategory,
    addcategory,
    loadeditcategory,
    editcategory,
    listcategory,
    searchCategory,
    filterAndsortCategory,
    categoryPagination,
}

