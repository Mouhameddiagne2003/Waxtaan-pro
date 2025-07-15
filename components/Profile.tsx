import React, { useState, useRef } from 'react';
import { toast } from 'sonner';
import { updateUserProfile } from "../services/user.service";
import type { User } from "../types";

interface ProfileProps {
  user: User;
  token: string;
  onClose: () => void;
  onProfileUpdate: (updatedUser: User) => void;
}

const Profile: React.FC<ProfileProps> = ({ user, token, onClose, onProfileUpdate }) => {
  const [password, setPassword] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [status, setStatus] = useState(user.status || 'Hey there! I am using WhatsApp.');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(user.avatar || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setPreviewAvatar(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    try {
      const payload: any = {
        name,
        status,
      };

      if (password) {
        payload.password = password;
      }

      if (avatarFile) {
        payload.avatar = avatarFile;
      }

      const updatedUser = await updateUserProfile(token, payload);
      onProfileUpdate(updatedUser);
      setIsEditing(false);
      toast.success('Profil mis à jour avec succès !');
    } catch (error) {
      console.error('Failed to update profile', error);
      toast.error('Échec de la mise à jour du profil.');
      // Gérer l'affichage de l'erreur ici
    }
  };

  return (
    <div className="absolute top-0 left-0 w-full h-full bg-[#f0f2f5] z-20 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-6 px-4 py-3 bg-[#25d366] text-white shadow-sm">
        <button onClick={onClose} className="p-2 rounded-full hover:bg-white/20">
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <h2 className="font-semibold text-lg">Profil</h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto flex flex-col">
        {/* Avatar */}
        <div className="py-8 flex justify-center">
          <div className="relative">
            <div className="w-40 h-40 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
              {previewAvatar ? (
                <img src={previewAvatar.startsWith('blob:') || previewAvatar.startsWith('http') ? previewAvatar : `http://localhost:8080${previewAvatar}`} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-5xl text-gray-600">{user.name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            {isEditing && (
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-2 right-2 w-10 h-10 bg-[#25d366] rounded-full flex items-center justify-center text-white shadow-lg hover:bg-[#128C7E] transition"
              >
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M21.28 5.22l-2.5-2.5a1.5 1.5 0 00-2.12 0L4 15.34V20h4.66l12.62-12.62a1.5 1.5 0 000-2.16zM12 18H6v-6l9-9 6 6-9 9z" fill="currentColor"/></svg>
              </button>
            )}
            <input type="file" ref={fileInputRef} onChange={handleAvatarChange} className="hidden" accept="image/*" />
          </div>
        </div>

        {/* User Info */}
        <div className="bg-white px-6 py-4 shadow-sm">
          <label className="text-xs text-[#25d366]">Votre nom</label>
          <div className="flex items-center justify-between py-2">
            {isEditing ? (
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-transparent focus:outline-none text-lg" />
            ) : (
              <p className="text-lg">{name}</p>
            )}
          </div>
        </div>

        <p className='text-center text-sm text-gray-500 px-6 py-4'>Ce n'est pas votre nom d'utilisateur. Ce nom sera visible pour vos contacts WhatsApp.</p>

        <div className="bg-white px-6 py-4 shadow-sm mt-2">
          <label className="text-xs text-[#25d366]">Statut</label>
          <div className="flex items-center justify-between py-2">
            {isEditing ? (
              <input type="text" value={status} onChange={e => setStatus(e.target.value)} className="w-full bg-transparent focus:outline-none text-lg" />
            ) : (
              <p className="text-lg">{status}</p>
            )}
          </div>
        </div>



        {isEditing && (
          <div className="bg-white px-6 py-4 shadow-sm mt-2">
            <label className="text-xs text-[#25d366]">Nouveau mot de passe</label>
            <div className="flex items-center justify-between py-2">
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder='Laisser vide pour ne pas changer' className="w-full bg-transparent focus:outline-none text-lg" />
            </div>
          </div>
        )}

        <div className="mt-auto p-6">
          {isEditing ? (
            <button onClick={handleSave} className="w-full bg-[#25d366] text-white font-bold py-3 rounded-lg hover:bg-[#128C7E] transition">
              Enregistrer les modifications
            </button>
          ) : (
            <button onClick={() => setIsEditing(true)} className="w-full bg-[#25d366] text-white font-bold py-3 rounded-lg hover:bg-[#128C7E] transition">
              Modifier
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
