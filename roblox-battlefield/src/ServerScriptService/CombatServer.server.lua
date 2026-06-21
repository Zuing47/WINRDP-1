--[[
	CombatServer (Script)
	Local: ServerScriptService

	Servidor AUTORITATIVO de combate. Toda a logica de dano, cooldown e
	energia roda aqui para evitar trapaca (o cliente so PEDE para atacar).

	Responsabilidades:
	  - Configurar a vida de cada jogador ao nascer
	  - Receber pedidos de Soco e Poder, validar cooldown/energia e aplicar dano
	  - Regenerar energia ao longo do tempo
	  - Avisar os clientes para tocar efeitos visuais
]]

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local Debris = game:GetService("Debris")

local Config = require(ReplicatedStorage:WaitForChild("GameConfig"))
local Remotes = require(ReplicatedStorage:WaitForChild("RemotesSetup"))

-- Estado por jogador: cooldowns e energia.
local state = {} -- [player] = { energy = n, lastPunch = t, powerCd = { [nome] = t } }

local function now()
	return os.clock()
end

-- ---------- utilidades ----------

local function getCharacterParts(player)
	local char = player.Character
	if not char then return nil end
	local hrp = char:FindFirstChild("HumanoidRootPart")
	local hum = char:FindFirstChildOfClass("Humanoid")
	if not hrp or not hum or hum.Health <= 0 then return nil end
	return char, hrp, hum
end

-- Aplica dano a um Humanoid, creditando o atacante.
local function applyDamage(targetHum, amount, attacker)
	if not targetHum or targetHum.Health <= 0 then return end
	targetHum:TakeDamage(amount)

	-- Marca quem causou o dano (util para sistema de kills/pontos).
	local tag = Instance.new("ObjectValue")
	tag.Name = "creator"
	tag.Value = attacker
	tag.Parent = targetHum
	Debris:AddItem(tag, 2)
end

-- Empurra uma parte para longe de uma origem.
local function applyKnockback(targetHrp, fromPosition, power)
	if power <= 0 then return end
	local direction = (targetHrp.Position - fromPosition)
	direction = Vector3.new(direction.X, 0, direction.Z)
	if direction.Magnitude < 0.1 then
		direction = Vector3.new(0, 0, 1)
	end
	direction = direction.Unit

	local bv = Instance.new("BodyVelocity")
	bv.MaxForce = Vector3.new(1e5, 1e5, 1e5)
	bv.Velocity = direction * power + Vector3.new(0, power * 0.4, 0)
	bv.Parent = targetHrp
	Debris:AddItem(bv, 0.2)
end

-- Retorna todos os personagens inimigos dentro de um raio de uma posicao.
local function getTargetsInRadius(originPos, radius, exceptPlayer)
	local hits = {}
	for _, player in ipairs(Players:GetPlayers()) do
		if player ~= exceptPlayer then
			local char, hrp, hum = getCharacterParts(player)
			if char and (hrp.Position - originPos).Magnitude <= radius then
				table.insert(hits, { player = player, hrp = hrp, hum = hum })
			end
		end
	end
	return hits
end

local function changeEnergy(player, delta)
	local s = state[player]
	if not s then return end
	s.energy = math.clamp(s.energy + delta, 0, Config.Energy.Max)
	-- Avisa a UI do dono.
	local char, _, hum = getCharacterParts(player)
	Remotes.StatsChanged:FireClient(player, {
		Energy = s.energy,
		MaxEnergy = Config.Energy.Max,
		Health = hum and hum.Health or 0,
		MaxHealth = Config.MaxHealth,
	})
end

-- ---------- soco ----------

local function handlePunch(player)
	local s = state[player]
	if not s then return end

	-- Cooldown
	if now() - s.lastPunch < Config.Punch.Cooldown then return end

	local char, hrp, hum = getCharacterParts(player)
	if not char then return end
	s.lastPunch = now()

	-- Acerta o inimigo mais proximo a frente, dentro do alcance.
	local origin = hrp.Position + hrp.CFrame.LookVector * (Config.Punch.Range * 0.5)
	local targets = getTargetsInRadius(origin, Config.Punch.Range * 0.5, player)

	for _, t in ipairs(targets) do
		applyDamage(t.hum, Config.Punch.Damage, player)
		applyKnockback(t.hrp, hrp.Position, Config.Punch.Knockback)
	end

	-- Efeito visual para todos.
	Remotes.Effect:FireAllClients("Punch", { character = char })
end

-- ---------- poderes ----------

local function canUsePower(player, powerName)
	local s = state[player]
	local cfg = Config.Powers[powerName]
	if not s or not cfg then return false, nil end

	local lastUse = s.powerCd[powerName] or 0
	if now() - lastUse < cfg.Cooldown then return false, nil end

	local cost = cfg.EnergyCost or 0
	if s.energy < cost then return false, nil end

	return true, cfg
end

local PowerHandlers = {}

-- Bola de fogo: cria um projetil que voa e explode no impacto.
function PowerHandlers.Fireball(player, char, hrp, cfg)
	local projectile = Instance.new("Part")
	projectile.Shape = Enum.PartType.Ball
	projectile.Size = Vector3.new(2, 2, 2)
	projectile.Color = cfg.Color
	projectile.Material = Enum.Material.Neon
	projectile.CanCollide = false
	projectile.CFrame = hrp.CFrame * CFrame.new(0, 1, -3)
	projectile.Parent = workspace

	local fire = Instance.new("Fire")
	fire.Size = 6
	fire.Parent = projectile

	local velocity = hrp.CFrame.LookVector * cfg.Speed
	local bv = Instance.new("BodyVelocity")
	bv.MaxForce = Vector3.new(1e5, 1e5, 1e5)
	bv.Velocity = velocity
	bv.Parent = projectile

	local exploded = false
	local function explode(atPosition)
		if exploded then return end
		exploded = true

		local targets = getTargetsInRadius(atPosition, cfg.BlastRadius, player)
		for _, t in ipairs(targets) do
			applyDamage(t.hum, cfg.Damage, player)
			applyKnockback(t.hrp, atPosition, Config.Punch.Knockback)
		end

		Remotes.Effect:FireAllClients("Explosion", {
			position = atPosition,
			color = cfg.Color,
			radius = cfg.BlastRadius,
		})
		projectile:Destroy()
	end

	projectile.Touched:Connect(function(hit)
		-- Ignora o proprio atacante.
		if hit:IsDescendantOf(char) then return end
		explode(projectile.Position)
	end)

	Debris:AddItem(projectile, cfg.Lifetime)

	Remotes.Effect:FireAllClients("Cast", { character = char, power = "Fireball" })
end

-- Onda de choque: dano em area ao redor do jogador.
function PowerHandlers.Shockwave(player, char, hrp, cfg)
	local targets = getTargetsInRadius(hrp.Position, cfg.Radius, player)
	for _, t in ipairs(targets) do
		applyDamage(t.hum, cfg.Damage, player)
		applyKnockback(t.hrp, hrp.Position, cfg.Knockback)
	end

	Remotes.Effect:FireAllClients("Shockwave", {
		position = hrp.Position,
		color = cfg.Color,
		radius = cfg.Radius,
	})
end

-- Dash: impulso rapido na direcao que o jogador olha.
function PowerHandlers.Dash(player, char, hrp, cfg)
	local bv = Instance.new("BodyVelocity")
	bv.MaxForce = Vector3.new(1e5, 0, 1e5)
	bv.Velocity = hrp.CFrame.LookVector * cfg.Power
	bv.Parent = hrp
	Debris:AddItem(bv, 0.25)

	Remotes.Effect:FireAllClients("Dash", { character = char })
end

local function handleUsePower(player, powerName)
	if typeof(powerName) ~= "string" then return end

	local ok, cfg = canUsePower(player, powerName)
	if not ok then return end

	local char, hrp = getCharacterParts(player)
	if not char then return end

	local handler = PowerHandlers[powerName]
	if not handler then return end

	-- Cobra o custo e marca cooldown ANTES de executar.
	local s = state[player]
	s.powerCd[powerName] = now()
	changeEnergy(player, -(cfg.EnergyCost or 0))

	handler(player, char, hrp, cfg)
end

-- ---------- ciclo de vida do jogador ----------

local function onCharacterAdded(player, char)
	local hum = char:WaitForChild("Humanoid")
	hum.MaxHealth = Config.MaxHealth
	hum.Health = Config.MaxHealth

	-- Reseta energia ao renascer.
	local s = state[player]
	if s then
		s.energy = Config.Energy.Max
		s.powerCd = {}
		s.lastPunch = 0
	end
end

local function onPlayerAdded(player)
	state[player] = {
		energy = Config.Energy.Max,
		lastPunch = 0,
		powerCd = {},
	}
	player.CharacterAdded:Connect(function(char)
		onCharacterAdded(player, char)
	end)
	if player.Character then
		onCharacterAdded(player, player.Character)
	end
end

local function onPlayerRemoving(player)
	state[player] = nil
end

Players.PlayerAdded:Connect(onPlayerAdded)
Players.PlayerRemoving:Connect(onPlayerRemoving)
for _, player in ipairs(Players:GetPlayers()) do
	onPlayerAdded(player)
end

-- ---------- conexao dos remotes ----------

Remotes.Punch.OnServerEvent:Connect(handlePunch)
Remotes.UsePower.OnServerEvent:Connect(handleUsePower)

-- ---------- regeneracao de energia ----------

local regenAccumulator = 0
RunService.Heartbeat:Connect(function(dt)
	regenAccumulator = regenAccumulator + dt
	if regenAccumulator < 0.25 then return end -- atualiza 4x por segundo
	local gained = Config.Energy.RegenPerSecond * regenAccumulator
	regenAccumulator = 0

	for player, s in pairs(state) do
		if s.energy < Config.Energy.Max then
			changeEnergy(player, gained)
		end
	end
end)

print("[Battlefield] CombatServer iniciado.")
