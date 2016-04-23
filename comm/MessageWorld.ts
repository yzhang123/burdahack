interface Entity
{
    pos: { x: number, y: number, z: number };
    xw : number;
    yw : number;
    zw : number;
}
type MessageWorld = { [id: number]: Entity };
