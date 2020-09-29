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
        let weaponDmg = function (equipedWeapon) {
            return damage = Math.floor(Math.random() * equipedWeapon + 1);
        }
        let getAttackResults = function (attacker, defender) {
            let attackResult = Math.floor(Math.random() * 20 + attacker.strength + 3);
            let damageDeal;
            if (attackResult <= 0) {
                alert(`${attacker.classType} miss with 1`)
                return getAttackResults;
            } else if (attackResult == 1) {
                damageDeal = weaponDmg(defender.weapon.damage);
                attacker.hp -= damageDeal
                playerhp.innerHTML = "Health: " + player.hp;
                enemyhp.innerHTML = "Health: " + enemy.hp;
                alert(`The ${attacker.classType} miss with Nat 1 and get hit by ${defender.classType}!. ${attacker.classType} takes ${damageDeal} damages`)
                return getAttackResults;
            } else if (attackResult == 20) {
                damageDeal = weaponDmg(attacker.weapon.damage) * 2;
                defender.hp = defender.hp - damageDeal;
                playerhp.innerHTML = "Health: " + player.hp;
                enemyhp.innerHTML = "Health: " + enemy.hp;
                alert(`Critical!,the ${attacker.classType} made ${damageDeal} to ${defender.classType}`)
                return getAttackResults;
            } else if (attackResult >= defender.armor) {
                damageDeal = weaponDmg(attacker.weapon.damage);
                defender.hp = defender.hp - damageDeal
                playerhp.innerHTML = "Health: " + player.hp;
                enemyhp.innerHTML = "Health: " + enemy.hp;
                alert(`The ${attacker.classType} hit with ${attackResult} damage ${damageDeal}`)
            } else if (attacker.hp <= 0 && attacker == player) {
                alert("You lose! Refresh to play again")
                return getAttackResults
            } else if (attacker.hp <= 0 && attacker == enemy) {
                alert("You win! Refresh to play again")
                return getAttackResults
            } else {
                alert(`The ${attacker.classType} miss their attack ${attackResult}`);
                return getAttackResults;
            }
        }
        //iniciativa
        playerIni = getIni(player.dexterity);
        enemyIni = getIni(enemy.dexterity);
        //hps
        let playerhp = document.getElementById("player-health");
        let enemyhp = document.getElementById("enemy-health");
        if (playerIni >= enemyIni) {
            alert("Player attacks first " + playerIni)
            getAttackResults(player, enemy);
            alert("Enemy counterattack")
            getAttackResults(enemy, player)

        } else {
            alert("Enemy attacks first " + enemyIni)
            getAttackResults(enemy, player)
            alert("Player counterattack")
            getAttackResults(player, enemy)
        }

    }

}