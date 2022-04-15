import BaseModel from "./models/players/BaseModel.js";
import Battlemaster from "./models/players/Battlemaster.js";
import Shadowmaster from "./models/players/Shadowmaster.js";
import Spellmaster from "./models/players/Spellmaster.js";
import { test } from "./models/viewManager.js";
import GameManager from "./GameManager.js";

var player = null;

const SELECT_BATTLE_MASTER_BUTTON = document.getElementById('battlemaster-select-btn');
const SELECT_SHADOW_MASTER_BUTTON = document.getElementById('shadowmaster-select-btn');
const SELECT_SPELL_MASTER_BUTTON = document.getElementById('spellmaster-select-btn');

const handlerClassSelect = function (event) {
    console.log(event.target.getAttribute("data-class"));
    let selectedClass = event.target.getAttribute("data-class");
    if (selectedClass === "battlemaster") {
        player = new Battlemaster();
    }else if (selectedClass === "shadowmaster") {
        player = new Shadowmaster();
    }else if (selectedClass === "spellmaster") {
        player = new Spellmaster();
    } 
    console.log(player);
}


SELECT_BATTLE_MASTER_BUTTON.addEventListener('click', handlerClassSelect);
SELECT_SHADOW_MASTER_BUTTON.addEventListener('click', handlerClassSelect);
SELECT_SPELL_MASTER_BUTTON.addEventListener('click', handlerClassSelect);
console.log(player)