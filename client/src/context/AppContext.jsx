import {createContext, useContext,useEffect,useState } from "react";
import {useNavigate} from "react-router-dom";
import { dummyProducts } from "../assets/assets";
import toast from "react-hot-toast";
export const AppContext = createContext();
import axios from "axios";
axios.defaults.withCredentials = true;

axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL;

export const AppContextProvider = ({children})=>{
    const currency = import.meta.env.VITE_CURRENCY;
const navigate = useNavigate();
const [user, setUser]= useState(null);
const [isSeller,setSeller ]= useState(false);
const [showUserLogin, setShowUserLogin] = useState(false);
const [products, setProducts] = useState([]);
const [cartItems, setCartItems] = useState({});


const [searchQuery, setSearchQuery] = useState({})
//Fetch Seller Status
const fetchSeller = async () =>{
    try{
        const {data} = await axios.get('/api/seller/is-auth');
        if(data.success)
            setSeller(true)
        else{
            setSeller(false)
        }

    }catch(err){
        setSeller(false);
    }
}
//fetch User Auth Status, user Data and Cart Items
const fetchUser = async ()=>{
    try{
        const {data} =await axios.get('/api/user/is-auth');
        if(data.success){
            setUser(data.user)
            console.log('from fetch user ', data.user)
            setCartItems(data.user?.cartItems || {})
        }else{
            setUser(null)
        }
    }catch(err){
        setUser(null);
    }
}


//fetch all products
const fetchProducts =async ()=> {
    
    // setProducts(dummyProducts);
    try{
        const {data} = await axios.get('/api/product/list')
        if(data.success){
            setProducts(data.products)
        }else{
            toast.error(data.message)
        }
    }
    catch(err){
        
            toast.error(err.message)
    }
}
//add product to cart
const addToCart = (itemId)=>{
    let cartData = structuredClone(cartItems);
    if(cartData[itemId]){
        cartData[itemId] += 1;
    }else{
        cartData[itemId] = 1;
    }
    setCartItems(cartData);
    toast.success("Added to the Cart");
}
//update cart item
const updateCartItem = (itemId, quantity)=>{
    let cartData = structuredClone(cartItems);
    cartData[itemId] = quantity;
    setCartItems(cartData);
     toast.success("Cart Updated")
}
//remove cart item
const removeFromCart =(itemId)=>{
let cartData = structuredClone(cartItems);
if(cartData[itemId]){
    cartData[itemId]-=1;
    if(cartData[itemId]==0){
        delete cartData[itemId];
    }
}

setCartItems(cartData);
toast.success("Removed From Cart.");
}
//Get cart items
const getCartCount = ()=>{
    let totalCount = 0;
    for(const item in cartItems){
        totalCount +=cartItems[item]
    }
    return totalCount;
}
//Get cart Total Amount
const getCartAmount = ()=>{
    let totalAmount = 0
    for(const items in cartItems){
        let itemInfo = products.find((product)=>product._id ===items );
        if(cartItems[items]>0){
            totalAmount += itemInfo.offerPrice * cartItems[items]
        }
    }
    return Math.floor(totalAmount * 100)/100;
}
useEffect(()=>{
    
    fetchUser()
    fetchSeller()
    fetchProducts();
},[]);
useEffect(()=>{
const updateCart = async ()=>{
    try{
        const {data} = await axios.post('/api/cart/update', {cartItems})
        if(!data.success){
            // console.log('error is comming from here ', data)
            toast.error(data.message)
        }
    }catch(err){
        //   console.log('error is comming from hhere ', err.message)
           
        toast.error(err.message);
    }
}
if(user){
    
//   console.log("Fetched user: ",user);
updateCart();
}
},[cartItems]);


const value = {
    navigate, user,setUser, isSeller, setCartItems,setSeller, showUserLogin, setShowUserLogin, products,cartItems, currency,addToCart, updateCartItem,removeFromCart,searchQuery, setSearchQuery,getCartAmount, getCartCount, axios,
fetchProducts,
};
return (
    <AppContext.Provider value = {value}>
        {children}
    </AppContext.Provider>
)
}
export const useAppContent = ()=>{
    return useContext(AppContext);
}