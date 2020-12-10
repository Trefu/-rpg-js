class Battlemaster {
    constructor(name, classCharacter) {
        this.classCharacter = classCharacter;
        this.name = name;
        this.maxHealth = 120;
        this.health = 120;
        this.speed = 20;
        this.luck = 10;
        this.defense = 2;
        this.blockChance = 20;
        this.blockPower = 40;
        this.dodgeChance = 10;
        this.fumbleChance = 12;
        this.counterChance = 22;
        this.accuracyChance = 100;
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
        let attackCheck = Math.floor(Math.random() * 100 + 1)
        let accuracy = this.accuracyChance - objective.dodgeChance
        let dmg = this.weapon.dmg;
        attackCheck <= accuracy ?
            console.log(`impacta con ${attackCheck} `) :
            console.log(`falla con ${attackCheck}, daño ${dmg} , punteria ${accuracy} `)

    }

}

let sword = {
    name: "Sword",
    dmg: 22,
    fumbleChance: 5
}