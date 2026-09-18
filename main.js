import { useState } from 'react';
import { createRoot } from 'react-dom/client'
import { forts } from './forts.js'

const generateRandomTroop = (row = -1, col = -1) => {
  return {
    name: `${["knight", "bowman", "healer"][Math.floor(Math.random() * 3)]}${Math.floor(Math.random() * 10000)}`,
    char: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 52)],
    row: row >= 0 ? row : Math.floor(Math.random() * 30),
    col: col >= 0 ? col : Math.floor(Math.random() * 15),
    power: 5 + Math.floor(Math.random() * 11),
    speed: 2 + Math.floor(Math.random() * 5),
    actions: [
      "move"
    ]
  };
};

const parseFort = fort => {
  return fort.map(str => str.split(' '));
}

const floodFill = (board, origin, speed) => {
  const dist = board.map(row => row.map(i => -1));
  const queue = [origin];
  dist[origin[0]][origin[1]] = 0;

  let index = 0;
  while (index < queue.length && dist[queue[index][0]][queue[index][1]] < speed) {
    for (let i = 0; i < 4; i++) {
      let adj = [queue[index][0] + [1, 0, -1, 0][i], queue[index][1] + [0, 1, 0, -1][i]];
      if (adj[0] < 0 || adj[0] >= board.length || adj[1] < 0 || adj[1] >= board[0].length) continue;
      if (board[adj[0]][adj[1]] != '.') continue;
      if (dist[adj[0]][adj[1]] == -1) {
        dist[adj[0]][adj[1]] = dist[queue[index][0]][queue[index][1]] + 1;
        queue.push(adj);
      }
    }
    index++;
  }

  return dist;
}

function Tile({ tile, handleClick }) {
  const tileClass = `tile ${tile.selected ? "tileSelected" : ""} ${tile.troops.length ? "tileTroop" : ""}`;
  const tileChar = tile.troops.length ? tile.troops[0].char : tile.terrain;

  return (
    <button className={tileClass} onClick={handleClick}>
      {tileChar}
    </button>
  );
}

function TileRow({ rowContent, handleClick }) {
  const arr = [];
  for (let i = 0; i < rowContent.length; i++) {
    arr.push(<Tile tile={rowContent[i]} handleClick={() => handleClick(i)} key={i} />);
  }
  return (
    <div className="tileRow">
      {arr}
    </div>
  )
}

function Board({ board, handleClick }) {
  const arr = [];
  for (let i = 0; i < board.length; i++) {
    arr.push(<TileRow class="tileRow" rowContent={board[i]} handleClick={j => handleClick(i, j)} key={i} />);
    arr.push(<br key={`br_${i}`} />);
  }
  return (
    <div className="board">
      {arr}
    </div>
  );
}

function Troop({ troop }) {
  return (
    <p className="troop">
      {`${troop.name} (${troop.char})`}
      <br />
      {`Power: ${troop.power}`}
      <br />
      {`Speed: ${troop.speed}`}
    </p>
  );
}

function TroopPanel({ troops }) {
  const arr = [];
  for (let t = 0; t < troops.length; t++) {
    arr.push(<Troop troop={troops[t]} key={t} />);
  }
  return (
    <div className="troopPanel">
      Troops
      <br />
      {arr}
    </div>
  );
}

function Action({ action, selected, handleClick }) {
  return (
    <button className={`action ${selected ? "selectedAction" : ""}`} onClick={handleClick}>
      {action.name}
    </button>
  )
}

function ActionPanel({ actions, selectedAction, handleClick }) {
  const arr = [];
  for (let a = 0; a < actions.length; a++) {
    arr.push(<Action action={actions[a]} selected={selectedAction == a} handleClick={() => handleClick(a)} key={`${a}`} />);
    arr.push(<br key={`br_${a}`} />);
  }
  return (
    <div className="actionPanel">
      Actions
      <br />
      {arr}
    </div>
  );
}

function Game({ fortName1 = "bananaSplitDecision", fortName2 = "seeingStars", defaultTroops, handleReset }) {
  const fort1 = forts[`${fortName1}1`], fort2 = forts[`${fortName2}2`];
  const [board, setBoard] = useState(parseFort(fort1.terrain.concat(fort2.terrain)));
  const [troops, setTroops] = useState(defaultTroops || fort1.spawns.concat(fort2.spawns.map(c => [c[0] + fort1.terrain.length, c[1]])).map(c => generateRandomTroop(c[0], c[1])));
  const [selectedTile, setSelectedTile] = useState(null);
  const [actions, setActions] = useState([]);
  const [selectedAction, setSelectedAction] = useState(-1);
  const [flag1, setFlag1] = useState([fort1.flag[0], fort1.flag[1]]);
  const [flag2, setFlag2] = useState([fort2.flag[0] + fort1.terrain.length, fort2.flag[1]]);

  const handleTileClick = (rowId, colId) => {
    if (selectedTile && selectedTile[0] == rowId && selectedTile[1] == colId) {
      setSelectedTile(null);
      setActions([]);
    } else {
      if (selectedAction >= 0) {
        if (floodFill(board, [troops[actions[selectedAction].troopId].row, troops[actions[selectedAction].troopId].col], troops[actions[selectedAction].troopId].speed)[rowId][colId] >= 0) {
          const newTroops = troops.slice();
          newTroops[actions[selectedAction].troopId].row = rowId;
          newTroops[actions[selectedAction].troopId].col = colId;
          setTroops(newTroops);
        }
      }
      
      setSelectedTile([rowId, colId]);
      const arr = [];
      for (let t = 0; t < troops.length; t++) {
        if (troops[t].row == rowId && troops[t].col == colId) {
          for (let a = 0; a < troops[t].actions.length; a++) {
            arr.push({
              name: `${troops[t].name} - ${troops[t].actions[a]}`,
              troopId: t
            });
          }
        }
      }
      setActions(arr);
    }

    setSelectedAction(-1);
  };

  const handleActionClick = i => {
    if (selectedAction == i) setSelectedAction(-1);
    else setSelectedAction(i);
  }

  const visualBoard = board.map(row => row.map(i => {
    return {
      terrain: i,
      selected: false,
      troops: []
    };
  }));
  visualBoard[flag1[0]][flag1[1]].terrain = 'F';
  visualBoard[flag2[0]][flag2[1]].terrain = 'f';
  if (selectedTile) visualBoard[selectedTile[0]][selectedTile[1]].selected = true;
  for (let t = 0; t < troops.length; t++) {
    visualBoard[troops[t].row][troops[t].col].troops.push(troops[t]);
  }

  return (
    <div className="game">
      <Board board={visualBoard} handleClick={handleTileClick} />
      <div className="sidebar">
        <button className="reset" onClick={handleReset}>Reset Game</button>
        {selectedTile && <TroopPanel troops={troops.filter(troop => troop.row == selectedTile[0] && troop.col == selectedTile[1])} />}
        {selectedTile && <ActionPanel actions={actions} selectedAction={selectedAction} handleClick={handleActionClick} />}
      </div>
    </div>
  );
}

function Menu({ handleSubmit }) {
  return (
    <form className="menu" onSubmit={handleSubmit}>
      Player 1:
      <select>
        <option value="alcatraz">Alcatraz</option>
        <option value="bananaSplitDecision">Banana Split Decision</option>
        <option value="seeingStars">Seeing Stars</option>
      </select>

      <br />

      Player 2:
      <select>
        <option value="alcatraz">Alcatraz</option>
        <option value="bananaSplitDecision">Banana Split Decision</option>
        <option value="seeingStars">Seeing Stars</option>
      </select>

      <br />

      <button>Start</button>
    </form>
  );
}

function CastleCapture({}) {
  const [gameStart, setGameStart] = useState(false);
  const [fort1, setFort1] = useState(null);
  const [fort2, setFort2] = useState(null);

  const handleSubmit = e => {
    e.preventDefault();
    setFort1(e.target[0].value);
    setFort2(e.target[1].value);
    setGameStart(true);
  };
  const handleReset = () => {
    setGameStart(false);
  }

  return (
    gameStart ? <Game fortName1={fort1} fortName2={fort2} handleReset={handleReset} /> : <Menu handleSubmit={handleSubmit} />
  )
}

const root = createRoot(document.getElementById("root"));
root.render(<CastleCapture />);