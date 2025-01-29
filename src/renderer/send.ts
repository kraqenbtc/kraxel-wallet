document.addEventListener('DOMContentLoaded', async () => {
  const walletBalance = document.getElementById('walletBalance');
  const sendForm = document.getElementById('sendForm');
  const pinModal = document.getElementById('pinModal');
  const pinInput = document.getElementById('pinInput') as HTMLInputElement;
  const confirmPin = document.getElementById('confirmPin');
  const cancelPin = document.getElementById('cancelPin');
  const amountInput = document.getElementById('amount') as HTMLInputElement;
  const recipientInput = document.getElementById('recipientAddress') as HTMLInputElement;
  const memoInput = document.getElementById('memo') as HTMLInputElement;
  const currentFeeElement = document.getElementById('currentFee');

  let pendingTransaction: {
    recipientAddress: string;
    amount: number;
    memo: string;
  } | null = null;

  let currentFee = 0.003;
  const feeModal = document.getElementById('feeModal');
  const feeInput = document.getElementById('feeInput') as HTMLInputElement;
  const setFeeBtn = document.getElementById('setFeeBtn');
  const confirmFee = document.getElementById('confirmFee');
  const cancelFee = document.getElementById('cancelFee');

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

    // Success modal elements
    const successModal = document.getElementById('successModal');
    const txIdElement = document.getElementById('txId');
    const viewTxButton = document.getElementById('viewTx');
    const closeSuccessButton = document.getElementById('closeSuccess');

    // Show success modal
    const showSuccessModal = (txid: string) => {
      if (successModal && txIdElement) {
        successModal.style.display = 'flex';
        txIdElement.textContent = txid;
      }
    };

    // Hide success modal
    const hideSuccessModal = () => {
      if (successModal) {
        successModal.style.display = 'none';
      }
    };

    // View transaction in explorer
    viewTxButton?.addEventListener('click', () => {
      const txid = txIdElement?.textContent;
      if (txid) {
        window.open(`https://explorer.hiro.so/txid/${txid}?chain=mainnet`, '_blank');
      }
    });

    // Close success modal
    closeSuccessButton?.addEventListener('click', hideSuccessModal);

    // Close modal on outside click
    successModal?.addEventListener('click', (e) => {
      if (e.target === successModal) {
        hideSuccessModal();
      }
    });

    // Fee Modal handlers
    const showFeeModal = () => {
      if (feeModal && feeInput) {
        feeModal.style.display = 'flex';
        feeInput.value = currentFee.toString();
        feeInput.focus();
      }
    };

    const hideFeeModal = () => {
      if (feeModal) {
        feeModal.style.display = 'none';
      }
    };

    setFeeBtn?.addEventListener('click', showFeeModal);
    cancelFee?.addEventListener('click', hideFeeModal);

    confirmFee?.addEventListener('click', () => {
      if (feeInput) {
        const newFee = parseFloat(feeInput.value);
        if (newFee >= 0.001) {
          currentFee = newFee;
          if (currentFeeElement) {
            currentFeeElement.textContent = newFee.toString();
          }
          hideFeeModal();
          // Re-validate amount if exists
          if (amountInput.value) {
            validateAmount(parseFloat(amountInput.value));
          }
        } else {
          alert('Minimum fee is 0.001 STX');
        }
      }
    });

    feeModal?.addEventListener('click', (e) => {
      if (e.target === feeModal) {
        hideFeeModal();
      }
    });

    // Amount validation
    const validateAmount = (value: number) => {
      if (!amountInput) return;
      
      if (value <= 0) {
        amountInput.setCustomValidity('Amount must be greater than 0');
      } else {
        const currentBalance = parseFloat(walletBalance?.textContent?.replace(' STX', '') || '0');
        const totalAmount = value + currentFee;
        
        if (totalAmount > currentBalance) {
          amountInput.setCustomValidity(`Insufficient balance. Total with fee (${currentFee} STX): ${totalAmount} STX`);
        } else {
          amountInput.setCustomValidity('');
        }
      }
      amountInput.reportValidity();
    };

    // Input validations
    amountInput?.addEventListener('input', (e) => {
      const input = e.target as HTMLInputElement;
      if (input.value === '') {
        input.setCustomValidity('');
      } else {
        validateAmount(parseFloat(input.value));
      }
    });

    // Form submission
    sendForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const recipientAddress = recipientInput?.value;
      const amount = parseFloat(amountInput?.value);
      const memo = memoInput?.value || '';
      
      try {
        pendingTransaction = { recipientAddress, amount, memo };
        showPinModal();
      } catch (error: any) {
        alert(`Error: ${error.message}`);
      }
    });

    // Input validasyonları
    recipientInput?.addEventListener('input', (e) => {
      const input = e.target as HTMLInputElement;
      const stxAddressRegex = /^(SP|SM)[A-Z0-9]{36,42}$/;
      
      if (!stxAddressRegex.test(input.value)) {
        input.setCustomValidity('Invalid STX address. Must start with SP or SM.');
      } else {
        input.setCustomValidity('');
      }
      input.reportValidity();
    });

    // PIN confirmation
    confirmPin?.addEventListener('click', async () => {
      if (!pendingTransaction || !pinInput?.value) return;

      try {
        const selectedWallet = await window.wallet.selectWallet(walletData.address, pinInput.value);
        
        if (!selectedWallet.success || !selectedWallet.wallet.privateKey) {
          throw new Error('Invalid PIN or wallet access denied');
        }

        const result = await window.wallet.sendSTX(
          selectedWallet.wallet.privateKey,
          pendingTransaction.recipientAddress, 
          pendingTransaction.amount,
          pendingTransaction.memo,
          currentFee
        );
        
        if (result.success) {
          hidePinModal();
          showSuccessModal(result.txid);
          (sendForm as HTMLFormElement)?.reset();
          
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