export function renderEntity(type: string, params: any): string
{
    var body;
    switch(type)
    {
        
        default:
            body = "<h1>" + type + "</h1>" + JSON.stringify(params);
            break;
    } 
    return "<html><body>" + body + "</body></html>";
}