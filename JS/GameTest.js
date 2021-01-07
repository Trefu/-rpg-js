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
        battleText.innerHTML += (`<h4>${player.name} Turn</h4>`);
        actionBtn1.innerText = `Use ${player.weapon.name}`
        actionBtn1.setAttribute("onclick", "player.attack(enemy)");
        $(actionBtn1).tooltip({
            title: `
                ${player.name} will try to attack using his ${player.weapon.name}.
                Crit chance: ${player.critical}%.
                Hit chance:${player.accuracyChance - enemy.dodgeChance}.
                Damage media: ${player.weapon.dmg.join("-")}.`,
            container: "body",
            placement: "right",
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
Bonus damage: ${restantLife(enemy)}
Bonus damage based on %enemy missed health`,
                container: "body",
                placement: "right",
                trigger: "hover"
            })
            actionBtn3.innerText = `Feint swing`
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

restantLife = (obj) => {
    return Math.round((obj.maxHealth - obj.health) / obj.maxHealth * 100 / 3)
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

const heal = function (obj, num) {
    obj.health += num;
    obj.health >= obj.maxHealth ? obj.health = obj.maxHealth : obj.health;
    battleTextAdd(`${obj.name} heals for ${num}`, "heal");

    actStats(obj);
}

const showButtons = function (boolean, btn) {
    boolean ? btn.classList.remove("d-none") : btn.classList.add("d-none");
};

const passTurn = (next) => {
    setTimeout(() => {
        battleText.innerHTML += (`<h4>${next.name} Turn</h4>`);
        next instanceof BaseModel ? $(playerCombatsBtns).show() : next.turn();
    }, 3000);
}
const generateWeaponDmg = (obj) => {
    let min = obj.weapon.dmg[0];
    let max = obj.weapon.dmg[1];
    let output = Math.floor(Math.random() * (max - min + 1) + min);
    return output;
}

const counterAttack = function (counter, objective) {
    let counterdmg = generateWeaponDmg(counter)
    objective.health -= counterdmg;
    battleTextAdd(`${counter.name} counter the attack dealing ${counterdmg} ${counter.weapon.type} damage`, "counter")
    if (objective.health <= 0) {
        objective.health = 0;
        alert("win coutner")
    }
    actStats(enemy);
    actStats(player);

}

const d100 = () => Math.ceil(Math.random() * 100);

$(document).ready(function () {
    //para evitar que al clickear la primera vez se devuelva al inicio
    $(".btn").click(function (e) {
        e.preventDefault();
    });

    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        $('.btn').popover('disable');
    }

});