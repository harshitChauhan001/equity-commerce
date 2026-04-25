import { createSlice } from '@reduxjs/toolkit';

const customerSlice = createSlice({
  name: 'customer',
  initialState: {
    customerId: 'customer_A', // default customer for demo
  },
  reducers: {
    setCustomerId(state, action) {
      state.customerId = action.payload;
    },
  },
});

export const { setCustomerId } = customerSlice.actions;
export default customerSlice.reducer;
