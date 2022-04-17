import Battlemaster from "./models/players/Battlemaster.js";
import Shadowmaster from "./models/players/Shadowmaster.js";
import Spellmaster from "./models/players/Spellmaster.js";
import { LOCAL_STORAGE_PLAYER } from "./const.js";
var player;

const setPlayer = (newPlayer) => {
    player = newPlayer
}

const GameManager = {
    /**
     * 
     * @param {Event} event 
     * @returns console.log
     */
    handlerClassSelect: function (event) {
        let selectedClass = event.target.getAttribute("data-class");
        if (selectedClass === "battlemaster") {
            setPlayer(new Battlemaster());
        } else if (selectedClass === "shadowmaster") {
            setPlayer(new Shadowmaster());
        } else if (selectedClass === "spellmaster") {
            setPlayer(new Spellmaster());
        }
        return console.log(player);
    },
    /**
     * Revisa el localstorage en busca del registro del jugador, si existe, instacia la antigua clase con sus  estadisticas y cosas
     * @returns console.log
     */
    restoreSavedPlayer: function () {
        var savedPlayer = JSON.parse(localStorage.getItem("PlayerSaved"))
        console.log(savedPlayer)
        if (!savedPlayer) return null;
        switch (savedPlayer.name) {
            case "Battlemaster":
                setPlayer(new Battlemaster(savedPlayer))
                break;
            case "Shadowmaster":
                setPlayer(new Shadowmaster(savedPlayer))
                break;
            case "Spellmaster":
                setPlayer(new Spellmaster(savedPlayer))
                break;
            default:
                console.log('error al restaurar');
                break;
        }
        return console.log('player restaurado ' + player)
    },
    /**
     * seteea el player en null y elimina el registro del localstorage 
     * @param {Event} e 
     * @returns console.log
     */
    deletedActualPlayer: function (e) {
        e.preventDefault()
        player = null;
        localStorage.removeItem(LOCAL_STORAGE_PLAYER);
        return console.log('player borrado ' + player)
    }
}

export default GameManager
export { player, setPlayer };