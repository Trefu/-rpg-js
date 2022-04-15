//Primero declaro la variable y luego la exporto, esto se hacen con las constantes
import Battlemaster from "./models/players/Battlemaster.js";
import Shadowmaster from "./models/players/Shadowmaster.js";
import Spellmaster from "./models/players/Spellmaster.js";

var player = null;

const GameManager = {
    handlerClassSelect: function (event) {
        let selectedClass = event.target.getAttribute("data-class");
        if (selectedClass === "battlemaster") {
            player = new Battlemaster();
        } else if (selectedClass === "shadowmaster") {
            player = new Shadowmaster();
        } else if (selectedClass === "spellmaster") {
            player = new Spellmaster();
        }
        return console.log(player);
    }
}

export default GameManager