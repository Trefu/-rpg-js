'use stric'
let player;

function Player(classType, hp, armor, strength, dexterity, intelligence, weapon) {
    this.classType = classType
    this.hp = hp
    this.armor = armor
    this.strength = strength
    this.dexterity = dexterity
    this.intelligence = intelligence
    this.weapon = weapon
}

let PlayerMoves = {
    meeleAttack: function () {
        //funcion para calcular la iniciativa
        let getIni = function (dex) {
            return ini = Math.floor(Math.random() * 20 + dex + 1);
        }
        //funcion para calcular el daño
        let weaponDmg = function () {
            return weaponDmg = Math.floor(Math.random() * player.weapon.damage + 1);
        }
        let getAttackScore = function (strength) {
            return getAttackScore = Math.floor(Math.random() * 20 + 1 + strength);
        }
        //iniciativa
        playerIni = getIni(player.dexterity);
        enemyIni = getIni(enemy.dexterity);
        //hps
        let playerhp = document.getElementById("player-health");
        let enemyhp = document.getElementById("enemy-health");

        if (playerIni >= enemyIni) {
            console.log("player first")
            let playerAttackScore = getAttackScore(player.strength)
            if (playerAttackScore >= enemy.armor) {
                let damageDeal = weaponDmg(player.weapon.damage)
                enemy.hp = enemy.hp - damageDeal;
                alert("You hit first with " + playerIni + " On your initiative vs " + enemyIni + " and hit him with " + playerAttackScore + " Dealing " + damageDeal + " damage!")
                console.log("impacto con " + playerAttackScore + " daño causado " + damageDeal)
                playerhp.innerHTML = "Health : " + player.hp;
                enemyhp.innerHTML = "Health : " + enemy.hp;
                if (enemy.hp <= 0) {
                    alert("You won!")
                    console.log("You won!")
                    playerhp.innerHTML = "Health : " + player.hp;
                    enemyhp.innerHTML = "Health : 0";
                }
            } else {
                console.log("miss con " + playerAttackScore)
                alert("You attack first but miss with " + playerAttackScore)
            }

        } else {
            console.log("enemy attacks first")
            let enemyAttackScore = getAttackScore(enemy.strength);
            if (enemyAttackScore > player.armor) {
                let enemyDamageDeal = weaponDmg(enemy.weapon.damage)
                player.hp = player.hp - enemyDamageDeal
                alert("Enemy hits you first with " + enemyIni + " On they initiative vs yours " + playerIni + " and hit you with  " + enemyAttackScore + " Dealing " + enemyDamageDeal + " damage!")
                console.log("enemigo impacto con " + enemyAttackScore + " daño recibido " + weaponDmg)
                playerhp.innerHTML = "Health : " + player.hp;
                enemyhp.innerHTML = "Health : " + enemy.hp;
            } else {
                console.log("enemy miss con " + enemyAttackScore)
                alert("Enemy attacks you first but miss with " + enemyAttackScore)
            }
            if (player.hp <= 0) {
                console.log("You lose!")
                playerhp.innerHTML = "Health : " + enemy.hp;
                enemyhp.innerHTML = "Health : 0";
            }

        }
    }


}