import { contextBridge, ipcRenderer } from 'electron';

interface Transaction {
  tx_id: string;
  tx_type: string;
  tx_status: string;
  amount: string;
  timestamp: number;
  sender: string;
  recipient: string;
}

interface WalletInfo {
  address: string;
  name: string;
  balance: string;
}

// Güvenli API tanımlamaları
contextBridge.exposeInMainWorld('wallet', {
  // Cüzdan işlemleri için güvenli metodlar
  createNewWallet: () => ipcRenderer.invoke('wallet:create'),
  getBalance: (address: string) => ipcRenderer.invoke('wallet:getBalance', address),
  switchNetwork: (network: 'mainnet' | 'testnet') => 
    ipcRenderer.invoke('wallet:switchNetwork', network),
  save: (wallet: any) => ipcRenderer.invoke('wallet:save', wallet),
  load: () => ipcRenderer.invoke('wallet:load'),
  exists: () => ipcRenderer.invoke('wallet:exists'),
  getWallets: () => ipcRenderer.invoke('wallet:getWallets'),
  selectWallet: (address: string, pin: string) => ipcRenderer.invoke('wallet:select', address, pin),
  getTransactions: (address: string) => ipcRenderer.invoke('wallet:getTransactions', address)
});

contextBridge.exposeInMainWorld('api', {
  versions: {
    node: () => process.versions.node,
    chrome: () => process.versions.chrome,
    electron: () => process.versions.electron
  }
});

declare global {
  interface Window {
    wallet: {
      createNewWallet: () => Promise<{ address: string; privateKey: string }>;
      getBalance: (address: string) => Promise<string>;
      save: (wallet: any) => Promise<{ success: boolean }>;
      load: () => Promise<any>;
      exists: () => Promise<boolean>;
      getWallets: () => Promise<Array<{ address: string; name: string }>>;
      selectWallet: (address: string, pin: string) => Promise<{ success: boolean; wallet: any }>;
      getTransactions: (address: string) => Promise<Transaction[]>;
    };
  }
} 