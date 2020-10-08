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
        getHeader.innerHTML = "<h1>Fight!</h1>";
        getInterface.remove();
        document.getElementById("battle").style.display = "inline";
        getPlayerBattleInterface.innerHTML = `                
                <img src="imgs/avatars/${player.name}.png" class="avatars">
                <div class="description">
                <h3>${player.name}</h3>
                <p id="player-health">Health: ${player.hp}</p>
                <p>Armor: ${player.armor}</p>
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
        let enemy01 = new Enemy("Goblin", 7, 15, -1, 2, 0, shortSword);
        let enemy02 = new Enemy("Violet Fungus", 18, 5, -4, -4, -5, spores);
        let enemy03 = new Enemy("Wolf", 11, 13, +1, +2, -4, bite);
        let enemy04 = new Enemy("Gnoll", 22, 15, +2, +1, -2, shortSword);
        let enemy05 = new Enemy("Ghoul", 22, 12, +1, +2, -2, claws);
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
                <p>Strength: ${enemy.strength}(${enemy.modifiers.str})</p>
                <p>Dexterity: ${enemy.dexterity}(${enemy.modifiers.dex})</p>
                <p>Constitution: ${enemy.constitution}(${enemy.modifiers.const})</p>
                <p>Intelligence: ${enemy.intelligence}(${enemy.modifiers.int})</p>
                <p>Wisdom: ${enemy.wisdom}(${enemy.modifiers.wis})</p>
                <p>Charisma: ${enemy.charisma}(${enemy.modifiers.cha})</p>
                <p>Weapon: ${enemy.weapon.name}(${enemy.modifiers.str}) </p>
                <p>Damage : 1d${enemy.weapon.damage}(${enemy.modifiers.str})</p>
                </div>
                `
        // Botones de acciones
        document.getElementById("actions").innerHTML = `<a href="#" class="btn" onclick="attack()">Attack!</a>`;
    }
};

function attack() {
    /**
     * gives a number between 1 and 20 simulating a dice roll and sums
     * @param {number} dex of the character passed in the argument.
     */
    let getIni = function (character) {
        return ini = Math.floor(Math.random() * 20 + parseInt(character.modifiers.dex) + 1);
    }
    let playerIni = getIni(player);
    let enemyIni = getIni(enemy);

    if (playerIni >= enemyIni) {
        console.log("player first")
        let attackValues = player.getAttackValues();
        if (attackValues.attackRoll <= 0) {
            console("1 no nat")
        } else if (attackValues.attackRoll == 1) {
            console.log("nat 1")
        } else if (attackValues.attackRoll == 20) {
            console.log("nat 20")
        } else if (attackValues.attackRoll >= enemy.armor) {
            console.log("impact")
            enemy.hp -= attackValues.dmg;
            console.log("damage " + attackValues.dmg + " left hp " + enemy.hp)
        } else {
            console.log("miss")
        }

    }


}

function currentHp() {
    let playerhp = document.getElementById("player-health");
    let enemyhp = document.getElementById("enemy-health");
    playerhp.innerHTML = "Health: " + player.hp;
    enemyhp.innerHTML = "Health: " + enemy.hp;
}


// define quien ataca primero