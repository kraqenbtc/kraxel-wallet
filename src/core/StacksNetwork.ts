import { StacksNetwork, STACKS_MAINNET } from '@stacks/network';

export class NetworkManager {
  private static instance: NetworkManager;
  private currentNetwork: StacksNetwork;

  private constructor() {
    this.currentNetwork = STACKS_MAINNET;
  }

  public static getInstance(): NetworkManager {
    if (!NetworkManager.instance) {
      NetworkManager.instance = new NetworkManager();
    }
    return NetworkManager.instance;
  }

  public getNetwork(): StacksNetwork {
    return this.currentNetwork;
  }

  public isMainnet(): boolean {
    return true;
  }
} 