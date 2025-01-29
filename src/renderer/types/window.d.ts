export {};

declare global {
  interface WalletInfo {
    address: string;
    name: string;
    balance: string;
  }

  interface Window {
    wallet: {
      createNewWallet: () => Promise<{
        address: string;
        privateKey: string;
      }>;
      getBalance: (address: string) => Promise<string>;
      switchNetwork: (network: 'mainnet' | 'testnet') => Promise<{ 
        success: boolean 
      }>;
      saveWallet: (wallet: { 
        address: string; 
        privateKey: string;
        name: string;
        pin: string;
      }) => Promise<{ 
        success: boolean 
      }>;
      loadWallet: () => Promise<WalletInfo & { requiresAuth: boolean }>;
      isWalletExists: () => Promise<boolean>;
      getWallets: () => Promise<Array<{
        address: string;
        name: string;
      }>>;
      selectWallet: (address: string, pin: string) => Promise<{
        success: boolean;
        wallet: WalletInfo;
      }>;
    };
    api: {
      versions: {
        node: () => string;
        chrome: () => string;
        electron: () => string;
      };
    };
  }
} 