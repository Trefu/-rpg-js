let body = document.getElementById("body");
let span = document.getElementById("battleText");
let textRecordSec = document.getElementById("textRecordSec");
let btnEvent1 = document.getElementById("ElectionEvent1");
let btnEvent2 = document.getElementById("ElectionEvent2");
let btnEvent3 = document.getElementById("ElectionEvent3");


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
    storm() {
        span.innerText = `seems to be that a storm is aproaching from the north`
        if ((player.health * 100 / player.maxHealth) >= 30) {
            showButtons(btnEvent1);
            showButtons(btnEvent2);
            showButtons(btnEvent3);
            btnEvent1.innerText = "Keep foward and try to pass the storm"
            btnEvent1.setAttribute("onClick", 'winterDangers.resultStorm("advance")')
            btnEvent2.innerText = "Search for a refuge"
            btnEvent3.innerText = "Keep foward and try to pass the storm"

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
            probAdvance -= player.strength * 2;
            if (probAdvance >= 45) {
                span.innerText += `
                ${player.name} manages to go trought the storm without problems and gets inspired`
                player.status = "Inspired"
            } else {
                span.innerText += `
                ${player.name} barely escapes the storm and feels icy`
                player.status = "Icy"
                player.health -= 15;
                actPlayerHealth();

            }
        }


    },
    cold() {
        console.log("cold")
    },
    cave() {
        span.innerText = "Deep footprints of a booted, humanoid are visible in the fresh snow. The footsteps lead deep into a cave; they do not return."

    },
    monsters() {
        console.log(wolf)
    },
    randomEvent() {
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


class Location {
    constructor(name, dangers, monsters, imgs) {
        this.name = name;
        this.dangers = dangers;
        this.monsters = monsters;
        this.imgs = imgs;
    }
    eventRandom() {
        locationsImgs.remove();
        body.style.backgroundImage = LocationBattle.imgs.bg;
        span.classList.remove("d-none");
        this.dangers.randomEvent();

    }



}

let showButtons = function (btn) {
    btn.classList.remove("d-none");
}