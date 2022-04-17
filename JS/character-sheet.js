import AutoSave from "./Autosave";

console.log('character sheet js')

//aca adentro va todo lo que queres que se ejecute una vez se cargo todo el html,css y js
window.onload = function () {
    //Activador de autosave
    AutoSave.start();
}