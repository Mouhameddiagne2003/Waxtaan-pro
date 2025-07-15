import axios from '../utils/api';

export async function login(username: string, password: string): Promise<string> {
  try {
    const res = await axios.post('/api/users/login', { username, password });
    return res.data.token;
  } catch (err: any) {
    throw new Error(err.response?.data || 'Erreur lors de la connexion');
  }
}

export async function register(user: { name: string; password: string; avatar: string; status?: string }): Promise<string> {
  try {
    const res = await axios.post('/api/users/register', user);
    return res.data.token;
  } catch (err: any) {
    throw new Error(err.response?.data || "Erreur lors de l'inscription");
  }
}
