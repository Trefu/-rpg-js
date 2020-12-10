var gameOver = false
var player = null;
var locationBattle = null;
var enemy = null;
let playerNameStatus = document.getElementById("playerNameStatus");
let interfaceSelection = document.getElementById("characterselection");
let playerInterface = document.getElementById("playerInterface");
let className = document.getElementById("classname");
let midSec = document.getElementById("midSec");
let body = document.getElementById("body");
let battleText = document.getElementById("battleText");
let textRecordSec = document.getElementById("textRecordSec");
let btnEvent1 = document.getElementById("ElectionEvent1");
let btnEvent2 = document.getElementById("ElectionEvent2");
let btnEvent3 = document.getElementById("ElectionEvent3");
// Status 
let statusInspired = document.getElementById(`inspired`);
let statusCold = document.getElementById(`cold`);
let statusFatigued = document.getElementById(`fatigued`);
let statusBleeding = document.getElementById(`bleeding`);
let statusPoisoned = document.getElementById(`poisoned`);
let statusScared = document.getElementById(`scared`);



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
                locationBattle = new locationMap("Claws of winter", winterDangers, winterMonsters, winterImgs);
                locationBattle.locationStart();
                locationBattle.eventRandom();
                break;
        }
    }
}


let actStats = function (obj) {
    playerHealthBar.style.width = `${obj.health * 100 / obj.maxHealth}%`;

    for (let pro in obj.status) {
        if (obj.status[pro]) {
            statusShow = document.getElementById(`${pro}`)
            statusShow.className = "";
        } else {
            statusShow = document.getElementById(`${pro}`)
            statusShow.className = "d-none";
        }
    }
}

actStatsObj = {
    obj: null,
    healthBar: null,
    actStatsHtml(obj) {
        this.obj = obj;
        console.log(this.obj)
    }
}

let heal = function (obj, num) {
    obj.health += num;
    obj.health >= obj.maxHealth ? obj.health = obj.maxHealth : obj.health;
    battleText.innerText += `
    ${obj.name} heals for ${num}`;
    actStats(player);
}