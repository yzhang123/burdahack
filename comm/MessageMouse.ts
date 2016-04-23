interface MessageMouse
{
    DX : number;
    DY : number;
    DZ : number;
    Gesture : string;
}
type MessageMouses = { [id: number]: MessageMouse }
