class Player {
    constructor(name) {
        this.name = name
    }
    getAttackValues() {
        let dmg = Math.floor(Math.random() * this.weapon.damage + parseInt(this.modifiers.str) + 1);
        let attackRoll = Math.floor(Math.random() * 20 + 3 + parseInt(this.modifiers.str));
        let attackValues = {
            dmg,
            attackRoll
        }
        return attackValues
    }

}