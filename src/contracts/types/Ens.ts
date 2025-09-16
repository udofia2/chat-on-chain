export interface Profile {
  username: string;
  bio: string;
  avatarHash: string;
  registrationTime: bigint;
}

export interface UsernameRegisteredEvent {
  owner: string;
  username: string;
  tokenId: bigint;
}

export interface BioUpdatedEvent {
  user: string;
  bio: string;
}

export interface AvatarUpdatedEvent {
  user: string;
  avatarHash: string;
}

export interface EnsContractRead {
  isAvailable: (username: string) => Promise<boolean>;
  getUsername: (owner: string) => Promise<string>;
  getOwner: (username: string) => Promise<string>;
  getProfile: (user: string) => Promise<Profile>;
}

export interface EnsContractWrite {
  register: (username: string) => Promise<string>;
  setBio: (bio: string) => Promise<string>;
  setAvatar: (avatarHash: string) => Promise<string>;
}

export type EnsContract = EnsContractRead & EnsContractWrite;