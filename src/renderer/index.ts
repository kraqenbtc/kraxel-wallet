console.log('index.ts loaded');

interface Transaction {
  tx_id: string;
  tx_type: string;
  tx_status: string;
  amount: string;
  timestamp: number;
  sender: string;
  recipient: string;
}

document.addEventListener('DOMContentLoaded', async () => {
  const walletBalance = document.getElementById('walletBalance');
  const walletValue = document.getElementById('walletValue');
  const walletName = document.getElementById('walletName');
  const walletAddress = document.getElementById('walletAddress');
  const copyAddress = document.getElementById('copyAddress');

  try {
    const savedWallet = localStorage.getItem('selectedWallet');
    
    if (savedWallet) {
      const wallet = JSON.parse(savedWallet);
      if (wallet.address.startsWith('ST')) {
        localStorage.removeItem('selectedWallet');
        window.location.href = 'wallet-setup.html';
        return;
      }

      if (walletName) walletName.textContent = wallet.name || '-';
      if (walletAddress) walletAddress.textContent = wallet.address;

      // Her zaman API'den taze balance al
      if (walletBalance) {
        const freshBalance = await window.wallet.getBalance(wallet.address);
        walletBalance.textContent = `${Number(freshBalance).toFixed(6)} STX`;
      }

      copyAddress?.addEventListener('click', async () => {
        if (wallet.address) {
          try {
            await navigator.clipboard.writeText(wallet.address);
            const originalText = copyAddress.textContent;
            copyAddress.textContent = 'Copied!';
            setTimeout(() => {
              if (copyAddress) copyAddress.textContent = originalText;
            }, 2000);
          } catch (err) {
            console.error('Failed to copy address:', err);
          }
        }
      });

      // Sadece son 3 transaction'ı göster
      const transactionsList = document.getElementById('transactionsList');
      if (transactionsList) {
        const transactions = await window.wallet.getTransactions(wallet.address);
        
        if (transactions.length > 0) {
          transactionsList.innerHTML = ''; // Clear existing
          
          // Son 3 transaction'ı al
          const recentTransactions = transactions.slice(0, 3);
          
          recentTransactions.forEach((tx: Transaction) => {
            const isReceived = tx.recipient === wallet.address;
            const date = new Date(tx.timestamp).toLocaleDateString();
            const time = new Date(tx.timestamp).toLocaleTimeString();
            
            const txElement = document.createElement('div');
            txElement.className = 'flex items-center justify-between p-3 border border-border rounded-lg bg-bg-primary';
            txElement.innerHTML = `
              <div class="grid grid-cols-[1fr,auto] gap-4 w-full">
                <div>
                  <p class="text-sm ${isReceived ? 'text-green-500' : 'text-red-500'}">
                    ${isReceived ? 'Received' : 'Sent'} ${tx.amount} STX
                  </p>
                  <p class="text-xs text-text-secondary mt-1 font-mono hover:text-hover transition-colors duration-300 cursor-pointer">${tx.tx_id}</p>
                </div>
                <div class="text-right flex items-center gap-4">
                  <p class="text-xs text-text-secondary">${date} ${time}</p>
                  <p class="text-xs text-text-secondary">${tx.tx_status}</p>
                </div>
              </div>
            `;
            
            // Sadece tx_id'ye tıklanınca explorer'a git
            const txIdElement = txElement.querySelector('.font-mono');
            txIdElement?.addEventListener('click', (e) => {
              e.stopPropagation();
              window.open(`https://explorer.hiro.so/txid/${tx.tx_id}?chain=mainnet`, '_blank');
            });
            
            transactionsList.appendChild(txElement);
          });

          // 3'ten fazla transaction varsa "View All" linki ekle
          if (transactions.length > 3) {
            const viewAllElement = document.createElement('div');
            viewAllElement.className = 'text-center mt-4';
            viewAllElement.innerHTML = `
              <a href="transactions.html" class="text-sm text-hover hover:underline">
                View All Transactions (${transactions.length})
              </a>
            `;
            transactionsList.appendChild(viewAllElement);
          }
        } else {
          transactionsList.innerHTML = `
            <p class="text-sm text-text-secondary text-center">No transactions found</p>
          `;
        }
      }
    } else {
      window.location.href = 'wallet-setup.html';
    }
  } catch (error) {
    console.error('Error:', error);
    window.location.href = 'wallet-setup.html';
  }

  // Send form handler
  const sendForm = document.getElementById('sendForm');
  sendForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const recipientAddress = (document.getElementById('recipientAddress') as HTMLInputElement).value;
    const amount = parseFloat((document.getElementById('amount') as HTMLInputElement).value);
    const memo = (document.getElementById('memo') as HTMLInputElement).value;
    
    try {
      const savedWallet = localStorage.getItem('selectedWallet');
      if (!savedWallet) throw new Error('No wallet selected');
      
      const wallet = JSON.parse(savedWallet);
      
      // Transaction'ı gönder
      const result = await window.wallet.sendSTX(
        wallet.privateKey, 
        recipientAddress, 
        amount,
        memo,
        0.003 // Default fee değerini ekle
      );
      
      if (result.success) {
        alert(`Transaction sent successfully!\nTXID: ${result.txid}`);
        // Form'u temizle
        (document.getElementById('sendForm') as HTMLFormElement).reset();
        
        // Balance'ı güncelle
        const newBalance = await window.wallet.getBalance(wallet.address);
        wallet.balance = newBalance;
        localStorage.setItem('selectedWallet', JSON.stringify(wallet));
        
        if (walletBalance) {
          walletBalance.textContent = `${Number(newBalance).toFixed(6)} STX`;
        }
      }
    } catch (error: any) {
      alert(`Failed to send STX: ${error.message}`);
    }
  });
}); 