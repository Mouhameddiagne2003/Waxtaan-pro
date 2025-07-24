import React, { FC } from "react";

interface AddContactModalProps {
  onClose: () => void;
  onSelectContact?: (id: string, name: string) => void;
}

const AddContactModal: FC<AddContactModalProps> = ({
  onClose,
  onSelectContact,
}) => {
  const [username, setUsername] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [feedback, setFeedback] = React.useState<string | null>(null);
  const [contacts, setContacts] = React.useState<
    { id: string; name: string }[]
  >([]);
  const [contactsLoading, setContactsLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchContacts() {
      setContactsLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Non authentifié");
        const userService = await import("../services/user.service");
        const me = await userService.getCurrentUser(token);
        if (!me.contacts || me.contacts.length === 0) {
          setContacts([]);
        } else {
          const contactList = await Promise.all(
            me.contacts.map(async (id: string) => {
              const cleanId = id.replace(/^"|"$/g, "").trim();
              try {
                return await userService.getUserById(cleanId, token);
              } catch {
                return null;
              }
            })
          );
          setContacts(
            contactList
              .filter(Boolean)
              .map((c: any) => ({ id: c.id, name: c.name }))
          );
        }
      } catch {
        setContacts([]);
      } finally {
        setContactsLoading(false);
      }
    }
    fetchContacts();
  }, []);

  async function handleAdd() {
    setFeedback(null);
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Non authentifié");
      const userService = await import("../services/user.service");
      const foundUser = await userService.getUserByUsername(username, token);
      const me = await userService.getCurrentUser(token);
      if (foundUser.id === me.id) {
        setFeedback("Vous ne pouvez pas vous ajouter vous-même !");
        setLoading(false);
        return;
      }
      await userService.addContact(me.id, foundUser.id, token);
      setFeedback(`Contact ajouté : ${foundUser.name}`);
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (e: any) {
      setFeedback(e.message || "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded shadow-lg p-6 min-w-[300px]">
        <h2 className="font-bold text-lg mb-2">Ajouter un contact</h2>
        <input
          type="text"
          placeholder="Nom du contact"
          className="border px-2 py-1 rounded w-full mb-3 text-black"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={loading}
        />
        <button
          className="px-4 py-1 bg-[#25d366] text-white rounded mr-2"
          onClick={handleAdd}
          disabled={loading || !username.trim()}
        >
          {loading ? "Recherche..." : "Ajouter"}
        </button>
        <button
          className="px-4 py-1 bg-gray-200 rounded"
          onClick={onClose}
          disabled={loading}
        >
          Annuler
        </button>
        {feedback && (
          <div
            className={`mt-3 text-sm text-center ${
              feedback.includes("Contact ajouté")
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {feedback}
          </div>
        )}
        <div className="mt-5">
          <div className="font-semibold text-gray-700 mb-1 text-sm">
            Vos contacts :
          </div>
          {contactsLoading ? (
            <div className="text-gray-400 text-xs">Chargement...</div>
          ) : contacts.length === 0 ? (
            <div className="text-gray-400 text-xs">Aucun contact</div>
          ) : (
            <ul className="text-xs text-gray-700 max-h-24 overflow-y-auto">
              {contacts.map((c) => (
                <li
                  key={c.id}
                  className="py-0.5 border-b last:border-b-0 border-gray-100 cursor-pointer hover:bg-[#eafff3] px-2 rounded"
                  onClick={() => {
                    if (onSelectContact) onSelectContact(c.id, c.name);
                    onClose();
                  }}
                >
                  {c.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddContactModal;
