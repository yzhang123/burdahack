interface Entity
{
    pos: { x: number, y: number, z: number };
    xw : number;
    yw : number;
    url: string;
}
type MessageWorld = { [id: number]: Entity };
