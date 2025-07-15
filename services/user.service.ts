import type { User } from "../types";

const API_URL = "http://localhost:8080/api";

// Gère la connexion de l'utilisateur
export async function login(username: string, password: string): Promise<{ token: string }> {
  const res = await fetch(`${API_URL}/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || 'Échec de la connexion');
  }

  return res.json();
}

// Gère l'inscription d'un nouvel utilisateur
export async function register(username: string, password: string, avatar: File | null) {
  const formData = new FormData();
  formData.append("username", username);
  formData.append("password", password);
  if (avatar) {
    formData.append("avatar", avatar);
  }

  const res = await fetch(`${API_URL}/users/register`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || 'Échec de l\'inscription');
  }

  return res.json();
}

// Service pour récupérer l'utilisateur connecté et ses contacts
export async function getCurrentUser(token: string): Promise<User> {
  const res = await fetch(`${API_URL}/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
    credentials: "include",
  });
  if (!res.ok) throw new Error("Impossible de récupérer l'utilisateur connecté");
  return res.json();
}

export async function getUserById(id: string, token: string): Promise<User> {
  const res = await fetch(`${API_URL}/users/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    credentials: "include",
  });
  if (!res.ok) throw new Error("Impossible de récupérer l'utilisateur");
  return res.json();
}

// Recherche un utilisateur par username
export async function getUserByUsername(username: string, token: string): Promise<User> {
  const res = await fetch(`${API_URL}/users/by-username/${encodeURIComponent(username)}`, {
    headers: { Authorization: `Bearer ${token}` },
    credentials: "include",
  });
  if (!res.ok) throw new Error("Aucun utilisateur trouvé avec ce nom");
  return res.json();
}

// Ajoute un contact à l'utilisateur courant
export async function addContact(myId: string, contactId: string, token: string) {
  const res = await fetch(`${API_URL}/users/${myId}/contacts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(contactId),
    credentials: "include",
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text || "Erreur lors de l'ajout du contact");
  return text;
}

// Met à jour le profil de l'utilisateur connecté
export async function updateUserProfile(
  token: string,
  { name, status, password, avatar }: { name: string; status: string; password?: string; avatar?: File }
) {
  const formData = new FormData();
  formData.append("name", name);
  formData.append("status", status);
  if (password) {
    formData.append("password", password);
  }
  if (avatar) {
    formData.append("avatar", avatar);
  }

  const res = await fetch(`${API_URL}/users/me`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
    credentials: "include",
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to update profile: ${errorText}`);
  }
  return res.json();
}
