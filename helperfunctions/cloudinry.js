 const cloudinary = require('cloudinary').v2;


const  cloudineryHelper = async function(filePath,folder) {
    cloudinary.config({
        cloud_name: process.env.CLOUD_NAME,
        api_key: process.env.CLOUD_KEY,
        api_secret: process.env.CLOUD_SECRET,
    });

    const {secure_url,public_id} = await cloudinary.uploader.upload(filePath,{
                 folder:folder,
                 resource_type: "auto"
    })
    return {secure_url,public_id}
}


module.exports = cloudineryHelper;