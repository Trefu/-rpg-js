class Battlemaster {
    constructor(name, classCharacter) {
        this.classCharacter = classCharacter;
        this.name = name;
        this.maxHealth = 120;
        this.health = 120;
        this.speed = 20;
        this.strength = 10;
        this.defense = 20;
        this.fumbleChance = 12;
        this.counterAttackChance = 22;
        this.status = "Fine"

    }

    attack(objective) {
        let extraDmg = Math.floor(Math.random() * 10 + 1);
        let dmg = Math.round(this.ataque + extraDmg - (objective.defensa / 2));
        objective.vida -= dmg;
        printHealth();
        document.getElementById("messagesCombat").innerHTML = `${objective.nombre} takes ${dmg} damages!.`;
    }
}