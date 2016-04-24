export function renderEntity(type: string, params: any): string
{
    var body;
    switch(type)
    {
        case "undefined":
            body =
                " ";
            break;
        case "textbox":
            body = 
                "<span style=\"padding: 20px;\"><span style=\"box-shadow: 0px 0px 20px 0px gray; position: relative; top: 43px; min-width: 256px; padding: 30px 50px 30px 50px; background: linear-gradient(0deg, #aaa, #fff); font-family: sans-serif; font-size: 50px; text-align:center; border-radius: 64px;\">" +
                (params["text"] || "enter text") +
                "</span></span>";
            break;
        case "imgbox":
            body = 
                "<img style=\"\" src=\"" + params["url"] + "\"></img>";
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