export interface Tournament {
  id: string;
  publicNumber: string;
  name: string;
  discipline: string;
  format: string;
  city: string;
  venue: string;
  shortDescription: string;
  description: string;
  startAt: string;
  endAt: string;
  registrationEndsAt: string;
  rules: string[];
  imageName?: string;
  imageUrl?: string;
}
