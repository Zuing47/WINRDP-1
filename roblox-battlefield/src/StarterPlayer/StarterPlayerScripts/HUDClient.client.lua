--[[
	HUDClient (LocalScript)
	Local: StarterPlayer > StarterPlayerScripts

	Cria uma interface simples (via codigo) mostrando as barras de
	Vida e Energia, alem de uma dica de controles.
	Atualiza ao receber Remotes.StatsChanged do servidor.
]]

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")

local Config = require(ReplicatedStorage:WaitForChild("GameConfig"))
local Remotes = require(ReplicatedStorage:WaitForChild("RemotesSetup"))

local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

-- ---------- montagem da UI ----------

local screen = Instance.new("ScreenGui")
screen.Name = "BattlefieldHUD"
screen.ResetOnSpawn = false
screen.IgnoreGuiInset = true
screen.Parent = playerGui

local function makeBar(label, color, yOffset)
	local holder = Instance.new("Frame")
	holder.Size = UDim2.new(0, 260, 0, 26)
	holder.Position = UDim2.new(0, 20, 1, -yOffset)
	holder.BackgroundColor3 = Color3.fromRGB(25, 25, 30)
	holder.BorderSizePixel = 0
	holder.Parent = screen

	local corner = Instance.new("UICorner")
	corner.CornerRadius = UDim.new(0, 6)
	corner.Parent = holder

	local fill = Instance.new("Frame")
	fill.Name = "Fill"
	fill.Size = UDim2.new(1, 0, 1, 0)
	fill.BackgroundColor3 = color
	fill.BorderSizePixel = 0
	fill.Parent = holder

	local fillCorner = corner:Clone()
	fillCorner.Parent = fill

	local text = Instance.new("TextLabel")
	text.Name = "Text"
	text.Size = UDim2.new(1, 0, 1, 0)
	text.BackgroundTransparency = 1
	text.Font = Enum.Font.GothamBold
	text.TextSize = 14
	text.TextColor3 = Color3.new(1, 1, 1)
	text.Text = label
	text.Parent = holder

	return fill, text
end

local healthFill, healthText = makeBar("Vida", Color3.fromRGB(230, 60, 60), 70)
local energyFill, energyText = makeBar("Energia", Color3.fromRGB(60, 160, 255), 38)

-- Dica de controles.
local tip = Instance.new("TextLabel")
tip.Size = UDim2.new(0, 400, 0, 20)
tip.Position = UDim2.new(0, 20, 1, -98)
tip.BackgroundTransparency = 1
tip.Font = Enum.Font.Gotham
tip.TextXAlignment = Enum.TextXAlignment.Left
tip.TextSize = 13
tip.TextColor3 = Color3.fromRGB(220, 220, 220)
tip.Text = "Clique = Soco  |  Q = Bola de Fogo  |  E = Onda de Choque  |  F = Dash"
tip.Parent = screen

-- ---------- atualizacao ----------

local function tweenBar(fill, ratio)
	ratio = math.clamp(ratio, 0, 1)
	TweenService:Create(
		fill,
		TweenInfo.new(0.2, Enum.EasingStyle.Quad),
		{ Size = UDim2.new(ratio, 0, 1, 0) }
	):Play()
end

local function updateStats(stats)
	if stats.Health then
		tweenBar(healthFill, stats.Health / (stats.MaxHealth or Config.MaxHealth))
		healthText.Text = string.format("Vida  %d / %d", math.floor(stats.Health), stats.MaxHealth or Config.MaxHealth)
	end
	if stats.Energy then
		tweenBar(energyFill, stats.Energy / (stats.MaxEnergy or Config.Energy.Max))
		energyText.Text = string.format("Energia  %d / %d", math.floor(stats.Energy), stats.MaxEnergy or Config.Energy.Max)
	end
end

Remotes.StatsChanged.OnClientEvent:Connect(updateStats)

-- Tambem acompanha a vida diretamente do Humanoid (atualizacao imediata ao tomar dano).
local function trackCharacter(char)
	local hum = char:WaitForChild("Humanoid")
	updateStats({ Health = hum.Health, MaxHealth = hum.MaxHealth })
	hum.HealthChanged:Connect(function(health)
		updateStats({ Health = health, MaxHealth = hum.MaxHealth })
	end)
end

if player.Character then
	trackCharacter(player.Character)
end
player.CharacterAdded:Connect(trackCharacter)
