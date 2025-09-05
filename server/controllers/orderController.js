import Order from "../models/Order.js";
import Product from "../models/Product.js";
import stripe from 'stripe';
import User from '../models/user.js'
//Place Order COD: /api/order/cod
export const placeOrderCOD = async (req, res)=>{
    try {
        const userId = req.user.id;
        const { items, address} = req.body;
        
        if(!address || items.length === 0) {
            return res.json({success: false, message: "Invalid data."});
        }
        
        // Fetch all product details concurrently using Promise.all
        const productPromises = items.map(async (item) => {
            const product = await Product.findById(item.product);
            if (!product) {
                // Return a specific error if a product is not found
                throw new Error(`Product with ID ${item.product} not found.`);
            }
            return {
                price: product.offerPrice,
                quantity: item.quantity
            };
        });

        // Wait for all product promises to resolve
        const productDetails = await Promise.all(productPromises);

        // Calculate the total amount
        let amount = productDetails.reduce((total, item) => {
            return total + item.price * item.quantity;
        }, 0);
    
        // 2% Tax Charge
        amount += Math.floor(amount * 0.02);

        // Best practice: In a real app, you would retrieve the userId from the
        // authenticated session (e.g., from a JWT token) for security.
        // We'll proceed with req.body for now as we don't have that setup.

        await Order.create({
            userId,
            items,
            amount,
            address,
            paymentType: "COD"
        });

        return res.json({success: true, message: "Order Placed Successfully"});

    } catch(err) {
        console.error("Order placement error:", err);
        return res.json({success: false, message: err.message});
    }
};

//Place Order Stripe: /api/order/stripe
// export const placeOrderStripe = async (req, res)=>{
//     try {
//         const userId = req.user.id;
//         const { items, address} = req.body;
        
//         const {origin} = req.headers;
        

//         if(!address || items.length === 0) {
//             return res.json({success: false, message: "Invalid data."});
//         }
        
//         let productData = [];

//         // Fetch all product details concurrently using Promise.all
//         const productPromises = items.map(async (item) => {
//             const product = await Product.findById(item.product);
//             if (!product) {
//                 // Return a specific error if a product is not found
//                 throw new Error(`Product with ID ${item.product} not found.`);
//             }
//             productData.push({
//                 name:product.name,
//                 price : product.offerPrice,
//                 quantity: item.quantity,
//             })
//             return {
//                 // (await acc) +
//                 price: product.offerPrice,
//                 quantity: item.quantity
//             };
//         });

//         // Wait for all product promises to resolve
//         const productDetails = await Promise.all(productPromises);

//         // Calculate the total amount
//         let amount = productDetails.reduce((total, item) => {
//             return total + item.price * item.quantity;
//         }, 0);
    
//         // 2% Tax Charge
//         amount += Math.floor(amount * 0.02);

//         // Best practice: In a real app, you would retrieve the userId from the
//         // authenticated session (e.g., from a JWT token) for security.
//         // We'll proceed with req.body for now as we don't have that setup.

//         const order = await Order.create({
//             userId,
//             items,
//             amount,
//             address,
//             paymentType: "Online"
//         });
//         //Stripe Gateway Initialize
//         const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);
//         //create line items for stripe
//         const line_items = productData.map(()=>{
//             return {
//                 price_data:{
//                     currency: 'usd',
//                     product_data:{
//                         name: item.name,
//                     },
//                     unit_amount : Math.floor(item.price + item.price * 0.02) * 100
//                 },
//                 quantity:item.quantity,
//             }
//         })
//         //create session
//         const session = await stripeInstance.checkout.sessions.create({
//             line_items,
//             mode: 'payment',
//             success_url: `${origin}/loader?next=my-orders`,
//             cancel_url:`${origin}cart`,
//             metadata:{
//                 orderId: order._id.toString(),
//                 userId,

//             }

//         })

//         return res.json({success: true, url: session.url});

//     } catch(err) {
//         console.error("Order placement error:", err);
//         return res.json({success: false, message: err.message});
//     }
// };
export const placeOrderStripe = async (req, res)=>{
    try {
        const userId = req.user.id;
        const { items, address} = req.body;
        
        const {origin} = req.headers;
        
        if(!address || items.length === 0) {
            return res.json({success: false, message: "Invalid data."});
        }
        
        // Fetch all product details concurrently and create the productData array.
        // This is a more reliable approach than pushing inside an async map.
        const productData = await Promise.all(items.map(async (item) => {
            const product = await Product.findById(item.product);
            if (!product) {
                // Return a specific error if a product is not found
                throw new Error(`Product with ID ${item.product} not found.`);
            }
            return {
                name: product.name,
                price: product.offerPrice,
                quantity: item.quantity,
            };
        }));
        
        // Calculate the total amount from the fetched productData
        let amount = productData.reduce((total, item) => {
            return total + item.price * item.quantity;
        }, 0);
    
        // 2% Tax Charge
        amount += Math.floor(amount * 0.02);

        // Create the order in the database
        const order = await Order.create({
            userId,
            items,
            amount,
            address,
            paymentType: "Online"
        });
        
        //Stripe Gateway Initialize
        const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);

        const line_items = productData.map((item) => {
            return {
                price_data:{
                    currency: 'usd',
                    product_data:{
                        name: item.name,
                    },
                    unit_amount : Math.floor(item.price + item.price * 0.02) * 100
                },
                quantity: item.quantity,
            }
        });
        


        //create session
        const session = await stripeInstance.checkout.sessions.create({
            line_items,
            mode: 'payment',
            success_url: `${origin}/loader?next=my-orders`,
            cancel_url:`${origin}/cart`,
            metadata:{
                orderId: order._id.toString(),
                userId,
            }
        });

        return res.json({success: true, url: session.url});

    } catch(err) {
        console.error("Order placement error:", err);
        return res.json({success: false, message: err.message});
    }
};

//Stripe Webhooks to Verify Payments Action : /stripe
export const stripeWebhooks = async(request, response)=>{
    const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY)
    const sig = request.headers["stripe-signature"]
    let event;
    try{
        event = stripeInstance.webhooks.constructEvent(
            request.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    }catch(err){
        response.status(400).send(`Webhook Error : ${error.message}`)
    }
    // Handle the event
    switch(event.type){
        case "payment_intent.succeeded":{
            const payment_intent = event.data.object;
            const payment_intentId = paymentIntent.id;
            //Getting Session Metadata
            const session = await stripeInstance.checkout.sessions.list({
                payment_intent:paymentIntentId,
            })
            const {orderId, userId} = session.data[0].metadata;
            //Mark Payment as Paid
            await Order.findByIdAndUpdate(orderId, {isPaid:true})
            //Clear user cart
            await UserActivation.findByIdAndUpdate(userId, {cartItems: {}});
            break;

        }
         case "payment_intent.payment_failed":{
     const payment_intent = event.data.object;
            const payment_intentId = paymentIntent.id;
            //Getting Session Metadata
            const session = await stripeInstance.checkout.sessions.list({
                payment_intent:paymentIntentId,
            })
            const {orderId } = session.data[0].metadata;
            await Order.findByIdAndDelete(orderId);
            break;
            
    }
    default:
        console.error(`Unhandled event type ${event.type}`)
        break;
    } 
   response.json({recieved:true})

}

//Get Orders by User Id :/api/order/user
export const getUserOrders = async (req,res) =>{
    try{
        const userId = req.user.id;
        const orders = await Order.find({
            userId,
            $or:[{paymentType:"COD"},{isPaid:true}]
        }).populate("items.product address").sort({createdAt: -1});
        res.json({success:true,orders});
    }catch(err){
res.json({success:false, message: err.message});
    }
}

//Get All Order (for Seller /admin): api/order/seller
export const getAllOrders = async (req, res) =>{
try{
        const orders = await Order.find({
        $or:[{paymentType:"COD"},{isPaid:true}]
    }).populate("items.product address").sort({createdAt: -1});
    res.json({success:'true', orders});

}catch(err){
    res.json({succes:false, message:err.message})
}
}




