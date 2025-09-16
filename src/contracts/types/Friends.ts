export interface FriendRequest {
  from: string;
  message: string;
  timestamp: bigint;
}

export interface FriendRequestSentEvent {
  from: string;
  to: string;
  message: string;
}

export interface FriendRequestAcceptedEvent {
  from: string;
  to: string;
}

export interface FriendRequestDeclinedEvent {
  from: string;
  to: string;
}

export interface FriendshipRemovedEvent {
  user1: string;
  user2: string;
}

export interface FriendsContractRead {
  getFriends: (user: string) => Promise<string[]>;
  getPendingRequests: (user: string) => Promise<FriendRequest[]>;
  areFriends: (user1: string, user2: string) => Promise<boolean>;
  getFriendCount: (user: string) => Promise<bigint>;
}

export interface FriendsContractWrite {
  sendFriendRequest: (friend: string, message: string) => Promise<string>;
  acceptFriendRequest: (requester: string) => Promise<string>;
  declineFriendRequest: (requester: string) => Promise<string>;
  removeFriend: (friend: string) => Promise<string>;
}

export type FriendsContract = FriendsContractRead & FriendsContractWrite;