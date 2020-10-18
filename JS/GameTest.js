var player = null;
var enemy = null;
var gameOver = false;



let Manager = {

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
                <p>Damage : 1d${player.weapon.damage} (${player.modifiers.str})</p>
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
        // Botones de acciones
        player.name == "Fighter" ? document.getElementById("actions").innerHTML = `<a id="attackBtn" href="#" class="btn" onclick="playerTurn('attack')">Attack!</a>
        <a id="guardBtn" href="#" class="btn" onclick="playerTurn('guard')">Guard</a>` :
            document.getElementById("actions").innerHTML = `<a id="attackBtn" href="#" class="btn" onclick="playerTurn('attack')">Attack!</a>`;


    }
};
//controla los turnos y los turnos de bonus
var turn = 1;
let bonusTime = -1;
let getSpan = document.getElementById("messages");
let enemyTimer;

function playerTurn(choise) {
    switch (choise) {
        case "attack":
            attack();
            break;
        case "guard":
            guard();
            break;
    }
    let attackBtn = document.getElementById("attackBtn");
    let guardBtn = document.getElementById("guardBtn");
    attackBtn.setAttribute('onclick', '')
    guardBtn.setAttribute('onclick', '')
    guardBtn.innerText = ("")
    attackBtn.innerText = ("")
    deathCheck(enemy.hp) ? (alert("you win"), enemy.hp = 0, clearTimeout(enemyTurn)) : enemy.hp;
    printStats();
    setTimeout(() => {
        getSpan.innerHTML = `${enemy.name} is about to attack!`
        enemyTimer = setTimeout(() => {
            enemyTurn();
        }, 2000);
    }, 3000);

}

function attack() {
    let attackValues;
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
}

function guard() {
    if (bonusTime === -1) {
        player.block(true), bonusTime = turn + 2;
        getSpan.innerHTML = `${player.name} is on guard! his armor gains a bonus of +2`;
    } else if (bonusTime > turn) {
        getSpan.innerHTML = `${player.name} is already buffed, Guard avaible in (${bonusTime - turn}) turns.`;
    }

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


function enemyTurn() {
    let enemyReturns;
    deathCheck(enemy.hp);
    if (player.name === "Fighter" && bonusTime === turn) {
        player.block(false);
        guardBtn.setAttribute('onclick', 'playerTurn("guard")');
        guardBtn.textContent = "Guard";
        bonusTime = -1;
    }
    enemyReturns = enemy.attack();
    getSpan.innerHTML = enemyReturns.messageReturn;
    attackBtn.setAttribute('onclick', 'playerTurn("attack")')
    attackBtn.innerText = ("Attack")
    printStats();
    deathCheck(player.hp) ? alert("acasa pete") : player.hp;

    turn++;

}