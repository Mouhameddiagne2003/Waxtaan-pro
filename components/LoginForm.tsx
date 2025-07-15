import React, { useState } from 'react';
import axios from '../utils/api';
import { useRouter } from 'next/router';

const LoginForm: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post('/api/auth/login', { username, password });
      localStorage.setItem('token', res.data.token);
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data || 'Erreur lors de la connexion');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-green-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-green-400 text-white rounded-full w-16 h-16 flex items-center justify-center text-xl font-bold mb-2">XML</div>
          <h1 className="text-2xl font-bold text-green-500 mb-1">WhatsApp XML</h1>
          <p className="text-gray-500">Connectez-vous à votre compte</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Nom d'utilisateur"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-300"
            required
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-300"
            required
          />
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <button
            type="submit"
            className="bg-green-400 hover:bg-green-500 text-white rounded px-4 py-2 font-semibold transition"
          >
            Se connecter
          </button>
        </form>
        <div className="text-center mt-4 text-gray-500 text-sm">
          Pas de compte ?{' '}
          <a href="/register" className="text-green-500 hover:underline">S'inscrire</a>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
