document.addEventListener('DOMContentLoaded', async () => {
  // Sayfa yüklendiğinde localStorage'ı temizle
  localStorage.removeItem('selectedWallet');
  
  const setupScreen = document.getElementById('setupScreen');
  const walletCreatedScreen = document.getElementById('walletCreatedScreen');
  const createWalletBtn = document.getElementById('createWallet');
  const importWalletBtn = document.getElementById('importWallet');
  const loadingDiv = document.getElementById('loading');
  const walletAddress = document.getElementById('walletAddress');
  const walletPrivateKey = document.getElementById('walletPrivateKey');
  const privateKeyContainer = document.getElementById('privateKeyContainer');
  const togglePrivateKeyBtn = document.getElementById('togglePrivateKey');
  const copyAddressBtn = document.getElementById('copyAddress');
  const saveWalletBtn = document.getElementById('saveWallet');
  const walletsList = document.getElementById('walletsList');
  const existingWallets = document.getElementById('existingWallets');
  const createWalletForm = document.getElementById('createWalletForm');
  const mainButtons = document.getElementById('mainButtons');
  const walletNameInput = document.getElementById('walletName') as HTMLInputElement;
  const walletPinInput = document.getElementById('walletPin') as HTMLInputElement;
  const confirmCreateBtn = document.getElementById('confirmCreate');
  const cancelCreateBtn = document.getElementById('cancelCreate');
  const holdCounter = document.getElementById('holdCounter');

  let pressTimer: NodeJS.Timeout | null = null;
  let currentWallet: { address: string; privateKey: string; name: string; pin: string } | null = null;
  let isPrivateKeyRevealed = false;
  let secondsLeft = 3;

  createWalletBtn?.addEventListener('click', () => {
    mainButtons?.classList.add('hidden');
    createWalletForm?.classList.remove('hidden');
    existingWallets?.classList.add('hidden');
    const orCreateDiv = document.querySelector('.relative.flex.justify-center');
    if (orCreateDiv) {
      (orCreateDiv as HTMLElement).style.display = 'none';
    }
  });
  
  const backBtn = document.createElement('button');
  backBtn.className = 'absolute top-8 left-8 px-4 py-2 text-sm border-2 border-border text-text-secondary hover:bg-hover hover:text-text-primary rounded-lg transition-colors duration-300 font-pixel';
  backBtn.innerHTML = '← Back';
  backBtn.addEventListener('click', () => {
    if (walletNameInput) walletNameInput.value = '';
    if (walletPinInput) walletPinInput.value = '';
    
    mainButtons?.classList.remove('hidden');
    createWalletForm?.classList.add('hidden');
    existingWallets?.classList.remove('hidden');
    
    const orCreateDiv = document.querySelector('.relative.flex.justify-center');
    if (orCreateDiv) {
      (orCreateDiv as HTMLElement).style.display = 'block';
    }
    
    backBtn.style.display = 'none';
  });
  
  document.querySelector('.max-w-2xl')?.appendChild(backBtn);
  backBtn.style.display = 'none';

  const counterDiv = document.createElement('div');
  counterDiv.className = 'absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-4xl text-success font-pixel';
  counterDiv.style.display = 'none';
  privateKeyContainer?.appendChild(counterDiv);

  const copyPrivateKeyBtn = document.createElement('button');
  copyPrivateKeyBtn.className = 'mt-2 px-3 py-1 text-xs border border-border hover:bg-hover rounded transition-colors duration-300';
  copyPrivateKeyBtn.textContent = 'Copy Private Key';
  copyPrivateKeyBtn.style.display = 'none';
  privateKeyContainer?.parentElement?.appendChild(copyPrivateKeyBtn);

  copyPrivateKeyBtn.addEventListener('click', async () => {
    if (currentWallet?.privateKey) {
      await navigator.clipboard.writeText(currentWallet.privateKey);
      const originalText = copyPrivateKeyBtn.textContent;
      copyPrivateKeyBtn.textContent = 'Copied!';
      setTimeout(() => {
        copyPrivateKeyBtn.textContent = originalText;
      }, 2000);
    }
  });

  let countdownInterval: NodeJS.Timeout | null = null;
  
  function startCountdown() {
    if (holdCounter) {
      secondsLeft = 3;
      holdCounter.textContent = secondsLeft.toString();
      countdownInterval = setInterval(() => {
        secondsLeft--;
        if (holdCounter && secondsLeft > 0) {
          holdCounter.textContent = secondsLeft.toString();
        }
      }, 1000);
    }
  }

  function resetCountdown() {
    if (countdownInterval) {
      clearInterval(countdownInterval);
    }
    if (holdCounter) {
      secondsLeft = 3;
      holdCounter.textContent = '3';
    }
  }

  if (privateKeyContainer && walletPrivateKey) {
    // Mouse events
    privateKeyContainer.addEventListener('mousedown', () => {
      if (!isPrivateKeyRevealed) {
        startCountdown();
        pressTimer = setTimeout(() => {
          privateKeyContainer.classList.remove('blur-sm');
          holdCounter?.classList.add('hidden');
          isPrivateKeyRevealed = true;
          resetCountdown();
        }, 3000);
      }
    });

    privateKeyContainer.addEventListener('mouseup', () => {
      if (!isPrivateKeyRevealed) {
        if (pressTimer) clearTimeout(pressTimer);
        resetCountdown();
      } else {
        // Eğer private key gösteriliyorsa ve tıklanırsa kopyala
        if (walletPrivateKey.textContent) {
          navigator.clipboard.writeText(walletPrivateKey.textContent)
            .then(() => {
              if (holdCounter) {
                holdCounter.textContent = 'Copied!';
                holdCounter.classList.remove('hidden');
                setTimeout(() => {
                  holdCounter.classList.add('hidden');
                }, 2000);
              }
            });
        }
      }
    });

    privateKeyContainer.addEventListener('mouseleave', () => {
      if (!isPrivateKeyRevealed) {
        if (pressTimer) clearTimeout(pressTimer);
        resetCountdown();
      }
    });

    // Touch events for mobile
    privateKeyContainer.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (!isPrivateKeyRevealed) {
        startCountdown();
        pressTimer = setTimeout(() => {
          privateKeyContainer.classList.remove('blur-sm');
          holdCounter?.classList.add('hidden');
          isPrivateKeyRevealed = true;
          resetCountdown();
        }, 3000);
      }
    });

    privateKeyContainer.addEventListener('touchend', (e) => {
      e.preventDefault();
      if (!isPrivateKeyRevealed) {
        if (pressTimer) clearTimeout(pressTimer);
        resetCountdown();
      } else {
        // Eğer private key gösteriliyorsa ve dokunulursa kopyala
        if (walletPrivateKey.textContent) {
          navigator.clipboard.writeText(walletPrivateKey.textContent)
            .then(() => {
              if (holdCounter) {
                holdCounter.textContent = 'Copied!';
                holdCounter.classList.remove('hidden');
                setTimeout(() => {
                  holdCounter.classList.add('hidden');
                }, 2000);
              }
            });
        }
      }
    });
  }

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        const setupScreenVisible = !setupScreen?.classList.contains('hidden');
        const createFormVisible = !createWalletForm?.classList.contains('hidden');
        backBtn.style.display = (setupScreenVisible && createFormVisible) ? 'block' : 'none';
        
        if (createFormVisible) {
          existingWallets?.classList.add('hidden');
          const orCreateDiv = document.querySelector('.relative.flex.justify-center');
          if (orCreateDiv) {
            (orCreateDiv as HTMLElement).style.display = 'none';
          }
        }
      }
    });
  });

  setupScreen && observer.observe(setupScreen, { attributes: true });
  createWalletForm && observer.observe(createWalletForm, { attributes: true });

  cancelCreateBtn?.addEventListener('click', () => {
    mainButtons?.classList.remove('hidden');
    createWalletForm?.classList.add('hidden');
    existingWallets?.classList.remove('hidden');
    const orCreateDiv = document.querySelector('.relative.flex.justify-center');
    if (orCreateDiv) {
      (orCreateDiv as HTMLElement).style.display = 'block';
    }
    walletNameInput.value = '';
    walletPinInput.value = '';
  });

  confirmCreateBtn?.addEventListener('click', async () => {
    const name = walletNameInput.value.trim();
    const pin = walletPinInput.value;

    if (!name) {
      alert('Please enter a wallet name');
      return;
    }

    if (!/^\d{6}$/.test(pin)) {
      alert('Please enter a 6-digit PIN');
      return;
    }

    try {
      showLoading();
      const wallet = await window.wallet.createNewWallet();
      currentWallet = {
        ...wallet,
        name,
        pin
      };
      await window.wallet.save(currentWallet);
      showWalletCreated(wallet);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'An unknown error occurred';
      alert('Failed to create wallet: ' + errorMessage);
    } finally {
      hideLoading();
    }
  });

  walletPinInput?.addEventListener('input', (e) => {
    const input = e.target as HTMLInputElement;
    input.value = input.value.replace(/\D/g, '').slice(0, 6);
  });

  importWalletBtn?.addEventListener('click', () => {
    alert('Import wallet feature coming soon...');
  });

  togglePrivateKeyBtn?.addEventListener('click', () => {
    const isBlurred = privateKeyContainer?.classList.contains('blur-sm');
    if (isBlurred) {
      privateKeyContainer?.classList.remove('blur-sm');
      togglePrivateKeyBtn.textContent = 'Hide';
    } else {
      privateKeyContainer?.classList.add('blur-sm');
      togglePrivateKeyBtn.textContent = 'Show';
    }
  });

  copyAddressBtn?.addEventListener('click', async () => {
    if (currentWallet?.address) {
      await navigator.clipboard.writeText(currentWallet.address);
      const originalText = copyAddressBtn.textContent;
      copyAddressBtn.textContent = 'Copied!';
      setTimeout(() => {
        if (copyAddressBtn) {
          copyAddressBtn.textContent = originalText;
        }
      }, 2000);
    }
  });

  saveWalletBtn?.addEventListener('click', async () => {
    window.location.href = 'index.html';
  });

  async function loadExistingWallets() {
    try {
      const wallets = await window.wallet.getWallets();
      
      if (wallets.length === 0) {
        if (existingWallets) {
          existingWallets.classList.add('hidden');
          const orCreateDiv = document.querySelector('.relative.flex.justify-center');
          if (orCreateDiv) {
            (orCreateDiv as HTMLElement).style.display = 'none';
          }
        }
        return;
      }

      if (walletsList) {
        walletsList.innerHTML = wallets.map(wallet => `
          <div class="wallet-item p-4 border border-border bg-bg-primary rounded-lg transition-all duration-300">
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <div class="text-sm text-text-secondary font-pixel">${wallet.name}</div>
                <div class="font-mono text-xs text-text-primary truncate mt-1">${wallet.address}</div>
                <div class="text-xs text-text-secondary mt-1">Balance: Loading...</div>
              </div>
              <button class="select-wallet-btn ml-4 px-3 py-1 text-xs border border-success text-success hover:bg-success hover:text-bg-dark rounded transition-colors duration-300"
                      data-address="${wallet.address}"
                      data-name="${wallet.name}">
                Select
              </button>
            </div>
            <!-- PIN Input Form (hidden by default) -->
            <div class="pin-input-form hidden mt-4 pt-4 border-t border-border">
              <div class="flex items-center space-x-2">
                <input type="password" 
                       class="flex-1 px-3 py-2 bg-bg-dark border border-border rounded-lg text-text-primary text-sm focus:border-success focus:outline-none"
                       placeholder="Enter 6-digit PIN"
                       maxlength="6"
                       pattern="\d{6}">
                <button class="confirm-pin-btn px-3 py-2 text-xs border border-success text-success hover:bg-success hover:text-bg-dark rounded transition-colors duration-300">
                  Confirm
                </button>
                <button class="cancel-pin-btn px-3 py-2 text-xs border border-border text-text-primary hover:bg-hover rounded transition-colors duration-300">
                  Cancel
                </button>
              </div>
              <div class="error-message text-error text-xs mt-2 hidden"></div>
            </div>
          </div>
        `).join('');

        wallets.forEach(async (wallet) => {
          try {
            const balance = await window.wallet.getBalance(wallet.address);
            const balanceElement = walletsList.querySelector(`[data-address="${wallet.address}"]`)
              ?.closest('.wallet-item')
              ?.querySelector('.text-text-secondary:last-child');
            if (balanceElement) {
              balanceElement.textContent = `Balance: ${balance} STX`;
            }
          } catch (error) {
            console.error('Error loading balance:', error);
          }
        });

        const selectButtons = walletsList.querySelectorAll('.select-wallet-btn');
        selectButtons.forEach(button => {
          button.addEventListener('click', () => {
            walletsList?.querySelectorAll('.pin-input-form').forEach(form => {
              form.classList.add('hidden');
            });

            const walletItem = button.closest('.wallet-item');
            const pinForm = walletItem?.querySelector('.pin-input-form');
            pinForm?.classList.remove('hidden');
          });
        });

        walletsList.querySelectorAll('.pin-input-form input').forEach(input => {
          input.addEventListener('input', (e) => {
            const target = e.target as HTMLInputElement;
            target.value = target.value.replace(/\D/g, '').slice(0, 6);
          });
        });

        walletsList.querySelectorAll('.confirm-pin-btn').forEach(button => {
          button.addEventListener('click', async () => {
            const walletItem = button.closest('.wallet-item');
            const address = walletItem?.querySelector('.select-wallet-btn')?.getAttribute('data-address');
            const pinInput = walletItem?.querySelector('input') as HTMLInputElement;
            const errorMessage = walletItem?.querySelector('.error-message');

            console.log('Attempting to select wallet:', { address, pinValue: pinInput?.value });

            if (!address || !pinInput?.value) {
              console.log('Missing address or PIN');
              return;
            }

            try {
              console.log('Calling selectWallet with:', address, pinInput.value);
              const result = await window.wallet.selectWallet(address, pinInput.value);
              console.log('Select wallet result:', result);

              if (result.success) {
                console.log('Wallet selected successfully, saving to localStorage:', result.wallet);
                localStorage.setItem('selectedWallet', JSON.stringify(result.wallet));
                console.log('Redirecting to index.html');
                window.location.href = 'index.html';
              }
            } catch (error) {
              console.error('Error selecting wallet:', error);
              if (errorMessage) {
                errorMessage.textContent = 'Invalid PIN';
                errorMessage.classList.remove('hidden');
                setTimeout(() => {
                  errorMessage.classList.add('hidden');
                }, 3000);
              }
            }
          });
        });

        walletsList.querySelectorAll('.cancel-pin-btn').forEach(button => {
          button.addEventListener('click', () => {
            const pinForm = button.closest('.pin-input-form');
            const pinInput = pinForm?.querySelector('input') as HTMLInputElement;
            pinInput.value = '';
            pinForm?.classList.add('hidden');
          });
        });
      }
    } catch (error) {
      console.error('Error loading wallets:', error);
      if (existingWallets) existingWallets.classList.add('hidden');
    }
  }

  await loadExistingWallets();

  function showLoading() {
    loadingDiv?.classList.remove('hidden');
    setupScreen?.classList.add('hidden');
  }

  function hideLoading() {
    loadingDiv?.classList.add('hidden');
  }

  function showWalletCreated(wallet: { address: string; privateKey: string }) {
    setupScreen?.classList.add('hidden');
    walletCreatedScreen?.classList.remove('hidden');
    
    if (walletAddress) walletAddress.textContent = wallet.address;
    if (walletPrivateKey) walletPrivateKey.textContent = wallet.privateKey;
  }
}); 