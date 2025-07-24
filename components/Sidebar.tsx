// Sidebar WhatsApp XML Web
import { FC } from "react";
import React, { useEffect } from "react";
import AddContactModal from "./AddContactModal";
import AddGroupModal from "./AddGroupModal";
import Profile from "./Profile";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";

import type { Conversation } from "../app/page";
import type { User } from "../types";

interface SidebarProps {
  allConvs: Conversation[];
  selected: string | null;
  onSelect: (key: string) => void;
  onAddConversation: (conv: Conversation) => void;
  onCreateGroup: (group: {
    name: string;
    members: { id: string; name: string }[];
  }) => void;
  currentUser: User | null;
  unreadCounts: { [key: string]: number };
}

const Sidebar: FC<SidebarProps> = ({
  allConvs,
  selected,
  onSelect,
  onAddConversation,
  onCreateGroup,
  currentUser,
  unreadCounts,
}) => {
  // compatibilité pour le code existant qui utilise "conversations"
  const conversations = allConvs;

  // États pour les menus et modaux
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);
  const [showContacts, setShowContacts] = React.useState(false);
  const [showGroups, setShowGroups] = React.useState(false);
  const [addContact, setAddContact] = React.useState(false);
  const [addGroup, setAddGroup] = React.useState(false);
  const [showProfile, setShowProfile] = React.useState(false);
  const [userProfile, setUserProfile] = React.useState<User | null>(null);
  // Contacts réels
  const [contacts, setContacts] = React.useState<
    { id: string; name: string; avatar: string }[]
  >([]);

  // Fetch current user profile
  useEffect(() => {
    async function fetchCurrentUser() {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const user = await import("../services/user.service").then((m) =>
          m.getCurrentUser(token)
        );
        setUserProfile(user);
      } catch (e) {
        console.error("Failed to fetch current user", e);
      }
    }
    fetchCurrentUser();
  }, []);

  // Handler pour cliquer sur un contact depuis la sidebar
  function handleContactClickSidebar(c: { id: string; name: string }) {
    handleContactClickModal(c.id, c.name);
  }

  // Handler pour cliquer sur un contact depuis le modal (AddContactModal)
  function handleContactClickModal(id: string, name: string) {
    const contactId = Number(id);
    let conv = conversations.find((conv) => conv.id === contactId);
    if (!conv) {
      const initials =
        name && typeof name === "string"
          ? name
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .toUpperCase()
          : "?";
      conv = {
        id: contactId,
        name: name,
        initials,
        messages: [],
      };
      onAddConversation(conv);
    }
    onSelect(`user-${contactId}`);
    setUserMenuOpen(false);
  }

  useEffect(() => {
    async function fetchContacts() {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        // Récupère l'utilisateur connecté
        const user = await import("../services/user.service").then((m) =>
          m.getCurrentUser(token)
        );
        if (!user.contacts) return;
        // Récupère les infos de chaque contact
        const contactList = await Promise.all(
          user.contacts.map(async (id: string) => {
            const cleanId =
              typeof id === "string" ? id.replace(/^"|"$/g, "").trim() : id;
            try {
              return await import("../services/user.service").then((m) =>
                m.getUserById(cleanId, token)
              );
            } catch {
              return null;
            }
          })
        );
        setContacts(
          contactList
            .filter((c) => c)
            .map((c: any) => ({ id: c.id, name: c.name, avatar: c.avatar }))
        );
      } catch (e) {
        setContacts([]);
      }
    }
    fetchContacts();
  }, []);

  // Trie les conversations par date du dernier message (plus récent en premier)
  const sortedConversations = [...conversations].sort((a, b) => {
    const lastA = a.messages[a.messages.length - 1];
    const lastB = b.messages[b.messages.length - 1];
    const dateA =
      lastA && lastA.timestamp ? new Date(lastA.timestamp).getTime() : 0;
    const dateB =
      lastB && lastB.timestamp ? new Date(lastB.timestamp).getTime() : 0;
    return dateB - dateA;
  });

  function handleLogout() {
    localStorage.removeItem("token");
    window.location.reload();
  }

  return (
    <aside className="w-full sm:w-80 bg-[#f5f6fa] border-r border-[#d1e7dd] h-screen flex flex-col relative">
      {/* Header */}
      <div className="px-4 pt-3 pb-2 bg-[#25d366] flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
              <Image
                src="/waxtaan.png"
                alt="Waxtaan Logo"
                width={32}
                height={32}
                className="rounded-full"
              />
            </div>
            <span className="font-bold text-lg text-white">Waxtaan</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Icône user + menu utilisateur (inchangé) */}
            <div className="relative">
              <button
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition focus:outline-none"
                onClick={() => setUserMenuOpen((v) => !v)}
              >
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                  <path
                    d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
                    fill="#fff"
                  />
                </svg>
              </button>
              {userMenuOpen && (
                <div className="absolute left-0 mt-2 w-80 bg-white border border-gray-100 rounded-xl shadow-2xl z-30 animate-fade-in p-0 overflow-hidden">
                  {/* Header vert WhatsApp */}
                  <div className="bg-[#25d366] px-5 pt-4 pb-2">
                    <h2 className="font-bold text-xl mb-1 text-white">
                      Nouvelle discussion
                    </h2>
                  </div>
                  {/* Actions */}
                  <div className="px-5 pt-3 pb-2 flex flex-col gap-2 bg-white">
                    <button
                      className="flex items-center gap-3 py-2 px-3 rounded-lg bg-white text-[#25d366] font-semibold border border-[#25d366]/30 shadow-sm hover:bg-[#f2f2f2] transition text-left"
                      onClick={() => {
                        setAddGroup(true);
                        setUserMenuOpen(false);
                      }}
                    >
                      <span className="bg-[#e9f5ec] text-[#25d366] rounded-full w-9 h-9 flex items-center justify-center">
                        <svg
                          width="22"
                          height="22"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="#25d366"
                            strokeWidth="2"
                          />
                          <path
                            d="M12 8v8M8 12h8"
                            stroke="#25d366"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      </span>
                      Nouveau groupe
                    </button>
                    <button
                      className="flex items-center gap-3 py-2 px-3 rounded-lg bg-white text-[#25d366] font-semibold border border-[#25d366]/30 shadow-sm hover:bg-[#f2f2f2] transition text-left"
                      onClick={() => {
                        setAddContact(true);
                        setUserMenuOpen(false);
                      }}
                    >
                      <span className="bg-[#e9f5ec] text-[#25d366] rounded-full w-9 h-9 flex items-center justify-center">
                        <svg
                          width="22"
                          height="22"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="#25d366"
                            strokeWidth="2"
                          />
                          <path
                            d="M12 8v8M8 12h8"
                            stroke="#25d366"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      </span>
                      Nouveau contact
                    </button>
                  </div>
                  {/* Liste contacts */}
                  <div className="px-2 pb-3 max-h-[340px] sm:max-h-[420px] overflow-y-auto bg-white">
                    <ul>
                      {contacts.map((c) => (
                        <li
                          key={c.id}
                          className="flex items-center gap-3 px-4 py-2 hover:bg-[#d1e7dd] hover:shadow rounded-lg cursor-pointer transition"
                          onClick={() => handleContactClickSidebar(c)}
                        >
                          <img
                            src={
                              c.avatar && c.avatar.startsWith("http")
                                ? c.avatar
                                : `${process.env.NEXT_PUBLIC_API_BASE_URL}${c.avatar}`
                            }
                            alt={c.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate text-gray-800">
                              {c.name}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
            {/* 3 points */}
            <button
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition focus:outline-none"
              onClick={() => setShowProfile(true)}
            >
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="2" fill="#fff" />
                <circle cx="19" cy="12" r="2" fill="#fff" />
                <circle cx="5" cy="12" r="2" fill="#fff" />
              </svg>
            </button>
            {/* Icône déconnexion */}
            <button
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition focus:outline-none"
              title="Déconnexion"
              onClick={handleLogout}
            >
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                <path
                  d="M16 17l5-5-5-5M21 12H9"
                  stroke="#fff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M13 5v-2a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v18a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-2"
                  stroke="#fff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
        {/* Barre de recherche moderne */}
        <div className="relative mt-2">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#25d366]">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" stroke="#25d366" strokeWidth="2" />
              <path
                d="M21 21l-3.5-3.5"
                stroke="#25d366"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Rechercher une conversation..."
            className="w-full pl-10 pr-3 py-2 rounded-full bg-white text-sm border-none focus:outline-none focus:ring-2 focus:ring-[#25d366] placeholder:text-[#25d366]/60 shadow-sm"
          />
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 pt-2 pb-4">
        <AnimatePresence>
          {sortedConversations.map((conv) => {
            const isActive =
              selected ===
              (conv.isGroup ? `group-${conv.id}` : `user-${conv.id}`);
            const lastMsg =
              conv.messages.length > 0
                ? conv.messages[conv.messages.length - 1]
                : null;
            const badge =
              unreadCounts[
                conv.isGroup ? `group-${conv.id}` : `user-${conv.id}`
              ];
            return (
              <motion.div
                key={conv.isGroup ? `group-${conv.id}` : `user-${conv.id}`}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className={`group flex items-center gap-3 px-3 py-3 mb-2 rounded-2xl cursor-pointer transition-all shadow-sm
                  ${
                    isActive
                      ? "bg-[#eafff3] border-l-4 border-[#25d366] font-bold text-[#128C7E]"
                      : "bg-white hover:shadow-md hover:bg-[#f7fcfa] text-gray-800"
                  }
                `}
                onClick={() =>
                  onSelect(
                    conv.isGroup ? `group-${conv.id}` : `user-${conv.id}`
                  )
                }
              >
                {/* Avatar + statut en ligne */}
                <div className="relative">
                  {conv.avatar ? (
                    <img
                      src={
                        conv.avatar.startsWith("http") ||
                        conv.avatar.startsWith("blob:")
                          ? conv.avatar
                          : `${process.env.NEXT_PUBLIC_API_BASE_URL}${conv.avatar}`
                      }
                      alt={conv.name}
                      className={`w-12 h-12 rounded-full object-cover ${
                        isActive ? "ring-2 ring-[#25d366]" : ""
                      }`}
                    />
                  ) : (
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                        isActive
                          ? "bg-[#25d366] text-white"
                          : "bg-green-100 text-green-600"
                      }`}
                    >
                      {conv.initials}
                    </div>
                  )}
                  {/* Point vert statut en ligne */}
                  {conv.online && (
                    <span className="absolute bottom-1 right-1 w-3 h-3 bg-[#25d366] border-2 border-white rounded-full"></span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="font-semibold truncate text-base">
                      {conv.name}
                    </span>
                    <span className="text-xs text-gray-400 group-hover:text-[#128c7e]">
                      {lastMsg ? lastMsg.time : ""}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span
                      className="truncate text-sm text-gray-500 group-hover:text-[#128c7e] max-w-[180px]"
                      title={
                        conv.isGroup && conv.id < 0
                          ? ""
                          : lastMsg
                          ? lastMsg.type === "file"
                            ? "Fichier envoyé"
                            : lastMsg.text
                          : ""
                      }
                    >
                      {conv.isGroup && conv.id < 0
                        ? ""
                        : lastMsg
                        ? lastMsg.type === "file"
                          ? "Fichier envoyé"
                          : lastMsg.text
                        : ""}
                    </span>
                    {/* Badge non lu */}
                    {badge > 0 &&
                      selected !==
                        (conv.isGroup
                          ? `group-${conv.id}`
                          : `user-${conv.id}`) && (
                        <span className="ml-2 bg-[#25d366] text-white rounded-full px-2 py-0.5 text-xs font-bold">
                          {badge}
                        </span>
                      )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </nav>
      {/* Search */}
      {showProfile && userProfile && (
        <Profile
          user={userProfile}
          token={localStorage.getItem("token") || ""}
          onClose={() => setShowProfile(false)}
          onProfileUpdate={(updatedUser) => {
            setUserProfile(updatedUser);
            setShowProfile(false);
          }}
        />
      )}

      {addContact && (
        <AddContactModal
          onClose={() => setAddContact(false)}
          onSelectContact={handleContactClickModal}
        />
      )}
      {/* Modaux/menus */}
      {addGroup && currentUser && (
        <AddGroupModal
          onClose={() => setAddGroup(false)}
          onCreateGroup={onCreateGroup}
          contacts={contacts}
          currentUser={currentUser}
        />
      )}
    </aside>
  );
};

export default Sidebar;
