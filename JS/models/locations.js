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
    storm() {
        battleText.innerText = `seems to be that a storm is aproaching from the north`
        if ((player.health * 100 / player.maxHealth) >= 30) {
            showButtons(btnEvent1);
            showButtons(btnEvent2);
            btnEvent1.innerText = "Keep foward and try to pass the storm"
            btnEvent1.setAttribute("onClick", 'winterDangers.resultStorm("advance")')
            btnEvent2.innerText = "Try to search for refuge"
        } else {
            btnEvent1.innerText = "Keep foward and try to pass the storm (Health to low)"
            btnEvent1.className = "btn btn-dark btn-outline-danger my-2 w-100"
            showButtons(btnEvent2);
            showButtons(btnEvent3);
        }
    },

    resultStorm(pick) {
        if (pick === "advance") {
            let probAdvance = Math.floor(Math.random() * 100 + 1);
            probAdvance += player.luck;
            console.log(probAdvance)
            if (probAdvance >= 80) {
                battleText.innerText += `
                ${player.name} manages to go trought the storm without problems and gets inspired`
                player.status.inspired = true;
            } else if (probAdvance >= 40) {
                battleText.innerText += `
                ${player.name} barely escapes the storm and feels icy`
                player.status.cold = true;
                player.health -= 15;
            } else {
                battleText.innerText += `
                ${player.name} almost get frozen in the storm`
                player.status.cold = true;
                player.health -= 30;
            }

        } else if (pick === "refuge") {
            let probRefuge = Math.floor(Math.random() * 100 + 1);
            probRefuge += player.luck;
            if (probRefuge >= 85) {
                battleText.innerText += `
                ${player.name} finds a great place to stay`
            } else {
                battleText.innerText += `
                ${player.name} almost get frozen in the storm`
                player.status.cold = true;
                player.health -= 30;
            }
        }
        actStats(player.status);
        setTimeout(() => {
            locationBattle.eventRandom()
        }, 5000);

    },

    cold() {
        console.log("cold")
    },
    cave() {
        battleText.innerText = "Deep footprints of a booted, humanoid are visible in the fresh snow. The footsteps lead deep into a cave; they do not return."

    },
    monsters() {
        console.log(wolf)
    },
    randomEvent() {
        //CAMBIAR ESTO CUANDO ESTEN LOS 4 EVENTOS
        let randomNum = 1
        if (randomNum === 1) {
            this.storm();

        } else if (randomNum === 2) {
            this.cold();
        } else if (randomNum === 3) {
            this.cave();
        } else {
            this.monsters();
        }
    }
};

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



}

let showButtons = function (btn) {
    btn.classList.remove("d-none");
}