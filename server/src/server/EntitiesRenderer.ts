export function renderEntity(type: string, params: any): string
{
    var body;
    switch(type)
    {
        case "undefined":
            body =
                "";
            break;
        case "box":
            body = 
                "<div style=\"background: linear-gradient(0deg, #aaa, #fff); font-family: sans-serif; font-size: 100px; text-align:center; line-height: 256px; width: 512px; height: 256px; border-radius: 64px;\">" +
                params["text"] +
                "</div>";
            break;
        case "text":
            body = 
                params["text"];
            break;
        default:
            body = "<h1>" + type + "</h1>" + JSON.stringify(params);
            break;
    }
    return "<html><body>" + body + "</body></html>";
}