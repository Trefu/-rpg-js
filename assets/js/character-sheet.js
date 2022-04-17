import AutoSave from "../../js/Autosave.js";
import { player } from "../../js/GameManager.js";

const AVATAR_IMAGE = document.getElementById('avatar');
console.log(AVATAR_IMAGE)
console.log('character sheet js')

//aca adentro va todo lo que queres que se ejecute una vez se cargo todo el html,css y js
window.onload = function () {
    //Activador de autosave
    AutoSave.start();
    AVATAR_IMAGE.src = player.avatar
}
