export default class BaseModel {
    constructor(name, classCharacter) {
        this.classCharacter = classCharacter;
        this.name = name;
        this.maxHealth = 0;
        this.health = 0;
        this.maxEnergy = 0;
        this.energy = 0;
        this.luck = 0;
        this.dodgeChance = 0;
        this.counterChance = 0;
        this.accuracyChance = 0;
        this.critical = 0;
        this.lore = "";
        this.weapon = null;
        this.status = {
            inspired: false,
            cold: false,
            bleeding: false,
            poisoned: false,
            bleeding: false,
            scared: false
        }
    }
    attack(objective) {
        let cost = this.maxEnergy * 8 / 100;
        let attackD100 = d100();
        let counterD100 = d100()
        let dmg = generateWeaponDmg(this.weapon)
        let AccTotal = this.accuracyChance - objective.dodgeChance;
        this.energy -= cost;

        if (this.critical >= attackD100) {
            ctStats(enemy);
            actStats(player);
            //Chequea si murio, de ser cierto no hay contraataque y actualiza las interfaces 🦴
            if (objective.health <= 0) {
                console.log("rip enemigo")
                let critDmg = dmg * 2;
                enemy.health -= critDmg
                battleTextAdd(`Critical, ${critDmg} ${this.weapon.type} damage`, "critical")
            } else if (AccTotal >= attackD100) {
                battleTextAdd(`Impact with ${dmg} ${this.weapon.type} damage`)
                enemy.health -= dmg
            } else {
                battleTextAdd(`${objective.name} has dodge the attack!`, "dodge")
            }
            ajective.health = 0
            actStats(enemy);
            actStats(player);
            //solo se ejecuta si el enemigo sigue vivo 💅
        } else {
            setTimeout(() => {
                if (counterD100 < objective.counterChance) {
                    counterAttack(objective, this)
                }
                passTurn(enemy)
            }, 1000);
        }
    }
}
