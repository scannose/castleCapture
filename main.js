import { useState } from 'react';
import { createRoot } from 'react-dom/client'
import { forts } from './forts.js'
import { troops } from './troops.js'

const createTroop = (troopName, coords, team) => {
  return Object.assign({
    row: coords[0],
    col: coords[1],
    health: 2,
    team: team || (Math.floor(Math.random() * 2) + 1)
  }, troops[troopName]);
};

const parseFort = fort => {
  return fort.map(str => str.split(' '));
};

function Tile({ tile, handleClick }) {
  const tileClass = `tile ${tile.terrain != '.' ? "tileTerrain" : ""} ${tile.selected ? "tileSelected" : ""} ${tile.highlighted ? "tileHighlighted" : ""} ${tile.troops.length ? ["tileTroopDead", "tileTroopWeakened", "tileTroop"][tile.troops[0].health] : ""}`;
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
      {`${troop.name} (Team ${troop.team})`}
      <br />
      {`Power: ${troop.power}`}
      <br />
      {`Speed: ${troop.speed}`}
      {troop.flying && (<>
        <br />
        Flying
      </>)}
      {troop.health < 2 && (<>
        <br />
        {troop.health ? "Weakened" : "Dead"}
      </>)}
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
      {action.action.name}
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
  const [troops, setTroops] = useState(defaultTroops || fort1.spawns.map(tile => createTroop("knight", tile, 1)).concat(fort2.spawns.map(tile => createTroop("archer", [tile[0] + fort1.terrain.length, tile[1]], 2))));
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
      let changeSelected = true;
      if (selectedAction >= 0) {
        changeSelected = false;
        const newBoard = board.map(row => row.slice());
        const newTroops = troops.slice();
        const thisTroop = newTroops[actions[selectedAction].troopId];
        const game = {
          board: newBoard,
          troops: newTroops
        };
        if (actions[selectedAction].action.range.call(thisTroop, game).find(tile => tile[0] == rowId && tile[1] == colId)) {
          actions[selectedAction].action.effect.call(thisTroop, game, [rowId, colId]);
          setBoard(newBoard);
          setTroops(newTroops);
          if (thisTroop.row != selectedTile[0] || thisTroop.col != selectedTile[1]) {
            changeSelected = true;
            rowId = thisTroop.row;
            colId = thisTroop.col;
          }
        }
      }
      if (changeSelected) {
        setSelectedTile([rowId, colId]);
        const arr = [];
        for (let t = 0; t < troops.length; t++) {
          if (troops[t].row == rowId && troops[t].col == colId) {
            for (let a in troops[t].actions) {
              arr.push({
                action: troops[t].actions[a],
                troopId: t
              });
            }
          }
        }
        setActions(arr);
      }
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
      highlighted: false,
      troops: []
    };
  }));
  visualBoard[flag1[0]][flag1[1]].terrain = 'F';
  visualBoard[flag2[0]][flag2[1]].terrain = 'f';
  if (selectedTile) visualBoard[selectedTile[0]][selectedTile[1]].selected = true;

  if (selectedAction >= 0) actions[selectedAction].action.range.call(troops[actions[selectedAction].troopId], {board: board, troops: troops}).forEach(tile => {if (0 <= tile[0] && tile[0] < visualBoard.length && 0 <= tile[1] && tile[1] < visualBoard[tile[0]].length) visualBoard[tile[0]][tile[1]].highlighted = true;});
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