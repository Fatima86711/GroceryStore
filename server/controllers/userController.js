import User from "../models/user.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken'
// /api/user/register
export const register = async(req,res)=>{
    try{  
          const {name,email, password} = req.body;
    if(!name || !email || !password ){
        return res.json({success:false, message:"Missing details."})
    }
    const existingUser = await User.findOne({email})
    if(existingUser){
            return res.json({success:false, message: 'User Already Exists'})
    }
    const hashedPassword = await bcrypt.hash(password,10)
    const user = await User.create({name, email, password:hashedPassword})
    const token = jwt.sign({id:user._id},process.env.JWT_SECRET,{expiresIn:'7d'})

    res.cookie('token',token,{
         httpOnly:true,
         secure:process.env.NODE_ENV ==='production',
        
         sameSite:process.env.NODE_ENV ==='production'? 'none':'strict',
         maxAge:7*24*60*60*1000,
    });
    return res.json({success:true,user:{email: user.email, name:user.name} })

    }catch(err){
    return res.json({success:false, message:err.message})
    }
}
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Create JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // Set cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Send response
    return res.json({
      success: true,
      user: {
        
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("Login error:", err.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

//check Auth : /api/user/is-auth
export const isAuth = async (req, res) =>{
    try{
        const { id } = req.user;
        const user = await User.findById(id).select('-password')
       if(!user){
        return res.json({success:false,message:"User not found"})

       }
        return res.json({success:true,user})
    }catch(err){
        console.log(err.message);
        return res.json ({success:false, message:"Internal Server Error."})
    }
}
export const logout = async (req, res) =>{
    try{
res.clearCookie('token', {
    httpOnly:true,
    secure:process.env.NODE_ENV =='production',
    sameSite:process.env.NODE_ENV =='production'?'none':'strict',

});
return res.json({success:true, message:'Logged Out'})
    }
    catch(err){
        console.log(err.message);
        return res.json ({success:false, message:err.message})
   
    }
}
