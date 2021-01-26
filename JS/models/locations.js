//Monsters
let troll = new Ice_Troll("Ice Troll");
let wolf = "Asd";
let winterTroll = "asdasd";
let snowDrake = "asd";
let dustWorm = "asdl"
//Monsters groups
let winterMonsters = {
    wolf,
    winterTroll,
    snowDrake,
    troll
};
let duniaMonsters = {
    dustWorm
}
//locations dangers
let duniaDangers = {
    eventPassed: 0,
    stormPassed: false
}

let winterDangers = {
    cold() {
        battleText.innerText = "Its getting colder"
        console.log("cold")
        this.coldPassed = true;
        btnEvent1.innerText = "cold"
        showButtons(true, btnEvent1);
        btnEvent1.setAttribute("onClick", 'winterDangers.resultWinterEvent("cold")')
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

    /*     resultWinterEvent(pick) {
            showButtons(false, btnEvent1)
            showButtons(false, btnEvent2)
            showButtons(false, btnEvent3)
            let luckThrow = d100()
            luckThrow += player.luck;
            console.log(`Luck trow ${luckThrow}`)

            switch (pick) {
                case "advance":
                    if (luckThrow >= 80) {
                        battleTextAdd(`${player.name} manages to go trought the storm without problems and gets inspired`);
                        player.status.inspired = true;
                    } else if (luckThrow >= 70) {
                        battleTextAdd(`${player.name} barely escapes the storm and feels icy`)
                        player.status.cold = true;
                        player.health -= 15;
                    } else {
                        battleText.innerText += `
                        ${player.name} almost get frozen in the storm`;
                        player.status.cold = true;
                        player.health -= 25;
                    }
                    this.stormPassed = true;
                    setTimeout(() => {
                        locationBattle.eventRandom()
                    }, 1000);
                    break;

                case "refuge":
                    let probRefuge = d100()
                    if (probRefuge >= 70) {
                        battleText.innerText += `
                        ${player.name} finds a great place to stay and get warm`;
                        player.status.cold = false;
                    } else {
                        battleText.innerText += `
                        ${player.name} almost get frozen in the storm`;
                        player.status.cold = true;
                        player.health -= 25;
                    }
                    this.stormPassed = true;
                    setTimeout(() => {
                        locationBattle.eventRandom()
                    }, 1000);
                    break;

                case "examine":
                    //CAMBIAR ESTO DESPUES DE TESTEAR
                    if (luckThrow >= 200) {
                        battleText.innerText += `
                    ${player.name} Finds a little treasure`;
                    } else {
                        locationBattle.randomFight();
                    }
                    break;

                case "ignore":
                    battleText.innerText += `
                ${player.name} decides to better past away`;
                    break;
                case "cold":
                    battleText.innerText += `
                ${player.name} ta bien codl`;
                    this.coldPassed = true;
                    setTimeout(() => {
                        locationBattle.eventRandom()
                    }, 1000);
                    break;
            }
            actStats(player);
        }, */
}


//locations images
let winterImgs = {
    bg: "linear-gradient(to right, #000428, #004e92)",
    reward: "",
    final: ""
}
let duniaImgs = {
    bg: "background: linear-gradient(to right, #cac531, #f3f9a7);"
}

let theDeepImgs = {

}

let neverWinterForestImgs = {


}
class locationMap {
    constructor(name, dangers, monsters, imgs) {
        this.name = name;
        this.dangers = dangers;
        this.monsters = monsters;
        this.imgs = imgs;
        this.eventList = getMethods(this.dangers);
    }
    locationStart() {
        locationsImgs.remove();
        body.style.background = this.imgs.bg;
        battleText.classList.remove("d-none");
    }
    /*
    la lista obtiene los nombres de los primeros 3 metodos de la location
    los cuales son los eventos,luego un numero aleatorio del 1 al 3 ejecuta el evento
    y lo popea
     */

    eventRandom() {
        if (this.eventList.length === 0) {
            console.log("nada")
        } else {
            let randomNum = Math.floor(Math.random() * this.eventList.length);
            let eventSelected = this.eventList[randomNum];
            if (this.eventList[randomNum]) {
                this.dangers[eventSelected]();
                this.eventList = arrayRemove(locationBattle.eventList, eventSelected)
            } else {
                this.eventRandom();
            }
        }

    }
    randomFight() {
        enemy = troll;
        battleText.innerText = `${player.name} stands against ${enemy.name}`
        enemyName.innerText = `${enemy.name}`
        enemyAvatar.src = "imgs/enemy/claws of winter/ice troll.png"

        setTimeout(() => {
            Manager.fight();
        }, 1000);
    }

}