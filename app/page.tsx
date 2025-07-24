"use client";

import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import React, { useState } from "react";
import type { User } from "../types";
import { Toaster } from "sonner";
import { WaxtaanLogo } from "../components/Waxtaan-page";

// Types stricts pour les messages et conversations
export type Message = {
  text: string;
  fromMe: boolean;
  time: string;
  timestamp: string;
  type?: "text" | "file";
  file?: string;
};

export type Conversation = {
  id: number;
  name: string;
  initials: string;
  avatar?: string;
  online?: boolean;
  messages: Message[];
  isGroup?: boolean;
};

// Pas de données mockées : les conversations seront vides tant que l'intégration réelle n'est pas faite
// Toutes les conversations (backend + locales)
const initialConversations: Conversation[] = [];

export default function Home() {
  // selectedKey: string | null, ex: 'group-3' ou 'user-3'
  const [selected, setSelected] = useState<string | null>(null);
  // Regroupe toutes les conversations (backend + locales)
  const [allConvs, setAllConvs] =
    useState<Conversation[]>(initialConversations);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  // Unread counts par conversation (clé = id)
  const [unreadCounts, setUnreadCounts] = useState<{ [key: string]: number }>(
    {}
  );
  // Dernier index lu par conversation (clé = id)
  const [lastReadMsgIndex, setLastReadMsgIndex] = useState<{
    [key: string]: number;
  }>({});

  // Charger l'utilisateur connecté au montage
  React.useEffect(() => {
    async function fetchMe() {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const userService = await import("../services/user.service");
        const me = await userService.getCurrentUser(token);
        setCurrentUser(me);
      } catch {
        setCurrentUser(null);
      }
    }
    fetchMe();
  }, []);

  React.useEffect(() => {
    let pollingRef: NodeJS.Timeout | null = null;
    async function fetchConversationsAndMessages() {
      const token = localStorage.getItem("token");
      if (!token || !currentUser) return; // Attend que currentUser soit chargé

      const userService = await import("../services/user.service");
      const groupService = await import("../services/group.service");
      const msgService = await import("../services/message.service");

      const me = currentUser;

      // 1. Récupère tous les messages une seule fois
      const allMsgs = await msgService.getAllMessages(token);

      // 2. Traite les conversations de groupe
      const allGroups = await groupService.getGroups(token);
      // On ne garde que les groupes dont l'utilisateur est membre
      const myGroups = allGroups.filter((g: any) =>
        (g.members || []).includes(String(me.id))
      );

      const groupConvs = await Promise.all(
        myGroups.map(async (group: any) => {
          const groupMsgs = allMsgs.filter(
            (m: any) => String(m.recipient) === String(group.id)
          );

          // Récupère les noms des membres
          const members = await Promise.all(
            (group.members || []).map(async (id: string) => {
              try {
                const u = await userService.getUserById(id, token);
                return { id: u.id, name: u.name };
              } catch {
                return { id, name: id }; // Fallback
              }
            })
          );

          return {
            id: Number(group.id),
            name: group.name,
            initials: group.name
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .toUpperCase(),
            members: members, // On ajoute la liste des membres ici
            isGroup: true,
            messages: groupMsgs
              .map((m: any) => ({
                text: m.content,
                fromMe: m.sender === me.id,
                time: new Date(m.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
                timestamp: m.timestamp,
                type: m.type,
                file: m.file,
              }))
              .sort(
                (a: any, b: any) =>
                  new Date(a.timestamp).getTime() -
                  new Date(b.timestamp).getTime()
              ),
          };
        })
      );

      // 3. Traite les conversations privées en se basant sur les messages échangés
      const allUsers = await userService.getAllUsers(token);
      const otherUserIds = new Set<string>();

      allMsgs.forEach((msg: any) => {
        if (
          msg.sender === me.id &&
          !allGroups.some((g: any) => g.id === msg.recipient)
        ) {
          otherUserIds.add(msg.recipient);
        } else if (
          msg.recipient === me.id &&
          !allGroups.some((g: any) => g.id === msg.sender)
        ) {
          otherUserIds.add(msg.sender);
        }
      });

      const privateConvs = await Promise.all(
        Array.from(otherUserIds).map(async (userId: string) => {
          try {
            const contactUser = allUsers.find((u: User) => u.id === userId);
            if (!contactUser) return null;

            const privateMsgs = allMsgs.filter(
              (m: any) =>
                (m.sender === me.id && m.recipient === userId) ||
                (m.sender === userId && m.recipient === me.id)
            );
            return {
              id: Number(contactUser.id),
              name: contactUser.name,
              initials: contactUser.name
                .split(" ")
                .map((n: string) => n[0])
                .join("")
                .toUpperCase(),
              avatar: contactUser.avatar,
              isGroup: false,
              messages: privateMsgs
                .map((m: any) => ({
                  text: m.content,
                  fromMe: m.sender === me.id,
                  time: new Date(m.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                  timestamp: m.timestamp,
                  type: m.type,
                  file: m.file,
                }))
                .sort(
                  (a: any, b: any) =>
                    new Date(a.timestamp).getTime() -
                    new Date(b.timestamp).getTime()
                ),
            };
          } catch (error) {
            console.error(
              `Impossible de récupérer le contact ${userId}`,
              error
            );
            return null;
          }
        })
      );

      const validPrivateConvs = privateConvs.filter(
        (c) => c !== null
      ) as Conversation[];

      // 4. Fusionne les conversations et met à jour l'état
      // On conserve les conversations vides déjà présentes dans allConvs
      const emptyConvs = allConvs.filter(
        (c) =>
          !c.isGroup &&
          (!c.messages || c.messages.length === 0) &&
          ![...groupConvs, ...validPrivateConvs].some(
            (cc) => !cc.isGroup && cc.id === c.id
          )
      );
      const finalConvs = [...groupConvs, ...validPrivateConvs, ...emptyConvs];
      setAllConvs(finalConvs);

      // 5. Met à jour les compteurs de non-lus (logique existante)
      updateUnreadCounts(finalConvs, me.id);
    }

    function updateUnreadCounts(conversations: Conversation[], myId: string) {
      setUnreadCounts((prev) => {
        const updated: { [key: string]: number } = {};
        conversations.forEach((conv) => {
          const key = conv.isGroup ? `group-${conv.id}` : `user-${conv.id}`;
          if (selected === key) {
            updated[key] = 0;
            setLastReadMsgIndex((lri) => ({
              ...lri,
              [key]: conv.messages.length - 1,
            }));
            return;
          }
          const lastRead = lastReadMsgIndex[key] ?? -1;
          let newUnread = 0;
          for (let i = lastRead + 1; i < conv.messages.length; i++) {
            if (conv.messages[i].fromMe === false) {
              // Comparaison stricte
              newUnread++;
            }
          }
          updated[key] = newUnread;
        });
        return updated;
      });
    }

    fetchConversationsAndMessages();
    pollingRef = setInterval(fetchConversationsAndMessages, 5000); // Augmentation du délai
    return () => {
      if (pollingRef) clearInterval(pollingRef);
    };
  }, [currentUser, selected]);

  // Handler pour sélection d'une conversation (remet les non lus à zéro)
  function handleSelectConversation(key: string) {
    setSelected(key);
    setUnreadCounts((prev) => ({ ...prev, [key]: 0 }));
    setLastReadMsgIndex((lri) => {
      // Marque comme lu à l'ouverture si pas déjà fait
      if (allConvs) {
        const found = allConvs.find(
          (c) => (c.isGroup ? `group-${c.id}` : `user-${c.id}`) === key
        );
        if (found) {
          return { ...lri, [key]: found.messages.length - 1 };
        }
      }
      return lri;
    });
  }

  // Handler pour ajout dynamique (depuis Sidebar)
  function handleAddConversation(conv: Conversation) {
    setAllConvs((prev) => {
      const key = conv.isGroup ? `group-${conv.id}` : `user-${conv.id}`;
      // Vérifier s'il existe déjà une conversation avec la même clé
      const exists = prev.some((c) => {
        const existingKey = c.isGroup ? `group-${c.id}` : `user-${c.id}`;
        return existingKey === key;
      });

      if (exists) return prev;
      return [...prev, conv];
    });
    const key = conv.isGroup ? `group-${conv.id}` : `user-${conv.id}`;
    setSelected(key);
  }

  // Handler pour création de groupe - VERSION CORRIGÉE
  function handleCreateGroup(group: {
    name: string;
    members: { id: string; name: string }[];
    id?: number;
  }) {
    const creator = currentUser
      ? { id: String(currentUser.id), name: currentUser.name }
      : null;
    let members = group.members || [];
    if (creator && !members.some((m) => m.id === creator.id)) {
      members = [...members, creator];
    }
    // Utilise l'id du backend si fourni, sinon génère un id temporaire négatif unique
    let groupId: number;

    if (group.id) {
      groupId = group.id;
    } else {
      // Génère un id temporaire négatif unique
      const existingNegativeIds = allConvs
        .filter((c) => c.isGroup && c.id < 0)
        .map((c) => c.id);

      groupId =
        existingNegativeIds.length > 0
          ? Math.min(...existingNegativeIds) - 1
          : -1;
    }

    // Vérifie si un groupe existe déjà avec le même id ET le même type
    const groupKey = `group-${groupId}`;
    const existingGroup = allConvs.find((c) => c.isGroup && c.id === groupId);

    if (existingGroup) {
      // Le groupe existe déjà, on le sélectionne simplement
      setSelected(groupKey);
      return;
    }

    // Crée le nouveau groupe
    const initials = group.name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase();

    const conv: Conversation = {
      id: groupId,
      name: group.name,
      initials,
      isGroup: true,
      messages: [],
    };

    setAllConvs((prev) => {
      // Double vérification pour éviter les doublons
      const exists = prev.some((c) => c.isGroup && c.id === groupId);
      if (exists) return prev;

      return [conv, ...prev];
    });

    setSelected(groupKey);
  }

  const selectedConv = allConvs.find(
    (c) => (c.isGroup ? `group-${c.id}` : `user-${c.id}`) === selected
  );

  return (
    <div className="flex min-h-screen bg-[#f9fbfa]">
      <Toaster richColors position="top-right" />
      {/* Sidebar (gauche) */}
      <div className="w-full sm:w-80 flex-shrink-0">
        <Sidebar
          allConvs={allConvs}
          selected={selected}
          onSelect={handleSelectConversation}
          onAddConversation={handleAddConversation}
          onCreateGroup={handleCreateGroup}
          currentUser={currentUser}
          unreadCounts={unreadCounts}
        />
      </div>
      {/* Zone centrale : accueil ou chat */}
      <main className="flex-1 flex flex-col h-screen">
        {selected === null ? (
          <WaxtaanLogo />
        ) : selectedConv ? (
          <ChatWindow
            conversation={selectedConv}
            onBack={() => setSelected(null)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            Aucune conversation sélectionnée ou conversation introuvable.
          </div>
        )}
      </main>
    </div>
  );
}
