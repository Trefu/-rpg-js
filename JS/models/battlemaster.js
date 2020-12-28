class BaseModel {
    constructor(name, classCharacter) {
        this.classCharacter = classCharacter;
        this.name = name;
        this.maxHealth = 0;
        this.health = 0;
        this.maxEnergy = 0;
        this.energy = 0;
        this.agi = 0;
        this.luck = 0;
        this.defense = 0;
        this.protection = 0;
        this.dodgeChance = 0;
        this.fumbleChance = 0;
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
        $(playerCombatsBtns).hide();
        let attackD100 = d100();
        let dmg = Math.round(generateMediaDmgCris(this));
        let AccTotal = this.accuracyChance - objective.dodgeChance;
        let counterD100 = d100();
        this.energy -= this.maxEnergy * 10 / 100;

        if (this.critical >= attackD100) {
            enemy.health -= dmg * 2;
            battleText.innerText += `
            Critical, ${dmg * 2} ${this.weapon.type} damage`
        } else if (AccTotal >= attackD100) {
            battleText.innerText += `
            Impact with ${dmg} ${this.weapon.type} damage`
            enemy.health -= dmg;
        } else {
            battleText.innerText += `
            ${objective.name} has dodge the attack!`
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

            }, 1000);
            setTimeout(() => {
                battleText.innerText = `Enemy turn`
                setTimeout(() => {
                    enemy.turn()
                }, 1000);
            }, 5000);
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
        this.dodgeChance = 20;
        this.fumbleChance = 5;
        this.counterChance = 15;
        this.accuracyChance = 95;
        this.critical = 15;
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
        console.log("lethablow")
    }
    feintSwing() {
        console.group("feintswing")
    }

}