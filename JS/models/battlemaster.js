class Battlemaster {
    constructor(name, classCharacter) {
        this.classCharacter = classCharacter;
        this.name = name;
        this.vida = 120;
        this.velocidad = 20;
        this.ataque = 10;
        this.defensa = 20;
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