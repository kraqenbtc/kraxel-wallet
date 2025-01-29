document.addEventListener('DOMContentLoaded', async () => {
  const walletBalance = document.getElementById('walletBalance');
  const sendForm = document.getElementById('sendForm');
  const pinModal = document.getElementById('pinModal');
  const pinInput = document.getElementById('pinInput') as HTMLInputElement;
  const confirmPin = document.getElementById('confirmPin');
  const cancelPin = document.getElementById('cancelPin');

  let pendingTransaction: {
    recipientAddress: string;
    amount: number;
    memo: string;
  } | null = null;

  try {
    // Aktif cüzdanı kontrol et
    const walletExists = await window.wallet.exists();
    if (!walletExists) {
      window.location.href = 'wallet-setup.html';
      return;
    }

    // Aktif cüzdanı yükle
    const walletData = await window.wallet.load();
    if (!walletData) {
      window.location.href = 'wallet-setup.html';
      return;
    }

    // Balance'ı göster
    if (walletBalance) {
      const balance = await window.wallet.getBalance(walletData.address);
      walletBalance.textContent = `${balance} STX`;
    }

    // PIN Modal handlers
    const showPinModal = () => {
      if (pinModal && pinInput) {
        pinModal.style.display = 'flex';
        pinInput.value = '';
        pinInput.focus();
      }
    };

    const hidePinModal = () => {
      if (pinModal && pinInput) {
        pinModal.style.display = 'none';
        pinInput.value = '';
        pendingTransaction = null;
      }
    };

    // Send form handler
    sendForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const recipientAddress = (document.getElementById('recipientAddress') as HTMLInputElement).value;
      const amount = parseFloat((document.getElementById('amount') as HTMLInputElement).value);
      const memo = (document.getElementById('memo') as HTMLInputElement).value;

      pendingTransaction = { recipientAddress, amount, memo };
      showPinModal();
    });

    // PIN confirmation handler
    confirmPin?.addEventListener('click', async () => {
      if (!pendingTransaction || !pinInput.value) return;

      try {
        // Önce PIN ile cüzdanı seç
        const selectedWallet = await window.wallet.selectWallet(walletData.address, pinInput.value);
        
        if (!selectedWallet.success) {
          throw new Error('Invalid PIN');
        }

        if (!selectedWallet.wallet.privateKey) {
          throw new Error('Wallet private key not found');
        }

        // Transaction'ı gönder
        const result = await window.wallet.sendSTX(
          selectedWallet.wallet.privateKey,
          pendingTransaction.recipientAddress, 
          pendingTransaction.amount,
          pendingTransaction.memo
        );
        
        if (result.success) {
          hidePinModal();
          alert(`Transaction sent successfully!\nTXID: ${result.txid}`);
          // Form'u temizle
          (document.getElementById('sendForm') as HTMLFormElement).reset();
          
          // Balance'ı güncelle
          const newBalance = await window.wallet.getBalance(walletData.address);
          if (walletBalance) {
            walletBalance.textContent = `${newBalance} STX`;
          }
        }
      } catch (error: any) {
        alert(`Failed to send STX: ${error.message}`);
      } finally {
        hidePinModal();
      }
    });

    // Cancel button handler
    cancelPin?.addEventListener('click', hidePinModal);

    // Close modal on outside click
    pinModal?.addEventListener('click', (e) => {
      if (e.target === pinModal) {
        hidePinModal();
      }
    });

    // Handle Enter key in PIN input
    pinInput?.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') {
        confirmPin?.click();
      } else if (e.key === 'Escape') {
        hidePinModal();
      }
    });

  } catch (error) {
    console.error('Error:', error);
    window.location.href = 'wallet-setup.html';
  }
}); 