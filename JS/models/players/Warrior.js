import BaseModel from "./BaseModel";

class Battlemaster extends BaseModel {
    constructor(name, classCharacter, weapon) {
        super()
        this.name = name;
        this.maxHealth = 80;
        this.health = 80;
        this.attack = 10
    }
    lethalblow() {
        let cost = this.maxEnergy * 24 / 100;
        if (cost > this.energy) {
            battleTextAdd(`no enough energy`);
        } else {
            $(playerCombatsBtns).hide();
            let attackD100 = d100();
            let counterD100 = d100() - 10;
            let bonusDmg = restantLife(enemy);
            let dmg = generateWeaponDmg(this.weapon) + bonusDmg;
            let AccTotal = this.accuracyChance - enemy.dodgeChance;
            this.energy -= cost;
            if (this.critical >= attackD100) {
                let critDmg = dmg * 2;
                enemy.health -= critDmg
                battleTextAdd(`${player.name} hits a vital spot!, deals ${critDmg} ${this.weapon.type} damage`, "critical")
            } else if (AccTotal >= attackD100) {
                battleTextAdd(`${player.name} try to finish ${enemy.name}, deals ${dmg} ${this.weapon.type} damage`)
                enemy.health -= dmg;
            } else {
                battleTextAdd(`${enemy.name} has dodge the attack!`, "dodge")
            }
            actStats(enemy);
            actStats(player);
            //Chequea si murio, de ser cierto no hay contraataque y actualiza las interfaces 🦴
            if (enemy.health <= 0) {
                console.log("rip enemigo")
                enemy.health = 0
                actStats(enemy);
                actStats(player);
            } else {
                //solo se ejecuta si el enemigo sigue vivo 💅
                setTimeout(() => {
                    if (counterD100 < enemy.counterChance) {
                        counterAttack(enemy, this)
                    }
                    passTurn(enemy)
                }, 1000);
            }
        }
    }
    feintSwing(objective) {
        $(playerCombatsBtns).hide();
        let attackD100 = d100();
        let counterD100 = d100()
        let feintDmg = {
            dmg: Math.round(this.weapon.dmg.map((a) => a *= 0.5))
        }
        let dmg = Math.round(generateWeaponDmg(feintDmg));
        let AccTotal = (this.accuracyChance - objective.dodgeChance) + 10;
        let energyRecover = this.maxEnergy * 14 / 100;
        this.energy += energyRecover;
        battleTextAdd(`${player.name} recover ${energyRecover} points of energy`, "heal")
        if (AccTotal >= attackD100) {
            battleTextAdd(`Feint and impact with ${dmg} ${this.weapon.type} damage`)
            enemy.health -= dmg
        } else {
            battleTextAdd(`${objective.name} has dodge the attack!`, "dodge")
        }
        actStats(enemy);
        actStats(player);
        if (objective.health <= 0) {
            console.log("rip enemigo")
            objective.health = 0
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

export const battlemaster = Battlemaster