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
      if (!token) return;

      // Récupère tous les messages du backend
      const msgService = await import("../services/message.service");
      const userService = await import("../services/user.service");
      const groupService = await import("../services/group.service");
      const me = await userService.getCurrentUser(token);

      // Récupère tous les messages (privés et groupes)
      const res = await fetch("http://localhost:8080/api/messages", {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      if (!res.ok) return;
      const allMsgs = await res.json();

      // 1. Récupère les groupes et leurs ids
      let groupConvs: any[] = [];
      let groupIds: string[] = [];
      try {
        const groups = await groupService.getGroups(token);
        // Filtrer les groupes où l'utilisateur connecté est membre
        const myGroups = groups.filter((g: any) =>
          (g.members || []).includes(String(me.id))
        );
        groupIds = myGroups.map((g: any) => String(g.id));
        groupConvs = await Promise.all(
          myGroups.map(async (group: any) => {
            // Récupère les messages du groupe
            // Un message de groupe est valide si recipient == group.id ET sender n'est pas le groupe lui-même (évite collision si un user a le même id qu'un groupe)

            //const groupMsgs = allMsgs.filter((m: any) => String(m.recipient) === String(group.id) && !groupIds.includes(String(m.sender)));

            const groupMsgs = allMsgs.filter((m: any) => {
              // Message destiné au groupe (pas à un membre)
              const isToGroup = String(m.recipient) === String(group.id);
              // L'expéditeur doit être un user (pas le groupe lui-même)
              const isFromUser = !groupIds.includes(String(m.sender));
              // On s'assure que le message n'est pas un message privé entre membres
              return isToGroup && isFromUser;
            });
            // Récupère les noms des membres
            const members = await Promise.all(
              (group.members || []).map(async (id: string) => {
                try {
                  const u = await userService.getUserById(id, token);
                  return { id: u.id, name: u.name };
                } catch {
                  return { id, name: id };
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
              members,
              isGroup: true,
              messages: groupMsgs.map((m: any) => ({
                text: m.content,
                fromMe: m.sender === me.id,
                time: new Date(m.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
                timestamp: m.timestamp,
                type: m.type === "file" ? "file" : undefined,
              })),
            };
          })
        );
      } catch (e) {
        // Pas de groupes ou erreur API
        groupConvs = [];
        groupIds = [];
      }

      // 2. Conversations privées (contacts) : ignorer les messages où sender ou recipient est un groupe
      // On stocke chaque conversation privée avec une clé user-<id> pour éviter toute collision
      const conversationsMap = new Map<
        string,
        {
          id: number;
          name: string;
          initials: string;
          avatar?: string;
          messages: any[];
          isGroup?: boolean;
        }
      >();
      for (const m of allMsgs) {
        // Un message est un message de groupe si et seulement si recipient est un id de groupe (présent dans groupIds)
        const isGroupMsg = groupIds.includes(String(m.recipient));
        if (!isGroupMsg && (m.sender === me.id || m.recipient === me.id)) {
          const contactId =
            m.sender === me.id ? Number(m.recipient) : Number(m.sender);
          const key = `user-${contactId}`;
          if (!conversationsMap.has(key)) {
            // Récupère le nom du contact (API user)
            let contactName = "";
            let contactAvatar: string | undefined;
            try {
              const contact = await userService.getUserById(
                String(contactId),
                token
              );
              contactName = contact.name;
              contactAvatar = contact.avatar;
            } catch {
              contactName = "Contact " + contactId;
            }
            const initials = contactName
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .toUpperCase();
            conversationsMap.set(key, {
              id: contactId,
              name: contactName,
              initials,
              avatar: contactAvatar,
              messages: [],
              isGroup: false,
            });
          }
          conversationsMap.get(key)!.messages.push({
            text: m.content,
            fromMe: m.sender === me.id,
            time: new Date(m.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            timestamp: m.timestamp,
            type: m.type === "file" ? "file" : undefined,
          });
        }
      }
      // Pour la fusion, on extrait juste les valeurs
      const convs = Array.from(conversationsMap.values());

      // 3. Fusionne contacts et groupes, groupes d'abord puis contacts
      setAllConvs((prev) => {
        // Étape 1 : on retire tous les groupes locaux qui ont un id déjà existant côté backend
        // const localConvs = prev.filter(c => {
        //   if (!c.isGroup) {
        //     const hasContact = convs.some(b => b.id === c.id && b.isGroup === false);
        //     return !hasContact;
        //   }
        //   // Supprime tout groupe local dont l'id existe déjà côté backend
        //   if (c.isGroup) {
        //     const hasGroup = groupConvs.some(b => b.id === c.id);
        //     return !hasGroup;
        //   }
        //   return true;
        // });

        const localConvs = prev.filter((c) => {
          if (!c.isGroup) {
            const hasContact = convs.some(
              (b) => b.id === c.id && b.isGroup === false
            );
            return !hasContact;
          }
          if (c.isGroup) {
            // Supprime tout groupe local dont l'id OU le nom existe déjà côté backend
            const hasGroup = groupConvs.some(
              (b) => b.id === c.id || b.name === c.name
            );
            return !hasGroup;
          }
          return true;
        });

        // Étape 2 : on fusionne, puis on retire tout doublon
        const merged = [...groupConvs, ...convs, ...localConvs];

        // Utilise un Map pour éviter les doublons basé sur l'id ET le type (groupe ou non)
        const uniqueConversations = new Map<string, (typeof merged)[0]>();

        for (const conv of merged) {
          const key = conv.isGroup ? `group-${conv.id}` : `user-${conv.id}`;
          // Garde seulement la première occurrence de chaque clé unique
          if (!uniqueConversations.has(key)) {
            uniqueConversations.set(key, conv);
          }
        }

        return Array.from(uniqueConversations.values());
      });

      // Gestion des non lus (pour toutes les conversations, groupes inclus)
      setUnreadCounts((prev) => {
        const updated: { [key: string]: number } = { ...prev };
        // On prend la liste fusionnée groupes + contacts
        [...groupConvs, ...convs].forEach((conv) => {
          const key = conv.isGroup ? `group-${conv.id}` : `user-${conv.id}`;
          // Si la conversation est sélectionnée, on marque tous les messages comme lus
          if (selected === key) {
            updated[key] = 0;
            setLastReadMsgIndex((lri) => ({
              ...lri,
              [key]: conv.messages.length - 1,
            }));
            return;
          }
          // Sinon, on regarde s'il y a de nouveaux messages depuis le dernier index lu
          const lastRead = lastReadMsgIndex[key] ?? -1;
          let newUnread = 0;
          for (let i = lastRead + 1; i < conv.messages.length; i++) {
            const msg = conv.messages[i];
            if (!msg.fromMe) newUnread++;
          }
          updated[key] = newUnread;
        });
        return updated;
      });
    }

    fetchConversationsAndMessages();
    pollingRef = setInterval(fetchConversationsAndMessages, 3000);
    return () => {
      if (pollingRef) clearInterval(pollingRef);
    };
  }, [selected]);

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
