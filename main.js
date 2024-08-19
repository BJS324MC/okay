const rad = n => n * Math.PI / 180,
    debugBalls = [],
    generateId = newID(),
    normalized = v => v === 0 ? -1 : v / Math.abs(v),
    limit = v => v > 10000 ? 10000 : v < -10000 ? -10000 : v,
    perpendicular = (m2, px, py) => [-(limit(1 / m2)).toFixed(3), +(py + limit(1 / m2) * px).toFixed(3)],
    LineLineIntersection = (m1, c1, m2, c2) => [(c1 - c2) / (m2 - m1), m2 * (c1 - c2) / (m2 - m1) + c2],
    compareAtoBfromC = (a, b, c) => {
        return a[0] * a[0] - 2 * a[0] * c[0] + a[1] * a[1] - 2 * a[1] * c[1] < b[0] * b[0] - 2 * b[0] * c[0] + b[1] * b[1] - 2 * b[1] * c[1]
    },
    directBall = () => {
        endPos = shapes.map(a => [a.intersect(ogShot.concat(shotSpeed)), a.id]).filter(a => a[0] !== false && a[1] !== contacted);
        if (endPos.length > 1) endPos = endPos.reduce((a, b) => compareAtoBfromC(a[0], b[0], ogShot) ? a : b);
        else if (endPos.length > 0) endPos = endPos[0];
        contacted = endPos[1];
        if (endPos.length > 0) endPos = endPos[0];

    },
    equation = (x1, y1, x2, y2) => {
        if (x2 - x1 === 0)
            x2 += 0.001;
        let m = (y2 - y1) / (x2 - x1),
            c = y1 - m * x1;
        return [m, c];
    },
    reflectPoint = (px, py, m1, c1, m2) => {
        let PPointX = px - m2 / (m2 * m2 + 1),
            mainPointX = (py - m2 * px - c1 + 1) / (m1 - m2),
            otherPointX = 2 * PPointX - mainPointX,
            otherPointY = m2 * otherPointX + py - m2 * px + 1,
            reflectionRay = equation(otherPointX, otherPointY, px, py);
        return [reflectionRay, [otherPointX - px, otherPointY - py]];
    },
    reflectVertically = (px, py, m1, c1) => {
        let otherPointX = px - 1,
            otherPointY = -m1 * (px - 1) + 2 * m1 * px + c1,
            reflectionRay = equation(otherPointX, otherPointY, px, py);
        return [reflectionRay, [otherPointX - px, otherPointY - py]];
    }
raySegmentIntersection = (ray, segment) => {
    let [x, y, dx, dy] = ray,
        [x1, y1, x2, y2] = segment,
        [m1, c1] = equation(x, y, x + dx, y + dy),
        [m2, c2] = equation(x1, y1, x2, y2);
    let [px, py] = LineLineIntersection(m1, c1, m2, c2);
    px = +px.toFixed(3);
    py = +py.toFixed(3);
    if (px * normalized(dx) >= x * normalized(dx) && py * normalized(dy) >= y * normalized(dy)) {
        let C1 = x1 < x2,
            C2 = y1 < y2,
            xMin = C1 ? x1 : x2, yMin = C2 ? y1 : y2,
            xMax = C1 ? x2 : x1, yMax = C2 ? y2 : y1;
        if (py >= yMin && py <= yMax && ((px >= xMin && px <= xMax) || ((Math.abs(m1) > 10000 || Math.abs(m2) > 10000)))) return [px, py, m1, c1, m2, c2];
    }
    return false;
},
    lineCircleIntersection = (a, b, c, p, q, r) => {
        let f = 1 + a * a / b * b, g = (2 * a / b) * (q - c / b) - 2 * p, h = c * c / (b * b) - ((2 * q * c) / b) + p * p + q * q - r * r;
        let intersections = [], n = g * g - 4 * f * h;
        if (n >= 0) {
            n = Math.sqrt(n);
            intersections.push([(-g + n) / (2 * f), (c - a * (-g + n) / (2 * f)) / b]);
            intersections.push([(-g - n) / (2 * f), (c - a * (-g - n) / (2 * f)) / b]);
            return intersections;
        } else return false;
    }
function* newID() {
    let id = 0;
    while (true) yield id++;
}
class Circle {
    constructor(x, y, r) {
        this.x = x;
        this.y = y;
        this.r = r;
        this.id = generateId.next().value;
    }
    intersect(ray) {
        let [x, y, dx, dy] = ray,
            [m1, c1] = equation(x, y, x + dx, y + dy),
            intersection = lineCircleIntersection(m1, -1, -c1, this.x, this.y, this.r);
        if (!intersection) return false;
        let [px, py] = compareAtoBfromC(intersection[0], intersection[1], ray) ? intersection[0] : intersection[1],
            m2 = (this.x - px) / (py - this.y),
            c2 = py - m2 * px;
        if (px * normalized(dx) >= x * normalized(dx) && py * normalized(dy) >= y * normalized(dy)) return [px, py, m1, c1, m2, c2];
        else return false;
    }
    draw(ctx) {
        ctx.beginPath();
        ctx.fillStyle = 'rgb(235,200,200)';
        ctx.arc(this.x + 1, this.y + 1, this.r + 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.fillStyle = 'rgb(255,255,255)';
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fill();
    }
}
class Polygon {
    constructor(points, x, y, angle, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.points = points;
        this.rotate(angle);
        this.id = generateId.next().value;
    }
    rotate(angle = 0) {
        let rs = Math.sin(rad(angle)), rc = Math.cos(rad(angle)), x, y;
        this.points.forEach(a => {
            x = a[0] * rc - a[1] * rs;
            y = a[0] * rs + a[1] * rc;
            a[0] = x; a[1] = y;
        });
    }
    intersect(ray) {
        let intersection = false;
        for (let i = 0; i < this.points.length; i++) {
            let M = (i === this.points.length - 1) ? [this.points[i][0] + this.x, this.points[i][1] + this.y, this.points[0][0] + this.x, this.points[0][1] + this.y]
                : [this.points[i][0] + this.x, this.points[i][1] + this.y, this.points[i + 1][0] + this.x, this.points[i + 1][1] + this.y];
            let result = raySegmentIntersection(ray, M);
            if (result !== false && (intersection === false || compareAtoBfromC(result, intersection, ray))) intersection = result;
        }
        return intersection;
    }
    draw(ctx) {
        ctx.beginPath();
        ctx.fillStyle = 'rgb(255,255,255)';
        let J = this.points.map(a => [a[0] + this.x, a[1] + this.y]);
        ctx.moveTo(...J[this.points.length - 1]);
        for (let p of J)
            ctx.lineTo(...p);
        ctx.fill();
        ctx.strokeStyle = 'rgb(202,202,202)';
        ctx.stroke();
    }
    draw2(ctx) {
        ctx.beginPath();
        ctx.fillStyle = 'red';
        ctx.moveTo(this.points[0][0] + this.x, this.points[0][1] + this.y)
        for (let i = 1; i < this.points.length; i++)ctx.lineTo(this.points[i][0] + this.x, this.points[i][1] + this.y);
        ctx.closePath();
        ctx.fill();
    }
}

const canvas = document.querySelector('canvas'),
    ctx = canvas.getContext('2d');

const text = (x, y, t) => {
    ctx.fillStyle = 'rgb(125,150,150)';
    ctx.fillText(t, x, y);
},
    ball = (x, y) => {
        ctx.beginPath();
        ctx.fillStyle = 'rgb(100,80,80)';
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();
    }

let shot = null,
    ogShot = null,
    target = null,
    effectFinished = false,
    contacted = null,
    lifted = true,
    shotSpeed = [0, 0],
    fadeBalls = [],
    endPos = null,
    shapes = [
        new Polygon([[-100, -100], [-250, 50], [-180, 200], [-20, 200], [50, 50]], 300, 300, 0),
        new Circle(100, 100, 50),
        new Polygon([[0, -50], [-50, 50], [50, 50]], 400, 200, 0),
        new Polygon([[-100, -100], [-100, 100], [100, 100], [100, -100]], 600, 300, 0)
    ];

const frame = () => {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    ctx.textAlign = "center";
    ctx.font = "15px Arial";
    ctx.fillStyle = 'rgb(250,240,250)';
    ctx.fillRect(0, 0, innerWidth, innerHeight);
    text(100, 105, "bruh.");
    if (shot !== null) {
        shot[0] += shotSpeed[0];
        shot[1] += shotSpeed[1];
        if (target !== null) {
            let A = shotSpeed[0] === 0, B = shotSpeed[1] === 0, C = true, S0 = shotSpeed[0] / Math.abs(shotSpeed[0]), S1 = shotSpeed[1] / Math.abs(shotSpeed[1]);
            if (!effectFinished) for (let i = 1; i < 10; i++) {
                let px = (target[0] - ogShot[0]) / 9 * i + ogShot[0], py = (target[1] - ogShot[1]) / 9 * i + ogShot[1];
                if (A && !B) C = shot[1] * S1 < py * S1;
                else if (B && !A) C = shot[0] * S0 < px * S0;
                else if (!A && !B) C = shot[0] * S0 < px * S0 && shot[1] * S1 < py * S1;
                if (!lifted || C) {
                    ctx.beginPath();
                    ctx.fillStyle = 'rgb(100,80,80)';
                    ctx.arc(px, py, 2, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            if ((!A || !B)) fadeBalls.push([...shot, 3]);
            for (let fb of fadeBalls) {
                fb[2] -= 0.1;
                ctx.fillStyle = `rgba(100,80,80,${fb[2]})`;
                ctx.beginPath();
                ctx.arc(fb[0], fb[1], 1, 0, Math.PI * 2);
                ctx.fill();
            }
            for (let j in fadeBalls) if (fadeBalls[j][2] <= 0) fadeBalls.splice(j, 1);
            if (endPos !== null && endPos !== false) {
                let [px, py, m1, c1, m2, c2] = endPos;
                if (A && !B) C = shot[1] * S1 > py * S1;
                else if (B && !A) C = shot[0] * S0 > px * S0;
                else if (!A && !B) C = shot[0] * S0 > px * S0 && shot[1] * S1 > py * S1;
                if (C) {
                    effectFinished = true;
                    let reflection = Math.abs(m2) > 10000 ? reflectVertically(...endPos) : reflectPoint(...endPos),
                        [dx, dy] = reflection[1],
                        m = Math.sqrt(dx ** 2 + dy ** 2);
                    if (m2 * ogShot[0] + c2 <= ogShot[1] === m2 * (px + dx) + c2 >= py + dy) {
                        dx = -dx;
                        dy = -dy;
                    }
                    shotSpeed = [dx / m * 5, dy / m * 5];
                    shot = [px, py];
                    ogShot = [px + shotSpeed[0], py + shotSpeed[1]];
                    ctx.strokeStyle = "black";
                    directBall();
                }
            }
        }
        ball(...shot);
    }
    for (let b of debugBalls) ball(...b);
    for (let shape of shapes) shape.draw(ctx);
    requestAnimationFrame(frame);
}

frame();

const holding = e => {
    if (lifted) {
        effectFinished = false;
        contacted = null;
        endPos = null;
        shotSpeed = [0, 0];
        lifted = false;
        fadeBalls = [];
        shot = [e.clientX, e.clientY];
        ogShot = [e.clientX, e.clientY];
        target = [e.clientX, e.clientY];
    }
},
    moving = e => !lifted && (target = [e.clientX, e.clientY]),
    releasing = () => {
        if (!lifted) {
            lifted = true;
            let dx = target[0] - shot[0], dy = target[1] - shot[1];
            if (Math.abs(dx) < 20 && Math.abs(dy) < 20) {
                target = null;
                shot = null;
            } else {
                let m = Math.sqrt(dx ** 2 + dy ** 2);
                shotSpeed = [dx / m * 5, dy / m * 5];
                directBall();
            };
        }
    },
    mobile = fn => e => fn(e.touches[0]);

addEventListener('mousedown', holding);
addEventListener('mousemove', moving);
addEventListener('mouseup', releasing);

addEventListener('touchstart', mobile(holding));
addEventListener('touchmove', mobile(moving));
addEventListener('touchend', mobile(releasing));