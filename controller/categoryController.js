const mongoose = require('mongoose')
const CategoryDb = require("../model/categoryModel");

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


module.exports ={
    category,
    loadaddcategory,
    addcategory,
    loadeditcategory,
    editcategory,
    listcategory,
}

