var player = null;
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
        let locationsImgs = document.getElementById("locationsImgs");
        let midSec = document.getElementById("midSec");

        className.innerText = `${player.name}`
        playerStatus.innerText = `${player.status}`;
        interfaceSelection.remove();
        playerInterface.className = "card p-5 mx-sm-auto mx-md-5"
        midSec.classList.remove("d-none")
    }

}




let actPlayerHealth = function () {
    let playerHealthBar = document.getElementById("playerHealth");
    playerHealthBar.style.width = `${player.health * 100 / player.maxHealth}%`;
}