import BaseModel from "./BaseModel.js";

export default class Spellmaster extends BaseModel {
    constructor() {
        super()
        this.name = "Spellmaster";
        this.maxHealth = 80;
        this.health = 80;
        this.attack = 10
    }
}