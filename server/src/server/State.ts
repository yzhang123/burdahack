import { Hand } from "./Hand";

interface State {
	onEnter?: () => void;
	onLeave?: () => void;
	onHandInput?: (hand: Hand) => void;
	forceHandID?: number;
	speechInput?: (word: string) => void;
};

export = State;