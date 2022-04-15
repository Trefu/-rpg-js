import BaseModel from "./BaseModel.js";

export default class Spellmaster extends BaseModel {
    constructor(name, classCharacter) {
        super()
        this.name = name;
        this.maxHealth = 80;
        this.health = 80;
        this.attack = 10
    }
}