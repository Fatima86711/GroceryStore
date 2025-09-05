import Address from "../models/Address.js";

export const addAddress = async(req,res)=>{
    try{
        const userId = req.user.id;
const {  firstName, lastName, email, street, city,state, zipcode, country, phone} = req.body;
await Address.create({userId, firstName, lastName, email, street, city,state, zipcode, country, phone})
res.json({success:true, message:"Address added successfully"})   

}catch(err){
console.log(err.message);
res.json({success:false, message:err.message})
    }
}
//get address : /api/address/get

export const getAddress = async (req,res)=>{
    try{
        const userId = req.user.id;
        const addresses = await Address.find({userId})
        res.json({success:true, addresses})
    }
    catch(err){
        console.log(err.message);
res.json({success:false, message:err.message})

    }
}

