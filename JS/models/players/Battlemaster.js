import BaseModel from "./BaseModel.js";

export default class Battlemaster extends BaseModel {
    constructor() {
        super()
        this.name = "Battlemaster";
        this.maxHealth = 80;
        this.health = 80;
        this.attack = 20
    }
    lethalblow() {
        return console.log('lethal');
    }
    feintSwing() {
        return console.log('feint')
    }
}
