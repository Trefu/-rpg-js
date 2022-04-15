import BaseModel from "./BaseModel.js";

const initialStats = {
    maxHealth: 40,
    health: 40,
    attack: 40,
}

export default class Spellmaster extends BaseModel {
    constructor() {
        super()
        this.name = "Spellmaster";
        this.maxHealth = initialStats.maxHealth;
        this.health = initialStats.health;
        this.attack = initialStats.attack;
    }
}