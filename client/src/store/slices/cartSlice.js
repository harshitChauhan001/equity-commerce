import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api';

export const fetchCart = createAsyncThunk('cart/fetch', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/cart');
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error?.message || 'Failed to load cart');
  }
});

export const addToCart = createAsyncThunk('cart/add', async ({ variantId, quantity }, { rejectWithValue }) => {
  try {
    const res = await api.post('/cart', { variantId, quantity });
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error?.message || 'Failed to add to cart');
  }
});

export const updateCartItem = createAsyncThunk('cart/update', async ({ itemId, quantity }, { rejectWithValue }) => {
  try {
    const res = await api.put(`/cart/${itemId}`, { quantity });
    return { itemId, quantity, data: res.data.data };
  } catch (err) {
    return rejectWithValue(err.response?.data?.error?.message || 'Failed to update cart');
  }
});

export const removeFromCart = createAsyncThunk('cart/remove', async (itemId, { rejectWithValue }) => {
  try {
    await api.delete(`/cart/${itemId}`);
    return itemId;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error?.message || 'Failed to remove item');
  }
});

export const checkoutCart = createAsyncThunk('cart/checkout', async ({ offerCode } = {}, { rejectWithValue }) => {
  try {
    const res = await api.post('/cart/checkout', { offerCode });
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error?.message || 'Checkout failed');
  }
});

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [],
    totalAmount: 0,
    shippingFee: 0,
    freeShippingThreshold: 999,
    loading: false,
    checkoutLoading: false,
    error: null,
    lastCheckout: null,
  },
  reducers: {
    clearCheckout(state) {
      state.lastCheckout = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetch
      .addCase(fetchCart.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.totalAmount = action.payload.totalAmount;
        state.shippingFee = action.payload.shippingFee;
        state.freeShippingThreshold = action.payload.freeShippingThreshold;
      })
      .addCase(fetchCart.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      // add
      .addCase(addToCart.fulfilled, (state) => { state.error = null; })
      .addCase(addToCart.rejected, (state, action) => { state.error = action.payload; })
      // remove
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.items = state.items.filter((i) => i.id !== action.payload);
      })
      // update
      .addCase(updateCartItem.fulfilled, (state, action) => {
        const { itemId, quantity, data } = action.payload;
        if (data?.removed) {
          state.items = state.items.filter((i) => i.id !== itemId);
        } else {
          const item = state.items.find((i) => i.id === itemId);
          if (item) item.quantity = quantity;
        }
      })
      // checkout
      .addCase(checkoutCart.pending, (state) => { state.checkoutLoading = true; state.error = null; })
      .addCase(checkoutCart.fulfilled, (state, action) => {
        state.checkoutLoading = false;
        state.lastCheckout = action.payload;
        state.items = [];
        state.totalAmount = 0;
      })
      .addCase(checkoutCart.rejected, (state, action) => { state.checkoutLoading = false; state.error = action.payload; });
  },
});

export const { clearCheckout } = cartSlice.actions;
export default cartSlice.reducer;
