class Enemy {
    constructor(name) {
        this.name = name;
        this.poisoned = false;
    }
    attack() {
        let dmg = Math.floor(Math.random() * enemy.weapon.damage + 1 + enemy.strength);
        let attackRoll = Math.floor(Math.random() * 20 + 1 + enemy.strength + enemy.weapon.attackBonusWeapon);
        let messageReturn;
        dmg <= 0 ? dmg = 1 : dmg;
        attackRoll <= 0 ? attackRoll = 1 : attackRoll;
        if (attackRoll === 20) {
            messageReturn = `${enemy.name} hits a critical strike! ${player.name} takes ${dmg * 2} damage!`
            player.hp -= dmg * 2;
        } else if (attackRoll >= player.armor) {
            messageReturn = `${enemy.name} strikes on ${player.name} and deals ${dmg} damage!`
            player.hp -= dmg;
        } else {
            messageReturn = `${enemy.name} attack can't impact ${player.name}!`

        }
        let enemyAttackResult = {
            dmg,
            attackRoll,
            messageReturn
        }
        return enemyAttackResult
    }
    pickAction() {
        this.enemyAttack();
    }
}

class Goblin extends Enemy {
    constructor(name) {
        super(name)
        this.maxHp = 12;
        this.hp = 12;
        this.armor = 14;
        this.strength = -1;
        this.dexterity = 0;
        this.intelligence = -2;
        this.weapon = {
            name: "Goblin Sword",
            damage: 4,
            attackBonusWeapon: 2
        }
    }

}


class Violet_Fungus extends Enemy {
    constructor(name) {
        super(name)
        this.maxHp = 35;
        this.hp = 35;
        this.armor = 5;
        this.strength = -4;
        this.dexterity = -4;
        this.intelligence = -2;
        this.weapon = {
            name: "Spores",
            damage: 4,
            attackBonusWeapon: 4
        }
    }

}

class Wolf extends Enemy {
    constructor(name) {
        super(name)
        this.maxHp = 18;
        this.hp = 18;
        this.armor = 13;
        this.strength = +1;
        this.dexterity = +2;
        this.intelligence = -4;
        this.weapon = {
            name: "Bite",
            damage: 4,
            attackBonusWeapon: 3
        }
    }

}



class Gnoll extends Enemy {
    constructor(name) {
        super(name)
        this.maxHp = 26;
        this.hp = 26;
        this.armor = 15;
        this.strength = +2;
        this.dexterity = +1;
        this.intelligence = -3;
        this.weapon = {
            name: "Sword",
            damage: 8,
            attackBonusWeapon: 3
        }
    }
}
//, 22, 12, +1, +2, -2, 0, 0, 0, claws);
class Ghoul extends Enemy {
    constructor(name) {
        super(name)
        this.maxHp = 34;
        this.hp = 34;
        this.armor = 14;
        this.strength = +1;
        this.dexterity = +1;
        this.intelligence = -2;
        this.weapon = {
            name: "Claws",
            damage: 6,
            attackBonusWeapon: 4
        }
    }
}