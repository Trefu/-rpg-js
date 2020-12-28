var gameOver = false;
var player = null;
var locationBattle = null;
var enemy = null;
//Interface Player Variables
let playerNameStatus = document.getElementById("playerNameStatus"); // ???
let interfaceSelection = document.getElementById("characterselection");
let playerInterface = document.getElementById("playerInterface");
let playerName = document.getElementById("playerName");
let midSec = document.getElementById("midSec");
let body = document.getElementById("body");
let playerCombatsBtns = document.getElementById("btnsHidder");
//Enemy Interface
let enemyInterface = document.getElementById("enemyInterface")
let enemyAvatar = document.getElementById("enemyAvatar");
let enemyName = document.getElementById("enemyName");
//Battle and events variables
let battleText = document.getElementById("battleText");
let textRecordSec = document.getElementById("textRecordSec");
let btnEvent1 = document.getElementById("ElectionEvent1");
let btnEvent2 = document.getElementById("ElectionEvent2");
let btnEvent3 = document.getElementById("ElectionEvent3");
let actionBtn1 = document.getElementById("playerAction1");
let actionBtn2 = document.getElementById("playerAction2");
let actionBtn3 = document.getElementById("playerAction3");
// Status variables
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
                player = new Battlemaster("Darius", "Battlemaster", sword);
                break;
        }
        return this.player;
    },
    preFight() {
        interfaceSelection.remove();
        $(playerInterface).removeClass("d-none")
        $(midSec).removeClass("d-none")
        playerName.innerText = `${player.name}`
    },
    locationSelect(loc) {
        switch (loc) {
            case "winter":
                locationBattle = new locationMap("Claws of winter", winterDangers, winterMonsters, winterImgs);
                locationBattle.locationStart();
                locationBattle.eventRandom();
                break;
        }
    },
    fight() {
        $(enemyInterface).removeClass("d-none");
        battleText.innerText = "";
        $(playerCombatsBtns).removeClass("d-none")

        actionBtn1.innerText = `Use ${player.weapon.name}`
        $(actionBtn1).tooltip({
            title: `
                Hit chance:${player.accuracyChance - enemy.dodgeChance}.
                Damage media: ${player.weapon.dmg}.`,
            container: "body",
            placement: "right",
            trigger: "hover"
        })

        if (player.classCharacter === "Battlemaster") {

            actionBtn2.innerText = `Lethal blow`
            actionBtn3.innerText = `Feint swing`
            actionBtn1.setAttribute("onclick", "player.attack(enemy)");


            $(actionBtn2).tooltip({
                title: `atque amet, eos eveniet voluptatem culpa! Harum soluta, vitae sint illo dignissimos
                voluptatibus.
                Hit chance:${player.accuracyChance - enemy.dodgeChance}. \n
                Damage media: ${player.weapon.dmg}.`,
                container: "body",
                placement: "right",
                trigger: "hover"
            })
            $(actionBtn3).tooltip({
                title: `Hit chance:${player.accuracyChance - enemy.dodgeChance}. \n Damage media: ${player.weapon.dmg}.`,
                container: "body",
                placement: "right",
                trigger: "hover"
            })

        }

    }


}

let changeTextTooltip = function (e, txt) {
    $(e).attr('data-bs-original-title', txt)
}




let actStats = function (obj) {
    obj.healthBar.style.width = `${obj.health * 100 / obj.maxHealth}%`;
    obj.energyBar.style.width = `${obj.energy * 100 / obj.maxEnergy}%`;

    changeTextTooltip(actionBtn1, `
    Hit chance:${player.accuracyChance - enemy.dodgeChance}.
    Damage media: ${player.weapon.dmg}.`)

    if (obj.name === player.name) {
        for (let pro in obj.status) {
            if (obj.status[pro]) {
                let statusShow = document.getElementById(`${pro}`)
                statusShow.className = "";
            } else {
                let statusShow = document.getElementById(`${pro}`)
                statusShow.className = "d-none";
            }
        }
    }
}

let heal = function (obj, num) {
    obj.health += num;
    obj.health >= obj.maxHealth ? obj.health = obj.maxHealth : obj.health;
    battleText.innerText += `
    ${obj.name} heals for ${num}`;
    actStats(player);
}

let showButtons = function (boolean, btn) {
    boolean ? btn.classList.remove("d-none") : btn.classList.add("d-none");
};

const generateMediaDmgCris = function (obj) {
    let min = 0.800;
    let percent = Math.round((obj.energy * 100) / obj.maxEnergy);
    let max = 1.200
    let media = Math.random() * (max - min) + min;
    if (player.status.inspired) {
        media += 0.30
    } else {
        if (percent > 60) {
            media += 0.15
        } else if (percent <= 60) {
            media += 0.80;
        } else if (percent <= 40) {
            media += 0.70;
        } else if (percent <= 20) {
            media += 0.60;
        }
    }
    return Math.round(obj.weapon.dmg * media);
};


const d100 = () => Math.floor(Math.random() * 100 + 1);

$(document).ready(function () {
    //para evitar que al clickear la primera vez se devuelva al inicio
    $(".btn").click(function (e) {
        e.preventDefault();
    });
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        $('.btn').popover('disable');
    }

});