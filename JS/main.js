import BaseModel from "./models/players/BaseModel.js";
import Battlemaster from "./models/players/Battlemaster.js";
import Shadowmaster from "./models/players/Shadowmaster.js";
import Spellmaster from "./models/players/Spellmaster.js";
import { test } from "./models/viewManager.js";
import GameManager from "./GameManager.js";

var player;

let selectBattlemaster = document.getElementById('battlemaster-select-btn');

const handlerBattlemasterClassSelect = function (event) {
    console.log(event)
}

selectBattlemaster.addEventListener('click', handlerBattlemasterClassSelect);

