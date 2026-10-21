"""
Space Invaders - Python / Pygame Implementation
Inspired by classic arcade retro games and beginner-friendly Python game development.

To run:
    pip install pygame
    python space_invaders.py
"""

import sys
import math
import random

try:
    import pygame
except ImportError:
    print("Pygame is not installed. Please install it using: pip install pygame")
    sys.exit(1)

# Initialize Pygame
pygame.init()
pygame.mixer.init()

# Game Window Dimensions
SCREEN_WIDTH = 800
SCREEN_HEIGHT = 600
screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
pygame.display.set_caption("Space Invaders · Syntax2Code")
clock = pygame.time.Clock()
FPS = 60

# Colors (RGB)
BLACK = (10, 10, 20)
WHITE = (255, 255, 255)
GREEN = (74, 222, 128)
CYAN = (56, 189, 248)
YELLOW = (250, 204, 21)
MAGENTA = (244, 114, 182)
RED = (239, 68, 68)

# Starfield Background
stars = [
    [random.randint(0, SCREEN_WIDTH), random.randint(0, SCREEN_HEIGHT), random.randint(1, 3)]
    for _ in range(75)
]


class Player:
    def __init__(self):
        self.width = 44
        self.height = 24
        self.x = SCREEN_WIDTH // 2 - self.width // 2
        self.y = SCREEN_HEIGHT - 60
        self.speed = 6
        self.lives = 3
        self.score = 0

    def move_left(self):
        self.x = max(10, self.x - self.speed)

    def move_right(self):
        self.x = min(SCREEN_WIDTH - self.width - 10, self.x + self.speed)

    def draw(self, surface):
        # Draw retro pixel cannon
        cx = self.x + self.width // 2
        # Base
        pygame.draw.rect(surface, GREEN, (self.x, self.y + 10, self.width, 14), border_radius=3)
        # Cockpit
        pygame.draw.rect(surface, GREEN, (cx - 10, self.y + 4, 20, 10), border_radius=2)
        # Laser turret
        pygame.draw.rect(surface, (255, 255, 255), (cx - 2, self.y - 4, 4, 8))


class Bullet:
    def __init__(self, x, y, is_enemy=False):
        self.x = x
        self.y = y
        self.is_enemy = is_enemy
        self.speed = 7 if not is_enemy else 4
        self.radius = 3

    def update(self):
        if self.is_enemy:
            self.y += self.speed
        else:
            self.y -= self.speed

    def draw(self, surface):
        color = RED if self.is_enemy else CYAN
        pygame.draw.circle(surface, color, (int(self.x), int(self.y)), self.radius)
        if not self.is_enemy:
            # Laser glow effect
            pygame.draw.line(surface, WHITE, (self.x, self.y), (self.x, self.y + 8), 2)


class Invader:
    def __init__(self, x, y, row):
        self.x = x
        self.y = y
        self.row = row
        self.width = 32
        self.height = 22
        self.alive = True

        # Assign point value and color by row
        if row == 0:
            self.color = MAGENTA
            self.points = 30
        elif row in (1, 2):
            self.color = CYAN
            self.points = 20
        else:
            self.color = YELLOW
            self.points = 10

    def draw(self, surface, anim_frame):
        if not self.alive:
            return
        # Retro alien sprite body
        pygame.draw.rect(surface, self.color, (self.x + 4, self.y + 4, 24, 14), border_radius=3)
        # Eyes
        eye_color = BLACK
        pygame.draw.rect(surface, eye_color, (self.x + 8, self.y + 8, 4, 4))
        pygame.draw.rect(surface, eye_color, (self.x + 20, self.y + 8, 4, 4))

        # Antennae / legs anim
        if anim_frame == 0:
            pygame.draw.rect(surface, self.color, (self.x + 2, self.y + 18, 4, 4))
            pygame.draw.rect(surface, self.color, (self.x + 26, self.y + 18, 4, 4))
        else:
            pygame.draw.rect(surface, self.color, (self.x + 6, self.y + 18, 4, 4))
            pygame.draw.rect(surface, self.color, (self.x + 22, self.y + 18, 4, 4))


class Particle:
    def __init__(self, x, y, color):
        self.x = x
        self.y = y
        self.color = color
        angle = random.uniform(0, 2 * math.pi)
        speed = random.uniform(1, 4)
        self.vx = math.cos(angle) * speed
        self.vy = math.sin(angle) * speed
        self.life = 25

    def update(self):
        self.x += self.vx
        self.y += self.vy
        self.life -= 1

    def draw(self, surface):
        if self.life > 0:
            size = max(1, int(self.life / 6))
            pygame.draw.circle(surface, self.color, (int(self.x), int(self.y)), size)


def create_invaders():
    invaders = []
    rows = 4
    cols = 9
    start_x = 100
    start_y = 70
    spacing_x = 65
    spacing_y = 42

    for r in range(rows):
        for c in range(cols):
            x = start_x + c * spacing_x
            y = start_y + r * spacing_y
            invaders.append(Invader(x, y, r))
    return invaders


def main():
    font_large = pygame.font.SysFont("Courier", 36, bold=True)
    font_small = pygame.font.SysFont("Courier", 18, bold=True)

    player = Player()
    bullets = []
    invaders = create_invaders()
    particles = []

    invader_dir = 1
    invader_speed = 1.0
    invader_step_timer = 0
    anim_frame = 0
    game_over = False
    game_won = False

    running = True
    while running:
        clock.tick(FPS)
        invader_step_timer += 1

        # Event handling
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_SPACE and not game_over and not game_won:
                    # Fire laser (limit max 3 on screen)
                    player_bullets = [b for b in bullets if not b.is_enemy]
                    if len(player_bullets) < 3:
                        bullets.append(Bullet(player.x + player.width // 2, player.y))
                elif event.key == pygame.K_r and (game_over or game_won):
                    # Restart game
                    player = Player()
                    bullets = []
                    particles = []
                    invaders = create_invaders()
                    invader_speed = 1.0
                    game_over = False
                    game_won = False
                elif event.key == pygame.K_ESCAPE:
                    running = False

        keys = pygame.key.get_pressed()
        if not game_over and not game_won:
            if keys[pygame.K_LEFT] or keys[pygame.K_a]:
                player.move_left()
            if keys[pygame.K_RIGHT] or keys[pygame.K_d]:
                player.move_right()

        # Update starfield
        for star in stars:
            star[1] = (star[1] + star[2] * 0.5) % SCREEN_HEIGHT

        if not game_over and not game_won:
            # Invaders movement
            living_invaders = [inv for inv in invaders if inv.alive]
            if len(living_invaders) == 0:
                game_won = True
            else:
                # Speed scales as invaders are destroyed
                current_speed = invader_speed + (36 - len(living_invaders)) * 0.08
                if invader_step_timer % 30 == 0:
                    anim_frame = 1 - anim_frame

                hit_edge = False
                for inv in living_invaders:
                    inv.x += invader_dir * current_speed
                    if inv.x <= 20 or inv.x + inv.width >= SCREEN_WIDTH - 20:
                        hit_edge = True
                    if inv.y + inv.height >= player.y:
                        game_over = True

                if hit_edge:
                    invader_dir *= -1
                    for inv in living_invaders:
                        inv.y += 18

                # Enemy random shooting
                if random.random() < 0.02 and len(living_invaders) > 0:
                    shooter = random.choice(living_invaders)
                    bullets.append(Bullet(shooter.x + shooter.width // 2, shooter.y + shooter.height, is_enemy=True))

            # Update bullets
            for b in bullets[:]:
                b.update()
                # Remove out of bounds
                if b.y < 0 or b.y > SCREEN_HEIGHT:
                    bullets.remove(b)
                    continue

                # Player laser hitting invader
                if not b.is_enemy:
                    for inv in living_invaders:
                        if (
                            inv.alive
                            and inv.x <= b.x <= inv.x + inv.width
                            and inv.y <= b.y <= inv.y + inv.height
                        ):
                            inv.alive = False
                            player.score += inv.points
                            if b in bullets:
                                bullets.remove(b)
                            # Create explosion particles
                            for _ in range(12):
                                particles.append(Particle(b.x, b.y, inv.color))
                            break
                else:
                    # Enemy laser hitting player
                    if (
                        player.x <= b.x <= player.x + player.width
                        and player.y <= b.y <= player.y + player.height
                    ):
                        if b in bullets:
                            bullets.remove(b)
                        player.lives -= 1
                        for _ in range(16):
                            particles.append(Particle(player.x + 20, player.y + 10, GREEN))
                        if player.lives <= 0:
                            game_over = True

            # Update particles
            for p in particles[:]:
                p.update()
                if p.life <= 0:
                    particles.remove(p)

        # Drawing
        screen.fill(BLACK)

        # Stars
        for star in stars:
            color = (180, 180, 220) if star[2] > 1 else (100, 100, 140)
            pygame.draw.circle(screen, color, (star[0], int(star[1])), star[2])

        # Invaders
        for inv in invaders:
            inv.draw(screen, anim_frame)

        # Bullets & Particles
        for b in bullets:
            b.draw(screen)
        for p in particles:
            p.draw(screen)

        # Player
        if not game_over:
            player.draw(screen)

        # HUD / Scores
        score_text = font_small.render(f"SCORE: {player.score}", True, WHITE)
        lives_text = font_small.render(f"LIVES: {'❤ ' * player.lives}", True, RED)
        screen.blit(score_text, (20, 20))
        screen.blit(lives_text, (SCREEN_WIDTH - 150, 20))

        # Game Over / Win overlays
        if game_over:
            over_title = font_large.render("GAME OVER", True, RED)
            over_sub = font_small.render("Press 'R' to Restart or 'ESC' to Exit", True, WHITE)
            screen.blit(over_title, (SCREEN_WIDTH // 2 - over_title.get_width() // 2, SCREEN_HEIGHT // 2 - 40))
            screen.blit(over_sub, (SCREEN_WIDTH // 2 - over_sub.get_width() // 2, SCREEN_HEIGHT // 2 + 10))
        elif game_won:
            win_title = font_large.render("VICTORY! GALAXY SAVED!", True, GREEN)
            win_sub = font_small.render("Press 'R' to Play Again", True, WHITE)
            screen.blit(win_title, (SCREEN_WIDTH // 2 - win_title.get_width() // 2, SCREEN_HEIGHT // 2 - 40))
            screen.blit(win_sub, (SCREEN_WIDTH // 2 - win_sub.get_width() // 2, SCREEN_HEIGHT // 2 + 10))

        pygame.display.flip()

    pygame.quit()
    sys.exit()


if __name__ == "__main__":
    main()
