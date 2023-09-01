export class compiler {
    constructor(public code: string) {

    }
    public compile(): string | undefined {
        try {
            var html = document.createElement('template');
            html.innerHTML = this.code;
            //(html.content.firstChild as HTMLElement).setAttribute('id', 'değişiklik zamanı');
            var mx = "";
            html.content.childNodes.forEach(cn => {
                if (cn instanceof Element) {
                    mx = mx + "<" + cn.tagName.toLowerCase() + ">" + cn.innerHTML + "</" + cn.nodeName.toLowerCase() + ">";
                } else {
                    mx = mx + cn.textContent;
                }

            })
            return mx;
        } catch (error) {

        }

    }
}