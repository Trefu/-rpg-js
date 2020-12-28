class Enemy {
    constructor(name) {
        this.name = name;
        this.maxHealth = 0;
        this.health = 0;
        this.agi = 0;
        this.defense = 0;
        this.dodgeChance = 0;
        this.fumbleChance = 0;
        this.counterChance = 0;
        this.accuracyChance = 0;
        this.protection = 0;
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
        let ran = 1 //Math.floor(Math.random() * 3 + 1);
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

class Ice_Troll extends Enemy {
    constructor(name) {
        super(name)
        this.maxHealth = 120;
        this.health = 120;
        this.maxEnergy = 150;
        this.energy = 150;
        this.agi = 5;
        this.defense = 2;
        this.dodgeChance = 5;
        this.fumbleChance = 30;
        this.counterChance = 10;
        this.accuracyChance = 70;
        this.protection = 5;
        this.weapon = claws;
        this.avatar = "imgs/enemy/claws of winter/ice troll.png";
    }
    act1() {
        let n = 0;
        battleText.innerText += `
        ${enemy.name} Mades three attacks with his claws!`
        let claws = () => {
            let attackD100 = d100();
            let dmg = Math.round(generateMediaDmgCris(this));
            let AccTotal = this.accuracyChance - player.dodgeChance;
            let counterD100 = d100();
            this.energy -= this.maxEnergy * 5 / 100;
            if (this.critical >= attackD100) {
                dmg *= 2
                player.health -= dmg;
                battleText.innerText += `
            Critical strike!, ${dmg} ${this.weapon.type} damage`;
            } else if (AccTotal >= attackD100) {
                battleText.innerText += `
            The ${enemy.name} impact with ${dmg} ${this.weapon.type} damage`;
                player.health -= dmg;
            } else {
                battleText.innerText += `
            ${player.name} has dodge the attack!`;
            }
            if (player.health <= 0) {
                console.log("rip");
                player.health = 0;
            } else {
                if (counterD100 < player.counterChance) {
                    counterAttack(player, this)
                }
            }
            n++;
            if (n < 3 && this.health > 0) {
                setTimeout(() => {
                    claws()
                }, 2000);
            } else {
                setTimeout(() => {
                    battleText.innerText = `${player.classCharacter} Turn`
                    $(playerCombatsBtns).show();
                }, 4000);
            }
        }
        setTimeout(() => {
            claws()
        }, 2000);

    }
    act2() {
        console.log("claws")
    }
    act3() {
        let costHeal = this.maxEnergy * 20 / 100;
        if (this.health === this.maxHealth || this.energy < costHeal) {
            this.turn();
            console.log("falta energia para helear")
        } else {
            let trollHeal = Math.round(this.health * 15 / this.maxHealth);
            this.energy -= costHeal;
            heal(this, this.trollHeal);
            battleText.innerText += `
            ${enemy.name} heals for ${trollHeal}`
        }
        actStats(enemy)
    }


}