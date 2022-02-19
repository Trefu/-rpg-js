console.log('main js')
/* import {
    functions
} from "./functions"
console.log(functions.heal)
import {
    weapons
} from "./Weapons"
import {
    enemy
} from "./models/Enemigo.js"

console.log(enemy.Ice_Troll)
import {
    battlemaster
} from "./models/battlemaster"

import {
    eventClicks
} from "./eventsClicks"
import {
    LocationsMap
} from "./models/locations"
console.log(LocationsMap)
var player = null;
var locationBattle = null;
//Interface Player Variables
let playerNameStatus = document.getElementById("playerNameStatus"); // ???
let interfaceSelection = document.getElementById("characterselection");
let playerInterface = document.getElementById("playerInterface");
let playerName = document.getElementById("playerName");
let midSec = document.getElementById("midSec");
let body = document.getElementById("body");
var playerCombatsBtns = $("#btnsHidder");
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
// locations selects buttons
const winterLocBtn = document.getElementById("loc1")
const duniaLocBtn = document.getElementById("loc2")
const deepLocBtn = document.getElementById("loc3")
const neverwinterLocBtn = document.getElementById("loc4")

const Manager = {
    start(pickedClass) {
        this.playerClassSelect(pickedClass);
        this.ready();
    },
    playerClassSelect(pickedClass) {
        switch (pickedClass) {
            case "battlemaster":
                player = new battlemaster("Darius", "Battlemaster", weapons.sword);
                break;
        }
        return this.player;
    },
    ready() {
        interfaceSelection.remove();
        $(playerInterface).removeClass("d-none")
        $(midSec).removeClass("d-none")
        playerName.innerText = `${player.name}`
        $(winterLocBtn).click(function (e) {
            e.preventDefault();
            Manager.locationSelect("winter")
        });
    },
    locationSelect(loc) {
        switch (loc) {
            case "winter":
                locationBattle = new LocationsMap.LocationClass("Claws of winter", LocationsMap.winterDangers, LocationsMap.winterMonsters, LocationsMap.winterImgs);
                break;
            case "dunia":
                locationBattle = new LocationsMap.LocationClass("Dunia", LocationsMap.duniaDangers, LocationsMap.duniaMonsters, LocationsMap.duniaImgs);
                break;
        }
        locationBattle.locationStart();
        locationBattle.eventRandom();
    },
    fight() {
        $(enemyInterface).removeClass("d-none");
        battleText.innerText = "";
        $(playerCombatsBtns).removeClass("d-none")
        battleText.innerHTML += (`<h4>${player.name} Turn</h4>`);
        actionBtn1.innerText = `Use ${player.weapon.name}`
        actionBtn1.setAttribute("onclick", "player.attack(enemy)");
        $(actionBtn1).tooltip({
            title: `${player.name} will try to attack using his ${player.weapon.name}.
    Crit chance: ${player.critical}%.
    Hit chance:${player.accuracyChance - enemy.dodgeChance}.
    Damage media: ${player.weapon.dmg.join("-")}.`,
            trigger: "hover"
        })

        if (player.classCharacter === "Battlemaster") {
            actionBtn2.innerText = `Lethal blow`
            actionBtn2.setAttribute("onclick", "player.lethalblow()");
            $(actionBtn2).tooltip({
                title: `${player.name} will attempt to hit a vital point, risking him to a counterattack.
    Crit chance: ${player.critical}%.
    Hit chance:${player.accuracyChance - enemy.dodgeChance}.
    Damage media: ${player.weapon.dmg.join("-")}.
    Bonus damage: ${functions.restantLife(enemy)}
    Bonus damage based on %enemy missed health`,
                trigger: "hover"
            })
            actionBtn3.innerText = `Feint swing`
            actionBtn3.setAttribute("onclick", "player.feintSwing(enemy)");
            $(actionBtn3).tooltip({
                title: `${player.name} Darius will perform a feint followed by a distancing attack to regain some energy.
    Hit chance:${player.accuracyChance - enemy.dodgeChance}.
    Damage media: ${player.weapon.dmg.map((a) => a /2).join("-")}.
    `,
                trigger: "hover"
            })
        }
    }

}

let battleTextAdd = (txt, esp) => {
    var newP = $("<p></p>")
    newP.text(txt);
    switch (esp) {
        case "critical":
            $(newP).addClass(esp);
            break;
        case "counter":
            $(newP).addClass(esp)
            break;
        case "dodge":
            $(newP).addClass(esp)
            break;
        case "heal":
            $(newP).addClass(esp)
            break;
    }
    $("#battleText").append(newP);
}

let changeTextTooltip = function (e, txt) {
    $(e).attr('data-bs-original-title', txt)

}


let actStats = function (obj) {
    obj.health <= 0 ? obj.health = 0 : obj.health;
    obj.energy <= 0 ? obj.energy = 0 : obj.energy;
    obj.healthBar.style.width = `${obj.health * 100 / obj.maxHealth}%`;
    obj.energyBar.style.width = `${obj.energy * 100 / obj.maxEnergy}%`;
    if (enemy !== null) {
        changeTextTooltip(actionBtn1, `${player.name} will try to attack using his ${player.weapon.name}.
    Crit: ${player.critical}%.
    Hit: ${player.accuracyChance - enemy.dodgeChance}%.
    Dmg: ${player.weapon.dmg.join("-")}.`)
        if (player.classCharacter === "Battlemaster") {
            changeTextTooltip(actionBtn2, `${player.name} will attempt to hit a vital point, risking him to a counterattack.
Crit chance: ${player.critical}%.
Hit chance:${player.accuracyChance - enemy.dodgeChance}.
Damage media: ${player.weapon.dmg.join("-")}.
Bonus damage: ${restantLife(enemy)}
Bonus damage based on %enemy missed health`)
            changeTextTooltip(actionBtn3, `${player.name} Darius will perform a feint followed by a distancing attack to regain some energy.
Hit chance:${player.accuracyChance - enemy.dodgeChance}.
Damage media: ${Math.round(player.weapon.dmg.map((a) => a *= 0.5).join("-"))}.
`)
        }

    }
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

$(document).ready(function () {
    $("#startBtnBattlemaster").click(function (e) {
        e.preventDefault();
        Manager.start("battlemaster")
        console.log(player)
    });
    //para evitar que al clickear la primera vez se devuelva al inicio
    console.log("asd")
    let btnsActionsInterface = $("#btnsActions");
    $(".btn").click(function (e) {
        e.preventDefault();
    });


    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        $('.btn').popover('disable');
    }
}); */