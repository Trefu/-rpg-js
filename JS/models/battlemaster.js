class Battlemaster {
    constructor(name, classCharacter) {
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
        this.weapon = sword;
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

    attack(objective) {
        let attackD100 = d100() - 90;
        let dmg = generateMediaDmgCris(this.weapon.dmg);
        let AccTotal = this.accuracyChance - objective.dodgeChance;
        console.log(`tirada de D100, ${attackD100} precision del jugador ${AccTotal}`)
        this.energy -= this.maxEnergy * 5 / 100;
        if (this.critical >= attackD100) {
            enemy.health -= dmg * 2;
            battleText.innerText += `
            Critical, ${dmg * 2} damage`
        } else if (AccTotal >= attackD100) {
            battleText.innerText += `
            Impact with ${dmg} damage`
            enemy.health -= dmg;
        } else {
            battleText.innerText += `
            Miss`
        }
        actStats(enemy);
        actStats(player);


    }
    lethalblow() {
        console.log("lethablow")
    }
    feintSwing() {
        console.group("feintswing")
    }

}

let sword = {
    name: "Sword",
    dmg: 22,
    fumbleChance: 5,

}