class Enemy {
    constructor(name) {
        this.name = name;
        this.maxHealth = 0;
        this.health = 0;
        this.speed = 0;
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

    }


}

class Ice_Troll extends Enemy {
    constructor(name) {
        super(name)
        this.maxHealth = 200;
        this.health = 200;
        this.speed = 5;
        this.defense = 2;
        this.dodgeChance = 5;
        this.fumbleChance = 15;
        this.counterChance = 5;
        this.accuracyChance = 80;
        this.protection = 5;
    }
    alo() {
        console.log("asd")
    }

}




sword = {
    name: "Sword",
    dmg: 22,
    fumbleChance: 5
}