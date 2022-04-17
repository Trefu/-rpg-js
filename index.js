import Autosave from "./js/Autosave.js";
import GameManager from "./js/GameManager.js";
/* if (!player && window.location.href.indexOf("select-character") === -1) {
    window.location.replace('views/select-character.html');
} */

//Esto es para poder borrar el pj en las pruebas ya que con localstorage.clear() se limpia el storage pero lavariable sigue cargada
//y el autosave lo vuelve a cargar
let deletePj = document.querySelector('.delete-pj');

deletePj.addEventListener('click', GameManager.deletedActualPlayer)

window.onunload = function () {
    console.log("borrando event listener antes de cambiar de pagina");
    deletePj.removeEventListener('click', setPlayerToNull);
    Autosave.stop();
    return;
} 

window.onload = function () {
    Autosave.start();
}