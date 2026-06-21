--[[
	EffectsClient (LocalScript)
	Local: StarterPlayer > StarterPlayerScripts

	Recebe avisos do servidor (Remotes.Effect) e toca os efeitos visuais
	correspondentes para TODOS os jogadores. Efeitos sao puramente cosmeticos.
]]

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Debris = game:GetService("Debris")
local TweenService = game:GetService("TweenService")

local Remotes = require(ReplicatedStorage:WaitForChild("RemotesSetup"))

-- Cria uma esfera de "explosao/onda" que cresce e some.
local function spawnBlast(position, color, maxRadius)
	local part = Instance.new("Part")
	part.Anchored = true
	part.CanCollide = false
	part.Shape = Enum.PartType.Ball
	part.Material = Enum.Material.Neon
	part.Color = color or Color3.new(1, 1, 1)
	part.Transparency = 0.2
	part.Size = Vector3.new(1, 1, 1)
	part.CFrame = CFrame.new(position)
	part.Parent = workspace

	local size = (maxRadius or 6) * 2
	local tween = TweenService:Create(
		part,
		TweenInfo.new(0.4, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
		{ Size = Vector3.new(size, size, size), Transparency = 1 }
	)
	tween:Play()
	Debris:AddItem(part, 0.5)
end

-- Faz uma parte do personagem brilhar/piscar rapidamente.
local function flashCharacter(character, color)
	if not character then return end
	local hrp = character:FindFirstChild("HumanoidRootPart")
	if not hrp then return end

	local highlight = Instance.new("Highlight")
	highlight.FillColor = color or Color3.fromRGB(255, 255, 255)
	highlight.FillTransparency = 0.5
	highlight.OutlineTransparency = 0
	highlight.Parent = character
	Debris:AddItem(highlight, 0.25)
end

local handlers = {}

function handlers.Punch(data)
	flashCharacter(data.character, Color3.fromRGB(255, 240, 150))
end

function handlers.Cast(data)
	flashCharacter(data.character, Color3.fromRGB(255, 120, 0))
end

function handlers.Explosion(data)
	spawnBlast(data.position, data.color, data.radius)
end

function handlers.Shockwave(data)
	spawnBlast(data.position, data.color, data.radius)
end

function handlers.Dash(data)
	flashCharacter(data.character, Color3.fromRGB(180, 220, 255))
end

Remotes.Effect.OnClientEvent:Connect(function(effectName, data)
	local handler = handlers[effectName]
	if handler then
		handler(data or {})
	end
end)
