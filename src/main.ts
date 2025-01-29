import { app, BrowserWindow, protocol, ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import { WalletManager } from './core/WalletManager';
import { NetworkManager } from './core/StacksNetwork';

interface WalletData {
  address: string;
  privateKey: string;
  name: string;
  pin: string;
}

interface WalletsStorage {
  wallets: WalletData[];
  activeWallet?: string;
}

class MainApplication {
  private mainWindow: BrowserWindow | null = null;
  private walletManager: WalletManager;
  private networkManager: NetworkManager;
  private walletPath: string;
  private isDevelopment: boolean;

  constructor() {
    this.walletManager = WalletManager.getInstance();
    this.networkManager = NetworkManager.getInstance();
    this.walletPath = path.join(app.getPath('userData'), 'wallet.json');
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.initialize();
    this.setupIPCHandlers();
  }

  private setupIPCHandlers(): void {
    ipcMain.handle('wallet:create', async () => {
      return await this.walletManager.createNewWallet();
    });

    ipcMain.handle('wallet:getBalance', async (_, address: string) => {
      return await this.walletManager.getBalance(address);
    });

    ipcMain.handle('wallet:switchNetwork', async () => {
      return { success: true };
    });

    ipcMain.handle('wallet:save', async (_, wallet: WalletData) => {
      try {
        let walletsData: WalletsStorage = { wallets: [] };
        
        if (fs.existsSync(this.walletPath)) {
          walletsData = JSON.parse(fs.readFileSync(this.walletPath, 'utf8'));
        }

        walletsData.wallets.push({
          address: wallet.address,
          privateKey: wallet.privateKey, // TODO: Şifreleme eklenecek
          name: wallet.name,
          pin: wallet.pin // TODO: Hash'lenecek
        });

        fs.writeFileSync(this.walletPath, JSON.stringify(walletsData));
        return { success: true };
      } catch (error) {
        console.error('Failed to save wallet:', error);
        throw error;
      }
    });

    ipcMain.handle('wallet:load', async () => {
      try {
        if (!fs.existsSync(this.walletPath)) {
          throw new Error('No wallet found');
        }
        const walletsData: WalletsStorage = JSON.parse(fs.readFileSync(this.walletPath, 'utf8'));
        
        // Aktif cüzdan kontrolü
        if (!walletsData.activeWallet) {
          throw new Error('No active wallet');
        }

        // Aktif cüzdanın tüm bilgilerini dön
        const activeWallet = walletsData.wallets.find(w => w.address === walletsData.activeWallet);
        if (!activeWallet) {
          throw new Error('Active wallet not found');
        }

        // Balance'ı da al
        const balance = await this.walletManager.getBalance(activeWallet.address);

        return {
          address: activeWallet.address,
          name: activeWallet.name,
          balance: balance,
          requiresAuth: false // PIN doğrulandığı için false
        };
      } catch (error) {
        console.error('Failed to load wallet:', error);
        throw error;
      }
    });

    ipcMain.handle('wallet:exists', () => {
      return fs.existsSync(this.walletPath);
    });

    ipcMain.handle('wallet:getWallets', async () => {
      try {
        if (!fs.existsSync(this.walletPath)) {
          return [];
        }
        
        const walletsData: WalletsStorage = JSON.parse(fs.readFileSync(this.walletPath, 'utf8'));
        return walletsData.wallets.map(w => ({
          address: w.address,
          name: w.name
        }));
      } catch (error) {
        console.error('Failed to get wallets:', error);
        return [];
      }
    });

    ipcMain.handle('wallet:select', async (_, address: string, pin: string) => {
      try {
        if (!fs.existsSync(this.walletPath)) {
          throw new Error('No wallet found');
        }

        const walletsData: WalletsStorage = JSON.parse(fs.readFileSync(this.walletPath, 'utf8'));
        const selectedWallet = walletsData.wallets.find(w => 
          w.address === address && w.pin === pin
        );
        
        if (!selectedWallet) {
          return { success: false, message: 'Invalid wallet or PIN' };
        }

        walletsData.activeWallet = address;
        fs.writeFileSync(this.walletPath, JSON.stringify(walletsData));

        const balance = await this.walletManager.getBalance(address);
        
        return { 
          success: true,
          wallet: {
            address: selectedWallet.address,
            privateKey: selectedWallet.privateKey,
            name: selectedWallet.name,
            balance: balance.toString()
          }
        };
      } catch (error) {
        console.error('Error selecting wallet:', error);
        return { success: false, message: (error as Error).message };
      }
    });

    ipcMain.handle('wallet:getTransactions', async (_, address: string) => {
      return await this.walletManager.getTransactions(address);
    });

    ipcMain.handle(
      'wallet:sendSTX',
      async (_, senderKey: string, recipientAddress: string, amount: number, memo: string) => {
        try {
          return await this.walletManager.sendSTX(senderKey, recipientAddress, amount, memo);
        } catch (error) {
          throw error;
        }
      }
    );

    ipcMain.handle('app:loadSidebarContent', async () => {
      try {
        let sidebarPath;
        if (this.isDevelopment) {
          // Development modunda src klasöründen oku
          sidebarPath = path.join(__dirname, '..', 'src', 'renderer', 'components', 'sidebar.html');
        } else {
          // Production modunda build klasöründen oku
          sidebarPath = path.join(__dirname, 'renderer', 'components', 'sidebar.html');
        }
        
        console.log('Loading sidebar from:', sidebarPath); // Debug için
        const content = await fsPromises.readFile(sidebarPath, 'utf8');
        return content;
      } catch (error) {
        console.error('Failed to load sidebar content:', error);
        throw error;
      }
    });
  }

  private async encryptWallet(wallet: { address: string; privateKey: string }) {
    // TODO: Implement proper encryption
    return wallet;
  }

  private async decryptWallet(encryptedData: any) {
    // TODO: Implement proper decryption
    return encryptedData;
  }

  private initialize(): void {
    // app.ready event'ini bekle
    app.whenReady().then(() => {
      // Asset protocol'ünü kur
      protocol.registerFileProtocol('asset', (request, callback) => {
        const url = request.url.replace('asset://', '');
        const decodedUrl = decodeURI(url);
        try {
          return callback(path.join(__dirname, '../src/assets', decodedUrl));
        } catch (error) {
          console.error('Failed to register protocol', error);
        }
      });

      this.createWindow();
    });

    app.on('window-all-closed', this.handleWindowsClosed);
    app.on('activate', this.handleActivate);
  }

  private createWindow = (): void => {
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'),
        webSecurity: true,
        allowRunningInsecureContent: false
      },
      backgroundColor: '#13111d'
    });

    // Protocol handler'ı register et
    if (!protocol.isProtocolRegistered('asset')) {
      protocol.registerFileProtocol('asset', (request, callback) => {
        const url = request.url.replace('asset://', '');
        const decodedUrl = decodeURI(url);
        try {
          return callback(path.join(__dirname, '..', 'src', 'assets', decodedUrl));
        } catch (error) {
          console.error('Failed to register protocol', error);
        }
      });
    }

    this.mainWindow.loadFile(path.join(__dirname, 'renderer', 'wallet-setup.html'));

    if (process.env.NODE_ENV === 'development') {
      this.mainWindow.webContents.openDevTools();
    }
  };

  private handleWindowsClosed = (): void => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  };

  private handleActivate = (): void => {
    if (BrowserWindow.getAllWindows().length === 0) {
      this.createWindow();
    }
  };
}

new MainApplication(); 