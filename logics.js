// ========== NEW GAME MODAL ==========
const modalHTML = `
  <div id="newGameModal" class="modal-overlay" style="display: none;">
    <div class="modal-box">
      <h2>Start New Game?</h2>
      <p>This will reset the current game. Are you sure?</p>
      <div class="modal-actions">
        <button id="reset-btn" class="modal-btn confirm">Yes, Start</button>
        <button id="cancelNewGame" class="modal-btn cancel">Cancel</button>
      </div>
    </div>
  </div>
`;
document.body.insertAdjacentHTML("beforeend", modalHTML);

// Modal styles
const modalStyles = document.createElement("style");
modalStyles.innerHTML = `
  .modal-overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
  }

  .modal-box {
    background: #2e2e2e;
    color: #f0d9b5;
    padding: 20px 30px;
    border-radius: 10px;
    text-align: center;
    font-family: 'Cinzel', serif;
    border: 2px solid #b58863;
    box-shadow: 0 4px 12px rgba(0,0,0,0.4);
  }

  .modal-actions {
    margin-top: 20px;
    display: flex;
    justify-content: center;
    gap: 15px;
  }

  .modal-btn {
    padding: 10px 20px;
    border: none;
    font-family: 'Cinzel', serif;
    border-radius: 8px;
  
  cursor:  url('assets/cursor3.png'), auto;;
    font-weight: 600;
  }

  .modal-btn.confirm {
    background-color: #b58863;
    color: #fff;
  }

  .modal-btn.cancel {
    background-color: #3b3b3b;
    color: #f0d9b5;
  }
`;
document.head.appendChild(modalStyles);

// Modal button logic
const triggerBtn = document.getElementById("resetgame-btn");
const modal = document.getElementById("newGameModal");
const confirmBtn = document.getElementById("reset-btn");
const cancelBtn = document.getElementById("cancelNewGame");

if (triggerBtn && modal && confirmBtn && cancelBtn) {
  triggerBtn.addEventListener("click", (e) => {
    e.preventDefault();
    modal.style.display = "flex";
  });

  cancelBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });

  confirmBtn.addEventListener("click", () => {
  
    triggerBtn.click();
  
  
    setTimeout(() => {
      modal.style.display = "none";
      document.getElementById("start-timer-btn").click();
    }, 30); // 300ms delay
  });
  
}

// ========== PAUSE OVERLAY ==========
const pauseOverlay = document.createElement('div');
pauseOverlay.id = 'pauseOverlay';
pauseOverlay.innerHTML = `
  <div class="pause-modal-content">
    <div class="pause-icon">⏸</div>
    <p class="pause-text">Press any key or tap anywhere to resume</p>
  </div>
`;
pauseOverlay.style.display = 'none';
document.body.appendChild(pauseOverlay);

// Pause styles
const pauseStyle = document.createElement('style');
pauseStyle.innerHTML = `
  #pauseOverlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    display: flex;
    flex-direction: column;
    align-items: center;
      cursor:  url('assets/cursor3.png'), auto;;
    justify-content: center;
    z-index: 9999;
    color: #f0d9b5;
    font-family: 'Cinzel', serif;
  }

  .pause-modal-content {
    text-align: center;
  }

  .pause-icon {
    font-size: 100px;
    margin-bottom: 20px;
    text-shadow: 2px 2px 5px rgba(0,0,0,0.4);
  }

  .pause-text {
    font-size: 1.5rem;
    color: #fffacd;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.6);
  }
`;
document.head.appendChild(pauseStyle);

// Pause logic
const pauseBtn = document.getElementById('pause-timer-btn');

if (pauseBtn) {
  pauseBtn.addEventListener('click', () => {
    if (pauseOverlay.style.display === 'none') {
      pauseOverlay.style.display = 'flex';
    }
  });

  function resumeFromPause() {
    if (pauseOverlay.style.display === 'flex') {
      pauseBtn.click(); // resume game logic
      setTimeout(() => {
        pauseOverlay.style.display = 'none';
      }, 15);
    }
  }

  document.addEventListener('keydown', resumeFromPause);
  pauseOverlay.addEventListener('click', resumeFromPause);
  pauseOverlay.addEventListener('click', resumeFromPause);
  
}
