export interface MessagePayload {
  sender: string;
  recipient: string; // id du contact ou du groupe
  content: string;
  timestamp: string;
  type: "text" | "file";
  file?: string | null;
}

export interface Message extends MessagePayload {
  id: string;
}

export async function sendMessage(
  message: MessagePayload,
  token: string,
  file?: File | null
): Promise<Message> {
  const formData = new FormData();
  const messageBlob = new Blob([JSON.stringify(message)], {
    type: "application/json",
  });
  formData.append("message", messageBlob);

  if (file) {
    formData.append("file", file);
  }

  const API_URL =
    (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080") + "/api";
  const res = await fetch(`${API_URL}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
    credentials: "include",
  });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error("Failed to send message:", errorBody);
    throw new Error("Erreur lors de l'envoi du message");
  }
  return res.json();
}

// Récupère les messages pour une conversation (privée ou groupe)
export async function getMessagesForConversation(
  conversationId: string,
  currentUserId: string,
  isGroup: boolean,
  token: string
): Promise<Message[]> {
  const API_URL =
    (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080") + "/api";
  const res = await fetch(`${API_URL}/messages`, {
    headers: { Authorization: `Bearer ${token}` },
    credentials: "include",
  });
  if (!res.ok) throw new Error("Erreur lors de la récupération des messages");
  const allMsgs = await res.json();
  let filtered;
  if (isGroup) {
    filtered = allMsgs.filter((m: any) => m.recipient === conversationId);
  } else {
    filtered = allMsgs.filter(
      (m: any) =>
        (m.sender === currentUserId && m.recipient === conversationId) ||
        (m.sender === conversationId && m.recipient === currentUserId)
    );
  }
  return filtered;
}

// Récupère TOUS les messages (pour le rafraîchissement initial)
export async function getAllMessages(token: string): Promise<Message[]> {
  const API_URL =
    (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080") + "/api";
  const res = await fetch(`${API_URL}/messages`, {
    headers: { Authorization: `Bearer ${token}` },
    credentials: "include",
  });
  if (!res.ok)
    throw new Error("Erreur lors de la récupération de tous les messages");
  return res.json();
}
