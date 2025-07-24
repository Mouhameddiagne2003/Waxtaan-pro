import { FC, useState, useEffect, useRef } from "react";
import {
  sendMessage,
  MessagePayload,
  Message,
} from "../services/message.service";
import type { Conversation } from "../app/page";
import { removeContactAndMessages } from "../services/user.service";

interface ChatWindowProps {
  conversation: Conversation;
  onBack: () => void;
}

const ChatWindow: FC<ChatWindowProps> = ({ conversation, onBack }) => {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const isGroup = (conversation as any).isGroup;
  const members: { id: string; name: string }[] =
    (conversation as any).members || [];

  // Récupère l'id de l'utilisateur connecté via le service user
  useEffect(() => {
    async function fetchUser() {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const userService = await import("../services/user.service");
        const me = await userService.getCurrentUser(token);
        setCurrentUserId(me.id || "");
      } catch {
        setCurrentUserId("");
      }
    }
    fetchUser();
  }, []);

  // Polling pour rafraîchir les messages toutes les 3s via le service message
  useEffect(() => {
    async function fetchMessages() {
      try {
        const token = localStorage.getItem("token");
        if (!token || !currentUserId) return;
        const msgService = await import("../services/message.service");
        const msgs = await msgService.getMessagesForConversation(
          String(conversation.id),
          currentUserId,
          isGroup,
          token
        );
        setMessages(msgs); // msgs doit être un tableau de Message
      } catch {}
    }
    if (currentUserId) {
      fetchMessages();
      pollingRef.current = setInterval(fetchMessages, 3000);
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [conversation.id, currentUserId, isGroup]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() && !file) return;

    setError(null);
    setSending(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Non authentifié");

      const payload: MessagePayload = {
        sender: currentUserId,
        recipient: String(conversation.id),
        content: input,
        timestamp: new Date().toISOString(),
        type: file ? "file" : "text",
        file: null, // Le backend génère l'URL
      };

      const msg = await sendMessage(payload, token, file);

      setMessages((prev) => [
        ...prev,
        msg, // msg est un Message complet
      ]);

      setInput("");
      setFile(null);
    } catch (e: any) {
      setError(e?.message || "Erreur d'envoi");
    } finally {
      setSending(false);
    }
  }

  // Fonction pour supprimer le contact
  async function handleRemoveContact() {
    setActionError(null);
    setActionSuccess(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Non authentifié");
      await removeContactAndMessages(
        currentUserId,
        String(conversation.id),
        token
      );
      setActionSuccess("Contact et messages supprimés");
      setShowConfirm(false);
      setTimeout(() => {
        onBack(); // Retour à la liste des conversations
      }, 1000);
    } catch (e: any) {
      setActionError(e?.message || "Erreur lors de la suppression");
    }
  }

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <div className="flex items-center px-4 py-3 border-b border-[#e9f5ec] bg-white shadow-sm relative">
        <button
          className="mr-3 p-2 rounded-full hover:bg-[#e9f5ec] text-[#128C7E] focus:outline-none"
          onClick={onBack}
          aria-label="Retour"
        >
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
            <path
              d="M15 18l-6-6 6-6"
              stroke="#128C7E"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        {conversation.avatar ? (
          <img
            src={
              conversation.avatar.startsWith("http")
                ? conversation.avatar
                : `http://localhost:8080${conversation.avatar}`
            }
            alt={conversation.name}
            className="w-10 h-10 rounded-full object-cover mr-3"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold text-lg mr-3">
            {conversation.initials}
          </div>
        )}
        <div className="flex flex-col flex-1 min-w-0">
          <span className="font-semibold text-base text-[#128C7E] truncate">
            {conversation.name}
          </span>
          {isGroup && (
            <span className="text-xs text-gray-400 truncate">
              {[
                ...members,
                ...(members.some((m) => m.id === currentUserId)
                  ? []
                  : [{ id: currentUserId, name: "" }]),
              ]
                .map((m) => (m.id === currentUserId ? "vous" : m.name))
                .join(", ")}
            </span>
          )}
          {!isGroup && (
            <span className="text-xs text-gray-400">
              {conversation.online ? "en ligne" : ""}
            </span>
          )}
        </div>
        <button
          className="ml-3 p-2 rounded-full hover:bg-[#e9f5ec] text-[#128C7E] focus:outline-none"
          aria-label="Menu"
          onClick={() => setShowMenu((v) => !v)}
        >
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="2" fill="currentColor" />
            <circle cx="19" cy="12" r="2" fill="currentColor" />
            <circle cx="5" cy="12" r="2" fill="currentColor" />
          </svg>
        </button>
        {showMenu && !isGroup && (
          <div className="absolute right-6 top-16 bg-white border rounded shadow-md z-10 min-w-[180px]">
            <button
              className="w-full text-left px-4 py-2 hover:bg-[#e9f5ec] text-red-600"
              onClick={() => {
                setShowMenu(false);
                setShowConfirm(true);
              }}
            >
              Supprimer le contact
            </button>
          </div>
        )}
        {showConfirm && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-20">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
              <h2 className="text-lg font-semibold mb-4">
                Confirmer la suppression
              </h2>
              <p className="mb-4">
                Voulez-vous vraiment supprimer ce contact et tous les messages
                associés ?
              </p>
              {actionError && (
                <div className="text-red-500 text-sm mb-2">{actionError}</div>
              )}
              {actionSuccess && (
                <div className="text-green-600 text-sm mb-2">
                  {actionSuccess}
                </div>
              )}
              <div className="flex justify-end gap-2">
                <button
                  className="px-4 py-2 rounded bg-gray-200"
                  onClick={() => setShowConfirm(false)}
                >
                  Annuler
                </button>
                <button
                  className="px-4 py-2 rounded bg-red-600 text-white"
                  onClick={handleRemoveContact}
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-8 py-6 bg-[#f9fbfa] flex flex-col gap-4">
        {messages.map((msg, idx) =>
          msg.type === "file" ? (
            <div
              key={idx}
              className={`flex ${
                msg.sender === currentUserId ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`rounded-lg px-4 py-2 bg-[#e9f5ec] text-gray-800 max-w-xs flex flex-col shadow-md`}
              >
                <span className="text-xs font-semibold mb-1">
                  Fichier envoyé
                </span>
                <a
                  href={`${process.env.NEXT_PUBLIC_API_BASE_URL}${msg.file}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#128C7E] text-xs underline"
                >
                  Télécharger
                </a>
                <span className="text-[10px] text-gray-400 mt-1 self-end">
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          ) : (
            <div
              key={idx}
              className={`flex ${
                msg.sender === currentUserId ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`rounded-lg px-4 py-2 ${
                  msg.sender === currentUserId
                    ? "bg-[#25d366] text-white"
                    : "bg-white text-gray-800 border border-[#e9f5ec]"
                } max-w-xs shadow-md`}
              >
                <span>{msg.content}</span>
                <span className="block text-[10px] text-gray-200/80 mt-1 text-right">
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          )
        )}
      </div>
      {/* Input */}
      <form
        className="flex items-center gap-2 px-6 py-5 border-t border-[#e9f5ec] bg-white"
        onSubmit={handleSend}
      >
        <input
          type="text"
          placeholder="Tapez un message..."
          className="flex-1 rounded-full border border-[#e9f5ec] px-4 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#25d366] bg-[#f9fbfa]"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={sending}
        />
        <input
          type="file"
          className="hidden"
          id="file-upload"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <label
          htmlFor="file-upload"
          className="cursor-pointer px-3 py-2 rounded-full bg-[#e9f5ec] text-[#128C7E] hover:bg-[#25d366]/20"
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
            <path
              d="M16.5 13.5V17a4.5 4.5 0 01-9 0v-7a4.5 4.5 0 019 0v6.5"
              stroke="#128C7E"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M12 17V7"
              stroke="#128C7E"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </label>
        {file && (
          <span className="text-xs text-gray-500 ml-2">{file.name}</span>
        )}
        <button
          type="submit"
          className="ml-2 px-4 py-2 rounded-full bg-[#25d366] text-white font-bold hover:bg-[#128C7E] transition"
          disabled={sending || (!input.trim() && !file)}
        >
          Envoyer
        </button>
      </form>
      {error && (
        <div className="text-xs text-red-500 text-center pb-2">{error}</div>
      )}
    </div>
  );
};

export default ChatWindow;
