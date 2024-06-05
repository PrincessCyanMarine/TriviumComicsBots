type ChildElement =
  | HTMLElement
  | Node
  | ElementBuilder<keyof HTMLElementTagNameMap>;
export class ElementBuilder<K extends keyof HTMLElementTagNameMap> {
  element: HTMLElementTagNameMap[K];
  constructor(tag: K) {
    this.element = document.createElement(tag);
  }

  static fromElement<K extends keyof HTMLElementTagNameMap>(
    element: HTMLElementTagNameMap[K]
  ) {
    let builder = new ElementBuilder<K>(element.tagName.toLowerCase() as K);
    builder.element = element;
    return builder;
  }

  addClass(className: string) {
    const classes = className.split(' ');
    for (const c of classes)
      this.element.classList.add(c);
    return this;
  }

  removeClass(className: string) {
    this.element.classList.remove(className);
    return this;
  }

  setText(text: string | (() => string)) {
    if (typeof text === "function") text = text();
    this.element.innerText = text;
    return this;
  }

  setHtml(html: string) {
    this.element.innerHTML = html;
    return this;
  }

  addEventListener<K extends keyof HTMLElementEventMap>(
    type: K,
    listener: (this: typeof this.element, ev: HTMLElementEventMap[K]) => any
  ) {
    this.element.addEventListener(type, listener as any);
    return this;
  }
  appendChildren(...children: ChildElement[]): ElementBuilder<K>;
  appendChildren(children: ChildElement[]): ElementBuilder<K>;
  appendChildren(
    first: ChildElement[] | ChildElement,
    ...rest: ChildElement[]
  ): ElementBuilder<K> {
    if (!Array.isArray(first)) first = [first];
    for (let child of [...first, ...rest]) {
      if (child instanceof ElementBuilder) child = child.build();
      this.element.appendChild(child);
    }
    return this;
  }

  build() {
    return this.element;
  }

  setAttribute(name: string, value: string | undefined) {
    if (value == undefined) {
      this.element.removeAttribute(name);
      return this;
    }
    this.element.setAttribute(name, value);
    return this;
  }

  setId(id: string) {
    this.element.id = id;
    return this;
  }
}
