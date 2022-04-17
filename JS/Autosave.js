import { LOCAL_STORAGE_PLAYER } from "./const.js";
import GameManager from "./GameManager.js";
import { player } from "./GameManager.js";

const AutoSave = (function () {
    var timer = null;
    function save() {
        if (player) {
            //me guardo en json los datos para restaurar
            var playerToSave = JSON.stringify(player.toJson());
            if (playerToSave) {
                localStorage.setItem(LOCAL_STORAGE_PLAYER, playerToSave)
                return console.log('player guardado ' + playerToSave)
            }
        }
        return console.log('no hay player');
    }
    function restore() {
        //le paso el json al gameManager y según el name va a instancear la clase
        var savedPlayer = JSON.parse(localStorage.getItem(LOCAL_STORAGE_PLAYER))
        if (savedPlayer) {
            return GameManager.restoreSavedPlayer(savedPlayer)
        }
    }
    return {
        start: function () {
            console.log('Autosave activado')
            restore();
            if (timer != null) {
                clearInterval(timer);
                timer = null;
            }
            timer = setInterval(save, 3000);
        },
        stop: function () {
            console.log('autosave parado')
            if (timer) {
                clearInterval(timer);
                timer = null;
            }
        }
    }
}())

export default AutoSave