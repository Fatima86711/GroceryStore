//user authentication middleware
import jwt from 'jsonwebtoken';
//will be executed before executing the controller 
export const authUser = async (req , res, next)=>{
    const {token} = req.cookies;
    if(!token){
        return res.json({success: false, message: 'Not Authorized'})
    }
    try{
        const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);
        // if(tokenDecode.id){
          req.user = { id: tokenDecode.id };
        // }else{
            // return res.json({success: false, message:'Not Authorized'});
        // }
        next();
    }
    catch(err){
 return res.json({success: false, message:'Not Authorized'});
       
    }
}