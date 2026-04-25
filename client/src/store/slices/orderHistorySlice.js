import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api';

export const fetchOrderHistory = createAsyncThunk(
  'orderHistory/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/orders/history');
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to load orders');
    }
  }
);

export const fetchAllOrders = createAsyncThunk(
  'orderHistory/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/admin/orders');
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to load all orders');
    }
  }
);

const orderHistorySlice = createSlice({
  name: 'orderHistory',
  initialState: {
    orders: [],
    allOrders: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrderHistory.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchOrderHistory.fulfilled, (state, action) => { state.loading = false; state.orders = action.payload; })
      .addCase(fetchOrderHistory.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchAllOrders.pending, (state) => { state.loading = true; })
      .addCase(fetchAllOrders.fulfilled, (state, action) => { state.loading = false; state.allOrders = action.payload; })
      .addCase(fetchAllOrders.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
  },
});

export default orderHistorySlice.reducer;
