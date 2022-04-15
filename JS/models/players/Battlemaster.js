import BaseModel from "./BaseModel.js";

export const initialStats = {
    maxHealth: 80,
    health: 80,
    attack: 20,
}

export default class Battlemaster extends BaseModel {
    constructor() {
        super()
        this.name = "Battlemaster";
        this.maxHealth = initialStats.maxHealth;
        this.health = initialStats.health;
        this.attack = initialStats.attack
    }
    lethalblow() {
        return console.log('lethal');
    }
    feintSwing() {
        return console.log('feint')
    }
}
