import AutoSave from "./Autosave.js";
import { LOCAL_STORAGE_PLAYER } from "./const.js";
import GameManager from "./GameManager.js";

//SI YA HAY UN PJ GUARDADO REDIRECCIONA
if (localStorage.getItem(LOCAL_STORAGE_PLAYER)) {
    window.location.replace('/index.html');
}

const SELECT_BATTLE_MASTER_BUTTON = document.getElementById('battlemaster-select-btn');
const SELECT_SHADOW_MASTER_BUTTON = document.getElementById('shadowmaster-select-btn');
const SELECT_SPELL_MASTER_BUTTON = document.getElementById('spellmaster-select-btn');

SELECT_BATTLE_MASTER_BUTTON.addEventListener('click', GameManager.handlerClassSelect);
SELECT_SHADOW_MASTER_BUTTON.addEventListener('click', GameManager.handlerClassSelect);
SELECT_SPELL_MASTER_BUTTON.addEventListener('click', GameManager.handlerClassSelect);

window.onunload = function () {
    console.log("borrando event listener antes de cambiar de pagina");
    SELECT_BATTLE_MASTER_BUTTON.removeEventListener('click', GameManager.handlerClassSelect);
    SELECT_SHADOW_MASTER_BUTTON.removeEventListener('click', GameManager.handlerClassSelect);
    SELECT_SPELL_MASTER_BUTTON.removeEventListener('click', GameManager.handlerClassSelect);
    AutoSave.stop();
    return;
}

window.onload = function () {
    AutoSave.start();
}