class Player {
    constructor(name, hp, armor, weapon) {
        this.name = name
        this.hp = hp;
        this.armor = armor;
        this.weapon = weapon;
        this.modifiers = {
            'str': "",
            'dex': '',
            'const': '',
            'int': '',
            'wis': '',
            'cha': ''
        }
    }
    getAttackValues() {
        let dmg = Math.floor(Math.random() * this.weapon.damage + 1);
        let attackRoll = Math.floor(Math.random() * 20 + 1 + parseInt(this.modifiers.str));
        let attackValues = {
            dmg: dmg,
            attackRoll: attackRoll
        }
        return attackValues
    }

}