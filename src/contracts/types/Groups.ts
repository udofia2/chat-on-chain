export interface Group {
  id: bigint;
  name: string;
  description: string;
  avatarHash: string;
  admin: string;
  createdAt: bigint;
  memberCount: bigint;
}

export interface GroupCreatedEvent {
  groupId: bigint;
  admin: string;
  name: string;
}

export interface MemberAddedEvent {
  groupId: bigint;
  member: string;
}

export interface MemberRemovedEvent {
  groupId: bigint;
  member: string;
}

export interface GroupsContractRead {
  getGroup: (groupId: bigint) => Promise<Group>;
  getMembers: (groupId: bigint) => Promise<string[]>;
  getUserGroups: (user: string) => Promise<bigint[]>;
  isMember: (groupId: bigint, user: string) => Promise<boolean>;
  isAdmin: (groupId: bigint, user: string) => Promise<boolean>;
}

export interface GroupsContractWrite {
  createGroup: (name: string, description: string, avatarHash: string) => Promise<string>;
  addMember: (groupId: bigint, member: string) => Promise<string>;
  removeMember: (groupId: bigint, member: string) => Promise<string>;
  leaveGroup: (groupId: bigint) => Promise<string>;
  updateGroupInfo: (groupId: bigint, name: string, description: string) => Promise<string>;
}

export type GroupsContract = GroupsContractRead & GroupsContractWrite;