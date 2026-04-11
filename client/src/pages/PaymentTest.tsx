import React from 'react';
export default function PaymentTest(){
  const pay=async()=> {
    const res=await fetch('http://localhost:5000/api/payments/create-payment-intent',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({amount:5000})});
    const data=await res.json(); alert(JSON.stringify(data));
  };
  return (<div><h3>Payment Test</h3><button onClick={pay}>Create Payment Intent</button></div>);
}
