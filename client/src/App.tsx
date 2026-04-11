import React from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import PaymentTest from './pages/PaymentTest';

export default function App(){
  return (
    <div style={{padding:20}}>
      <h1>Veterinary Network Platform</h1>
      <Login />
      <Register />
      <Dashboard />
      <PaymentTest />
    </div>
  );
}
