import React, { useState } from 'react';
export default function Register() {
  const [email,setEmail]=useState(''); const [password,setPassword]=useState('');
  const submit=async(e:any)=>{e.preventDefault();
    const res=await fetch('http://localhost:5000/api/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})});
    const data=await res.json(); console.log(data);
    if(data.token) localStorage.setItem('token',data.token);
  };
  return (<form onSubmit={submit}><h3>Register</h3><input placeholder='email' value={email} onChange={e=>setEmail(e.target.value)}/><input placeholder='password' type='password' value={password} onChange={e=>setPassword(e.target.value)}/><button>Register</button></form>);
}
