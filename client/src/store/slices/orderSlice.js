import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api';

export const placeOrder = createAsyncThunk('order/place', async (orderData, { rejectWithValue }) => {
  try {
    const res = await api.post('/orders', orderData);
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error?.message || 'Order failed');
  }
});

export const validateOffer = createAsyncThunk('order/validateOffer', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post('/offers/validate', data);
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error?.message || 'Invalid offer');
  }
});

const orderSlice = createSlice({
  name: 'order',
  initialState: {
    lastOrder: null,
    offer: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearOrder(state) {
      state.lastOrder = null;
      state.error = null;
    },
    clearOffer(state) {
      state.offer = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(placeOrder.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(placeOrder.fulfilled, (state, action) => { state.loading = false; state.lastOrder = action.payload; })
      .addCase(placeOrder.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(validateOffer.fulfilled, (state, action) => { state.offer = action.payload; })
      .addCase(validateOffer.rejected, (state, action) => { state.offer = null; state.error = action.payload; });
  },
});

export const { clearOrder, clearOffer } = orderSlice.actions;
export default orderSlice.reducer;
