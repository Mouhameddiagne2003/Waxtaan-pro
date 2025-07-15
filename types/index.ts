export type User = {
  id: string;
  name: string;
  status: string;
  avatar?: string; // Le ? indique que le champ est optionnel
  contacts?: string[];
  groups?: string[];
};
