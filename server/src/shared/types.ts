/// <reference path="DeviceView.ts" />
/// <reference path="IBox.ts" />
/// <reference path="Vector3D.ts" />

interface MouseData
{
    DX : number;
    DY : number;
    DZ : number;
    Gesture : string;
    IsLeft: boolean;
}

type MultMouseData = { [uid: string]: MouseData };