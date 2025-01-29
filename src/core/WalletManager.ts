import { 
  makeRandomPrivKey, 
  getAddressFromPrivateKey,
} from '@stacks/transactions';
import { NetworkManager } from './StacksNetwork';

interface Transaction {
  tx_id: string;
  tx_type: string;
  tx_status: string;
  amount: string;
  timestamp: number;
  sender: string;
  recipient: string;
}

export class WalletManager {
  private static instance: WalletManager;
  private networkManager: NetworkManager;

  private constructor() {
    this.networkManager = NetworkManager.getInstance();
  }

  public static getInstance(): WalletManager {
    if (!WalletManager.instance) {
      WalletManager.instance = new WalletManager();
    }
    return WalletManager.instance;
  }

  public async createNewWallet() {
    try {
      const privateKey = makeRandomPrivKey();
      const address = getAddressFromPrivateKey(privateKey, 'mainnet');
      return { address, privateKey };
    } catch (error) {
      throw error;
    }
  }

  public async getBalance(address: string) {
    try {
      const baseUrl = 'https://api.hiro.so';
      const response = await fetch(`${baseUrl}/extended/v1/address/${address}/balances`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const balanceInMicroStx = data.stx?.balance || '0';
      // 6 decimal için 1_000_000'a böl
      const balanceInStx = (Number(balanceInMicroStx) / 1_000_000).toFixed(6);
      return balanceInStx;
    } catch (error) {
      return '0.000000';
    }
  }

  public async getTransactions(address: string) {
    try {
      const baseUrl = 'https://api.hiro.so';
      const response = await fetch(
        `${baseUrl}/extended/v1/address/${address}/transactions?limit=10`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      return data.results.map((tx: any) => {
        const amount = tx.token_transfer?.amount || '0';
        return {
          tx_id: tx.tx_id,
          tx_type: tx.tx_type,
          tx_status: tx.tx_status,
          amount: (Number(amount) / 1_000_000).toFixed(6),
          timestamp: tx.burn_block_time * 1000, // Unix timestamp to milliseconds
          sender: tx.sender_address,
          recipient: tx.token_transfer?.recipient_address || ''
        };
      });
    } catch (error) {
      return [];
    }
  }
} 