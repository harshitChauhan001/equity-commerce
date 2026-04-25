import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api';

export const fetchProducts = createAsyncThunk('products/fetchAll', async () => {
  const res = await api.get('/products');
  return res.data.data;
});

export const fetchProductById = createAsyncThunk(
  'products/fetchById',
  async (id) => {
    const res = await api.get(`/products/${id}`);
    return res.data.data;
  }
);

const productsSlice = createSlice({
  name: 'products',
  initialState: {
    list: [],
    current: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearCurrent(state) {
      state.current = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchProducts.fulfilled, (state, action) => { state.loading = false; state.list = action.payload; })
      .addCase(fetchProducts.rejected, (state, action) => { state.loading = false; state.error = action.error.message; })
      .addCase(fetchProductById.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchProductById.fulfilled, (state, action) => { state.loading = false; state.current = action.payload; })
      .addCase(fetchProductById.rejected, (state, action) => { state.loading = false; state.error = action.error.message; });
  },
});

export const { clearCurrent } = productsSlice.actions;
export default productsSlice.reducer;
