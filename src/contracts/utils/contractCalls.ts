import { createPublicClient, createWalletClient, http, getContract, parseEther } from 'viem';
import { mainnet, polygon, optimism, arbitrum, base, sepolia } from 'viem/chains';
import { CONTRACT_ADDRESSES } from '../../libs/constants';

import ensAbi from '../abi/ChainChatENS.json';
import friendsAbi from '../abi/ChainChatFriends.json';
import groupsAbi from '../abi/ChainChatGroups.json';
import chatTokenAbi from '../abi/ChatToken.json';

// Chain configuration
const chains = {
  1: mainnet,
  137: polygon,
  10: optimism,
  42161: arbitrum,
  8453: base,
  11155111: sepolia, // Testnet
};

/**
 * Get public client for reading contract data
 */
export const getPublicClient = (chainId: number = 11155111) => {
  const chain = chains[chainId as keyof typeof chains] || sepolia;
  
  return createPublicClient({
    chain,
    transport: http(),
  });
};

/**
 * Get wallet client for writing to contracts
 */
export const getWalletClient = (chainId: number = 11155111) => {
  const chain = chains[chainId as keyof typeof chains] || sepolia;
  
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

  constructor(chainId: number = 11155111) {
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

  async getRegistrationFee(): Promise<bigint> {
    const contract = this.getReadContract();
    return await contract.read.getRegistrationFee();
  }

  async getTotalUsers(): Promise<bigint> {
    const contract = this.getReadContract();
    return await contract.read.getTotalUsers();
  }

  async isRegistered(address: string): Promise<boolean> {
    const contract = this.getReadContract();
    return await contract.read.isRegistered([address]);
  }

  // Write functions
  async registerUsername(username: string) {
    const contract = this.getWriteContract();
    const fee = await this.getRegistrationFee();
    return await contract.write.register([username], {
      value: fee,
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

  async updateProfile(bio: string, avatarHash: string) {
    const contract = this.getWriteContract();
    return await contract.write.updateProfile([bio, avatarHash]);
  }
}

/**
 * Friends Contract Functions
 */
export class FriendsContractService {
  private publicClient: any;
  private walletClient: any;

  constructor(chainId: number = 11155111) {
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

  async friendRequestExists(from: string, to: string): Promise<boolean> {
    const contract = this.getReadContract();
    return await contract.read.friendRequestExists([from, to]);
  }

  async getFriendRequest(from: string, to: string) {
    const contract = this.getReadContract();
    return await contract.read.getFriendRequest([from, to]);
  }

  async getFriendSuggestions(address: string, limit: number): Promise<string[]> {
    const contract = this.getReadContract();
    return await contract.read.getFriendSuggestions([address, BigInt(limit)]);
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

  constructor(chainId: number = 11155111) {
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

  async getGroupSettings(groupId: bigint) {
    const contract = this.getReadContract();
    return await contract.read.getGroupSettings([groupId]);
  }

  async getPublicGroups(offset: number, limit: number) {
    const contract = this.getReadContract();
    return await contract.read.getPublicGroups([BigInt(offset), BigInt(limit)]);
  }

  async searchGroups(query: string, limit: number) {
    const contract = this.getReadContract();
    return await contract.read.searchGroups([query, BigInt(limit)]);
  }

  async getTotalGroups(): Promise<bigint> {
    const contract = this.getReadContract();
    return await contract.read.getTotalGroups();
  }

  // Write functions
  async createGroup(
    name: string, 
    description: string, 
    avatarHash: string, 
    groupType: number, 
    isPublic: boolean
  ) {
    const contract = this.getWriteContract();
    return await contract.write.createGroup([name, description, avatarHash, groupType, isPublic], {
      value: parseEther('0.001'), // GROUP_CREATION_FEE
    });
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

  async addGroupAdmin(groupId: bigint, adminAddress: string) {
    const contract = this.getWriteContract();
    return await contract.write.addAdmin([groupId, adminAddress]);
  }

  async removeGroupAdmin(groupId: bigint, adminAddress: string) {
    const contract = this.getWriteContract();
    return await contract.write.removeAdmin([groupId, adminAddress]);
  }

  async updateGroupInfo(groupId: bigint, name: string, description: string, avatarHash: string) {
    const contract = this.getWriteContract();
    return await contract.write.updateGroupInfo([groupId, name, description, avatarHash]);
  }

  async updateGroupSettings(
    groupId: bigint, 
    isPublic: boolean, 
    requireApproval: boolean, 
    allowInvites: boolean, 
    maxMembers: number
  ) {
    const contract = this.getWriteContract();
    return await contract.write.updateGroupSettings([groupId, isPublic, requireApproval, allowInvites, BigInt(maxMembers)]);
  }

  async transferGroupOwnership(groupId: bigint, newOwner: string) {
    const contract = this.getWriteContract();
    return await contract.write.transferOwnership([groupId, newOwner]);
  }
}

/**
 * ChatToken Contract Functions
 */
export class ChatTokenContractService {
  private publicClient: any;
  private walletClient: any;

  constructor(chainId: number = 11155111) {
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

  async getTotalEarned(address: string): Promise<bigint> {
    const contract = this.getReadContract();
    return await contract.read.getTotalEarned([address]);
  }

  async getActivityCount(address: string, activity: string): Promise<bigint> {
    const contract = this.getReadContract();
    return await contract.read.getActivityCount([address, activity]);
  }

  async getActivityReward(activity: string): Promise<bigint> {
    const contract = this.getReadContract();
    return await contract.read.getActivityReward([activity]);
  }

  async getUserStats(address: string) {
    const contract = this.getReadContract();
    return await contract.read.getUserStats([address]);
  }

  async getTimeUntilNextClaim(address: string): Promise<bigint> {
    const contract = this.getReadContract();
    return await contract.read.getTimeUntilNextClaim([address]);
  }

  async getRewardMultiplier(address: string): Promise<bigint> {
    const contract = this.getReadContract();
    return await contract.read.getRewardMultiplier([address]);
  }

  // Write functions
  async claimDailyReward() {
    const contract = this.getWriteContract();
    return await contract.write.claimDailyReward();
  }

  async claimPendingRewards() {
    const contract = this.getWriteContract();
    return await contract.write.claimPendingRewards();
  }

  async rewardActivity(userAddress: string, activity: string) {
    const contract = this.getWriteContract();
    return await contract.write.rewardActivity([userAddress, activity]);
  }

  async burn(amount: bigint) {
    const contract = this.getWriteContract();
    return await contract.write.burn([amount]);
  }
}

/**
 * Contract Event Watchers
 */
export class ContractEventWatcher {
  private publicClient: any;

  constructor(chainId: number = 11155111) {
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

  watchAvatarUpdates(callback: (log: any) => void) {
    return this.publicClient.watchContractEvent({
      address: CONTRACT_ADDRESSES.ENS as `0x${string}`,
      abi: ensAbi,
      eventName: 'AvatarUpdated',
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

  watchFriendRequestDeclined(callback: (log: any) => void) {
    return this.publicClient.watchContractEvent({
      address: CONTRACT_ADDRESSES.FRIENDS as `0x${string}`,
      abi: friendsAbi,
      eventName: 'FriendRequestDeclined',
      onLogs: callback,
    });
  }

  watchFriendshipRemoved(callback: (log: any) => void) {
    return this.publicClient.watchContractEvent({
      address: CONTRACT_ADDRESSES.FRIENDS as `0x${string}`,
      abi: friendsAbi,
      eventName: 'FriendshipRemoved',
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

  watchDailyRewardClaimed(callback: (log: any) => void) {
    return this.publicClient.watchContractEvent({
      address: CONTRACT_ADDRESSES.CHAT_TOKEN as `0x${string}`,
      abi: chatTokenAbi,
      eventName: 'DailyRewardClaimed',
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