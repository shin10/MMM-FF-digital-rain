/* Magic Mirror
 * Module: MMM-Ff-digital-rain
 *
 * By Michael Trenkler
 * ISC Licensed.
 */

Module.register("MMM-Ff-digital-rain", {
  defaults: {
    distribution: function (x) {
      return x;
    },
    fps: 10,
    color: "#0A4",
    fontSize: "2rem",
    chars:
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$+-*/=%\"'#&_(),.;:?!\\|{}<>[]^~",
    fontURL: null,
    numberOfDrops: 10,
    numberOfMutations: 10,
    width: null,
    height: null
  },

  wrapper: null,
  matrix: [],
  mutations: [],
  drops: [],
  columnLength: 0,
  tPrevFrame: 0,

  getStyles: function () {
    return ["MMM-Ff-digital-rain.css"];
  },

  getDom: function () {
    let wrapper = (this.wrapper = document.createElement("ul"));
    wrapper.classList.add("digital-rain");
    wrapper.style.width = this.config.width || "100vw";
    wrapper.style.height = this.config.height || "100vh";
    wrapper.style.fontSize = this.config.fontSize;
    if (typeof this.config.color === "string")
      wrapper.style.color = this.config.color;

    if (this.config.fontURL) {
      let font = new FontFace(
        "MMM-Ff-digital-rain-font",
        `url(${this.config.fontURL})`
      );
      document.fonts.add(font);
    }

    return wrapper;
  },

  addLine: function () {
    let line = { drops: [], element: document.createElement("li") };
    line.element.innerText = "&nbsp;";
    this.matrix.push(line);
    this.wrapper.appendChild(line.element);
    this.fillColumn(line.element);
    return line;
  },

  randomChar: function () {
    return this.config.chars[~~(this.config.chars.length * Math.random())];
  },

  fillColumn: function (el) {
    el.innerText = "";
    while (el.childElementCount < this.columnLength)
      el.innerHTML += `<i>${this.randomChar()}</i>`;
  },

  removeElements: function () {
    while (this.matrix.length) this.matrix.pop().element.remove();
  },

  setupElements: function () {
    this.tPrevFrame = 0;
    this.removeElements();

    this.addLine();
    let line = this.matrix[0].element;

    let wrapperBounds = this.wrapper.getBoundingClientRect();
    let wrapperWidth = wrapperBounds.width;
    let wrapperHeight = wrapperBounds.height;
    let lineWidth = line.getBoundingClientRect().width;

    // test for number of chars per column
    while (line.scrollHeight <= wrapperHeight) line.innerText += "x";

    this.columnLength = line.innerText.length - 1;
    this.fillColumn(this.matrix[0].element);

    this.numberOfLines = Math.floor(wrapperWidth / lineWidth);
    while (this.matrix.length < this.numberOfLines) this.addLine();
    // taste the rainbow
    if (typeof this.config.color === "function") {
      for (let i = 0; i < this.matrix.length; ++i) {
        let line = this.matrix[i].element;
        line.style.color = this.config.color(i / this.matrix.length);
      }
    }

    // setup mutations
    for (let i = 0; i < this.config.numberOfMutations; ++i) {
      this.mutations.push({
        x: Math.floor(Math.random() * this.matrix.length),
        y: Math.floor(Math.random() * this.columnLength)
      });
    }

    // setup drops
    for (let i = 0; i < this.config.numberOfDrops; ++i) {
      this.drops.push({
        x: this.distributedX(),
        y: -Math.floor(Math.random() * this.columnLength)
      });
    }

    window.requestAnimationFrame((ts) => this.efh(ts));
  },

  efh: function (timestamp) {
    if (!this.matrix.length) return;
    if (!this.hidden) window.requestAnimationFrame((ts) => this.efh(ts));
    if (timestamp - this.tPrevFrame < 1000 / this.config.fps) return;
    this.tPrevFrame = timestamp;

    for (let i = 0; i < this.mutations.length; ++i) {
      if (Math.random() < 0.5) continue; // ignore
      let mutation = this.mutations[i];

      // reposition mutation
      if (Math.random() > 0.9) {
        let tmpDrop = this.drops[Math.floor(Math.random() * this.drops.length)]; // get random drop and move a little up
        mutation.x = tmpDrop.x;
        mutation.y = tmpDrop.y;
      }

      // move mutator
      if (Math.random() < 0.2) {
        mutation.y += Math.random() < 0.5 ? -1 : 1;
      }

      // mutate char
      let charElement = this.matrix[mutation.x].element.children[mutation.y];
      if (charElement) charElement.innerText = this.randomChar();
    }

    for (let i = 0; i < this.drops.length; ++i) {
      let drop = this.drops[i];

      // move drop
      if (++drop.y < 0) continue;

      if (
        drop.y >= this.columnLength ||
        Math.random() * this.matrix.length < 0.25
      ) {
        drop.x = this.distributedX();
        drop.y = 0;
      }

      let charElement = this.matrix[drop.x].element.children[drop.y];
      charElement.innerText = this.randomChar();

      // restart animation loop
      charElement.style.animation = "none";
      charElement.offsetHeight; /* trigger reflow */
      charElement.style.animation = null;
      charElement.classList.add("loop");
    }
  },

  distributedX: function () {
    return Math.floor(
      Math.max(0, Math.min(this.config.distribution(Math.random()), 1)) *
        this.matrix.length
    );
  },

  suspend: function () {
    this.removeElements();
  },

  resume: function () {
    if (this.config.fontURL) {
      document.fonts
        .load(
          `${this.config.fontSize} MMM-Ff-digital-rain-font`,
          this.config.chars
        )
        .then(() => this.setupElements());
    } else {
      this.setupElements();
    }
  }
});
