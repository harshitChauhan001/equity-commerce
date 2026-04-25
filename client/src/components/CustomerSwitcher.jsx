import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setCustomerId } from '../store/slices/customerSlice';

import '../styles/CustomerSwitcher.css';

const CUSTOMERS = ['customer_A', 'customer_B', 'customer_C'];

function CustomerSwitcher() {
  const dispatch = useDispatch();
  const { customerId } = useSelector((state) => state.customer);

  const handleChange = (e) => {
    dispatch(setCustomerId(e.target.value));
  };

  return (
    <div className="switcher">
      <label className="switcher__label" htmlFor="customer-select">
        👤 Viewing as:
      </label>
      <select
        id="customer-select"
        className="switcher__select"
        value={customerId}
        onChange={handleChange}
      >
        {CUSTOMERS.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <span className="switcher__hint">Switch to see different prices</span>
    </div>
  );
}

export default CustomerSwitcher;
