import User from "../models/user.js";
// update User CartData : /api/cart/update
export const updateCart = async (req, res)=>{
    try{
         const userId = req.user.id; 
const { cartItems} = req.body;
const user = await User.findById(userId);
if(!user)
{
    return res.status(404).json({success: false, message: "User not found"})
}
user.cartItems = cartItems;
await user.save();
res.json({success:true, message:"Cart Updated"})
    }catch(err){
console.log(err.message);
res.status(500).json({success:false, message:err.message})
    }
}