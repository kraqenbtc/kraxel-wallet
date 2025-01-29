import { 
  makeRandomPrivKey, 
  getAddressFromPrivateKey,
  makeSTXTokenTransfer,
  broadcastTransaction,
  standardPrincipalCV,
  PostConditionMode,
  SignedTokenTransferOptions
} from '@stacks/transactions';
import { STACKS_MAINNET } from '@stacks/network';
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
          timestamp: tx.burn_block_time * 1000,
          sender: tx.sender_address,
          recipient: tx.token_transfer?.recipient_address || ''
        };
      });
    } catch (error) {
      return [];
    }
  }

  public async sendSTX(
    senderKey: string,
    recipientAddress: string,
    amount: number,
    memo: string = '',
    fee: number = 0.003 // Default fee parametresi ekleyelim
  ) {
    try {
      if (!senderKey || typeof senderKey !== 'string') {
        throw new Error('Private key is required');
      }

      if (!recipientAddress) {
        throw new Error('Recipient address is required');
      }

      if (!amount || amount <= 0) {
        throw new Error('Invalid amount');
      }

      // Private key'i hex formatına çevir
      const privateKeyHex = senderKey.startsWith('0x') ? senderKey : `0x${senderKey}`;
      
      const network = this.networkManager.getNetwork();
      const amountInMicroSTX = Math.floor(amount * 1_000_000);

      // Get sender address
      const senderAddress = getAddressFromPrivateKey(privateKeyHex, 'mainnet');

      // Get nonce
      const accountResponse = await fetch(
        `https://api.hiro.so/v2/accounts/${senderAddress}?proof=0`
      );
      
      if (!accountResponse.ok) {
        throw new Error('Failed to fetch account info');
      }
      
      const accountData = await accountResponse.json();
      const nonce = accountData.nonce;

      // Fee'yi microSTX'e çevir
      const feeInMicroSTX = Math.floor(fee * 1_000_000);

      // Create transaction options
      const txOptions = {
        recipient: standardPrincipalCV(recipientAddress),
        amount: amountInMicroSTX,
        senderKey: privateKeyHex,
        network,
        memo,
        nonce,
        fee: feeInMicroSTX // Sabit fee yerine parametre olarak gelen fee'yi kullan
      };

      // Make and sign transaction
      const transaction = await makeSTXTokenTransfer(txOptions);

      // Broadcast transaction
      const broadcastResponse = await broadcastTransaction({
        transaction,
        network
      });

      if ('error' in broadcastResponse) {
        throw new Error(broadcastResponse.error);
      }

      return {
        success: true,
        txid: broadcastResponse.txid
      };
    } catch (error: any) {
      console.error('Error sending STX:', error);
      throw new Error(error.message || 'Failed to send STX');
    }
  }
} 