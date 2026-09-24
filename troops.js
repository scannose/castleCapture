const floodFill = function(game) {
  const dist = game.board.map(row => row.map(i => -1));
  const queue = [[this.row, this.col]];
  dist[this.row][this.col] = 0;

  let index = 0;
  while (index < queue.length && dist[queue[index][0]][queue[index][1]] < this.speed) {
    for (let i = 0; i < 4; i++) {
      let adj = [queue[index][0] + [1, 0, -1, 0][i], queue[index][1] + [0, 1, 0, -1][i]];
      let tile = game.board[queue[index][0]][queue[index][1]];
      if (!this.flying && tile != '.' && ['v', '>', '^', '<'].indexOf(tile) != i) continue;
      if (!(0 <= adj[0] && adj[0] < game.board.length && 0 <= adj[1] && adj[1] < game.board[adj[0]].length)) continue;
      if (!this.flying && !['.', 'v', '>', '^', '<'].includes(game.board[adj[0]][adj[1]])) continue;
      if (dist[adj[0]][adj[1]] == -1) {
        dist[adj[0]][adj[1]] = dist[queue[index][0]][queue[index][1]] + 1;
        queue.push(adj);
      }
    }
    index++;
  }

  return dist;
}

const attack = (power1, power2) => {
  return Math.random() < 0.5 * power1 / power2;
};

const move = {
  name: "Move",
  range: function(game) {
    const dist = floodFill.call(this, game);
    const arr = [];
    for (let i = 0; i < dist.length; i++) {
      for (let j = 0; j < dist[i].length; j++) {
        if (dist[i][j] > 0 && (game.board[i][j] == '.' || this.flying) && !game.troops.find(troop => i == troop.row && j == troop.col)) {
          arr.push([i, j]);
        }
      }
    }
    return arr;
  },
  effect: function(game, tile) {
    this.row = tile[0];
    this.col = tile[1];
  }
};

export const troops = {
  knight: {
    name: "Knight",
    char: 'K',
    charWeakened: 'k',
    power: 10,
    speed: 3,
    actions: {
      move: move,
      slash: {
        name: "Sword Slash",
        range: function(game) {
          return [[-1, 0], [-1, 1], [0, 1], [1, 1], [1, 0], [1, -1], [0, -1], [-1, -1]].map(tile => [this.row + tile[0], this.col + tile[1]]);
        },
        splash: function(game, tile)  {
          const arr = [[-1, 0], [-1, 1], [0, 1], [1, 1], [1, 0], [1, -1], [0, -1], [-1, -1]].map(tile => [this.row + tile[0], this.col + tile[1]]);
          const index = arr.findIndex(t => tile[0] == t[0] && tile[1] == t[1]);
          if (index == -1) return [];
          return [arr[(index + 7) % 8], arr[index], arr[(index + 1) % 8]];
        },
        effect: function(game, tile) {
          const splash = this.actions.slash.splash.call(this, game, tile);
          for (let t = 0; t < game.troops.length; t++) {
            if (game.troops[t].team == this.team || !game.troops[t].health) continue;
            for (let s = 0; s < splash.length; s++) {
              if (game.troops[t].row == splash[s][0] && game.troops[t].col == splash[s][1]) {
                if (attack(this.power, game.troops[t].power)) {
                  game.troops[t].health = Math.max(game.troops[t].health - 1, 0);
                }
              }
            }
          }
          for (let s = 0; s < splash.length; s++) {
            if (['=', '_'].includes(game.board[splash[s][0]][splash[s][1]])) {
              game.board[splash[s][0]][splash[s][1]] = '.';
            }
          }
        }
      }
    }
  },
  archer: {
    name: "Archer",
    char: 'A',
    charWeakened: 'a',
    power: 6,
    speed: 5,
    actions: {
      move: move,
      arrows: {
        name: "Arrows",
        range: function(game) {
          const arr = [];
          for (let i = -3; i < 3; i++) {
            for (let j = -3; j < 3; j++) {
              if (1 <= Math.abs(i) + Math.abs(j) <= 4) {
                arr.push([i, j]);
              }
            }
          }
          return arr.map(tile => [this.row + tile[0], this.col + tile[1]]);
        },
        effect: function(game, tile) {
          const power = Math.random() < 0.5 ? this.power * 2 : this.power;
          for (let t = 0; t < game.troops.length; t++) {
            if (game.troops[t].row == tile[0] && game.troops[t].col == tile[1] && game.troops[t].team != this.team && game.troops[t].health) {
              if (attack(power, game.troops[t].power)) {
                game.troops[t].health--;
              }
            }
          }
          if (['=', '_'].includes(game.board[tile[0]][tile[1]])) {
            game.board[tile[0]][tile[1]] = '.';
          }
        }
      }
    }
  }
};