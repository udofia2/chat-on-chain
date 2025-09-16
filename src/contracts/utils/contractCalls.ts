import { createPublicClient, createWalletClient, http, getContract, parseEther } from 'viem';
import { mainnet, polygon, optimism } from 'viem/chains';
import { CONTRACT_ADDRESSES } from '../../libs/constants';

import ensAbi from '../abi/Ens.json';
import friendsAbi from '../abi/Friends.json';
import groupsAbi from '../abi/Groups.json';
import chatTokenAbi from '../abi/ChatToken.json';

import type { EnsContract } from '../types/Ens';
import type { FriendsContract } from '../types/Friends';
import type { GroupsContract } from '../types/Groups';

// Chain configuration
const chains = {
  1: mainnet,
  137: polygon,
  10: optimism,
};

/**
 * Get public client for reading contract data
 */
export const getPublicClient = (chainId: number = 137) => {
  const chain = chains[chainId as keyof typeof chains] || polygon;
  
  return createPublicClient({
    chain,
    transport: http(),
  });
};

/**
 * Get wallet client for writing to contracts
 */
export const getWalletClient = (chainId: number = 137) => {
  const chain = chains[chainId as keyof typeof chains] || polygon;
  
  return createWalletClient({
    chain,
    transport: http(),
  });
};

/**
 * ENS Contract Functions
 */
export class EnsContractService {
  private publicClient: any;
  private walletClient: any;

  constructor(chainId: number = 137) {
    this.publicClient = getPublicClient(chainId);
    this.walletClient = getWalletClient(chainId);
  }

  private getReadContract() {
    return getContract({
      address: CONTRACT_ADDRESSES.ENS as `0x${string}`,
      abi: ensAbi,
      client: this.publicClient,
    });
  }

  private getWriteContract() {
    return getContract({
      address: CONTRACT_ADDRESSES.ENS as `0x${string}`,
      abi: ensAbi,
      client: this.walletClient,
    });
  }

  // Read functions
  async isUsernameAvailable(username: string): Promise<boolean> {
    const contract = this.getReadContract();
    return await contract.read.isAvailable([username]);
  }

  async getUsernameByAddress(address: string): Promise<string> {
    const contract = this.getReadContract();
    return await contract.read.getUsername([address]);
  }

  async getAddressByUsername(username: string): Promise<string> {
    const contract = this.getReadContract();
    return await contract.read.getOwner([username]);
  }

  async getProfile(address: string) {
    const contract = this.getReadContract();
    return await contract.read.getProfile([address]);
  }

  // Write functions
  async registerUsername(username: string) {
    const contract = this.getWriteContract();
    return await contract.write.register([username], {
      value: parseEther('0.01'), // Registration fee
    });
  }

  async updateBio(bio: string) {
    const contract = this.getWriteContract();
    return await contract.write.setBio([bio]);
  }

  async updateAvatar(avatarHash: string) {
    const contract = this.getWriteContract();
    return await contract.write.setAvatar([avatarHash]);
  }
}

/**
 * Friends Contract Functions
 */
export class FriendsContractService {
  private publicClient: any;
  private walletClient: any;

  constructor(chainId: number = 137) {
    this.publicClient = getPublicClient(chainId);
    this.walletClient = getWalletClient(chainId);
  }

  private getReadContract() {
    return getContract({
      address: CONTRACT_ADDRESSES.FRIENDS as `0x${string}`,
      abi: friendsAbi,
      client: this.publicClient,
    });
  }

  private getWriteContract() {
    return getContract({
      address: CONTRACT_ADDRESSES.FRIENDS as `0x${string}`,
      abi: friendsAbi,
      client: this.walletClient,
    });
  }

  // Read functions
  async getFriends(address: string): Promise<string[]> {
    const contract = this.getReadContract();
    return await contract.read.getFriends([address]);
  }

  async getPendingRequests(address: string) {
    const contract = this.getReadContract();
    return await contract.read.getPendingRequests([address]);
  }

  async areFriends(address1: string, address2: string): Promise<boolean> {
    const contract = this.getReadContract();
    return await contract.read.areFriends([address1, address2]);
  }

  async getFriendCount(address: string): Promise<bigint> {
    const contract = this.getReadContract();
    return await contract.read.getFriendCount([address]);
  }

  // Write functions
  async sendFriendRequest(friendAddress: string, message: string) {
    const contract = this.getWriteContract();
    return await contract.write.sendFriendRequest([friendAddress, message]);
  }

  async acceptFriendRequest(requesterAddress: string) {
    const contract = this.getWriteContract();
    return await contract.write.acceptFriendRequest([requesterAddress]);
  }

  async declineFriendRequest(requesterAddress: string) {
    const contract = this.getWriteContract();
    return await contract.write.declineFriendRequest([requesterAddress]);
  }

  async removeFriend(friendAddress: string) {
    const contract = this.getWriteContract();
    return await contract.write.removeFriend([friendAddress]);
  }
}

/**
 * Groups Contract Functions
 */
export class GroupsContractService {
  private publicClient: any;
  private walletClient: any;

  constructor(chainId: number = 137) {
    this.publicClient = getPublicClient(chainId);
    this.walletClient = getWalletClient(chainId);
  }

  private getReadContract() {
    return getContract({
      address: CONTRACT_ADDRESSES.GROUPS as `0x${string}`,
      abi: groupsAbi,
      client: this.publicClient,
    });
  }

  private getWriteContract() {
    return getContract({
      address: CONTRACT_ADDRESSES.GROUPS as `0x${string}`,
      abi: groupsAbi,
      client: this.walletClient,
    });
  }

  // Read functions
  async getGroup(groupId: bigint) {
    const contract = this.getReadContract();
    return await contract.read.getGroup([groupId]);
  }

  async getGroupMembers(groupId: bigint): Promise<string[]> {
    const contract = this.getReadContract();
    return await contract.read.getMembers([groupId]);
  }

  async getUserGroups(address: string): Promise<bigint[]> {
    const contract = this.getReadContract();
    return await contract.read.getUserGroups([address]);
  }

  async isGroupMember(groupId: bigint, address: string): Promise<boolean> {
    const contract = this.getReadContract();
    return await contract.read.isMember([groupId, address]);
  }

  async isGroupAdmin(groupId: bigint, address: string): Promise<boolean> {
    const contract = this.getReadContract();
    return await contract.read.isAdmin([groupId, address]);
  }

  // Write functions
  async createGroup(name: string, description: string, avatarHash: string) {
    const contract = this.getWriteContract();
    return await contract.write.createGroup([name, description, avatarHash]);
  }

  async addGroupMember(groupId: bigint, memberAddress: string) {
    const contract = this.getWriteContract();
    return await contract.write.addMember([groupId, memberAddress]);
  }

  async removeGroupMember(groupId: bigint, memberAddress: string) {
    const contract = this.getWriteContract();
    return await contract.write.removeMember([groupId, memberAddress]);
  }

  async leaveGroup(groupId: bigint) {
    const contract = this.getWriteContract();
    return await contract.write.leaveGroup([groupId]);
  }

  async updateGroupInfo(groupId: bigint, name: string, description: string) {
    const contract = this.getWriteContract();
    return await contract.write.updateGroupInfo([groupId, name, description]);
  }
}

/**
 * ChatToken Contract Functions
 */
export class ChatTokenContractService {
  private publicClient: any;
  private walletClient: any;

  constructor(chainId: number = 137) {
    this.publicClient = getPublicClient(chainId);
    this.walletClient = getWalletClient(chainId);
  }

  private getReadContract() {
    return getContract({
      address: CONTRACT_ADDRESSES.CHAT_TOKEN as `0x${string}`,
      abi: chatTokenAbi,
      client: this.publicClient,
    });
  }

  private getWriteContract() {
    return getContract({
      address: CONTRACT_ADDRESSES.CHAT_TOKEN as `0x${string}`,
      abi: chatTokenAbi,
      client: this.walletClient,
    });
  }

  // Read functions
  async getBalance(address: string): Promise<bigint> {
    const contract = this.getReadContract();
    return await contract.read.balanceOf([address]);
  }

  async getPendingRewards(address: string): Promise<bigint> {
    const contract = this.getReadContract();
    return await contract.read.getPendingRewards([address]);
  }

  async getLastClaimTime(address: string): Promise<bigint> {
    const contract = this.getReadContract();
    return await contract.read.getLastClaimTime([address]);
  }

  async canClaimDailyReward(address: string): Promise<boolean> {
    const contract = this.getReadContract();
    return await contract.read.canClaimDaily([address]);
  }

  async getTotalSupply(): Promise<bigint> {
    const contract = this.getReadContract();
    return await contract.read.totalSupply();
  }

  // Write functions
  async claimDailyReward() {
    const contract = this.getWriteContract();
    return await contract.write.claimDailyReward();
  }

  async rewardActivity(userAddress: string, activity: string) {
    const contract = this.getWriteContract();
    return await contract.write.rewardActivity([userAddress, activity]);
  }
}

/**
 * Contract Event Watchers
 */
export class ContractEventWatcher {
  private publicClient: any;

  constructor(chainId: number = 137) {
    this.publicClient = getPublicClient(chainId);
  }

  // Watch ENS events
  watchUsernameRegistrations(callback: (log: any) => void) {
    return this.publicClient.watchContractEvent({
      address: CONTRACT_ADDRESSES.ENS as `0x${string}`,
      abi: ensAbi,
      eventName: 'UsernameRegistered',
      onLogs: callback,
    });
  }

  watchProfileUpdates(callback: (log: any) => void) {
    return this.publicClient.watchContractEvent({
      address: CONTRACT_ADDRESSES.ENS as `0x${string}`,
      abi: ensAbi,
      eventName: 'BioUpdated',
      onLogs: callback,
    });
  }

  // Watch Friends events
  watchFriendRequests(callback: (log: any) => void) {
    return this.publicClient.watchContractEvent({
      address: CONTRACT_ADDRESSES.FRIENDS as `0x${string}`,
      abi: friendsAbi,
      eventName: 'FriendRequestSent',
      onLogs: callback,
    });
  }

  watchFriendRequestAccepted(callback: (log: any) => void) {
    return this.publicClient.watchContractEvent({
      address: CONTRACT_ADDRESSES.FRIENDS as `0x${string}`,
      abi: friendsAbi,
      eventName: 'FriendRequestAccepted',
      onLogs: callback,
    });
  }

  // Watch Groups events
  watchGroupCreation(callback: (log: any) => void) {
    return this.publicClient.watchContractEvent({
      address: CONTRACT_ADDRESSES.GROUPS as `0x${string}`,
      abi: groupsAbi,
      eventName: 'GroupCreated',
      onLogs: callback,
    });
  }

  watchGroupMemberChanges(callback: (log: any) => void) {
    return this.publicClient.watchContractEvent({
      address: CONTRACT_ADDRESSES.GROUPS as `0x${string}`,
      abi: groupsAbi,
      eventName: 'MemberAdded',
      onLogs: callback,
    });
  }

  // Watch ChatToken events
  watchTokenRewards(callback: (log: any) => void) {
    return this.publicClient.watchContractEvent({
      address: CONTRACT_ADDRESSES.CHAT_TOKEN as `0x${string}`,
      abi: chatTokenAbi,
      eventName: 'TokensRewarded',
      onLogs: callback,
    });
  }
}

// Export singleton instances
export const ensContract = new EnsContractService();
export const friendsContract = new FriendsContractService();
export const groupsContract = new GroupsContractService();
export const chatTokenContract = new ChatTokenContractService();
export const eventWatcher = new ContractEventWatcher();