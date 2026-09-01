export type Photo = {
  id: string;
  url: string;
  alt: string;
  order: number;
};

export type Profile = {
  id: string;
  fullName: string;
  position: string;
  description: string;
  photos: Photo[];
};

export type Project = {
  id: string;
  title: string;
  description: string;
  link: string | null;
  order: number;
  photos: Photo[];
};

export type PhotoData = {
  id: string;
  url: string;
  alt: string;
  order: number;
  profileId: string | null;
  projectId: string | null;
};