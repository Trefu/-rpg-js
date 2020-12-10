//Monsters
let wolf = "Asd";
let winterTroll = "asdasd";
let snowDrake = "asd";

//Monsters groups
let winterMonsters = {
    wolf,
    winterTroll,
    snowDrake
};

//locations dangers
let winterDangers = {
    eventsPassed: 0,
    stormPassed: false,
    coldPassed: false,
    cavePassed: false,
    monstersPassed: false,
    cold() {
        battleText.innerText = "Its getting colder"
        console.log("cold")
        this.coldPassed = true;
    },
    cave() {
        battleText.innerText = "Deep footprints of a booted, humanoid are visible in the fresh snow. The footsteps lead deep into a cave; they do not return."
        showButtons(true, btnEvent1);
        showButtons(true, btnEvent2);
        btnEvent1.innerText = "Examine the cave"
        btnEvent1.setAttribute("onClick", 'winterDangers.resultWinterEvent("examine")')
        btnEvent2.innerText = "Ignore and keep forward"
        btnEvent2.setAttribute("onClick", 'winterDangers.resultWinterEvent("ignore")')
        console.log("cueva")
    },
    monsters() {
        battleText.innerText = "Monster"
        console.log("monsters")
        this.monstersPassed = true;
    },
    storm() {
        console.log("tormenta")
        battleText.innerText = `seems to be that a storm is aproaching from the north`
        if ((player.health * 100 / player.maxHealth) >= 30) {
            showButtons(true, btnEvent1);
            showButtons(true, btnEvent2);
            btnEvent1.innerText = "Keep foward and try to pass the storm"
            btnEvent1.setAttribute("onClick", 'winterDangers.resultWinterEvent("advance")')
            btnEvent2.innerText = "Try to search for refuge"
            btnEvent2.setAttribute("onClick", 'winterDangers.resultWinterEvent("refuge")')
        } else {
            btnEvent1.innerText = "Keep foward and try to pass the storm (Health to low)"
            btnEvent1.className = "btn btn-dark btn-outline-danger my-2 w-100"
            showButtons(true, btnEvent2);
            showButtons(true, btnEvent3);
        }
    },

    resultWinterEvent(pick) {
        showButtons(false, btnEvent1)
        showButtons(false, btnEvent2)
        showButtons(false, btnEvent3)
        let luckThrow = d100()
        luckThrow += player.luck;
        switch (pick) {
            case "advance":
                if (luckThrow >= 80) {
                    battleText.innerText += `
                    ${player.name} manages to go trought the storm without problems and gets inspired`;
                    player.status.inspired = true;
                } else if (luckThrow >= 70) {
                    battleText.innerText += `
                    ${player.name} barely escapes the storm and feels icy`;
                    player.status.cold = true;
                    player.health -= 15;
                } else {
                    battleText.innerText += `
                    ${player.name} almost get frozen in the storm`;
                    player.status.cold = true;
                    player.health -= 25;
                }
                this.stormPassed = true;
                break;
            case "refuge":
                if (probRefuge >= 70) {
                    battleText.innerText += `
                    ${player.name} finds a great place to stay and get warm`;
                    player.status.cold = false;
                } else {
                    battleText.innerText += `
                    ${player.name} almost get frozen in the storm`;
                    player.status.cold = true;
                    player.health -= 25;
                    break;
                }
                case "examine":
                    if (luckThrow >= 80) {
                        battleText.innerText += `${player.name} Finds a little treasure`;
                    } else {
                        locationBattle.randomFight();
                    }
                    break;

                case "ignore":
                    battleText.innerText += `${player.name} decides to better past away`;
                    break;

        }
        actStats(player);
        setTimeout(() => {
            locationBattle.eventRandom();
        }, 5000);

    },


    randomEvent() {
        let eventList = [this.stormPassed, this.coldPassed, this.cavePassed, this.monstersPassed];
        let eventMethods = {
            0: this.storm,
            1: this.cold,
            2: this.cave,
            3: this.monsters,
        }
        let randomNum = 2 //Math.floor(Math.random() * 4);
        if (!eventList[randomNum]) {
            eventMethods[randomNum]()
        } else {
            this.randomEvent()
        }
    }

}



//locations images
let winterImgs = {
    bg: "url('imgs/locations/winterbg.jpg')"
}


class locationMap {
    constructor(name, dangers, monsters, imgs) {
        this.name = name;
        this.dangers = dangers;
        this.monsters = monsters;
        this.imgs = imgs;
    }
    locationStart() {
        locationsImgs.remove();
        body.style.backgroundImage = this.imgs.bg;
        battleText.classList.remove("d-none");
    }
    eventRandom() {
        this.dangers.randomEvent();
    }
    randomFight() {
        enemy = new Ice_Troll("Ice Troll")
        battleText.innerText = `${player.name} stands against ${enemy.name}`

    }

}