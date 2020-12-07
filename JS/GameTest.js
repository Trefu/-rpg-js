var player = null;
var LocationBattle = null;
let playerNameStatus = document.getElementById("playerNameStatus");
let interfaceSelection = document.getElementById("characterselection");
let playerInterface = document.getElementById("playerInterface");
let className = document.getElementById("classname");
let midSec = document.getElementById("midSec");

const Manager = {
    start(pickedClass) {
        this.playerClassSelect(pickedClass);
        this.preFight();
    },
    playerClassSelect(pickedClass) {
        switch (pickedClass) {
            case "battlemaster":
                player = new Battlemaster("Darius", "Battlemaster");
                break;
        }
        return this.player;
    },
    preFight() {
        className.innerText = `${player.name}`
        interfaceSelection.remove();
        playerInterface.classList.remove("d-none")
        midSec.classList.remove("d-none")

    },
    locationSelect(loc) {
        switch (loc) {
            case "winter":
                LocationBattle = new Location("Claws of winter", winterDangers, winterMonsters, winterImgs);
                LocationBattle.eventRandom();
                break;
        }
    }
}


let actStatus = function (obj) {
    for (let pro in obj) {
        if (obj[pro]) {
            let status = document.getElementById(`${pro}`)
            status.className = "";
        } else {
            let status = document.getElementById(`${pro}`)
            status.className = "d-none";
        }
    }
}