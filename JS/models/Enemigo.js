class Enemy {
    constructor(name) {
        this.name = name;
        this.maxHealth = 0;
        this.health = 0;
        this.agi = 0;
        this.defense = 0;
        this.dodgeChance = 0;
        this.counterChance = 0;
        this.accuracyChance = 0;
        this.protection = 0;
        this.critical = 0;
        this.status = {
            inspired: false,
            cold: false,
            bleeding: false,
            poisoned: false,
            bleeding: false,
            scared: false
        }
        this.healthBar = document.getElementById("enemyHealth");
        this.energyBar = document.getElementById("enemyEnergyBar");
    }
    turn() {
        let ran = Math.floor(Math.random() * 3 + 1);
        battleText.innerHTML += ("<h4>Enemy Turn</h4>");
        if (this.energy <= 0) {
            battleTextAdd(`${enemy.name} is exhaust!`)
            this.energy += this.maxEnergy * 40 / 100;
            actStats(enemy)
            setTimeout(() => {
                battleText.innerHTML += (`<h4>${player.name} Turn</h4>`);
                $(playerCombatsBtns).show();
            }, 4000);
        } else {
            switch (ran) {
                case 1:
                    this.act1();
                    break;
                case 2:
                    this.act2();
                    break;
                case 3:
                    this.act3()
                    break;

            }
        }
    }

}

class Ice_Troll extends Enemy {
    constructor(name) {
        super(name)
        this.maxHealth = 140;
        this.health = 140;
        this.maxEnergy = 160;
        this.energy = 160;
        this.dodgeChance = 5;
        this.counterChance = 5;
        this.accuracyChance = 70;
        this.critical = 8;
        this.weapon = claws;
        this.raged = false;
        this.avatar = "imgs/enemy/claws of winter/ice troll.png";
    }
    turn() {
        let ran = Math.floor(Math.random() * 3 + 1);

        if (this.energy <= 0) {
            battleTextAdd(`${enemy.name} is exhaust!`)
            this.energy = 0;
            this.energy += (this.maxEnergy * 40 / 100);
            actStats(enemy)
            setTimeout(() => {
                battleText.innerHTML += (`<h4>${player.name} Turn</h4>`);
                $(playerCombatsBtns).show();
            }, 3000);
        } else {
            if (this.raged) {
                this.act2()
            } else {
                switch (ran) {
                    case 1:
                        this.act1();
                        break;
                    case 2:
                        this.act2();
                        break;
                    case 3:
                        this.act3()
                        break;
                }

            }
        }
    }
    act1() {
        let cost = this.maxEnergy * 5 / 100;
        let n = 0;
        battleTextAdd(`${enemy.name} Mades three attacks with his claws!`)
        let claws = () => {
            let attackD100 = d100();
            let dmg = generateWeaponDmg(this.weapon)
            let AccTotal = this.accuracyChance - player.dodgeChance;
            let counterD100 = d100();
            this.energy -= cost;
            this.energy <= 0 ? (this.energy = 0, dmg -= 2) : this.energy;
            if (this.critical >= attackD100) {
                dmg *= 2
                player.health -= dmg;
                battleTextAdd(`Critical strike!, ${dmg} ${this.weapon.type} damage`, "critical");
            } else if (AccTotal >= attackD100) {
                battleTextAdd(`The ${enemy.name} impact with ${dmg} ${this.weapon.type} damage`);
                player.health -= dmg;
            } else {
                battleTextAdd(`${player.name} has dodge the attack!`, "dodge");
            }
            if (player.health <= 0) {
                alert("you lose, pete,refresh to get fucking fucked again")
                player.health = 0;
            } else {
                if (counterD100 < player.counterChance) {
                    counterAttack(player, this)
                }
            }
            actStats(enemy);
            actStats(player);
            n++;
            if (n < 3 && this.health > 0) {
                setTimeout(() => {
                    claws();
                }, 2000);
            } else {
                passTurn(player)
            }
        }
        setTimeout(() => {
            claws()
        }, 2000);

    }
    act2() {
        if (this.raged) {
            this.raged = false;
            let dmg = generateWeaponDmg(this.weapon) * 3;
            let attackD100 = d100();
            let counterD100 = d100();
            let AccTotal = (this.accuracyChance - player.dodgeChance) + 15;
            if (AccTotal > attackD100) {
                player.health -= dmg;
                battleTextAdd(`${this.name} ram into ${player.name} and deals ${dmg} damage!`);
            } else {
                battleTextAdd(`${player.name} dodge the ${this.name}`);
                counterD100 -= 10;
            }
            if (player.health <= 0) {
                alert("you lose, pete,refresh to get fucking fucked again")
                player.health = 0;
                actStats(player);
            } else {
                if (counterD100 < player.counterChance) {
                    counterAttack(player, this)
                }
                actStats(enemy);
                actStats(player);
                passTurn(player);
            }
        } else {
            let cost = parseInt(this.maxEnergy * 19 / 100)
            if (cost > this.energy) {
                this.turn()
            } else {
                this.energy -= cost;
                this.raged = true;
                battleTextAdd(`${this.name} is preparing to ram!`);
                actStats(enemy);
                actStats(player);
                passTurn(player);
            }
        }
    }
    act3() {
        let costHeal = this.maxEnergy * 18 / 100;
        if (this.health >= 60 * this.maxHealth / 100 || this.energy < costHeal) {
            this.turn();
        } else {
            let trollHeal = Math.round(this.maxHealth * 24 / 100);
            this.energy -= costHeal;
            heal(this, trollHeal);
            passTurn(player)
        }
        actStats(enemy)
    }
}


class Winter_Wolf extends Enemy {
    constructor(name) {
        super(name)
        this.maxHealth = 70;
        this.health = 70;
        this.maxEnergy = 120;
        this.energy = 120;
        this.dodgeChance = 15;
        this.counterChance = 15;
        this.accuracyChance = 90;
        this.critical = 10;
        this.weapon = bite;

        this.avatar = "imgs/enemy/claws of winter/wolf.png";
    }
    turn() {
        let ran = Math.floor(Math.random() * 3 + 1);
        if (this.energy <= 0) {
            battleTextAdd(`${enemy.name} is exhaust!`)
            this.energy = 0;
            this.energy += (this.maxEnergy * 40 / 100);
            actStats(enemy)
            setTimeout(() => {
                battleText.innerHTML += (`<h4>${player.name} Turn</h4>`);
                $(playerCombatsBtns).show();
            }, 3000);
        } else {
            switch (ran) {
                case 1:
                    this.act1();
                    break;
                case 2:
                    this.act2();
                    break;
                case 3:
                    this.act3()
                    break;
            }
        }
    }
    act1() {
        let cost = this.maxEnergy * 5 / 100;
        let n = 0;
        battleTextAdd(`${enemy.name} Mades three attacks with his claws!`)
        let claws = () => {
            let attackD100 = d100();
            let dmg = generateWeaponDmg(this.weapon)
            let AccTotal = this.accuracyChance - player.dodgeChance;
            let counterD100 = d100();
            this.energy -= cost;
            this.energy <= 0 ? (this.energy = 0, dmg -= 2) : this.energy;
            if (this.critical >= attackD100) {
                dmg *= 2
                player.health -= dmg;
                battleTextAdd(`Critical strike!, ${dmg} ${this.weapon.type} damage`, "critical");
            } else if (AccTotal >= attackD100) {
                battleTextAdd(`The ${enemy.name} impact with ${dmg} ${this.weapon.type} damage`);
                player.health -= dmg;
            } else {
                battleTextAdd(`${player.name} has dodge the attack!`, "dodge");
            }
            if (player.health <= 0) {
                alert("you lose, pete,refresh to get fucking fucked again")
                player.health = 0;
            } else {
                if (counterD100 < player.counterChance) {
                    counterAttack(player, this)
                }
            }
            actStats(enemy);
            actStats(player);
            n++;
            if (n < 3 && this.health > 0) {
                setTimeout(() => {
                    claws();
                }, 2000);
            } else {
                passTurn(player)
            }
        }
        setTimeout(() => {
            claws()
        }, 2000);

    }
    act2() {
        if (this.raged) {
            this.raged = false;
            let dmg = generateWeaponDmg(this.weapon) * 3;
            let attackD100 = d100();
            let counterD100 = d100();
            let AccTotal = (this.accuracyChance - player.dodgeChance) + 15;
            if (AccTotal > attackD100) {
                player.health -= dmg;
                battleTextAdd(`${this.name} ram into ${player.name} and deals ${dmg} damage!`);
            } else {
                battleTextAdd(`${player.name} dodge the ${this.name}`);
                counterD100 -= 10;
            }
            if (player.health <= 0) {
                alert("you lose, pete,refresh to get fucking fucked again")
                player.health = 0;
                actStats(player);
            } else {
                if (counterD100 < player.counterChance) {
                    counterAttack(player, this)
                }
                actStats(enemy);
                actStats(player);
                passTurn(player);
            }
        } else {
            let cost = parseInt(this.maxEnergy * 19 / 100)
            if (cost > this.energy) {
                this.turn()
            } else {
                this.energy -= cost;
                this.raged = true;
                battleTextAdd(`${this.name} is preparing to ram!`);
                actStats(enemy);
                actStats(player);
                passTurn(player);
            }
        }
    }
    act3() {
        let costHeal = this.maxEnergy * 18 / 100;
        if (this.health >= 60 * this.maxHealth / 100 || this.energy < costHeal) {
            this.turn();
        } else {
            let trollHeal = Math.round(this.maxHealth * 24 / 100);
            this.energy -= costHeal;
            heal(this, trollHeal);
            passTurn(player)
        }
        actStats(enemy)
    }


}