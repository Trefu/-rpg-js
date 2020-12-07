var player = null;
var LocationBattle = null;
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
        let interfaceSelection = document.getElementById("characterselection");
        let playerInterface = document.getElementById("playerInterface");
        let className = document.getElementById("classname");
        let playerStatus = document.getElementById("playerStatus");
        let midSec = document.getElementById("midSec");
        className.innerText = `${player.name}`
        playerStatus.innerText = `${player.status}`;
        interfaceSelection.remove();
        playerInterface.classList.remove("d-none")
        midSec.classList.remove("d-none")
    },
    locationSelect(loc) {
        switch (loc) {
            case "winter":
                LocationBattle = new Location("Claws of winter", winterDangers, winterMonsters, winterImgs);
                LocationBattle.eventRandom();
                midSec.style = "";
                break;
        }
    }
}




let actPlayerHealth = function () {
    let playerHealthBar = document.getElementById("playerHealth");
    playerHealthBar.style.width = `${player.health * 100 / player.maxHealth}%`;
}