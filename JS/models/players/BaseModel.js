export default class BaseModel {
    constructor() {
        this.name = "";
        this.maxHealth = 0;
        this.health = 0;
        this.attack = 0;
    }
    attack() {
        console.log('attack')
    }
}
