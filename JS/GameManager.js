//Primero declaro la variable y luego la exporto, esto se hacen con las constantes
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