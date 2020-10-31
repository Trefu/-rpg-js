var player = null;
var enemy = null;
var gameOver = false;
const Manager = {
    setGameStart: function (name) {
        this.resetPlayer(name);
        this.setPrefight();
    },
    resetPlayer: function (name) {
        switch (name) {
            case "Fighter":
                player = new Fighter('Fighter');
                break;
            case "Mage":
                player = new Mage('Mage')
                break;
            case "Rogue":
                player = new Rogue('Rogue')
                break;
        }
    },
    setPrefight: function () {
        //Cambia  el escenario/interface y muestra al personaje jugador
        let getActions = document.getElementById("actions");
        let getHeader = document.getElementById("header");
        let getInterface = document.getElementById("pickinterface");
        let getPlayerBattleInterface = document.getElementById("playerBattleInterface");
        getHeader.innerHTML = "<h1>Fight</h1>";
        getInterface.remove();
        document.getElementById("battle").style.display = "inline";
        getPlayerBattleInterface.innerHTML = `                
                <img src="imgs/avatars/${player.name.toLowerCase()}.png" class="avatars">
                <div class="description">
                <h3>${player.name}</h3>
                <p id="player-health">Health: ${player.hp}</p>
                <p id="playerArmor">Armor: ${player.armor}</p>
                <p id="playerStr">Strength: ${player.strength}(${player.modifiers.str})</p>
                <p>Dexterity: ${player.dexterity}(${player.modifiers.dex})</p>
                <p>Intelligence: ${player.intelligence}(${player.modifiers.int})</p>
                <p id="playerWeapon">Weapon: ${player.weapon.name} Attack bonus:(+${parseInt(player.modifiers.str) + player.weapon.attackBonusWeapon})</p>
                <p id="playerDamage">Damage : 1d${player.weapon.damage} (+${parseInt(player.modifiers.str) + player.weapon.damageBonusWeapon})</p>
                </div>
                `


        getActions.innerHTML = `
        <a href="#" class="btn" onclick="Manager.setFight()">Search an enemy!</a>
        `;
    },

    //Crear enemigo aleatorio
    setFight: function () {
        let enemy01 = new Goblin("Goblin");
        let enemy02 = new Violet_Fungus("Violet Fungus");
        let enemy03 = new Wolf("Wolf");
        let enemy04 = new Gnoll("Gnoll");
        let enemy05 = new Ghoul("Ghoul");
        let pickEnemy = Math.floor(Math.random() * 5 + 1);
        switch (pickEnemy) {
            case 1:
                enemy = enemy01
                break;
            case 2:
                enemy = enemy02
                break;
            case 3:
                enemy = enemy03
                break;
            case 4:
                enemy = enemy04
                break;
            case 5:
                enemy = enemy05
                break;

        }
        alert("One " + enemy.name + " appears to fight you!");
        document.getElementById("arena").style.display = "inline"
        document.getElementById("enemyBattleInterface").innerHTML = `                
                <img src="imgs/enemy/${enemy.name}.png" class="avatars">
                <div class="description">
                <h3>${enemy.name}</h3>
                <p id="enemy-health">Health: ${enemy.hp}</p>
                <p>Armor: ${enemy.armor}</p>
                <p>Strength: ${enemy.strength}</p>
                <p>Dexterity: ${enemy.dexterity}</p>
                <p>Intelligence: ${enemy.intelligence}</p>
                <p>Weapon: ${enemy.weapon.name}
                Attack Bonus: ${enemy.weapon.attackBonusWeapon}</p>
                <p>Damage : 1d${enemy.weapon.damage} (${enemy.strength})</p>
                </div>
                `
        // Creacion de botones
        if (player.name == "Fighter") {
            document.getElementById("actions").innerHTML = `<a id="attackBtn" href="#" class="btn" onclick="playerTurn('attack')">Attack!</a>
        <a id="guardBtn" href="#" class="btn" onclick="playerTurn('guard')">Defensive stance</a>
        <a id="agresiveBtn" href="#" class="btn" onclick="playerTurn('agresive')">Agresive stance</a>
        <a id="recklessBtn" href="#" class="btn" onclick="playerTurn('reckless')">Reckless stance</a>`
            let guardBtn = document.getElementById("guardBtn");
            let agresiveBtn = document.getElementById("agresiveBtn");
            let reckleesBtn = document.getElementById("reckleesBtn");
        } else if (player.name == "Mage") {
            document.getElementById("actions").innerHTML = `<a id="attackBtn" href="#" class="btn" onclick="playerTurn('attack')">Attack!</a>
        <a id="healBtn" href="#" class="btn" onclick="playerTurn('heal')">Heal spell (2d6+INT)</a>
        <a id="poisonBtn" href="#" class="btn" onclick="playerTurn('poison')">Poison Spray</a>
        <a id="lightningBtn" href="#" class="btn" onclick="playerTurn('lightning')">Lightning bolts</a>`
            let healBtn = document.getElementById("healBtn");
            let poisonBtn = document.getElementById("poisonBtn");
            let lightningBtn = document.getElementById("lightningBtn");
        } else {
            document.getElementById("actions").innerHTML = `<a id="attackBtn" href="#" class="btn" onclick="playerTurn('attack')">Attack!</a>`;
            let attackBtn = document.getElementById("attackBtn");
        }
    }
};
//controla los turnos y los turnos de bonus

var turn = 1;
let getSpan = document.getElementById("messages");
let enemyTimer;
let firstturn = false;
let defensiveActivated = false;
let agresiveActivated = false;
let recklessActivated = false;
let stancesActivated = false;
let usesStances = 0;
let bonusTime = 0;


function playerTurn(choise) {
    switch (choise) {
        case "attack":
            attack();
            break;
        case "guard":
            fighterStances('guard');
            break;
        case "agresive":
            fighterStances('agresive');
            break;
        case "reckless":
            fighterStances('reckless');
            break;
        case "heal":
            heal();
            printStats();
            break;
    }
    //Anti spam
    attackBtn.setAttribute('onclick', '')
    if (deathCheck(enemy.hp)) {
        alert("win");
        enemy.hp = 0;
        printStats();
    } else {
        setTimeout(() => {
            getSpan.innerHTML = `${enemy.name} is about to attack!`
        }, 3000);

        setTimeout(() => {
            enemyTurn();
        }, 5000);
    }

}

let stancesBtnsDeactive = function () {
    guardBtn.setAttribute("onclick", "")
    agresiveBtn.setAttribute("onclick", "")
    recklessBtn.setAttribute("onclick", "")
}
let stancesBtnsActive = function () {
    guardBtn.setAttribute("onclick", "playerTurn('guard')")
    agresiveBtn.setAttribute("onclick", "playerTurn('agresive')")
    recklessBtn.setAttribute("onclick", "playerTurn('reckless')")
}
stancesBtnsText = function (text) {
    guardBtn.innerText = "Defensive stance" + text;
    agresiveBtn.innerText = "Agresive stance " + text;
    recklessBtn.innerText = "Reckless stance " + text;
}

function fighterStances(stance) {

    switch (stance) {
        case "guard":
            if (!stancesActivated && usesStances != 3) {
                stancesActivated = true;
                defensiveActivated = true;
                player.block(true);
                stancesBtnsDeactive();
                getSpan.innerHTML = `${player.name} is on defensive stance!`;
                bonusTime = turn + 3;
                usesStances++;
            } else if (defensiveActivated && bonusTime === turn) {
                stancesActivated = false;
                defensiveActivated = false;
                player.block(false);
                usesStances === 3 ? (
                    stancesBtnsDeactive(),
                    getSpan.innerHTML = `${player.name} Can't use more stances`,
                    stancesBtnsText("(No more stances uses)")
                ) : (
                    stancesBtnsActive(),
                    setTimeout(() => {
                        getSpan.innerHTML = `${player.name} is no more on defensive stance`
                    }, 2500),
                    stancesBtnsText("")
                );
                bonusTime = 0;
            } else if (bonusTime != turn) {
                stancesBtnsText("(On cooldown)")
            }
            break;

        case "agresive":
            if (!stancesActivated && usesStances != 3) {
                stancesActivated = true;
                agresiveActivated = true;
                player.agresive(true);
                stancesBtnsDeactive();
                getSpan.innerHTML = `${player.name} is on agresive stance!`;
                bonusTime = turn + 3;
                usesStances++;
            } else if (agresiveActivated && bonusTime === turn) {
                stancesActivated = false;
                agresiveActivated = false;
                player.agresive(false);
                usesStances === 3 ? (
                    stancesBtnsDeactive(),
                    getSpan.innerHTML = `${player.name} Can't use more stances`,
                    stancesBtnsText("(No more stances uses)")
                ) : (
                    stancesBtnsActive(),
                    setTimeout(() => {
                        getSpan.innerHTML = `${player.name} is no more on agresive stance`
                    }, 2500),
                    stancesBtnsText("")
                );
                bonusTime = 0;
            } else if (bonusTime != turn) {
                stancesBtnsText("(On cooldown)")
            }
            break;

        case "reckless":
            if (!stancesActivated && usesStances != 3) {
                stancesActivated = true;
                recklessActivated = true;
                player.reckless(true);
                stancesBtnsDeactive();
                getSpan.innerHTML = `${player.name} is on reckless stance!`;
                bonusTime = turn + 3;
                usesStances++;
            } else if (recklessActivated && bonusTime === turn) {
                stancesActivated = false;
                recklessActivated = false;
                player.reckless(false);
                usesStances === 3 ? (
                    stancesBtnsDeactive(),
                    getSpan.innerHTML = `${player.name} Can't use more stances`,
                    stancesBtnsText("(No more stances uses)")
                ) : (
                    stancesBtnsActive(),
                    setTimeout(() => {
                        getSpan.innerHTML = `${player.name} is no more on reckless stance`
                    }, 2500),
                    stancesBtnsText("")
                );
                bonusTime = 0;
            } else if (bonusTime != turn) {
                stancesBtnsText("(On cooldown)")
            }
            break;
    }
    printStats()
}

function enemyTurn() {
    let enemyReturns;
    // Fighter stances
    if (player.name == "Fighter" && stancesActivated && defensiveActivated) {
        fighterStances('guard');
    } else if (agresiveActivated) {
        fighterStances('agresive');
    } else if (recklessActivated) {
        fighterStances('reckless');
    }
    enemyReturns = enemy.attack();
    getSpan.innerHTML = enemyReturns.messageReturn;
    attackBtn.setAttribute('onclick', 'playerTurn("attack")')
    attackBtn.innerText = ("Attack")
    printStats();
    deathCheck(player.hp) ? alert("acasa pete") : player.hp;
    turn++;
}

function printStats() {
    let playerhp = document.getElementById("player-health");
    let enemyhp = document.getElementById("enemy-health");
    let playerArmor = document.getElementById("playerArmor");
    let playerStr = document.getElementById("playerStr");
    let playerWeapon = document.getElementById("playerWeapon");
    let playerDamage = document.getElementById("playerDamage");
    playerDamage.innerHTML = `Damage : 1d${player.weapon.damage} (+${parseInt(player.modifiers.str) + player.weapon.damageBonusWeapon})`
    playerWeapon.innerHTML = `Weapon: ${player.weapon.name} Attack bonus:(+${parseInt(player.modifiers.str) + player.weapon.attackBonusWeapon})`
    playerhp.innerText = "Health: " + player.hp;
    enemyhp.innerText = "Health: " + enemy.hp;
    playerArmor.innerText = "Armor: " + player.armor;
    playerStr.innerText = `Strength: ${player.strength}(${player.modifiers.str})`
}

function deathCheck(hp) {
    return hp <= 0;
}

function attack() {
    let attackValues;
    attackValues = player.getAttackValues();
    if (attackValues.attackRoll <= 0) {
        getSpan.innerHTML = `${player.name} miss with 1 (not Nat 1)`;
    } else if (attackValues.attackRoll == 1) {
        getSpan.innerHTML = `${player.name} attack first and rolls nat 1, he miss and take ${enemy.weapon.damage / 2} damage`;
    } else if (attackValues.attackRoll == 20) {
        getSpan.innerHTML = `${player.name} hits a crit!, ${enemy.name} takes ${attackValues.dmg *2} damage`;
        enemy.hp -= attackValues.dmg * 2;
    } else if (attackValues.attackRoll >= enemy.armor) {
        getSpan.innerHTML = `The ${player.name} strikes on ${enemy.name} and deals ${attackValues.dmg} damage`;
        enemy.hp -= attackValues.dmg;
    } else {
        getSpan.innerHTML = `The ${player.name} has missed!`;
    }
}

function heal() {
    let healValues = player.healSpell();
    getSpan.innerHTML = `${healValues.msg}`
    console.log(healValues)

}