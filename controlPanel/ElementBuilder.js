class ElementBuilder {
    constructor(tag) {
        this.element = document.createElement(tag);
    }
    static fromElement(element) {
        let builder = new ElementBuilder(element.tagName.toLowerCase());
        builder.element = element;
        return builder;
    }
    addClass(className) {
        const classes = className.split(' ');
        for (const c of classes)
            this.element.classList.add(c);
        return this;
    }
    removeClass(className) {
        this.element.classList.remove(className);
        return this;
    }
    setText(text) {
        if (typeof text === "function")
            text = text();
        this.element.innerText = text;
        return this;
    }
    setHtml(html) {
        this.element.innerHTML = html;
        return this;
    }
    addEventListener(type, listener) {
        this.element.addEventListener(type, listener);
        return this;
    }
    appendChildren(first, ...rest) {
        if (!Array.isArray(first))
            first = [first];
        for (let child of [...first, ...rest]) {
            if (child instanceof ElementBuilder)
                child = child.build();
            this.element.appendChild(child);
        }
        return this;
    }
    build() {
        return this.element;
    }
    setAttribute(name, value) {
        if (value == undefined) {
            this.element.removeAttribute(name);
            return this;
        }
        this.element.setAttribute(name, value);
        return this;
    }
    setId(id) {
        this.element.id = id;
        return this;
    }
}