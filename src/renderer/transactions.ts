document.addEventListener('DOMContentLoaded', async () => {
  const transactionsList = document.getElementById('transactionsList');

  try {
    const savedWallet = localStorage.getItem('selectedWallet');
    
    if (!savedWallet) {
      window.location.href = 'wallet-setup.html';
      return;
    }

    const wallet = JSON.parse(savedWallet);

    // Tüm transactions'ları göster
    if (transactionsList) {
      const transactions = await window.wallet.getTransactions(wallet.address);
      
      if (transactions.length > 0) {
        transactionsList.innerHTML = ''; // Clear existing
        
        transactions.forEach((tx: Transaction) => {
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
      } else {
        transactionsList.innerHTML = `
          <p class="text-sm text-text-secondary text-center">No transactions found</p>
        `;
      }
    }
  } catch (error) {
    console.error('Error:', error);
    window.location.href = 'wallet-setup.html';
  }
}); 