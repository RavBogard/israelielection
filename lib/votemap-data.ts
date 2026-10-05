import april from "../public/vote-map/2019a.json";
import september from "../public/vote-map/2019b.json";
import twenty from "../public/vote-map/2020.json";
import twentyOne from "../public/vote-map/2021.json";
import twentyTwo from "../public/vote-map/2022.json";
import placesJson from "../public/vote-map/places.json";
import type { VoteMapElection, Places } from "./votemap";
/** Explicit imports ensure server exports include the same shipped data without filesystem assumptions. */
export const historicalElections = [april,september,twenty,twentyOne,twentyTwo] as VoteMapElection[];
export const historicalPlaces = placesJson as unknown as Places;
