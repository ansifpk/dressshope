const loginAdmin = async(req,res,next)=>{
    try {
        if(!req.session.admin_id){
            res.redirect('/admin')
        }else{
            next()
        }
        
    } catch (error) {
        console.log(error.message)
    }
}
const logoutAdmin = async(req,res,next)=>{
    try {
        if(req.session.admin_id){
            res.redirect('/admin/dashboard')
        }else{
            next()
        }
        
    } catch (error) {
        console.log(error.message)
    }
}
module.exports={
    loginAdmin,
    logoutAdmin
}