class Enemy {
    constructor(name) {
        this.name = name;
        this.maxHealth = 0;
        this.health = 0;
        this.agi = 0;
        this.defense = 0;
        this.dodgeChance = 0;
        this.fumbleChance = 0;
        this.counterChance = 0;
        this.accuracyChance = 0;
        this.protection = 0;
        this.status = {
            inspired: false,
            cold: false,
            bleeding: false,
            poisoned: false,
            bleeding: false,
            scared: false
        }
        this.healthBar = document.getElementById("enemyHealth");
        this.energyBar = document.getElementById("enemyEnergyBar");
    }
}

class Ice_Troll extends Enemy {
    constructor(name) {
        super(name)
        this.maxHealth = 200;
        this.health = 200;
        this.maxEnergy = 300;
        this.energy = 300;
        this.agi = 5;
        this.defense = 2;
        this.dodgeChance = 5;
        this.fumbleChance = 15;
        this.counterChance = 50;
        this.accuracyChance = 80;
        this.protection = 5;
        this.weapon = claws;
        this.avatar = "imgs/enemy/claws of winter/ice troll.png";
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
            battleText.innerText += "<br>" + `Critical, ${dmg * 2} ${this.weapon.type} damage`
        } else if (AccTotal >= attackD100) {
            battleText.innerText += "<br>" + `Impact with ${dmg} ${this.weapon.type} damage`
            enemy.health -= dmg;
        } else {
            battleText.innerText += "<br>" + `${objective.name} has dodge the attack!`
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