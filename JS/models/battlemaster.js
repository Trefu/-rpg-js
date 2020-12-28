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
        let attackD100 = d100();
        let dmg = Math.round(generateMediaDmgCris(this));
        let AccTotal = this.accuracyChance - objective.dodgeChance;
        let counterD100 = d100();

        console.log(`tirada de D100, ${attackD100} precision del jugador ${AccTotal} chance de counter ${counterD100} counter del enemigo ${enemy.counterChance}`)
        this.energy -= this.maxEnergy * 5 / 100;
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
        if (objective.health <= 0) {
            console.log("rip")
            objective.health = 0

        } else {
            setTimeout(() => {
                if (counterD100 < objective.counterChance) {
                    let counterdmg = Math.round(generateMediaDmgCris(objective));
                    this.health -= counterdmg;
                    battleText.innerHTML += "<br>" + ` ${objective.name} counter the attack dealing ${objective.weapon.type}  ${counterdmg}`
                }

            }, 0);
        }

        setTimeout(() => {
            actStats(enemy);
            actStats(player);
        }, 100);

    }
}


class Battlemaster extends BaseModel {
    constructor(name, classCharacter, weapon) {
        super()
        this.classCharacter = classCharacter;
        this.name = name;
        this.maxHealth = 120;
        this.health = 120;
        this.maxEnergy = 200;
        this.energy = 200;
        this.agi = 20;
        this.luck = 5;
        this.defense = 2;
        this.protection = 20;
        this.dodgeChance = 10;
        this.fumbleChance = 12;
        this.counterChance = 22;
        this.accuracyChance = 100;
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
        console.log("lethablow")
    }
    feintSwing() {
        console.group("feintswing")
    }

}