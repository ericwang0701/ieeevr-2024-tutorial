import { MyRoom } from "../AppRoom";

export interface IVector2 {
    x: number;
    y: number;
}

// Define the type for the dictionary with string keys and MyRoom values
type RoomDictionary = {
    [key: string]: MyRoom;
};

export let AllRooms: { rooms: RoomDictionary } = {
    rooms: {} // This is now a dictionary where you can use a string key to get a MyRoom object
};

export function getCurrentDateStr(): string {
    const currentDate = new Date(); // Get the current date and time

    // Extract individual date components
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1; // Months are 0-based, so add 1
    const day = currentDate.getDate();
    const hours = currentDate.getHours();
    const minutes = currentDate.getMinutes();
    const seconds = currentDate.getSeconds();
    const milliseconds = currentDate.getMilliseconds();

    // Create a human-readable date string with milliseconds
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;

}

export function shuffle(array) {
    let currentIndex = array.length, randomIndex;

    // While there remain elements to shuffle.
    while (currentIndex > 0) {

        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }

    return array;
}

export const SHtoPuzzleMap = {
    1: "1",
    2: "1",
    3: "2",
    4: "2",
    5: "3",
    6: "3"
};

export function randomNumber(min, max) {
    return Math.random() * (max - min) + min;
}

//exclude desktop users
export const mobileUserIDList = [1,2,3,4,5,6,7,8,9,10,22,24,26,30,31,40,42,44]