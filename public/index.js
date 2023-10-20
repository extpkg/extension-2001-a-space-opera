(() => {
  // src/js/mobile.js
  var isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);

  // src/js/sound.js
  var NB_AUDIO_CTX = 10;
  var audioCtx = [];
  var VOLUME = 0.3;
  var memoNoteToData = {};
  var timerId;
  function initAudioContext(songs) {
    start = performance.now();
    for (i = 0; i < NB_AUDIO_CTX; i++) {
      audioCtx[i] = new AudioContext();
    }
    end = performance.now();
  }
  function playSong(song, done) {
    let n = 0;
    timerId = setTimeout(function run() {
      if (n == song.length) {
        if (done) {
          done();
        } else {
          timerId = setTimeout(() => {
            playSong(song);
          }, song[0].next);
        }
      } else {
        note = song[n];
        playNote(note, n);
        timerId = setTimeout(run, note.next);
        n++;
      }
    }, 0);
  }
  function stopSong(song) {
    clearTimeout(timerId);
    song.forEach((note2) => {
      if (note2.source) {
        note2.source.stop();
      }
    });
  }
  function generateBufferDataForSong(songData) {
    songData.forEach(generateBufferDataForNote);
  }
  function generateBufferDataForNote(note2) {
    note2.buffer = audioCtx[0].createBuffer(1, 1e6, 44100);
    note2.buffer.getChannelData(0).set(getD(note2.key, note2.hold));
  }
  function playNote(note2, n) {
    const aCtx = audioCtx[n % NB_AUDIO_CTX];
    const source = aCtx.createBufferSource();
    source.buffer = note2.buffer;
    const gain = aCtx.createGain();
    gain.gain.value = VOLUME;
    source.connect(gain);
    gain.connect(aCtx.destination);
    source.start();
    note2.source = source;
    note2.startTime = performance.now();
  }
  var getFrequency = (note2) => 130.81 * 1.06 ** note2;
  function getD(note2, hold) {
    const memoKey = `${note2}-${hold}`;
    if (memoNoteToData[memoKey]) {
      return memoNoteToData[memoKey];
    }
    freq = getFrequency(note2);
    for (
      V = hold,
        vv = [],
        pp = ch = 0,
        s = (freq2, tt, aa, tick2) =>
          Math.sin((freq2 / tt) * 6.28 * aa + tick2),
        w = (freq2, tt) =>
          Math.sin(
            (freq2 / 44100) * tt * 6.28 +
              s(freq2, 44100, tt, 0) ** 2 +
              0.75 * s(freq2, 44100, tt, 0.25) +
              0.1 * s(freq2, 44100, tt, 0.5),
          ),
        D = [],
        tick = 0;
      tick < 44100 * V;
      tick++
    ) {
      D[tick] =
        tick < 88
          ? (tick / 88.2) * w(tick, freq)
          : (1 - (tick - 88.2) / (44100 * (V - 2e-3))) **
              ((0.5 * Math.log((1e4 * freq) / 44100)) ** 2) *
            w(tick, freq);
    }
    memoNoteToData[memoKey] = D;
    return D;
  }

  // src/js/utils.js
  var prng = Math.random;
  function rand(min = 0, max = 1) {
    return prng() * (max + 1 - min) + min;
  }
  function randInt(min = 0, max = 1) {
    return Math.floor(rand(min, max));
  }
  function choice(values) {
    return values[randInt(0, values.length - 1)];
  }
  function clamp(value, min, max) {
    return value < min ? min : value > max ? max : value;
  }
  function lerp(min, max, t) {
    if (t < 0) return min;
    if (t > 1) return max;
    return min * (1 - t) + max * t;
  }
  function loadImg(dataUri) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () {
        resolve(img);
      };
      img.src = dataUri;
    });
  }

  // src/img/charset.webp
  var charset_default =
    "data:image/webp;base64,UklGRuAAAABXRUJQVlA4TNQAAAAvHAEBEA8w//M///Mf8IAqAKBp5zzbbGZ7tz3bZvKbEW3ba0tWXdwHeNX5btnm+Y2I/gf8e4ELkiP2Zs/9l6R69smMFr//zSQgPcAA6fKZ3kWusJFxvmsSv7NXP4sQudUZqpdXoWKOyGQ2nrO2mCtJ/fRbMhzrjEH8SqI58mTkVqtGPcM3AywjC4BRg58sDa1BuEtAxsWuWeUOu8Wic3GzWY/HJR1e8pDJWMBeGz0vSVG6mfj09TGyAI8lmzSbDZ2cuTN/SLrn9/0AMwoA9uRM7yIbsQ==";

  // src/js/text.js
  var ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789.:,'!?+-*/=%#[]UDLRNC";
  var ALIGN_LEFT = "start";
  var ALIGN_CENTER = "center";
  var ALIGN_RIGHT = "end";
  var CHARSET_SIZE = 5;
  var charset;
  var ctx;
  var initCharset = async (canvasContext) => {
    ctx = canvasContext;
    charset = await loadImg(charset_default);
  };
  function renderBitmapText(msg, x, y, align = ALIGN_LEFT, scale = 1) {
    const SCALED_SIZE = scale * CHARSET_SIZE;
    const MSG_WIDTH = msg.length * SCALED_SIZE + (msg.length - 1) * scale;
    const ALIGN_OFFSET =
      align === ALIGN_RIGHT
        ? MSG_WIDTH
        : align === ALIGN_CENTER
        ? MSG_WIDTH / 2
        : 0;
    [...msg].forEach((c2, i2) => {
      ctx.drawImage(
        charset,
        ALPHABET.indexOf(c2) * CHARSET_SIZE,
        0,
        CHARSET_SIZE,
        CHARSET_SIZE,
        Math.floor(x + i2 * scale * (CHARSET_SIZE + 1) - ALIGN_OFFSET),
        y,
        Math.floor(SCALED_SIZE),
        Math.floor(SCALED_SIZE),
      );
    });
  }

  // src/js/game.js
  var LOADING_SCREEN = 0;
  var TITLE_SCREEN = 1;
  var GAME_SCREEN = 2;
  var END_SCREEN = 3;
  var screen = LOADING_SCREEN;
  var PLANETS = [
    {
      hint: "i'm afraid i can't do that, dave",
      name: "2001: a space odyssey",
      noteRange: [9, 25],
      song: [
        { key: 9, hold: 12, next: 2e3 },
        { key: 16, hold: 12, next: 2e3 },
        { key: 21, hold: 12, next: 2e3 },
        { key: 25, hold: 3.5, next: 250 },
        { key: 24, hold: 8, next: 3e3 },
      ],
      width: 3,
    },
    {
      hint: "may it be with you, always",
      name: "the force theme",
      noteRange: [12, 22],
      song: [
        { key: 12, hold: 3.5, next: 350 },
        { key: 17, hold: 8, next: 1e3 },
        { key: 19, hold: 8, next: 1e3 },
        { key: 20, hold: 2.5, next: 250 },
        { key: 22, hold: 2.5, next: 250 },
        { key: 20, hold: 5, next: 800 },
        { key: 12, hold: 8, next: 2e3 },
      ],
      width: 2.2,
    },
    {
      hint: "make it so",
      name: "star trek next generation",
      noteRange: [9, 23],
      song: [
        { key: 9, hold: 8, next: 1e3 },
        { key: 14, hold: 3.5, next: 350 },
        { key: 18, hold: 3.5, next: 350 },
        { key: 16, hold: 5, next: 800 },
        { key: 12, hold: 3.5, next: 350 },
        { key: 23, hold: 3.5, next: 350 },
        { key: 21, hold: 8, next: 2e3 },
      ],
      width: 2.2,
    },
    {
      hint: "danger will robinson",
      name: "lost in space",
      noteRange: [7, 19],
      song: [
        { key: 19, hold: 5, next: 1e3 },
        { key: 19, hold: 2.5, next: 250 },
        { key: 18, hold: 2.5, next: 250 },
        { key: 19, hold: 2.5, next: 250 },
        { key: 14, hold: 3.5, next: 350 },
        { key: 11, hold: 3.5, next: 350 },
        { key: 7, hold: 3.5, next: 350 },
        { key: 19, hold: 5, next: 1e3 },
      ],
      width: 2,
    },
    {
      hint: "to boldly go in space",
      name: "star trek original series",
      noteRange: [11, 23],
      song: [
        { key: 11, hold: 3.5, next: 350 },
        { key: 16, hold: 2.5, next: 250 },
        { key: 21, hold: 8, next: 1e3 },
        { key: 20, hold: 3.5, next: 350 },
        { key: 16, hold: 2.5, next: 250 },
        { key: 13, hold: 2.5, next: 250 },
        { key: 18, hold: 2.5, next: 250 },
        { key: 23, hold: 8, next: 2e3 },
      ],
      width: 2,
    },
    {
      hint: "so say we all",
      name: "battle star galactica",
      noteRange: [21, 30],
      song: [
        { key: 28, hold: 8, next: 1e3 },
        { key: 26, hold: 3.5, next: 350 },
        { key: 25, hold: 3.5, next: 350 },
        { key: 23, hold: 3.5, next: 350 },
        { key: 21, hold: 3.5, next: 350 },
        { key: 26, hold: 8, next: 1e3 },
        { key: 28, hold: 2.5, next: 250 },
        { key: 30, hold: 2.5, next: 250 },
        { key: 28, hold: 8, next: 1e3 },
      ],
      width: 1.65,
    },
    {
      hint: "never give up, never surrender",
      name: "galaxy quest",
      noteRange: [7, 19],
      song: [
        { key: 7, hold: 5, next: 800 },
        { key: 12, hold: 5, next: 800 },
        { key: 14, hold: 5, next: 800 },
        { key: 16, hold: 2.5, next: 250 },
        { key: 17, hold: 2.5, next: 250 },
        { key: 19, hold: 2.5, next: 250 },
        { key: 17, hold: 5, next: 800 },
        { key: 16, hold: 5, next: 800 },
        { key: 14, hold: 8, next: 2e3 },
      ],
      width: 1.5,
    },
    {
      hint: "he is your father",
      name: "darth vader theme",
      noteRange: [0, 7],
      song: [
        { key: 4, hold: 8, next: 1e3 },
        { key: 4, hold: 8, next: 1e3 },
        { key: 4, hold: 8, next: 1e3 },
        { key: 0, hold: 8, next: 800 },
        { key: 7, hold: 5, next: 350 },
        { key: 4, hold: 8, next: 1e3 },
        { key: 0, hold: 8, next: 800 },
        { key: 7, hold: 5, next: 350 },
        { key: 4, hold: 8, next: 1e3 },
      ],
      width: 1.7,
    },
  ];
  var DISTANCE_TO_TARGET_RANGE = 5;
  var BASE_RADIUS = 35;
  var s2 = 0;
  var currentSong = [];
  var draggedNote;
  var loadedSongs = 0;
  var planet = {};
  var crosshair;
  var wellPlacedNotes;
  var [CTX] = createCanvas(768, 1024, c);
  var [STARS_CTX, STARS] = createCanvas(480, 640);
  var [PLANET_CTX, PLANET] = createCanvas(200, 200);
  var [VIEWPORT_CTX, VIEWPORT] = createCanvas(480, 640);
  var svgPattern;
  var canvasX;
  var scaleToFit;
  var currentTime;
  var elapsedTime;
  var lastTime;
  var requestId;
  var running = true;
  var keyToHue = (key, [low, high]) =>
    (360 - ((key - low) * 240) / (high - low) + 240) % 360;
  var ringColor = (note2) =>
    `hsl(${note2.hue} ${note2.hover && crosshair.touchTime ? 10 : 90}% ${
      note2.hover && crosshair.touchTime
        ? 90
        : lerp(90, 50, (currentTime - note2.startTime) / (note2.hold * 500))
    }%)`;
  var trailColor = (note2) =>
    `hsl(${note2.hue} 40% ${note2.hover && crosshair.touchTime ? 90 : 15}%)`;
  function initTitleScreen() {
    renderPlanet();
    currentSong = PLANETS[s2].song.map((note2) => ({ ...note2 }));
    moveRing(3, 4);
    planet.x = VIEWPORT.width;
    planet.y = VIEWPORT.height;
    updateNotesDisplayAttributes();
  }
  function startGame() {
    konamiIndex = 0;
    crosshair = {
      x: -10,
      y: -10,
    };
    screen = GAME_SCREEN;
    s2 = 0;
    startPuzzle(s2);
  }
  function startPuzzle(s3) {
    crosshair.enabled = true;
    currentSong = PLANETS[s3].song.map((note2) => ({ ...note2 }));
    if (s3 === 0) {
      moveRing(3, 4);
    } else {
      randomizeCurrentSong();
    }
    updateNotesDisplayAttributes();
    renderPlanet();
    playSong(currentSong);
  }
  function randomizeCurrentSong() {
    wellPlacedNotes = currentSong.length;
    while (wellPlacedNotes > currentSong.length / 2) {
      let src = randInt(0, currentSong.length - 1);
      let dest = src;
      while (dest === src) {
        dest = randInt(0, currentSong.length - 1);
      }
      moveRing(src, dest);
    }
  }
  function updateNotesDisplayAttributes() {
    currentSong.reduceRight(
      (currentRadius, note2) => {
        note2.hue = keyToHue(note2.key, PLANETS[s2].noteRange);
        note2.radius = currentRadius + BASE_RADIUS;
        note2.width = note2.next / 100;
        note2.startTime = 0;
        return note2.radius;
      },
      (2 + PLANETS[s2].width) * BASE_RADIUS,
    );
  }
  function updateWellPlacedNotes() {
    const templateSong = PLANETS[s2].song;
    wellPlacedNotes = currentSong.reduce((sum, note2, n) => {
      note2.correctPlace =
        note2.key === templateSong[n].key &&
        note2.hold === templateSong[n].hold &&
        note2.next === templateSong[n].next;
      return sum + (note2.correctPlace ? 1 : 0);
    }, 0);
  }
  function moveRing(src, dest) {
    const srcNote = currentSong[src];
    currentSong[src] = currentSong[dest];
    currentSong[dest] = srcNote;
    updateWellPlacedNotes();
  }
  var crosshairDistanceFromPlanet = () =>
    Math.sqrt(
      Math.pow(planet.x - crosshair.x, 2) + Math.pow(planet.y - crosshair.y, 2),
    );
  var ringUnderCrosshair = () =>
    currentSong.findIndex(
      (note2) =>
        crosshair.enabled &&
        Math.abs(
          note2.radius -
            (isMobile ? BASE_RADIUS : note2.width) / 2 -
            crosshairDistanceFromPlanet(),
        ) <=
          Math.max(
            (isMobile ? BASE_RADIUS : note2.width) / 2,
            DISTANCE_TO_TARGET_RANGE,
          ),
    );
  function update() {
    switch (screen) {
      case LOADING_SCREEN:
        if (loadedSongs !== PLANETS.length) {
          generateBufferDataForSong(PLANETS[loadedSongs].song);
          loadedSongs += 1;
        } else {
          initTitleScreen();
          screen = TITLE_SCREEN;
        }
        break;
      case GAME_SCREEN:
        currentSong.forEach((note2) => {
          note2.hover = 0;
        });
        if (b.style.cursor !== "grabbing") {
          b.style.cursor = "default";
        }
        const n = ringUnderCrosshair();
        if (n >= 0 && !currentSong[n].dragged) {
          if (b.style.cursor === "default") {
            b.style.cursor = "grab";
          }
          currentSong[n].hover = currentTime;
        }
        if (wellPlacedNotes === currentSong.length && crosshair.enabled) {
          crosshair.enabled = false;
          stopSong(currentSong);
          playSong(currentSong, () => {
            s2 += 1;
            if (s2 < PLANETS.length) {
              startPuzzle(s2);
            } else {
              screen = END_SCREEN;
            }
          });
        }
        break;
    }
  }
  function createCanvas(width, height, canvas, ctx2) {
    canvas = canvas || c.cloneNode();
    canvas.width = width;
    canvas.height = height;
    ctx2 = canvas.getContext("2d");
    return [ctx2, canvas];
  }
  function blit() {
    CTX.drawImage(
      VIEWPORT,
      0,
      0,
      VIEWPORT.width,
      VIEWPORT.height,
      0,
      0,
      c.width,
      c.height,
    );
  }
  var SPACE = 2 * CHARSET_SIZE;
  function render() {
    VIEWPORT_CTX.drawImage(
      STARS,
      0,
      0,
      VIEWPORT.width,
      VIEWPORT.height,
      0,
      0,
      VIEWPORT.width,
      VIEWPORT.height,
    );
    VIEWPORT_CTX.drawImage(
      PLANET,
      0,
      0,
      PLANET.width,
      PLANET.height,
      VIEWPORT.width - PLANET.width,
      VIEWPORT.height - PLANET.height,
      PLANET.width,
      PLANET.height,
    );
    switch (screen) {
      case LOADING_SCREEN:
        renderBitmapText(
          `loading song #${loadedSongs}/${PLANETS.length}...`,
          VIEWPORT.width / 2,
          34 * SPACE,
          ALIGN_CENTER,
          2,
        );
        break;
      case TITLE_SCREEN:
        currentSong.forEach(renderRing);
        renderBitmapText(
          "2001",
          VIEWPORT.width / 2,
          SPACE * 5,
          ALIGN_CENTER,
          8,
        );
        renderBitmapText(
          "a space opera",
          VIEWPORT.width / 2,
          11 * SPACE,
          ALIGN_CENTER,
          4,
        );
        renderBitmapText(
          "space no longer sounds its old self...",
          SPACE,
          18 * SPACE,
          ALIGN_LEFT,
          2,
        );
        renderBitmapText(
          "bring harmony to the cosmic microwave",
          SPACE,
          20 * SPACE,
          ALIGN_LEFT,
          2,
        );
        renderBitmapText("background!", SPACE, 22 * SPACE, ALIGN_LEFT, 2);
        renderBitmapText(
          `${isMobile ? "tap" : "click"} to start`,
          VIEWPORT.width / 2,
          34 * SPACE,
          ALIGN_CENTER,
          2,
        );
        break;
      case GAME_SCREEN:
        currentSong.forEach(renderRing);
        if (draggedNote) {
          renderDraggedRing(draggedNote);
        }
        renderBitmapText(
          `planet #${s2 + 1}/${PLANETS.length}`,
          SPACE,
          SPACE * 5,
          ALIGN_LEFT,
          2,
        );
        renderBitmapText(
          `${wellPlacedNotes}/${currentSong.length}
notes`,
          VIEWPORT.width - SPACE,
          VIEWPORT.height - 2 * SPACE,
          ALIGN_RIGHT,
          2,
        );
        if (crosshair.enabled) {
          if (s2 === 0) {
            renderBitmapText(
              "guess each planet's iconic tune. each",
              SPACE,
              10 * SPACE,
              ALIGN_LEFT,
              2,
            );
            renderBitmapText(
              "colored ring is a note of the tune.",
              SPACE,
              12 * SPACE,
              ALIGN_LEFT,
              2,
            );
            renderBitmapText(
              "swap rings to recompose the tune.",
              SPACE,
              14 * SPACE,
              ALIGN_LEFT,
              2,
            );
            renderBitmapText(
              "wider rings, longer notes.",
              SPACE,
              18 * SPACE,
              ALIGN_LEFT,
              2,
            );
            renderBitmapText(
              "colder colors, lower notes...",
              SPACE,
              20 * SPACE,
              ALIGN_LEFT,
              2,
            );
            renderBitmapText(
              "...warmer colors, higher ones.",
              SPACE,
              22 * SPACE,
              ALIGN_LEFT,
              2,
            );
            renderBitmapText(
              "here's a hint:",
              SPACE,
              28 * SPACE,
              ALIGN_LEFT,
              2,
            );
          }
          renderBitmapText(
            PLANETS[s2].hint,
            VIEWPORT.width / 2,
            (s2 === 0 ? 30 : 16) * SPACE,
            ALIGN_CENTER,
            2,
          );
        } else {
          renderBitmapText(
            PLANETS[s2].name,
            VIEWPORT.width / 2,
            16 * SPACE,
            ALIGN_CENTER,
            2,
          );
        }
        break;
      case END_SCREEN:
        renderBitmapText(
          "thank you for playing",
          VIEWPORT.width / 2,
          28 * SPACE,
          ALIGN_CENTER,
          2,
        );
        renderBitmapText(
          "2001: a space opera",
          VIEWPORT.width / 2,
          32 * SPACE,
          ALIGN_CENTER,
          4,
        );
        break;
    }
    blit();
  }
  function renderRing(note2) {
    if (!note2.dragged) {
      VIEWPORT_CTX.save();
      VIEWPORT_CTX.beginPath();
      VIEWPORT_CTX.shadowBlur = Math.max(10, note2.width);
      VIEWPORT_CTX.lineWidth = BASE_RADIUS - note2.width;
      VIEWPORT_CTX.arc(
        planet.x,
        planet.y,
        note2.radius - note2.width - VIEWPORT_CTX.lineWidth / 2,
        0,
        2 * Math.PI,
      );
      VIEWPORT_CTX.strokeStyle = trailColor(note2);
      VIEWPORT_CTX.shadowColor = VIEWPORT_CTX.strokeStyle;
      VIEWPORT_CTX.stroke();
      VIEWPORT_CTX.closePath();
      VIEWPORT_CTX.beginPath();
      VIEWPORT_CTX.shadowBlur = Math.max(10, note2.width);
      VIEWPORT_CTX.lineWidth = note2.width;
      VIEWPORT_CTX.arc(
        planet.x,
        planet.y,
        note2.radius - note2.width / 2,
        0,
        2 * Math.PI,
      );
      VIEWPORT_CTX.strokeStyle = ringColor(note2);
      VIEWPORT_CTX.shadowColor = VIEWPORT_CTX.strokeStyle;
      VIEWPORT_CTX.stroke();
      VIEWPORT_CTX.closePath();
      if (screen === GAME_SCREEN) {
        renderBitmapText(
          note2.correctPlace ? "C" : "x",
          VIEWPORT.width - note2.radius + note2.width / 2,
          VIEWPORT.height - 4 * CHARSET_SIZE,
          ALIGN_CENTER,
          2,
        );
      }
      VIEWPORT_CTX.restore();
    }
  }
  function renderDraggedRing(note2) {
    VIEWPORT_CTX.save();
    VIEWPORT_CTX.beginPath();
    VIEWPORT_CTX.shadowBlur = 5;
    VIEWPORT_CTX.lineWidth = note2.width;
    VIEWPORT_CTX.arc(
      planet.x,
      planet.y,
      crosshairDistanceFromPlanet() - note2.width / 2,
      0,
      2 * Math.PI,
    );
    VIEWPORT_CTX.strokeStyle = ringColor(note2);
    VIEWPORT_CTX.shadowColor = VIEWPORT_CTX.strokeStyle;
    VIEWPORT_CTX.stroke();
    VIEWPORT_CTX.closePath();
    VIEWPORT_CTX.restore();
  }
  function renderStars() {
    STARS_CTX.fillStyle = "#000";
    STARS_CTX.fillRect(0, 0, STARS.width, STARS.height);
    let prob = 0;
    for (let x = 0; x < STARS.width; x += 10) {
      for (let y = 0; y < STARS.height; y += 10) {
        if (rand() < prob) {
          prob = 0;
          STARS_CTX.fillStyle = choice(["#444", "#555", "#666"]);
          const size = randInt(1, 2);
          STARS_CTX.fillRect(x, y, size, size);
        } else {
          prob += 2e-3;
        }
      }
    }
  }
  function renderPlanet() {
    PLANET_CTX.clearRect(0, 0, PLANET.width, PLANET.height);
    PLANET_CTX.fillStyle = PLANET_CTX.createPattern(svgPattern, "repeat");
    PLANET_CTX.beginPath();
    PLANET_CTX.shadowBlur = BASE_RADIUS;
    PLANET_CTX.shadowColor = "#1cb";
    PLANET_CTX.arc(
      PLANET.width,
      PLANET.height,
      PLANETS[s2].width * BASE_RADIUS,
      0,
      2 * Math.PI,
    );
    PLANET_CTX.fill();
    PLANET_CTX.closePath();
  }
  function loop() {
    if (running) {
      requestId = requestAnimationFrame(loop);
      currentTime = performance.now();
      elapsedTime = (currentTime - lastTime) / 1e3;
      update();
      render();
      lastTime = currentTime;
    }
  }
  function toggleLoop(value) {
    running = value;
    if (running) {
      lastTime = performance.now();
      loop();
      if (screen !== LOADING_SCREEN) {
        playSong(currentSong);
      }
    } else {
      cancelAnimationFrame(requestId);
      stopSong(currentSong);
    }
  }
  onload = async (e) => {
    document.title = "2001: A Space Opera";
    onresize();
    await initCharset(VIEWPORT_CTX);
    svgPattern = await loadImg(
      "data:image/svg+xml;base64," +
        btoa(new XMLSerializer().serializeToString(p)),
    );
    initAudioContext();
    renderStars();
    toggleLoop(true);
  };
  onresize = onrotate = function () {
    scaleToFit = Math.min(
      innerWidth / VIEWPORT.width,
      innerHeight / VIEWPORT.height,
    );
    c.width = VIEWPORT.width * scaleToFit;
    c.height = VIEWPORT.height * scaleToFit;
    CTX.imageSmoothingEnabled =
      VIEWPORT_CTX.imageSmoothingEnabled =
      STARS_CTX.imageSmoothingEnabled =
      PLANET_CTX.imageSmoothingEnabled =
        false;
    canvasX = (window.innerWidth - c.width) / 2;
    window.focus();
  };
  document.onvisibilitychange = function (e) {
    toggleLoop(!e.target.hidden);
  };
  onkeydown = function (e) {
    if (!e.repeat) {
      switch (screen) {
        case GAME_SCREEN:
          switch (e.code) {
            case "KeyP":
              toggleLoop(!running);
              break;
          }
          break;
      }
    }
  };
  onkeyup = function (e) {
    switch (screen) {
      case GAME_SCREEN:
        break;
      case END_SCREEN:
        switch (e.code) {
          case "KeyT":
            open(
              `https://twitter.com/intent/tweet?text=viral%20marketing%20message%20https%3A%2F%2Fgoo.gl%2F${"some tiny Google url here"}`,
              "_blank",
            );
            break;
          default:
            screen = TITLE_SCREEN;
            break;
        }
        break;
    }
  };
  onpointerdown = function (e) {
    e.preventDefault();
    switch (screen) {
      case GAME_SCREEN:
        crosshair.touchTime = currentTime;
        setCrosshairLocation(pointerLocation(e));
        const n = ringUnderCrosshair();
        if (n >= 0) {
          b.style.cursor = "grabbing";
          currentSong[n].dragged = crosshair.touchTime;
          draggedNote = currentSong[n];
        }
        break;
    }
  };
  onpointermove = function (e) {
    e.preventDefault();
    switch (screen) {
      case GAME_SCREEN:
        setCrosshairLocation(pointerLocation(e));
        break;
    }
  };
  onpointerup = function (e) {
    e.preventDefault();
    switch (screen) {
      case TITLE_SCREEN:
        startGame();
        break;
      case GAME_SCREEN:
        crosshair.touchTime = 0;
        b.style.cursor = "default";
        const src = currentSong.findIndex((note2) => note2.dragged);
        if (src >= 0) {
          currentSong[src].dragged = 0;
          draggedNote = 0;
          const dest = ringUnderCrosshair();
          if (dest >= 0) {
            moveRing(src, dest);
            updateNotesDisplayAttributes();
          }
        }
        break;
      case END_SCREEN:
        screen = TITLE_SCREEN;
        break;
    }
  };
  function pointerLocation(e) {
    return [
      clamp(
        Math.round(((e.x || e.pageX) - canvasX) / scaleToFit),
        0,
        VIEWPORT.width,
      ),
      clamp(Math.round((e.y || e.pageY) / scaleToFit), 0, VIEWPORT.height),
    ];
  }
  function setCrosshairLocation([touchX, touchY]) {
    crosshair.x = touchX;
    crosshair.y = touchY;
  }
})();
