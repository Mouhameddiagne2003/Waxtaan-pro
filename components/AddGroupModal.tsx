import React, { FC } from "react";
import { addGroup } from "../services/group.service";

interface AddGroupModalProps {
  onClose: () => void;
  onCreateGroup: (group: {
    name: string;
    members: { id: string; name: string }[];
  }) => void;
  contacts: { id: string; name: string }[];
  currentUser: { id: string; name: string };
}

const AddGroupModal: FC<AddGroupModalProps> = ({
  onClose,
  onCreateGroup,
  contacts,
  currentUser,
}) => {
  const [groupName, setGroupName] = React.useState("");
  const [selectedContacts, setSelectedContacts] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [feedback, setFeedback] = React.useState<string | null>(null);

  function handleToggleContact(id: string) {
    setSelectedContacts((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }
  async function handleCreate() {
    setFeedback(null);
    if (!groupName.trim()) {
      setFeedback("Veuillez entrer un nom de groupe.");
      return;
    }
    if (selectedContacts.length === 0) {
      setFeedback("Veuillez sélectionner au moins un membre.");
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      console.log("token utilisé pour ajout groupe :", token);
      const allMemberIds = [...selectedContacts, currentUser.id];
      const group = await addGroup(groupName.trim(), allMemberIds, token!);
      onCreateGroup({
        name: group.name,
        members: group.members.map((id: string) => {
          // Vous pouvez enrichir avec les noms si besoin
          const found =
            contacts.find((c) => c.id === id) ||
            (id === currentUser.id ? currentUser : { id, name: id });
          return { id, name: found.name };
        }),
      });
      setFeedback("Groupe créé !");
      setTimeout(() => {
        setLoading(false);
        onClose();
      }, 1000);
    } catch (e: any) {
      setFeedback(e?.message || "Erreur lors de la création du groupe.");
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded shadow-lg p-6 w-full max-w-sm sm:max-w-md">
        <h2 className="font-bold text-xl mb-4">Créer un groupe</h2>
        <label className="block mb-2 text-sm font-medium">Nom du groupe</label>
        <input
          type="text"
          className="w-full rounded border px-3 py-2 mb-4 text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#25d366]"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          placeholder="Nom du groupe"
          disabled={loading}
        />
        <label className="block mb-2 text-sm font-medium">Membres</label>
        <div className="max-h-40 overflow-y-auto mb-4">
          {contacts.map((c) => (
            <label
              key={c.id}
              className="flex items-center gap-2 py-1 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedContacts.includes(c.id)}
                onChange={() => handleToggleContact(c.id)}
                disabled={loading}
              />
              <span>{c.name}</span>
            </label>
          ))}
        </div>
        {feedback && (
          <div className="text-xs text-center text-red-500 mb-2">
            {feedback}
          </div>
        )}
        <div className="flex justify-end gap-2 mt-4">
          <button
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
            onClick={onClose}
            disabled={loading}
          >
            Annuler
          </button>
          <button
            className="px-4 py-2 rounded bg-[#25d366] text-white font-semibold hover:bg-[#128C7E]"
            onClick={handleCreate}
            disabled={loading}
          >
            Créer
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddGroupModal;
