const loginUser = async(req,res,next)=>{
    try {
        if(!req.session.user_id){
            res.redirect('/')
        }else{
            next()
        }
        
    } catch (error) {
        console.log(error.message)
    }
}
const logoutUser = async(req,res,next)=>{
    try {
        if(req.session.user_id){
            res.redirect('/home')
        }else{
            next()
        }
        
    } catch (error) {
        console.log(error.message)
    }
}
module.exports={
    loginUser,
    logoutUser
}