export interface HobbyInterface {
  icon: string;
  label: string;
}

export interface UserDetailsInterface {
  name: string;
  language: string;
  age: number;
  userDescription: string | null;
  profession: string | null;
  interests: string | null;
}

export interface UserLocationInterface {
  country: string | null;
  city: string | null;
}

export interface GetUserInterface {
  details: UserDetailsInterface;
  hobbies: HobbyInterface[];
  location: UserLocationInterface;
}
