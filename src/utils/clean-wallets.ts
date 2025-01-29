import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// İşletim sistemine göre wallet dosyasının yolunu belirle
let walletPath = '';
const appName = 'kraxel-wallet';

switch (process.platform) {
  case 'darwin': // macOS
    walletPath = path.join(os.homedir(), 'Library', 'Application Support', appName, 'wallet.json');
    break;
  case 'win32': // Windows
    walletPath = path.join(process.env.APPDATA || '', appName, 'wallet.json');
    break;
  default: // Linux ve diğerleri
    walletPath = path.join(os.homedir(), '.config', appName, 'wallet.json');
    break;
}

// Wallet dosyasını sil
if (fs.existsSync(walletPath)) {
  fs.unlinkSync(walletPath);
  console.log('Wallet file deleted successfully');
  console.log('Path:', walletPath);
} else {
  console.log('No wallet file found');
  console.log('Checked path:', walletPath);
} 