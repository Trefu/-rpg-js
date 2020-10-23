class Player {
    constructor(name) {
        this.name = name
    }
    getAttackValues() {
        let dmg = Math.floor(Math.random() * this.weapon.damage + parseInt(this.modifiers.str) + 1);
        let attackRoll = Math.floor(Math.random() * 20 + 1 + parseInt(this.modifiers.str) + player.weapon.attackBonusWeapon);
        let attackValues = {
            dmg,
            attackRoll
        }
        return attackValues
    }

}