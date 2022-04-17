export default class BaseModel {
    constructor() {
        this.name = "";
        this.maxHealth = 0;
        this.health = 0;
        this.attack = 0;
        //this.avatarFolder = ;
    }
    attack() {
        console.log('attack')
    }
    toJson() {
        return {
            name: this.name,
            maxHealth: this.maxHealth,
            health: this.health,
            attack: this.attack
        }
    }
}
