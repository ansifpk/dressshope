const UserDb = require("../model/userModel");
const blockUser = async(req,res,next)=>{
    try {
        const data = await UserDb.findOne({_id:req.session.user_id});
       if(data.is_blocked === true){
         console.log(data.is_blocked)
         req.session.destroy()
         res.redirect('/')
       }else{
          next()
       }
    } catch (error) {
        console.log(error.message)
    }
}
module.exports={
    blockUser
}