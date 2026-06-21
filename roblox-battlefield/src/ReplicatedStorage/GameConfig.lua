--[[
	GameConfig (ModuleScript)
	Local: ReplicatedStorage

	Centraliza todos os valores de balanceamento do jogo.
	Tanto o servidor quanto o cliente leem daqui, evitando "numeros magicos"
	espalhados pelo codigo.
]]

local GameConfig = {}

-- Vida do personagem
GameConfig.MaxHealth = 150

-- ===== Soco (ataque corpo-a-corpo) =====
GameConfig.Punch = {
	Damage = 15,        -- dano por soco
	Range = 8,          -- alcance em studs
	Cooldown = 0.45,    -- tempo entre socos (segundos)
	Knockback = 25,     -- empurrao aplicado no alvo
}

-- ===== Poderes (ataques especiais) =====
-- Cada poder tem uma tecla, dano, cooldown e custo de energia.
GameConfig.Powers = {
	Fireball = {            -- Bola de fogo (tecla Q)
		Key = "Q",
		Damage = 35,
		Cooldown = 3,
		EnergyCost = 30,
		Speed = 80,         -- velocidade do projetil (studs/s)
		Lifetime = 4,       -- tempo de vida do projetil
		Color = Color3.fromRGB(255, 110, 0),
		BlastRadius = 6,    -- raio de explosao ao atingir
	},
	Shockwave = {           -- Onda de choque ao redor (tecla E)
		Key = "E",
		Damage = 45,
		Cooldown = 6,
		EnergyCost = 50,
		Radius = 18,        -- raio da onda
		Knockback = 70,
		Color = Color3.fromRGB(0, 170, 255),
	},
	Dash = {                -- Avanco rapido / esquiva (tecla F)
		Key = "F",
		Cooldown = 2,
		EnergyCost = 20,
		Power = 90,         -- forca do impulso
	},
}

-- ===== Energia (recurso para usar poderes) =====
GameConfig.Energy = {
	Max = 100,
	RegenPerSecond = 12,    -- quanto regenera por segundo
}

return GameConfig
