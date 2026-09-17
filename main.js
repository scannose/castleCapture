import { useState } from 'react';
import { createRoot } from 'react-dom/client'
import { forts } from './forts.js'

const generateRandomTroop = (row = -1, col = -1) => {
  return {
    name: `${["knight", "bowman", "healer"][Math.floor(Math.random() * 3)]}${Math.floor(Math.random() * 10000)}`,
    char: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 52)],
    row: row >= 0 ? row : Math.floor(Math.random() * 30),
    col: col >= 0 ? col : Math.floor(Math.random() * 15),
    actions: [
      "move"
    ]
  };
};

const parseFort = fort => {
  return fort.map(str => str.split(' ')).flat();
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

function Board({ board, width, height, handleClick }) {
  const arr = [];
  for (let i = 0; i < height; i++) {
    arr.push(<TileRow class="tileRow" rowContent={board.slice(i * width, (i + 1) * width)} handleClick={j => handleClick(i, j)} key={i} />);
    arr.push(<br key={`br_${i}`} />);
  }
  return (
    <div className="board">
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

function Game({ width, height, fort1 = "alcatraz", fort2 = "alcatraz" }) {
  const [board, setBoard] = useState(parseFort(forts[`${fort1}1`].terrain).concat(parseFort(forts[`${fort2}2`].terrain)));
  const [troops, setTroops] = useState(forts[`${fort1}1`].spawns.concat(forts[`${fort2}2`].spawns.map(x => x + width * height / 2)).map(n => generateRandomTroop(Math.floor(n / width), n % width)));
  const [selectedTile, setSelectedTile] = useState(null);
  const [actions, setActions] = useState([]);
  const [selectedAction, setSelectedAction] = useState(-1);
  const [flag1, setFlag1] = useState(forts[`${fort1}1`].flag);
  const [flag2, setFlag2] = useState(forts[`${fort2}2`].flag + width * height / 2);

  const handleTileClick = (rowId, colId) => {
    if (selectedTile && selectedTile[0] == rowId && selectedTile[1] == colId) {
      setSelectedTile(null);
      setActions([]);
    } else {
      if (selectedAction >= 0) {
        troops[actions[selectedAction].troopId].row = rowId;
        troops[actions[selectedAction].troopId].col = colId;
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

  const visualBoard = board.map(n => {
    return {
      terrain: n,
      selected: false,
      troops: []
    };
  });
  visualBoard[flag1].terrain = 'F';
  visualBoard[flag2].terrain = 'f';
  if (selectedTile) visualBoard[selectedTile[0] * width + selectedTile[1]].selected = true;
  for (let t = 0; t < troops.length; t++) {
    visualBoard[troops[t].row * width + troops[t].col].troops.push(troops[t]);
  }

  return (
    <>
      <Board board={visualBoard} width={width} height={height} handleClick={handleTileClick} />
      <ActionPanel actions={actions} selectedAction={selectedAction} handleClick={handleActionClick} />
    </>
  );
};

const root = createRoot(document.getElementById("root"));
root.render(<Game width={15} height={30} />);