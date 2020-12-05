var player = null;
const Manager = {
    start(pickedClass) {
        this.playerClassSelect(pickedClass);
        this.playerInterface();
    },
    playerClassSelect(pickedClass) {
        switch (pickedClass) {
            case "battlemaster":
                player = new Battlemaster("Darius", "Battlemaster");
                break;
        }
        return this.player;
    },
    playerInterface() {
        let interfaceSelection = document.getElementById("characterselection");
        let playerInterface = document.getElementById("playerInterface");
        let className = document.getElementById("classname");
        let playerStatus = document.getElementById("playerStatus")
        className.innerText = `${player.name}`
        playerStatus.innerText = `${player.status}`;
        interfaceSelection.remove();
        playerInterface.className = "card mt-5 p-5"
    }

}