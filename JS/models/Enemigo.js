class Enemy {
    constructor(name) {
        this.name = name;
        this.maxHealth = 120;
        this.health = 120;
        this.speed = 20;
        this.strength = 10;
        this.defense = 2;
        this.dodgeChance = 10;
        this.fumbleChance = 12;
        this.counterChance = 22;
        this.accuracyChance = 100;
        this.status = {
                inspired: false,
                cold: false,
                bleeding: false,
                poisoned: false,
                bleeding: false,
                scared: false
            },
            this.weapon = sword

    }

    attack(objective, weapon) {
        let attackCheck = Math.floor(Math.random() * 100 + 1)
        let accuracy = this.accuracyChance - objective.dodgeChance
        let dmg = weapon.dmg;
        attackCheck <= this.accuracyChance

    }
}

sword = {
    name: "Sword",
    dmg: 22,
    fumbleChance: 5
}