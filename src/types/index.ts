export type Photo = {
  id: string;
  url: string;
  alt: string;
  description: string | null;
  order: number;
};

export type Profile = {
  id: string;
  fullName: string;
  position: string;
  description: string;
  sliderAutoPlay: boolean;
  siteTitle: string;
  siteDescription: string;
  email: string;
  phone: string;
  aboutExtraTitle: string;
  aboutExtra: string;
  aboutExtraVisible: boolean;
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
  description: string | null;
  order: number;
  profileId: string | null;
  projectId: string | null;
};