export function renderEntity(type: string, params: any): string
{
    var body;
    switch(type)
    {
        case "bubble.html":
            body = 
                "<div style=\"background: linear-gradient(0deg, #aaa, #fff); font-family: sans-serif; font-size: 200px; text-align:center; line-height: 512px; width: 512px; height: 512px; border-radius: 64px;\">" +
                params["text"] +
                "</div>";
            break;
        default:
            body = "<h1>" + type + "</h1>" + JSON.stringify(params);
            break;
    }
    return "<html><body>" + body + "</body></html>";
}