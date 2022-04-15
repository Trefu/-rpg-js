import BaseModel from "./BaseModel.js";

export default class Shadowmaster extends BaseModel {
    constructor() {
        super()
        this.name = "Shadowmaster";
        this.maxHealth = 80;
        this.health = 80;
        this.attack = 20
    }
}