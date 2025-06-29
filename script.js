class ChessGame {
  constructor() {
    this.board = this.initializeBoard()
    this.currentPlayer = "white"
    this.selectedSquare = null
    this.gameOver = false
    this.capturedPieces = { white: [], black: [] }
    this.moveHistory = []
    this.enPassantTarget = null
    this.castlingRights = {
      white: { kingside: true, queenside: true },
      black: { kingside: true, queenside: true },
    }
    this.isRotating = false
    this.gameStarted = false

    // Timer properties
    this.timers = {
      white: 600, // 10 minutes in seconds
      black: 600,
    }
    this.activeTimer = null
    this.timerInterval = null
    this.timerPaused = false

    this.pieceSymbols = {
      white: {
        king: "♔",
        queen: "♕",
        rook: "♖",
        bishop: "♗",
        knight: "♘",
        pawn: "♙",
      },
      black: {
        king: "♚",
        queen: "♛",
        rook: "♜",
        bishop: "♝",
        knight: "♞",
        pawn: "♟",
      },
    }

    this.initializeGame()

    // Add PWA functionality
    this.initializePWA()
  }

  initializeBoard() {
    const board = Array(8)
      .fill(null)
      .map(() => Array(8).fill(null))

    // Place pawns
    for (let col = 0; col < 8; col++) {
      board[1][col] = { type: "pawn", color: "black" }
      board[6][col] = { type: "pawn", color: "white" }
    }

    // Place other pieces
    const pieceOrder = ["rook", "knight", "bishop", "queen", "king", "bishop", "knight", "rook"]
    for (let col = 0; col < 8; col++) {
      board[0][col] = { type: pieceOrder[col], color: "black" }
      board[7][col] = { type: pieceOrder[col], color: "white" }
    }

    return board
  }

  initializeGame() {
    this.createBoard()
    this.updateDisplay()
    this.setupEventListeners()
    this.updateTimerDisplay()
  }

  setupEventListeners() {
    document.getElementById("reset-btn").addEventListener("click", () => this.resetGame())
    document.getElementById("start-timer-btn").addEventListener("click", () => this.startGame())
    document.getElementById("pause-timer-btn").addEventListener("click", () => this.pauseTimer())
    document.getElementById("reset-timer-btn").addEventListener("click", () => this.resetTimer())
    document.getElementById("time-preset").addEventListener("change", (e) => this.setTimePreset(e.target.value))

    // Timer click events
    document.getElementById("white-timer").addEventListener("click", () => this.clickTimer("white"))
    document.getElementById("black-timer").addEventListener("click", () => this.clickTimer("black"))
  }

  createBoard() {
    const boardElement = document.getElementById("chess-board")
    boardElement.innerHTML = ""

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const square = document.createElement("div")
        square.className = `square ${(row + col) % 2 === 0 ? "light" : "dark"}`
        square.dataset.row = row
        square.dataset.col = col
        square.addEventListener("click", (e) => this.handleSquareClick(e))

        const piece = this.board[row][col]
        if (piece) {
          square.innerHTML = `<span class="piece">${this.pieceSymbols[piece.color][piece.type]}</span>`
        }

        boardElement.appendChild(square)
      }
    }
  }

  handleSquareClick(event) {
    if (this.gameOver || this.isRotating || !this.gameStarted) return

    const row = Number.parseInt(event.currentTarget.dataset.row)
    const col = Number.parseInt(event.currentTarget.dataset.col)

    if (this.selectedSquare) {
      if (this.selectedSquare.row === row && this.selectedSquare.col === col) {
        this.clearSelection()
        return
      }

      if (this.isValidMove(this.selectedSquare.row, this.selectedSquare.col, row, col)) {
        this.makeMove(this.selectedSquare.row, this.selectedSquare.col, row, col)
        this.clearSelection()
        this.switchPlayer()
        this.updateDisplay()
        this.checkGameEnd()
      } else {
        this.clearSelection()
        if (this.board[row][col] && this.board[row][col].color === this.currentPlayer) {
          this.selectSquare(row, col)
        }
      }
    } else {
      if (this.board[row][col] && this.board[row][col].color === this.currentPlayer) {
        this.selectSquare(row, col)
      }
    }
  }

  selectSquare(row, col) {
    this.selectedSquare = { row, col }
    this.highlightSquares()
  }

  clearSelection() {
    this.selectedSquare = null
    this.clearHighlights()
  }

  highlightSquares() {
    this.clearHighlights()

    if (!this.selectedSquare) return

    const { row, col } = this.selectedSquare
    const selectedElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`)
    selectedElement.classList.add("selected")

    // Highlight valid moves
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (this.isValidMove(row, col, r, c)) {
          const targetElement = document.querySelector(`[data-row="${r}"][data-col="${c}"]`)
          if (this.board[r][c]) {
            targetElement.classList.add("capture-move")
          } else {
            targetElement.classList.add("valid-move")
          }
        }
      }
    }
  }

  clearHighlights() {
    document.querySelectorAll(".square").forEach((square) => {
      square.classList.remove("selected", "valid-move", "capture-move", "in-check")
    })
  }

  isValidMove(fromRow, fromCol, toRow, toCol) {
    const piece = this.board[fromRow][fromCol]
    if (!piece || piece.color !== this.currentPlayer) return false

    // Can't capture own piece
    const targetPiece = this.board[toRow][toCol]
    if (targetPiece && targetPiece.color === piece.color) return false

    // Check piece-specific movement rules
    if (!this.isValidPieceMove(piece, fromRow, fromCol, toRow, toCol)) return false

    // Check if move would put own king in check
    if (this.wouldBeInCheck(fromRow, fromCol, toRow, toCol, piece.color)) return false

    return true
  }

  isValidPieceMove(piece, fromRow, fromCol, toRow, toCol) {
    const rowDiff = toRow - fromRow
    const colDiff = toCol - fromCol
    const absRowDiff = Math.abs(rowDiff)
    const absColDiff = Math.abs(colDiff)

    switch (piece.type) {
      case "pawn":
        return this.isValidPawnMove(piece, fromRow, fromCol, toRow, toCol)
      case "rook":
        return (rowDiff === 0 || colDiff === 0) && this.isPathClear(fromRow, fromCol, toRow, toCol)
      case "bishop":
        return absRowDiff === absColDiff && this.isPathClear(fromRow, fromCol, toRow, toCol)
      case "queen":
        return (
          (rowDiff === 0 || colDiff === 0 || absRowDiff === absColDiff) &&
          this.isPathClear(fromRow, fromCol, toRow, toCol)
        )
      case "knight":
        return (absRowDiff === 2 && absColDiff === 1) || (absRowDiff === 1 && absColDiff === 2)
      case "king":
        return this.isValidKingMove(piece, fromRow, fromCol, toRow, toCol)
      default:
        return false
    }
  }

  isValidPawnMove(piece, fromRow, fromCol, toRow, toCol) {
    const direction = piece.color === "white" ? -1 : 1
    const startRow = piece.color === "white" ? 6 : 1
    const rowDiff = toRow - fromRow
    const colDiff = Math.abs(toCol - fromCol)

    // Forward move
    if (colDiff === 0) {
      if (rowDiff === direction && !this.board[toRow][toCol]) return true
      if (
        fromRow === startRow &&
        rowDiff === 2 * direction &&
        !this.board[toRow][toCol] &&
        !this.board[fromRow + direction][fromCol]
      )
        return true
    }

    // Diagonal capture
    if (colDiff === 1 && rowDiff === direction) {
      if (this.board[toRow][toCol]) return true
      // En passant
      if (this.enPassantTarget && this.enPassantTarget.row === toRow && this.enPassantTarget.col === toCol) return true
    }

    return false
  }

  isValidKingMove(piece, fromRow, fromCol, toRow, toCol) {
    const rowDiff = Math.abs(toRow - fromRow)
    const colDiff = Math.abs(toCol - fromCol)

    // Normal king move
    if (rowDiff <= 1 && colDiff <= 1) return true

    // Castling
    if (rowDiff === 0 && colDiff === 2) {
      return this.canCastle(piece.color, toCol > fromCol ? "kingside" : "queenside")
    }

    return false
  }

  canCastle(color, side) {
    if (!this.castlingRights[color][side]) return false
    if (this.isInCheck(color)) return false

    const row = color === "white" ? 7 : 0
    const kingCol = 4
    const rookCol = side === "kingside" ? 7 : 0
    const direction = side === "kingside" ? 1 : -1

    // Check if path is clear
    const start = Math.min(kingCol, rookCol) + 1
    const end = Math.max(kingCol, rookCol)
    for (let col = start; col < end; col++) {
      if (this.board[row][col]) return false
    }

    // Check if king passes through check
    for (let i = 1; i <= 2; i++) {
      if (this.wouldBeInCheck(row, kingCol, row, kingCol + direction * i, color)) return false
    }

    return true
  }

  isPathClear(fromRow, fromCol, toRow, toCol) {
    const rowStep = toRow > fromRow ? 1 : toRow < fromRow ? -1 : 0
    const colStep = toCol > fromCol ? 1 : toCol < fromCol ? -1 : 0

    let currentRow = fromRow + rowStep
    let currentCol = fromCol + colStep

    while (currentRow !== toRow || currentCol !== toCol) {
      if (this.board[currentRow][currentCol]) return false
      currentRow += rowStep
      currentCol += colStep
    }

    return true
  }

  makeMove(fromRow, fromCol, toRow, toCol) {
    const piece = this.board[fromRow][fromCol]
    const capturedPiece = this.board[toRow][toCol]

    // Handle en passant capture
    if (
      piece.type === "pawn" &&
      this.enPassantTarget &&
      toRow === this.enPassantTarget.row &&
      toCol === this.enPassantTarget.col
    ) {
      const capturedPawnRow = piece.color === "white" ? toRow + 1 : toRow - 1
      const capturedPawn = this.board[capturedPawnRow][toCol]
      this.capturedPieces[capturedPawn.color].push(capturedPawn)
      this.board[capturedPawnRow][toCol] = null
    }

    // Handle castling
    if (piece.type === "king" && Math.abs(toCol - fromCol) === 2) {
      const rookFromCol = toCol > fromCol ? 7 : 0
      const rookToCol = toCol > fromCol ? 5 : 3
      const rook = this.board[fromRow][rookFromCol]
      this.board[fromRow][rookToCol] = rook
      this.board[fromRow][rookFromCol] = null
    }

    // Update castling rights
    if (piece.type === "king") {
      this.castlingRights[piece.color].kingside = false
      this.castlingRights[piece.color].queenside = false
    }
    if (piece.type === "rook") {
      if (fromCol === 0) this.castlingRights[piece.color].queenside = false
      if (fromCol === 7) this.castlingRights[piece.color].kingside = false
    }

    // Set en passant target
    this.enPassantTarget = null
    if (piece.type === "pawn" && Math.abs(toRow - fromRow) === 2) {
      this.enPassantTarget = { row: (fromRow + toRow) / 2, col: fromCol }
    }

    // Handle pawn promotion
    if (piece.type === "pawn" && (toRow === 0 || toRow === 7)) {
      piece.type = "queen" // Auto-promote to queen
    }

    // Capture piece
    if (capturedPiece) {
      this.capturedPieces[capturedPiece.color].push(capturedPiece)
    }

    // Move piece
    this.board[toRow][toCol] = piece
    this.board[fromRow][fromCol] = null

    // Record move
    this.moveHistory.push({ fromRow, fromCol, toRow, toCol, piece, capturedPiece })
  }

  wouldBeInCheck(fromRow, fromCol, toRow, toCol, color) {
    // Make temporary move
    const originalPiece = this.board[toRow][toCol]
    const movingPiece = this.board[fromRow][fromCol]
    this.board[toRow][toCol] = movingPiece
    this.board[fromRow][fromCol] = null

    const inCheck = this.isInCheck(color)

    // Restore board
    this.board[fromRow][fromCol] = movingPiece
    this.board[toRow][toCol] = originalPiece

    return inCheck
  }

  isInCheck(color) {
    const kingPosition = this.findKing(color)
    if (!kingPosition) return false

    const opponentColor = color === "white" ? "black" : "white"

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.board[row][col]
        if (piece && piece.color === opponentColor) {
          if (this.isValidPieceMove(piece, row, col, kingPosition.row, kingPosition.col)) {
            return true
          }
        }
      }
    }

    return false
  }

  findKing(color) {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.board[row][col]
        if (piece && piece.type === "king" && piece.color === color) {
          return { row, col }
        }
      }
    }
    return null
  }

  hasValidMoves(color) {
    for (let fromRow = 0; fromRow < 8; fromRow++) {
      for (let fromCol = 0; fromCol < 8; fromCol++) {
        const piece = this.board[fromRow][fromCol]
        if (piece && piece.color === color) {
          for (let toRow = 0; toRow < 8; toRow++) {
            for (let toCol = 0; toCol < 8; toCol++) {
              if (this.isValidMove(fromRow, fromCol, toRow, toCol)) {
                return true
              }
            }
          }
        }
      }
    }
    return false
  }

  checkGameEnd() {
    const inCheck = this.isInCheck(this.currentPlayer)
    const hasValidMoves = this.hasValidMoves(this.currentPlayer)

    if (inCheck) {
      // Highlight king in check
      const kingPosition = this.findKing(this.currentPlayer)
      if (kingPosition) {
        const kingElement = document.querySelector(`[data-row="${kingPosition.row}"][data-col="${kingPosition.col}"]`)
        kingElement.classList.add("in-check")
      }
    }

    if (!hasValidMoves) {
      this.gameOver = true
      this.stopTimer()
      if (inCheck) {
        document.getElementById("game-status").textContent =
          `Checkmate! ${this.currentPlayer === "♕white" ? "♕Black" : "White"} wins!`
      } else {
        document.getElementById("game-status").textContent = "Stalemate! It's a draw!"
      }
    } else if (inCheck) {
      document.getElementById("game-status").textContent =
        `${this.currentPlayer.charAt(0).toUpperCase() + this.currentPlayer.slice(1)} is in check!`
    } else {
      document.getElementById("game-status").textContent = ""
    }

    // Check for time out
    if (this.timers.white <= 0) {
      this.gameOver = true
      this.stopTimer()
      document.getElementById("game-status").textContent = "Time's up! Black wins!"
    } else if (this.timers.black <= 0) {
      this.gameOver = true
      this.stopTimer()
      document.getElementById("game-status").textContent = "Time's up! White wins!"
    }
  }

  switchPlayer() {
    if (this.isRotating) return

    this.isRotating = true
    const boardElement = document.getElementById("chess-board")
    const turnIndicator = document.getElementById("turn-indicator")

    // Pause timer during rotation
    const wasTimerRunning = this.activeTimer !== null
    if (wasTimerRunning) {
      this.stopTimer()
    }

    // Show turn indicator
    const nextPlayer = this.currentPlayer === "white" ? "black" : "white"
    turnIndicator.textContent = `${nextPlayer.charAt(0).toUpperCase() + nextPlayer.slice(1)}'s Turn`
    turnIndicator.classList.add("show")

    // Rotate board so current player is always at bottom
    if (this.currentPlayer === "white") {
      boardElement.classList.remove("white-turn")
      boardElement.classList.add("black-turn")
    } else {
      boardElement.classList.remove("black-turn")
      boardElement.classList.add("white-turn")
    }

    setTimeout(() => {
      this.currentPlayer = nextPlayer
      this.updateDisplay()
      turnIndicator.classList.remove("show")
      this.isRotating = false

      // Resume timer after rotation if game was running
      if (wasTimerRunning && this.gameStarted && !this.gameOver) {
        this.startTimer(this.currentPlayer)
      }
    }, 1200)
  }

  // Timer methods
  startGame() {
    this.gameStarted = true
    this.startTimer("white")
    document.getElementById("start-timer-btn").textContent = "Game Has Started"
    document.getElementById("start-timer-btn").disabled = true
  }

  startTimer(player) {
    this.stopTimer()
    this.activeTimer = player
    this.updateTimerStates()

    this.timerInterval = setInterval(() => {
      if (!this.timerPaused && !this.isRotating) {
        this.timers[this.activeTimer]--
        this.updateTimerDisplay()
        this.checkGameEnd()
      }
    }, 1000)
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval)
      this.timerInterval = null
    }
    this.activeTimer = null
    this.updateTimerStates()
  }

  pauseTimer() {
    this.timerPaused = !this.timerPaused
    document.getElementById("pause-timer-btn").textContent = this.timerPaused ? "▶" : "⏸"
   
  }

  resetTimer() {
    this.stopTimer()
    const timePreset = Number.parseInt(document.getElementById("time-preset").value)
    this.timers.white = timePreset
    this.timers.black = timePreset
    this.updateTimerDisplay()
    this.gameStarted = false
    document.getElementById("start-timer-btn").textContent = "Start Game"
    document.getElementById("start-timer-btn").disabled = false
    document.getElementById("pause-timer-btn").textContent = "▐▐"
    this.timerPaused = false
  }

  setTimePreset(seconds) {
    const time = Number.parseInt(seconds)
    this.timers.white = time
    this.timers.black = time
    this.updateTimerDisplay()
  }

  clickTimer(player) {
    if (!this.gameStarted || this.gameOver || this.isRotating) return

    // Only allow clicking if it's the player's turn and timer is active
    if (player === this.currentPlayer && this.activeTimer === player) {
      // Player clicked their timer to end their turn
      this.stopTimer()
      // The timer will restart for the next player after board rotation
    }
  }

  updateTimerDisplay() {
    document.getElementById("white-time").textContent = this.formatTime(this.timers.white)
    document.getElementById("black-time").textContent = this.formatTime(this.timers.black)
  }

  updateTimerStates() {
    const whiteTimer = document.getElementById("white-timer")
    const blackTimer = document.getElementById("black-timer")

    whiteTimer.classList.remove("active", "inactive")
    blackTimer.classList.remove("active", "inactive")

    if (this.activeTimer === "white") {
      whiteTimer.classList.add("active")
      blackTimer.classList.add("inactive")
    } else if (this.activeTimer === "black") {
      blackTimer.classList.add("active")
      whiteTimer.classList.add("inactive")
    }
  }

  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  updateDisplay() {
    this.createBoard()
    document.getElementById("current-player").textContent =
      this.currentPlayer.charAt(0).toUpperCase() + this.currentPlayer.slice(1)

    const boardElement = document.getElementById("chess-board")
    if (this.currentPlayer === "white") {
      boardElement.classList.remove("black-turn")
      boardElement.classList.add("white-turn")
    } else {
      boardElement.classList.remove("white-turn")
      boardElement.classList.add("black-turn")
    }

    // Update captured pieces
    document.getElementById("captured-white").innerHTML = this.capturedPieces.white
      .map((piece) => `<span class="captured-piece">${this.pieceSymbols.white[piece.type]}</span>`)
      .join("")

    document.getElementById("captured-black").innerHTML = this.capturedPieces.black
      .map((piece) => `<span class="captured-piece">${this.pieceSymbols.black[piece.type]}</span>`)
      .join("")
  }

  resetGame() {
    this.board = this.initializeBoard()
    this.currentPlayer = "white"
    this.selectedSquare = null
    this.gameOver = false
    this.isRotating = false
    this.gameStarted = false
    this.capturedPieces = { white: [], black: [] }
    this.moveHistory = []
    this.enPassantTarget = null
    this.castlingRights = {
      white: { kingside: true, queenside: true },
      black: { kingside: true, queenside: true },
    }

    const boardElement = document.getElementById("chess-board")
    boardElement.classList.remove("black-turn")
    boardElement.classList.add("white-turn")

    this.stopTimer()
    this.resetTimer()
    this.updateDisplay()
    document.getElementById("game-status").textContent = ""
  }

  initializePWA() {
    // Register service worker
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("SW registered: ", registration)
          })
          .catch((registrationError) => {
            console.log("SW registration failed: ", registrationError)
          })
      })
    }

    // Handle install prompt
    let deferredPrompt
    const installButton = document.getElementById("install-button")
    const installPrompt = document.getElementById("install-prompt")

    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault()
      deferredPrompt = e
      installPrompt.style.display = "block"
    })

    installButton.addEventListener("click", async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        console.log(`User response to the install prompt: ${outcome}`)
        deferredPrompt = null
        installPrompt.style.display = "none"
      }
    })

    // Handle app installed
    window.addEventListener("appinstalled", () => {
      console.log("PWA was installed")
      installPrompt.style.display = "none"
    })

    // Handle online/offline status
    this.handleNetworkStatus()

    // Handle URL parameters for shortcuts
    this.handleURLParams()
  }

  handleNetworkStatus() {
    const offlineIndicator = document.getElementById("offline-indicator")

    const updateOnlineStatus = () => {
      if (navigator.onLine) {
        offlineIndicator.style.display = "none"
      } else {
        offlineIndicator.style.display = "block"
      }
    }

    window.addEventListener("online", updateOnlineStatus)
    window.addEventListener("offline", updateOnlineStatus)
    updateOnlineStatus()
  }

  handleURLParams() {
    const urlParams = new URLSearchParams(window.location.search)
    const action = urlParams.get("action")

    switch (action) {
      case "new-game":
        this.resetGame()
        break
      case "quick-match":
        this.resetGame()
        this.setTimePreset(300) // 5 minutes
        this.startGame()
        break
      case "accept-game":
        // Handle multiplayer game acceptance (future feature)
        console.log("Accepting multiplayer game...")
        break
    }
  }
}

// Initialize the game when the page loads
document.addEventListener("DOMContentLoaded", () => {
  new ChessGame()
})
