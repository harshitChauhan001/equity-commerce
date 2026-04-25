import { configureStore } from '@reduxjs/toolkit';
import productsReducer from './slices/productsSlice';
import orderReducer from './slices/orderSlice';
import authReducer from './slices/authSlice';
import cartReducer from './slices/cartSlice';
import orderHistoryReducer from './slices/orderHistorySlice';

const store = configureStore({
  reducer: {
    products: productsReducer,
    order: orderReducer,
    auth: authReducer,
    cart: cartReducer,
    orderHistory: orderHistoryReducer,
  },
});

export default store;
