class Enemy {
    constructor(name) {
        this.name = name
    }
    attack() {
        let dmg = Math.floor(Math.random() * enemy.weapon.damage + 1 + enemy.strength);
        let attackRoll = Math.floor(Math.random() * 20 + 1 + enemy.strength + enemy.weapon.attackBonusWeapon);
        let messageReturn;
        dmg <= 0 ? dmg = 1 : dmg;
        attackRoll <= 0 ? attackRoll = 1 : attackRoll;
        if (attackRoll >= player.armor) {
            messageReturn = `${enemy.name} strikes on ${player.name} and deals ${dmg} damage!`
            player.hp -= dmg;
        } else {
            messageReturn = `${enemy.name} attacks first but miss`

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
        this.hp = 6;
        this.armor = 14;
        this.strength = -1;
        this.dexterity = 0;
        this.intelligence = -2;
        this.weapon = {
            name: "Goblin Sword",
            damage: 4,
            attackBonusWeapon: 4
        }
    }

}


class Violet_Fungus extends Enemy {
    constructor(name) {
        super(name)
        this.hp = 30;
        this.armor = 5;
        this.strength = -4;
        this.dexterity = -4;
        this.intelligence = -2;
        this.weapon = {
            name: "Spores",
            damage: 4,
            attackBonusWeapon: 8
        }
    }

}

class Wolf extends Enemy {
    constructor(name) {
        super(name)
        this.hp = 11;
        this.armor = 13;
        this.strength = +1;
        this.dexterity = +2;
        this.intelligence = -4;
        this.weapon = {
            name: "Bite",
            damage: 4,
            attackBonusWeapon: 4
        }
    }

}



class Gnoll extends Enemy {
    constructor(name) {
        super(name)
        this.hp = 22;
        this.armor = 15;
        this.strength = +2;
        this.dexterity = +1;
        this.intelligence = -3;
        this.weapon = {
            name: "Sword",
            damage: 8,
            attackBonusWeapon: 4
        }
    }
}
//, 22, 12, +1, +2, -2, 0, 0, 0, claws);
class Ghoul extends Enemy {
    constructor(name) {
        super(name)
        this.hp = 28;
        this.armor = 14;
        this.strength = +1;
        this.dexterity = +1;
        this.intelligence = -2;
        this.weapon = {
            name: "Claws",
            damage: 6,
            attackBonusWeapon: 6
        }
    }
}