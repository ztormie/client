// src/pages/LoginPage.js

import React, { useState } from 'react';
import { supabase } from '../supabase'; // Make sure this is correctly set up
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  async function handleLogin(e) {
    e.preventDefault();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMessage(error.message);
    } else {
      navigate('/admin'); // Redirect to AdminPage after login
    }
  }

  return (
    <div className="min-h-screen bg-[#fffaf4] flex flex-col items-center justify-center px-6">
      <h1 className="text-3xl font-bold mb-6">Logga in</h1>

      <form onSubmit={handleLogin} className="flex flex-col gap-4 w-full max-w-sm">
        <input
          type="email"
          placeholder="E-post"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border p-2 rounded"
          required
        />
        <input
          type="password"
          placeholder="Lösenord"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2 rounded"
          required
        />
        <button
          type="submit"
          className="bg-yellow-300 hover:bg-yellow-400 text-gray-900 font-semibold py-2 px-4 rounded"
        >
          Logga in
        </button>
        {errorMessage && <p className="text-red-500">{errorMessage}</p>}
      </form>
    </div>
  );
}
