var player = null;
var enemy = null;

let Manager = {

    setGameStart: function (name) {
        this.resetPlayer(name);
        this.setPrefight();
    },
    resetPlayer: function (name) {
        switch (name) {
            case "Fighter":
                player = new Fighter('Fighter', 12, 17, greatsword);
                break;
            case "Mage":
                player = new Mage('Mage', 8, 10, staff)
                break;
            case "Rogue":
                player = new Rogue('Rogue', 10, 14, dagger)
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
                <img src="imgs/avatars/${player.name}.png" class="avatars">
                <div class="description">
                <h3>${player.name}</h3>
                <p id="player-health">Health: ${player.hp}</p>
                <p id="playerArmor">Armor: ${player.armor}</p>
                <p>Strength: ${player.strength}(${player.modifiers.str})</p>
                <p>Dexterity: ${player.dexterity}(${player.modifiers.dex})</p>
                <p>Constitution: ${player.constitution}(${player.modifiers.const})</p>
                <p>Intelligence: ${player.intelligence}(${player.modifiers.int})</p>
                <p>Wisdom: ${player.wisdom}(${player.modifiers.wis})</p>
                <p>Charisma: ${player.charisma}(${player.modifiers.cha})</p>
                <p>Weapon: ${player.weapon.name}(${player.modifiers.str}) </p>
                <p>Damage : 1d${player.weapon.damage}(${player.modifiers.str})</p>
                </div>
                `


        getActions.innerHTML = `
        <a href="#" class="btn" onclick="Manager.setFight()">Search an enemy!</a>
        `;
    },

    //Crear enemigo aleatorio
    setFight: function () {
        let enemy01 = new Enemy("Goblin", 7, 15, -1, 2, 0, 0, 0, 0, shortSword);
        let enemy02 = new Enemy("Violet Fungus", 18, 5, -4, -4, -5, 0, 0, 0, spores);
        let enemy03 = new Enemy("Wolf", 11, 13, +1, +2, -4, 0, 0, 0, bite);
        let enemy04 = new Enemy("Gnoll", 22, 15, +2, +1, -2, 0, 0, 0, shortSword);
        let enemy05 = new Enemy("Ghoul", 22, 12, +1, +2, -2, 0, 0, 0, claws);
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
                <p>Constitution: ${enemy.constitution}</p>
                <p>Intelligence: ${enemy.intelligence}</p>
                <p>Wisdom: ${enemy.wisdom}</p>
                <p>Charisma: ${enemy.charisma}</p>
                <p>Weapon: ${enemy.weapon.name}</p>
                <p>Damage : 1d${enemy.weapon.damage} + ${enemy.strength}</p>
                </div>
                `
        // Botones de acciones
        player.name == "Fighter" ? document.getElementById("actions").innerHTML = `<a id="atackBtn" href="#" class="btn" onclick="attack()">Attack!</a>
        <a id="guardBtn" href="#" class="btn" onclick="guard()">Guard</a>` :
            document.getElementById("actions").innerHTML = `<a href="#" class="btn" onclick="attack()">Attack!</a>`;


    }
};
//controla los turnos y los turnos de bonus
var turn = 1;
let bonusTime = 0;
let getSpan = document.getElementById("messages");
let attackBtn = document.getElementById("atackBtn")


function attack() {

    let playerIni = getIni(parseInt(player.modifiers.dex));
    let enemyIni = getIni(enemy.dexterity);
    let attackValues;

    if (playerIni >= enemyIni) {
        attackValues = player.getAttackValues();
        if (attackValues.attackRoll <= 0) {
            getSpan.innerHTML = `${player.name} go first and miss with 1 (not Nat 1)`;
        } else if (attackValues.attackRoll == 1) {
            getSpan.innerHTML = `${player.name} attack first and rolls nat 1, he miss and take ${enemy.weapon.damage / 2} damage`;
        } else if (attackValues.attackRoll == 20) {
            getSpan.innerHTML = `${player.name} hits a crit! ${enemy.name} takes ${attackValues.dmg *2} damage`;
        } else if (attackValues.attackRoll >= enemy.armor) {
            getSpan.innerHTML = `The ${player.name} strikes first on ${enemy.name} and deals ${attackValues.dmg} damage`;
            enemy.hp -= attackValues.dmg;
        } else {
            getSpan.innerHTML = `The ${player.name} attacks first and missed!`;
        }
        deathCheck(enemy.hp) ? (alert("win"), enemy.hp = 0, printStats()) : (enemy.hp = enemy.hp, printStats());

        //enemy attack
    } else {
        attackValues = enemy.getAttackValues();
        if (attackValues.attackRoll <= 0) {
            getSpan.innerHTML = `${enemy.name}attack miss with 1 (not Nat 1)`;
        } else if (attackValues.attackRoll == 1) {
            getSpan.innerHTML = `${enemy.name} go first but rolls nat 1, he miss and takes ${player.weapon.damage / 2} damage`;
        } else if (attackValues.attackRoll == 20) {
            player.hp -= attackValues.dmg * 2;
            getSpan.innerHTML = `${enemy.name} hits a crit!, ${player.name} takes ${attackValues.dmg *2} damage`;
        } else if (attackValues.attackRoll >= player.armor) {
            getSpan.innerHTML = `The ${enemy.name} strikes first,and deals ${attackValues.dmg} damage to ${player.name}`;
            player.hp -= attackValues.dmg;
        } else {
            getSpan.innerHTML = `The ${enemy.name} attacks first and missed`;
        }
        deathCheck(player.hp) ? (alert("YOU LOSE"), player.hp = 0, printStats()) : (player.hp = player.hp, printStats());
    }
    turn++;
    bonusTime > turn ? cooldowns(guardBtn) : (player.block(false), guardBtn.setAttribute('onclick', 'guard()'), bonusTime = 0, guardBtn.textContent = "Guard");

}

function guard() {
    let guardBtn = document.getElementById("guardBtn");
    player.block(true), guardBtn.setAttribute('onclick', 'buffed(guardBtn)'), bonusTime = turn + 4;
    getSpan.innerHTML = `${player.name} is on guard! his armor gains a bonus`;
    turn++;
    printStats()


}

function printStats() {
    let playerhp = document.getElementById("player-health");
    let enemyhp = document.getElementById("enemy-health");
    let playerArmor = document.getElementById("playerArmor");
    playerhp.innerHTML = "Health: " + player.hp;
    enemyhp.innerHTML = "Health: " + enemy.hp;
    playerArmor.innerHTML = "Armor: " + player.armor;
}

function deathCheck(hp) {
    return hp <= 0;

}
let getIni = function (dex) {
    return ini = Math.floor(Math.random() * 20 + dex + 1);
}

function buffed(el) {
    getSpan.innerHTML = `${player.name} is already buffed`;
    turn == bonusTime
}

function cooldowns(el) {
    el.textContent = `Cooldown(${bonusTime - turn})`
}