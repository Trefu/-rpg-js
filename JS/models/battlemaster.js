class BaseModel {
    constructor(name, classCharacter) {
        this.classCharacter = classCharacter;
        this.name = name;
        this.maxHealth = 0;
        this.health = 0;
        this.maxEnergy = 0;
        this.energy = 0;
        this.agi = 3;
        this.luck = 0;
        this.defense = 0;
        this.protection = 0;
        this.dodgeChance = 0;
        this.counterChance = 0;
        this.accuracyChance = 0;
        this.critical = 0;
        this.weapon = null;
        this.status = {
            inspired: false,
            cold: false,
            bleeding: false,
            poisoned: false,
            bleeding: false,
            scared: false
        }
    }
    attack(objective) {
        let cost = this.maxEnergy * 8 / 100;
        $(playerCombatsBtns).hide();
        let attackD100 = d100();
        let counterD100 = d100()
        let dmg = generateWeaponDmg(this)
        let AccTotal = this.accuracyChance - objective.dodgeChance;
        console.log(`ataque ${attackD100}
        counter ${counterD100}`)
        this.energy -= cost;

        if (this.critical >= attackD100) {
            let critDmg = dmg * 2;
            enemy.health -= critDmg
            battleTextAdd(`Critical, ${critDmg} ${this.weapon.type} damage`, "critical")
        } else if (AccTotal >= attackD100) {
            battleTextAdd(`Impact with ${dmg} ${this.weapon.type} damage`)
            enemy.health -= dmg
        } else {
            battleTextAdd(`${objective.name} has dodge the attack!`, "dodge")
        }
        actStats(enemy);
        actStats(player);
        //Chequea si murio, de ser cierto no hay contraataque y actualiza las interfaces 🦴
        if (objective.health <= 0) {
            console.log("rip enemigo")
            objective.health = 0
            actStats(enemy);
            actStats(player);
            //solo se ejecuta si el enemigo sigue vivo 💅
        } else {
            setTimeout(() => {
                if (counterD100 < objective.counterChance) {
                    counterAttack(objective, this)
                }
                passTurn(enemy)
            }, 1000);
        }

    }
}


class Battlemaster extends BaseModel {
    constructor(name, classCharacter, weapon) {
        super()
        this.classCharacter = classCharacter;
        this.name = name;
        this.maxHealth = 80;
        this.health = 80;
        this.maxEnergy = 100;
        this.energy = 100;
        this.agi = 20;
        this.luck = 5;
        this.defense = 2;
        this.protection = 20;
        this.dodgeChance = 10;
        this.counterChance = 10;
        this.accuracyChance = 95;
        this.critical = 10;
        this.weapon = weapon;
        this.status = {
            inspired: false,
            cold: false,
            bleeding: false,
            poisoned: false,
            bleeding: false,
            scared: false
        }
        this.healthBar = document.getElementById("playerHealth");
        this.energyBar = document.getElementById("energyBar");
    }
    lethalblow() {
        let cost = this.maxEnergy * 24 / 100;
        if (cost > this.energy) {
            battleTextAdd(`no enough energy`);
        } else {
            $(playerCombatsBtns).hide();
            let attackD100 = d100();
            let counterD100 = d100() - 10;
            let bonusDmg = restantLife(enemy);
            let dmg = generateWeaponDmg(this) + bonusDmg;
            let AccTotal = this.accuracyChance - enemy.dodgeChance;
            this.energy -= cost;
            if (this.critical >= attackD100) {
                let critDmg = dmg * 2;
                enemy.health -= critDmg
                battleTextAdd(`${player.name} hits a vital spot!, deals ${critDmg} ${this.weapon.type} damage`, "critical")
            } else if (AccTotal >= attackD100) {
                battleTextAdd(`${player.name} try to finish ${enemy.name}, deals ${dmg} ${this.weapon.type} damage`)
                enemy.health -= dmg;
            } else {
                battleTextAdd(`${enemy.name} has dodge the attack!`, "dodge")
            }
            actStats(enemy);
            actStats(player);
            //Chequea si murio, de ser cierto no hay contraataque y actualiza las interfaces 🦴
            if (enemy.health <= 0) {
                console.log("rip enemigo")
                enemy.health = 0
                actStats(enemy);
                actStats(player);
            } else {
                //solo se ejecuta si el enemigo sigue vivo 💅
                setTimeout(() => {
                    if (counterD100 < enemy.counterChance) {
                        counterAttack(enemy, this)
                    }
                    passTurn(enemy)
                }, 1000);
            }
        }
    }
    feintSwing() {
        console.group("feintswing")
    }

}