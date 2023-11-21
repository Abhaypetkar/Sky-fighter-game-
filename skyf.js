const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const player = {
    x: canvas.width / 2 - 25,
    y: canvas.height - 50,
    width: 100,
    height: 50,
    speed: 5,
    health: 130,
    continuousFireInterval: 300,
    lastShotTime: 0,
};

const bullets = [];
const enemies = [];
const enemyBullets = []; // Add this line for enemy bullets
const enemySpeed = 2;
const bulletSpeed = 5;
const enemyBulletSpeed = 3;
let score = 0;
let enemySpawnInterval = 1000;
let lastEnemySpawnTime = 0;
let enemyFireInterval = 2000;
let lastEnemyFireTime = 0;


const playerImage = new Image();
playerImage.src = "Image/rocket.png";
const enemyImage = new Image();
enemyImage.src = "Image/rocket2.png";

class QuadTree {
    constructor(x, y, width, height, capacity) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.capacity = capacity;
        this.objects = [];
        this.isDivided = false;
    }

    insert(object) {
        if (!this.isDivided) {
            this.objects.push(object);

            if (this.objects.length > this.capacity) {
                this.subdivide();
            }
        } else {
            for (let i = 0; i < 4; i++) {
                if (this.children[i].contains(object)) {
                    this.children[i].insert(object);
                    break;
                }
            }
        }
    }

    subdivide() {
        const childWidth = this.width / 2;
        const childHeight = this.height / 2;
        this.children = [
            new QuadTree(this.x, this.y, childWidth, childHeight, this.capacity),
            new QuadTree(this.x + childWidth, this.y, childWidth, childHeight, this.capacity),
            new QuadTree(this.x, this.y + childHeight, childWidth, childHeight, this.capacity),
            new QuadTree(this.x + childWidth, this.y + childHeight, childWidth, childHeight, this.capacity),
        ];

        for (const object of this.objects) {
            for (let i = 0; i < 4; i++) {
                if (this.children[i].contains(object)) {
                    this.children[i].insert(object);
                    break;
                }
            }
        }
        this.objects = [];
        this.isDivided = true;
    }

    contains(object) {
        return (
            object.x >= this.x &&
            object.x + object.width <= this.x + this.width &&
            object.y >= this.y &&
            object.y + object.height <= this.y + this.height
        );
    }

    queryRange(range, foundObjects) {
        if (!this.isDivided) {
            for (const object of this.objects) {
                if (rangeIntersects(range, object)) {
                    foundObjects.push(object);
                }
            }
        } else {
            for (let i = 0; i < 4; i++) {
                if (rangeIntersects(range, this.children[i])) {
                    this.children[i].queryRange(range, foundObjects);
                }
            }
        }
    }
}

function rangeIntersects(range, object) {
    return (
        range.x < object.x + object.width &&
        range.x + range.width > object.x &&
        range.y < object.y + object.height &&
        range.y + range.height > object.y
    );
}

const quadTree = new QuadTree(0, 0, canvas.width, canvas.height, 4);

function drawPlayer() {
    ctx.fillStyle = "white";
    ctx.drawImage(playerImage, player.x, player.y, player.width, player.height);
    ctx.fillStyle = "green";
    ctx.fillRect(player.x, player.y, player.health*0.6, 5);
}

function drawBullets() {
    ctx.fillStyle = "white";
    for (let i = 0; i < bullets.length; i++) {
        ctx.fillRect(bullets[i].x, bullets[i].y, 5, 10);
    }
    ctx.fillStyle = "red";
    for (let i = 0; i < enemyBullets.length; i++) {
        ctx.fillRect(enemyBullets[i].x, enemyBullets[i].y, 5, 10);
    }
}

function drawEnemies() {
    ctx.fillStyle = "red";
    for (let i = 0; i < enemies.length; i++) 
        ctx.drawImage(enemyImage, enemies[i].x, enemies[i].y, 40, 40);
    }


    function movePlayer() {
        const keys = {};
    
        document.addEventListener("keydown", function (event) {
            keys[event.key] = true;
    
            if (keys["ArrowLeft"] && player.x > 0) {
                player.x -= player.speed;
            }
    
            if (keys["ArrowRight"] && player.x < canvas.width - player.width) {
                player.x += player.speed;
            }
    
            if (keys[" "] || keys["Spacebar"]) {
                const currentTime = new Date().getTime();
                if (currentTime - player.lastShotTime > player.continuousFireInterval) {
                    bullets.push({
                        x: player.x + player.width / 2 - 2.5,
                        y: player.y,
                    });
                    player.lastShotTime = currentTime;
                }
            }
        });
    
        document.addEventListener("keyup", function (event) {
            delete keys[event.key];
        });
    }
    
function moveBullets() {
    for (let i = 0; i < bullets.length; i++) {
        bullets[i].y -= bulletSpeed;
        if (bullets[i].y < 0) {
            bullets.splice(i, 1);
            i--;
        }
    }
}

function moveEnemies() {
    for (let i = 0; i < enemies.length; i++) {
        enemies[i].y += enemySpeed;
        if (enemies[i].y > canvas.height) {
            enemies.splice(i, 1);
            i--;
        }
    }
}

function moveEnemyBullets() {
    for (let i = 0; i < enemyBullets.length; i++) {
        enemyBullets[i].y += enemyBulletSpeed;
        if (enemyBullets[i].y > canvas.height) {
            enemyBullets.splice(i, 1);
            i--;
        }
    }
}

function enemyFire() {
    const currentTime = new Date().getTime();
    if (currentTime - lastEnemyFireTime > enemyFireInterval) {
        for (let i = 0; i < enemies.length; i++) {
            enemyBullets.push({
                x: enemies[i].x + 18,
                y: enemies[i].y + 40,
            });
        }
        lastEnemyFireTime = currentTime;
    }
}
function healthbar(){
    let Width=document.getElementById("healthBarFill");
    Width.style.width=(Width.offsetWidth-20)+"px";
}

function checkEnemyBulletCollisions() {
    for (let i = 0; i < enemyBullets.length; i++) {
        if (
            player.x < enemyBullets[i].x + 5 &&
            player.x + player.width > enemyBullets[i].x &&
            player.y < enemyBullets[i].y + 10 &&
            player.y + player.height > enemyBullets[i].y
        ) {
            enemyBullets.splice(i, 1);
            player.health -= 13;
            healthbar();
            i--;
        }
    }
}

function checkCollisions() {
    for (let i = 0; i < bullets.length; i++) {
        for (let j = 0; j < enemies.length; j++) {
            if (
                bullets[i].x < enemies[j].x + 40 &&
                bullets[i].x + 5 > enemies[j].x &&
                bullets[i].y < enemies[j].y + 40 &&
                bullets[i].y + 10 > enemies[j].y
            ) {
                bullets.splice(i, 1);
                enemies.splice(j, 1);
                score += 10;
                i--;
                break;
            }
        }
    }
}

function spawnEnemies() {
    const randomX = Math.floor(Math.random() * (canvas.width - 40));
    enemies.push({
        x: randomX,
        y: 0,
    });
}

function update() {
    const currentTime = new Date().getTime();

    if (currentTime - lastEnemySpawnTime > enemySpawnInterval) {
        spawnEnemies();
        lastEnemySpawnTime = currentTime;
    }

    moveBullets();
    moveEnemyBullets();
    moveEnemies();
    checkCollisions();
    checkEnemyBulletCollisions();
    enemyFire();

    for (let i = 0; i < enemies.length; i++) {
        if (
            player.x < enemies[i].x + 40 &&
            player.x + player.width > enemies[i].x &&
            player.y < enemies[i].y + 40 &&
            player.y + player.height > enemies[i].y
        ) {
            player.health -= 13;
            healthbar();
            enemies.splice(i, 1);
            
         
        }
    }
  
    if (player.health <= 0) {
        gameOver();
    }
}

function drawScore() {
    ctx.fillStyle = "white";
    ctx.font = "20px Arial ";
    ctx.fillText("Score: " +score,700,20);
}
function gameOver() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.font = "36px Arial";
    ctx.fillText("Game Over", canvas.width / 2 - 100, canvas.height / 2);
    ctx.font = "20px Arial";
    ctx.fillText("Final Score: " + score, canvas.width / 2 - 60, canvas.height / 2 + 30);
    document.getElementById("reload").style.display="block";
}
function gameLoop() {
    if (player.health > 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawPlayer();
        drawBullets();
        drawEnemies();
        update();
        drawScore();
        requestAnimationFrame(gameLoop);
    }
}

movePlayer();
gameLoop();