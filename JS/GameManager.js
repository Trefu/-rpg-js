//Primero declaro la variable y luego la exporto, esto se hacen con las constantes
const GameManager = {
    handlerClassSelect : function (event) {
        console.log(event.target.getAttribute("data-class"));
        player = event.target.getAttribute("data-class");
    }
}

export default GameManager