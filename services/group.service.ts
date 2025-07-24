export async function addGroup(name: string, members: string[], token: string) {
  const API_URL =
    (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080") + "/api";
  const res = await fetch(`${API_URL}/groups`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, members }),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Erreur lors de la création du groupe");
  return res.json(); // Le backend doit idéalement retourner le groupe créé (avec id)
}

// Récupère tous les groupes de l'utilisateur connecté
export async function getGroups(token: string) {
  const API_URL =
    (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080") + "/api";
  const res = await fetch(`${API_URL}/groups`, {
    headers: { Authorization: `Bearer ${token}` },
    credentials: "include",
  });
  if (!res.ok) throw new Error("Erreur lors de la récupération des groupes");
  return res.json();
}

// Ajout de la fonction pour récupérer un groupe par son id
export async function getGroupById(id: string | number, token: string) {
  const API_URL =
    (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080") + "/api";
  const res = await fetch(`${API_URL}/groups/${id}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    credentials: "include",
  });
  if (!res.ok) throw new Error("Erreur lors de la récupération du groupe");
  return res.json();
}
