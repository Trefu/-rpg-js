const coldDescription = "Its getting colder"
const coldOptions = {
    "btn1": "Run",
    "btn2": "Find refugee",
    "btn3": "idk"
}
const coldActions = {
    "btn1": "coldRun()",
    "btn2": "refuge()",
    "btn3": "idk()",
}

const coldRun = () => console.log("runururn")
const refuge = () => console.log("refuge")
const idk = () => console.log("idk")
const coldRes = [coldRun, refuge, idk]


const coldEvent = {
    name: "cold",
    description: coldDescription,
    difficulty: 65,
    options: coldOptions,
    actions: coldActions,
    resolutions: coldRes
}
export const eventClicks = {
    coldEvent,
    coldRun
}