class ChessAI {
    constructor() {
      this.engine = STOCKFISH();
      this.engine.postMessage("uci");
  
      this.callbacks = [];
  
      this.engine.onmessage = (event) => {
        const message = typeof event === "string" ? event : event.data;
        if (message.startsWith("bestmove")) {
          const move = message.split(" ")[1];
          if (move && move !== "(none)") {
            const callback = this.callbacks.shift();
            if (callback) callback(move);
          }
        }
      };
    }
  
    async getBestMove(board, color, difficulty = 5) {
      const fen = this._boardToFEN(board, color);
  
      return new Promise((resolve) => {
        this.engine.postMessage("ucinewgame");
        this.engine.postMessage("isready");
        this.engine.postMessage(`position fen ${fen}`);
        this.engine.postMessage(`go depth ${difficulty}`);
  
        this.callbacks.push((moveStr) => {
          const from = [8 - parseInt(moveStr[1]), moveStr.charCodeAt(0) - 97];
          const to = [8 - parseInt(moveStr[3]), moveStr.charCodeAt(2) - 97];
          resolve({ from, to });
        });
      });
    }
  
    _boardToFEN(board, turn) {
      const symbols = {
        pawn: "p",
        knight: "n",
        bishop: "b",
        rook: "r",
        queen: "q",
        king: "k",
      };
  
      let fen = "";
  
      for (let row = 0; row < 8; row++) {
        let empty = 0;
        for (let col = 0; col < 8; col++) {
          const piece = board[row][col];
          if (!piece) {
            empty++;
          } else {
            if (empty > 0) {
              fen += empty;
              empty = 0;
            }
            const symbol = symbols[piece.type];
            fen += piece.color === "white" ? symbol.toUpperCase() : symbol;
          }
        }
        if (empty > 0) fen += empty;
        if (row < 7) fen += "/";
      }
  
      fen += ` ${turn} - - 0 1`; // simple placeholders for castling/en passant
      return fen;
    }
  }
  