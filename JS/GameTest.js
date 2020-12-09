var player = null;
var locationBattle = null;
var enemy = null;
let playerNameStatus = document.getElementById("playerNameStatus");
let interfaceSelection = document.getElementById("characterselection");
let playerInterface = document.getElementById("playerInterface");
let className = document.getElementById("classname");
let playerHealthBar = document.getElementById("playerHealth");
let playerEnergyBar = document.getElementById("energyBar")
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
                locationsBattle = new locationMap("Claws of winter", winterDangers, winterMonsters, winterImgs);
                locationsBattle.eventRandom();
                break;
        }
    }
}


let actStats = function (obj) {
    playerHealthBar.style.width = `${player.health * 100 / player.maxHealth}%`;

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