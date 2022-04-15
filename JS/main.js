import BaseModel from "./models/players/BaseModel.js";
import Battlemaster from "./models/players/Battlemaster.js";
import Shadowmaster from "./models/players/Shadowmaster.js";
import Spellmaster from "./models/players/Spellmaster.js";
import GameManager from "./GameManager.js";

var player = null;

const SELECT_BATTLE_MASTER_BUTTON = document.getElementById('battlemaster-select-btn');
const SELECT_SHADOW_MASTER_BUTTON = document.getElementById('shadowmaster-select-btn');
const SELECT_SPELL_MASTER_BUTTON = document.getElementById('spellmaster-select-btn');

SELECT_BATTLE_MASTER_BUTTON.addEventListener('click', GameManager.handlerClassSelect);
SELECT_SHADOW_MASTER_BUTTON.addEventListener('click', GameManager.handlerClassSelect);
SELECT_SPELL_MASTER_BUTTON.addEventListener('click', GameManager.handlerClassSelect);

console.log(player)