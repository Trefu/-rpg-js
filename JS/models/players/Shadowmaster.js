import BaseModel from "./BaseModel.js";

const initialStats = {
    maxHealth: 60,
    health: 60,
    attack: 30,
}

export default class Shadowmaster extends BaseModel {
    constructor() {
        super()
        this.name = "Shadowmaster";
        this.maxHealth = initialStats.maxHealth;
        this.health = initialStats.health;
        this.attack = initialStats.attack;
    }
}